import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { XPParser, type XPParseResult, type XPNode, type XPLink, type XPSubcatchment, type XPTimeSeries, type XPPumpCurve, type XPTransect, type XPPollutant, type XPControlRule, type XPLIDControl, type XPLIDUsage, DB, SHAPE_CODES, ROUTING_CODES, PUMP_CODES, LID_TYPE_NAMES } from "@/lib/xp-parser";
import { buildINP, buildCSV } from "@/lib/swmm5-builder";
import { Upload, FileDown, Map, Table, Settings, FileText, Search } from "lucide-react";

function f(v: number | undefined | null, d = 2): string {
  return v == null || v === 0 ? '0' : typeof v === 'number' ? v.toFixed(d) : String(v);
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const XPReader = () => {
  const [result, setResult] = useState<XPParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [nodeFilter, setNodeFilter] = useState('');
  const [linkFilter, setLinkFilter] = useState('');
  const [scFilter, setScFilter] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parser = new XPParser();
      const parsed = parser.parse(text);
      setResult(parsed);

      // Auto-download .inp for .xp files
      if (/\.xp$/i.test(file.name)) {
        const inp = buildINP(parsed);
        const inpName = file.name.replace(/\.xp$/i, '.inp');
        download(inp, inpName, 'text/plain');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const filteredNodes = useMemo(() => {
    if (!result) return [];
    if (!nodeFilter) return result.nodes;
    const q = nodeFilter.toLowerCase();
    return result.nodes.filter(n => 
      n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    );
  }, [result, nodeFilter]);

  const filteredLinks = useMemo(() => {
    if (!result) return [];
    if (!linkFilter) return result.links;
    const q = linkFilter.toLowerCase();
    return result.links.filter(l => 
      l.name.toLowerCase().includes(q) || l.type.toLowerCase().includes(q) ||
      l.usNode?.toLowerCase().includes(q) || l.dsNode?.toLowerCase().includes(q)
    );
  }, [result, linkFilter]);

  const filteredSubcatchments = useMemo(() => {
    if (!result) return [];
    if (!scFilter) return result.subcatchments;
    const q = scFilter.toLowerCase();
    return result.subcatchments.filter(s => 
      s.name.toLowerCase().includes(q) || s.outlet?.toLowerCase().includes(q)
    );
  }, [result, scFilter]);

  const stats = useMemo(() => {
    if (!result) return null;
    const nt: Record<string, number> = {};
    const lt: Record<string, number> = {};
    const sh: Record<string, number> = {};
    result.nodes.forEach(n => { nt[n.type] = (nt[n.type] || 0) + 1; });
    result.links.forEach(l => { lt[l.type] = (lt[l.type] || 0) + 1; });
    result.links.filter(l => l.type === 'Conduit').forEach(l => {
      const s = l.shapeName || '?';
      sh[s] = (sh[s] || 0) + 1;
    });
    return { nt, lt, sh };
  }, [result]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Drop Zone */}
          <Card
            className={`border-2 border-dashed cursor-pointer transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('xpFileInput')?.click()}
          >
            <CardContent className="py-8 text-center">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-mono font-bold text-foreground mb-1">Drop .xp files here</h3>
              <p className="text-sm text-muted-foreground">Each .xp file is auto-converted to SWMM5 .inp and downloaded</p>
              <div className="flex gap-3 justify-center mt-4">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); document.getElementById('xpFileInput')?.click(); }}>
                  Choose Files
                </Button>
              </div>
              <input
                type="file"
                id="xpFileInput"
                accept=".xp,.XP,.xpx,.XPX,.inp,.INP,.dat,.DAT,.txt,.TXT"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </CardContent>
          </Card>

          {result && (
            <>
              {/* File info */}
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="font-mono">{result.format}</Badge>
                    <span className="font-mono text-sm text-foreground">{fileName}</span>
                    {result.title && <span className="text-sm text-muted-foreground">— {result.title}</span>}
                    <Badge className="bg-primary/10 text-primary border-primary/20">{result.nodes.length} nodes</Badge>
                    <Badge className="bg-success/10 text-success border-success/20">{result.links.length} links</Badge>
                    {result.subcatchments.length > 0 && (
                      <Badge className="bg-accent/10 text-accent-foreground border-accent/20">{result.subcatchments.length} subcatchments</Badge>
                    )}
                    {result.timeSeries.length > 0 && (
                      <Badge className="bg-warning/10 text-warning border-warning/20">{result.timeSeries.length} time series</Badge>
                    )}
                    {result.pumpCurves.length > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">{result.pumpCurves.length} pump curves</Badge>
                    )}
                    {result.transects.length > 0 && (
                      <Badge className="bg-success/10 text-success border-success/20">{result.transects.length} transects</Badge>
                    )}
                    {result.pollutants.length > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">{result.pollutants.length} pollutants</Badge>
                    )}
                    {result.controlRules.length > 0 && (
                      <Badge className="bg-warning/10 text-warning border-warning/20">{result.controlRules.length} controls</Badge>
                    )}
                    {result.lidControls.length > 0 && (
                      <Badge className="bg-success/10 text-success border-success/20">{result.lidControls.length} LID controls</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  <TabsTrigger value="summary" className="font-mono text-xs">Summary</TabsTrigger>
                  <TabsTrigger value="nodes" className="font-mono text-xs">Nodes <Badge variant="secondary" className="ml-1 text-xs">{result.nodes.length}</Badge></TabsTrigger>
                  <TabsTrigger value="links" className="font-mono text-xs">Links <Badge variant="secondary" className="ml-1 text-xs">{result.links.length}</Badge></TabsTrigger>
                  {result.subcatchments.length > 0 && (
                    <TabsTrigger value="subcatchments" className="font-mono text-xs">Subcatchments <Badge variant="secondary" className="ml-1 text-xs">{result.subcatchments.length}</Badge></TabsTrigger>
                  )}
                  {result.timeSeries.length > 0 && (
                    <TabsTrigger value="timeseries" className="font-mono text-xs">Time Series <Badge variant="secondary" className="ml-1 text-xs">{result.timeSeries.length}</Badge></TabsTrigger>
                  )}
                  {result.pumpCurves.length > 0 && (
                    <TabsTrigger value="pumpcurves" className="font-mono text-xs">Pump Curves <Badge variant="secondary" className="ml-1 text-xs">{result.pumpCurves.length}</Badge></TabsTrigger>
                  )}
                  {result.transects.length > 0 && (
                    <TabsTrigger value="transects" className="font-mono text-xs">Transects <Badge variant="secondary" className="ml-1 text-xs">{result.transects.length}</Badge></TabsTrigger>
                  )}
                  {result.pollutants.length > 0 && (
                    <TabsTrigger value="pollutants" className="font-mono text-xs">Pollutants <Badge variant="secondary" className="ml-1 text-xs">{result.pollutants.length}</Badge></TabsTrigger>
                  )}
                  {result.controlRules.length > 0 && (
                    <TabsTrigger value="controls" className="font-mono text-xs">Controls <Badge variant="secondary" className="ml-1 text-xs">{result.controlRules.length}</Badge></TabsTrigger>
                  )}
                  {result.lidControls.length > 0 && (
                    <TabsTrigger value="lid" className="font-mono text-xs">LID Controls <Badge variant="secondary" className="ml-1 text-xs">{result.lidControls.length}</Badge></TabsTrigger>
                  )}
                  <TabsTrigger value="jobctrl" className="font-mono text-xs">Job Control</TabsTrigger>
                  <TabsTrigger value="map" className="font-mono text-xs">Network Map</TabsTrigger>
                  <TabsTrigger value="rawcards" className="font-mono text-xs">Raw Cards <Badge variant="secondary" className="ml-1 text-xs">{Object.keys(result.rawCards).length}</Badge></TabsTrigger>
                  <TabsTrigger value="export" className="font-mono text-xs">Export</TabsTrigger>
                </TabsList>

                {/* Summary */}
                <TabsContent value="summary">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                    {[
                      { label: 'Nodes', value: result.nodes.length, color: 'text-primary' },
                      { label: 'Links', value: result.links.length, color: 'text-success' },
                      { label: 'Subcatchments', value: result.subcatchments.length, color: 'text-accent-foreground' },
                      { label: 'Time Series', value: result.timeSeries.length, color: 'text-warning' },
                      { label: 'Pump Curves', value: result.pumpCurves.length, color: 'text-primary' },
                      { label: 'Transects', value: result.transects.length, color: 'text-success' },
                      { label: 'Pollutants', value: result.pollutants.length, color: 'text-destructive' },
                      { label: 'Controls', value: result.controlRules.length, color: 'text-warning' },
                      { label: 'LID Controls', value: result.lidControls.length, color: 'text-success' },
                      { label: 'LID Usages', value: result.lidUsages.length, color: 'text-success' },
                      { label: 'Junctions', value: stats?.nt.Junction || 0, color: 'text-primary' },
                      { label: 'Outfalls', value: stats?.nt.Outfall || 0, color: 'text-warning' },
                      { label: 'Storage', value: stats?.nt.Storage || 0, color: 'text-primary' },
                      { label: 'Conduits', value: stats?.lt.Conduit || 0, color: 'text-success' },
                      { label: 'Orifices', value: stats?.lt.Orifice || 0, color: 'text-warning' },
                      { label: 'Weirs', value: stats?.lt.Weir || 0, color: 'text-primary' },
                      { label: 'Pumps', value: stats?.lt.Pump || 0, color: 'text-primary' },
                      { label: 'Card Groups', value: Object.keys(result.rawCards).length, color: 'text-muted-foreground' },
                    ].map(s => (
                      <Card key={s.label}>
                        <CardContent className="py-3 px-4">
                          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                          <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {stats && Object.keys(stats.sh).length > 0 && (
                    <Card>
                      <CardHeader className="py-3"><CardTitle className="text-sm font-mono">Conduit Shapes</CardTitle></CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(stats.sh).sort((a, b) => b[1] - a[1]).map(([shape, count]) => (
                            <div key={shape} className="flex justify-between px-3 py-1.5 bg-muted/50 rounded font-mono text-sm">
                              <span className="text-muted-foreground">{shape}</span>
                              <span className="text-primary font-bold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Nodes */}
                <TabsContent value="nodes">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter nodes..." className="font-mono text-sm max-w-xs" value={nodeFilter} onChange={e => setNodeFilter(e.target.value)} />
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          {['#', 'Name', 'Type', 'X', 'Y', 'Gr.Elev', 'Init.Depth', 'Q_Inst', 'Outfall', 'Storage'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNodes.map(n => (
                          <tr key={n.idx} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{n.idx}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{n.name}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-warning">{n.type}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(n.x)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(n.y)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(n.grelev)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(n.y0)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(n.qinst)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs">{n.outfallType || ''}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{n.astore ? f(n.astore) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Links */}
                <TabsContent value="links">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter links..." className="font-mono text-sm max-w-xs" value={linkFilter} onChange={e => setLinkFilter(e.target.value)} />
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          {['#', 'Name', 'Type', 'Shape', 'US Node', 'DS Node', 'Depth', 'Width', 'Length', 'US Inv', 'DS Inv', 'Rough', 'Slope%', 'Barrels'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLinks.map(l => (
                          <tr key={l.idx} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{l.idx}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{l.name}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-warning">{l.type}</td>
                            <td className="px-3 py-1.5 font-mono text-xs">{l.shapeName || ''}</td>
                            <td className="px-3 py-1.5 font-mono text-xs">{l.usNode}</td>
                            <td className="px-3 py-1.5 font-mono text-xs">{l.dsNode}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.deep)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.wide)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.len)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.zp1)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.zp2)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{f(l.rough, 4)}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{l.slope ? f(l.slope, 4) : ''}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-right">{l.barrel && l.barrel !== 1 ? l.barrel : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Subcatchments */}
                {result.subcatchments.length > 0 && (
                  <TabsContent value="subcatchments">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Filter subcatchments..." className="font-mono text-sm max-w-xs" value={scFilter} onChange={e => setScFilter(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            {['#', 'Name', 'Outlet', 'Area', 'Width', '%Imperv', 'Slope%', 'N-Imp', 'N-Perv', 'DS-Imp', 'DS-Perv', 'f0', 'ff', 'Decay', 'Rain Gage'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubcatchments.map(s => (
                            <tr key={s.idx} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{s.idx}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{s.name}</td>
                              <td className="px-3 py-1.5 font-mono text-xs">{s.outlet}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.area)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.width)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.imperv)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.slope, 4)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.nImperv, 4)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.nPerv, 4)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.dsImperv)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{f(s.dsPerv)}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{s.f0 ? f(s.f0) : ''}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{s.ff ? f(s.ff) : ''}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-right">{s.fDecay ? f(s.fDecay) : ''}</td>
                              <td className="px-3 py-1.5 font-mono text-xs">{s.rainGage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}

                {/* Time Series */}
                {result.timeSeries.length > 0 && (
                  <TabsContent value="timeseries">
                    <div className="space-y-4">
                      {result.timeSeries.map((ts, i) => {
                        const nodeMatch = result.nodes.find(n => n.idx === ts.nodeIdx);
                        const maxVal = Math.max(...ts.points.map(p => p.value));
                        const maxTime = ts.points.length > 0 ? ts.points[ts.points.length - 1].time : 0;
                        return (
                          <Card key={i}>
                            <CardHeader className="py-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <CardTitle className="text-sm font-mono">{ts.name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-xs">{ts.type}</Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  Node: {nodeMatch?.name || `OI_${ts.nodeIdx}`} • {ts.points.length} points • Peak: {f(maxVal, 2)} • Duration: {f(maxTime, 1)} hrs
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              {/* Simple ASCII sparkline bar chart */}
                              <div className="border rounded-lg overflow-hidden mb-3">
                                <svg viewBox={`0 0 600 120`} className="w-full" style={{ height: 120 }}>
                                  <rect width={600} height={120} fill="hsl(var(--card))" />
                                  {ts.points.map((pt, j) => {
                                    const x = maxTime > 0 ? (pt.time / maxTime) * 580 + 10 : j * 5 + 10;
                                    const h = maxVal > 0 ? (pt.value / maxVal) * 90 : 0;
                                    const barW = Math.max(2, 560 / ts.points.length - 1);
                                    return (
                                      <rect key={j} x={x} y={110 - h} width={barW} height={h}
                                        fill="hsl(var(--primary))" opacity={0.7}>
                                        <title>t={f(pt.time, 2)}h, v={f(pt.value, 3)}</title>
                                      </rect>
                                    );
                                  })}
                                  <line x1={10} y1={110} x2={590} y2={110} stroke="hsl(var(--border))" strokeWidth={1} />
                                  <text x={10} y={10} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace">Peak: {f(maxVal, 2)}</text>
                                  <text x={540} y={10} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace" textAnchor="end">{f(maxTime, 1)}h</text>
                                </svg>
                              </div>
                              {/* Data table (first 20 points) */}
                              <div className="overflow-x-auto border rounded-lg max-h-48">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50 border-b">
                                      <th className="px-3 py-1 text-left font-mono text-muted-foreground">#</th>
                                      <th className="px-3 py-1 text-right font-mono text-muted-foreground">Time (hrs)</th>
                                      <th className="px-3 py-1 text-right font-mono text-muted-foreground">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ts.points.slice(0, 20).map((pt, j) => (
                                      <tr key={j} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="px-3 py-0.5 font-mono text-muted-foreground">{j + 1}</td>
                                        <td className="px-3 py-0.5 font-mono text-right">{f(pt.time, 4)}</td>
                                        <td className="px-3 py-0.5 font-mono text-right text-primary">{f(pt.value, 4)}</td>
                                      </tr>
                                    ))}
                                    {ts.points.length > 20 && (
                                      <tr><td colSpan={3} className="px-3 py-1 font-mono text-xs text-muted-foreground text-center">... +{ts.points.length - 20} more points</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                )}

                {/* Pump Curves */}
                {result.pumpCurves.length > 0 && (
                  <TabsContent value="pumpcurves">
                    <div className="space-y-4">
                      {result.pumpCurves.map((pc, i) => {
                        const pumpLink = result.links.find(l => l.idx === pc.linkIdx);
                        const maxX = pc.points.length > 0 ? Math.max(...pc.points.map(p => p.x)) : 1;
                        const maxY = pc.points.length > 0 ? Math.max(...pc.points.map(p => p.y)) : 1;
                        const xLabel: Record<number, string> = { 1: 'Volume', 2: 'Depth', 3: 'Head', 4: 'Depth' };
                        return (
                          <Card key={i}>
                            <CardHeader className="py-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <CardTitle className="text-sm font-mono">{pc.name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-xs">{pc.curveType}</Badge>
                                <Badge variant="secondary" className="font-mono text-xs">{pc.pumpTypeName}</Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  Link: {pumpLink?.name || `OI_${pc.linkIdx}`} • {pc.points.length} points
                                  {pumpLink ? ` • ON: ${f(pumpLink.pon)} OFF: ${f(pumpLink.poff)}` : ''}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              {pc.points.length > 0 ? (
                                <>
                                  <div className="border rounded-lg overflow-hidden mb-3">
                                    <svg viewBox="0 0 600 160" className="w-full" style={{ height: 160 }}>
                                      <rect width={600} height={160} fill="hsl(var(--card))" />
                                      {/* Axes */}
                                      <line x1={50} y1={140} x2={580} y2={140} stroke="hsl(var(--border))" strokeWidth={1} />
                                      <line x1={50} y1={10} x2={50} y2={140} stroke="hsl(var(--border))" strokeWidth={1} />
                                      {/* Curve line */}
                                      <polyline
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        points={pc.points.map(pt => {
                                          const px = 50 + (maxX > 0 ? (pt.x / maxX) * 520 : 0);
                                          const py = 140 - (maxY > 0 ? (pt.y / maxY) * 120 : 0);
                                          return `${px},${py}`;
                                        }).join(' ')}
                                      />
                                      {/* Points */}
                                      {pc.points.map((pt, j) => {
                                        const px = 50 + (maxX > 0 ? (pt.x / maxX) * 520 : 0);
                                        const py = 140 - (maxY > 0 ? (pt.y / maxY) * 120 : 0);
                                        return (
                                          <circle key={j} cx={px} cy={py} r={3} fill="hsl(var(--primary))">
                                            <title>{xLabel[pc.pumpType] || 'X'}={f(pt.x, 3)}, Flow={f(pt.y, 3)}</title>
                                          </circle>
                                        );
                                      })}
                                      {/* Labels */}
                                      <text x={315} y={155} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace" textAnchor="middle">{xLabel[pc.pumpType] || 'X-Value'}</text>
                                      <text x={10} y={80} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace" transform="rotate(-90 10 80)">Flow</text>
                                      <text x={55} y={10} fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="monospace">{f(maxY, 2)}</text>
                                      <text x={570} y={155} fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="monospace" textAnchor="end">{f(maxX, 2)}</text>
                                    </svg>
                                  </div>
                                  <div className="overflow-x-auto border rounded-lg max-h-48">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-muted/50 border-b">
                                          <th className="px-3 py-1 text-left font-mono text-muted-foreground">#</th>
                                          <th className="px-3 py-1 text-right font-mono text-muted-foreground">{xLabel[pc.pumpType] || 'X'}</th>
                                          <th className="px-3 py-1 text-right font-mono text-muted-foreground">Flow</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {pc.points.map((pt, j) => (
                                          <tr key={j} className="border-b border-border/50 hover:bg-muted/30">
                                            <td className="px-3 py-0.5 font-mono text-muted-foreground">{j + 1}</td>
                                            <td className="px-3 py-0.5 font-mono text-right">{f(pt.x, 4)}</td>
                                            <td className="px-3 py-0.5 font-mono text-right text-primary">{f(pt.y, 4)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No curve data points found — pump references curve by name only.</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                )}

                {/* Transects */}
                {result.transects.length > 0 && (
                  <TabsContent value="transects">
                    <div className="space-y-4">
                      {result.transects.map((t, i) => {
                        const link = result.links.find(l => l.idx === t.linkIdx);
                        const minElev = t.points.length > 0 ? Math.min(...t.points.map(p => p.elevation)) : 0;
                        const maxElev = t.points.length > 0 ? Math.max(...t.points.map(p => p.elevation)) : 1;
                        const maxStation = t.points.length > 0 ? t.points[t.points.length - 1].station : 1;
                        const minStation = t.points.length > 0 ? t.points[0].station : 0;
                        const elevRange = maxElev - minElev || 1;
                        const staRange = maxStation - minStation || 1;
                        return (
                          <Card key={i}>
                            <CardHeader className="py-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <CardTitle className="text-sm font-mono">{t.name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-xs">IRREGULAR</Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  Link: {link?.name || `OI_${t.linkIdx}`} • {t.points.length} stations •
                                  n={f(t.nChannel, 4)} • Banks: {f(t.leftBank)}–{f(t.rightBank)}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              {t.points.length > 0 ? (
                                <>
                                  <div className="border rounded-lg overflow-hidden mb-3">
                                    <svg viewBox="0 0 600 180" className="w-full" style={{ height: 180 }}>
                                      <rect width={600} height={180} fill="hsl(var(--card))" />
                                      {/* Axes */}
                                      <line x1={50} y1={160} x2={580} y2={160} stroke="hsl(var(--border))" strokeWidth={1} />
                                      <line x1={50} y1={10} x2={50} y2={160} stroke="hsl(var(--border))" strokeWidth={1} />
                                      {/* Fill under curve */}
                                      <polygon
                                        fill="hsl(var(--primary))"
                                        opacity={0.15}
                                        points={[
                                          `${50 + ((t.points[0]?.station || 0) - minStation) / staRange * 520},160`,
                                          ...t.points.map(pt => {
                                            const px = 50 + (pt.station - minStation) / staRange * 520;
                                            const py = 160 - ((pt.elevation - minElev) / elevRange) * 140;
                                            return `${px},${py}`;
                                          }),
                                          `${50 + ((t.points[t.points.length - 1]?.station || 0) - minStation) / staRange * 520},160`,
                                        ].join(' ')}
                                      />
                                      {/* Cross-section line */}
                                      <polyline
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        points={t.points.map(pt => {
                                          const px = 50 + (pt.station - minStation) / staRange * 520;
                                          const py = 160 - ((pt.elevation - minElev) / elevRange) * 140;
                                          return `${px},${py}`;
                                        }).join(' ')}
                                      />
                                      {/* Bank station markers */}
                                      {[t.leftBank, t.rightBank].map((bank, bi) => {
                                        const bx = 50 + (bank - minStation) / staRange * 520;
                                        return (
                                          <line key={bi} x1={bx} y1={10} x2={bx} y2={160}
                                            stroke="hsl(var(--warning))" strokeWidth={1} strokeDasharray="4,3" opacity={0.7}>
                                            <title>{bi === 0 ? 'Left' : 'Right'} bank: {f(bank)}</title>
                                          </line>
                                        );
                                      })}
                                      {/* Points */}
                                      {t.points.map((pt, j) => {
                                        const px = 50 + (pt.station - minStation) / staRange * 520;
                                        const py = 160 - ((pt.elevation - minElev) / elevRange) * 140;
                                        return (
                                          <circle key={j} cx={px} cy={py} r={2.5} fill="hsl(var(--primary))">
                                            <title>Sta={f(pt.station, 3)}, Elev={f(pt.elevation, 3)}</title>
                                          </circle>
                                        );
                                      })}
                                      {/* Labels */}
                                      <text x={315} y={175} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace" textAnchor="middle">Station</text>
                                      <text x={10} y={90} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="monospace" transform="rotate(-90 10 90)">Elevation</text>
                                      <text x={55} y={10} fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="monospace">{f(maxElev, 2)}</text>
                                      <text x={55} y={158} fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="monospace">{f(minElev, 2)}</text>
                                    </svg>
                                  </div>
                                  <div className="overflow-x-auto border rounded-lg max-h-48">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-muted/50 border-b">
                                          <th className="px-3 py-1 text-left font-mono text-muted-foreground">#</th>
                                          <th className="px-3 py-1 text-right font-mono text-muted-foreground">Station</th>
                                          <th className="px-3 py-1 text-right font-mono text-muted-foreground">Elevation</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {t.points.map((pt, j) => (
                                          <tr key={j} className="border-b border-border/50 hover:bg-muted/30">
                                            <td className="px-3 py-0.5 font-mono text-muted-foreground">{j + 1}</td>
                                            <td className="px-3 py-0.5 font-mono text-right">{f(pt.station, 4)}</td>
                                            <td className="px-3 py-0.5 font-mono text-right text-primary">{f(pt.elevation, 4)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No station-elevation data found for this transect.</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                )}

                {/* Pollutants / Water Quality */}
                {result.pollutants.length > 0 && (
                  <TabsContent value="pollutants">
                    <div className="space-y-4">
                      {/* Pollutant definitions */}
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-mono">Pollutant Definitions</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  {['Name', 'Units', 'C-Rain', 'C-GW', 'C-RDII', 'C-Init', 'Kdecay', 'Co-Pollutant', 'Co-Frac'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.pollutants.map((pol, i) => (
                                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{pol.name}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs">{pol.units}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.cRain)}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.cGW)}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.cRDII)}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.cInit)}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.decayCoeff, 4)}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs">{pol.coPollutant}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{f(pol.coFraction)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Land Uses */}
                      {result.landuses.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-mono">Land Uses</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="overflow-x-auto border rounded-lg">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50 border-b">
                                    {['Name', 'Sweep Interval', 'Sweep Fraction', 'Sweep Avail'].map(h => (
                                      <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.landuses.map((lu, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{lu.name}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(lu.sweepInterval)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(lu.sweepFraction)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(lu.sweepAvail)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Buildup */}
                      {result.buildups.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-mono">Buildup Functions</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="overflow-x-auto border rounded-lg">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50 border-b">
                                    {['Land Use', 'Pollutant', 'Function', 'C1', 'C2', 'C3', 'Per Unit'].map(h => (
                                      <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.buildups.map((bu, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{bu.landuse}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs">{bu.pollutant}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-warning">{bu.funcType}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(bu.c1)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(bu.c2)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(bu.c3)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs">{bu.perUnit}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Washoff */}
                      {result.washoffs.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-mono">Washoff Functions</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="overflow-x-auto border rounded-lg">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50 border-b">
                                    {['Land Use', 'Pollutant', 'Function', 'C1', 'C2', 'Sweep Eff', 'BMP %'].map(h => (
                                      <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.washoffs.map((wo, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{wo.landuse}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs">{wo.pollutant}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-warning">{wo.funcType}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(wo.c1)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(wo.c2)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(wo.sweepEffic)}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(wo.bmPct)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Loadings */}
                      {result.loadings.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-mono">Initial Loadings</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="overflow-x-auto border rounded-lg">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50 border-b">
                                    {['Subcatchment', 'Pollutant', 'Init. Buildup'].map(h => (
                                      <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.loadings.map((ld, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="px-3 py-1.5 font-mono text-xs">{ld.subcatchment}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{ld.pollutant}</td>
                                      <td className="px-3 py-1.5 font-mono text-xs text-right">{f(ld.value)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Controls */}
                {result.controlRules.length > 0 && (
                  <TabsContent value="controls">
                    <div className="space-y-4">
                      {result.controlRules.map((rule, i) => (
                        <Card key={i}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-mono flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">{rule.name}</Badge>
                              {rule.priority > 1 && <Badge variant="secondary" className="text-xs">Priority {rule.priority}</Badge>}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="font-mono text-sm space-y-1 bg-muted/30 p-3 rounded-lg border border-border">
                              <div className="text-primary font-bold">RULE {rule.name}</div>
                              {rule.conditions.map((cond, ci) => (
                                <div key={ci} className="text-foreground">
                                  <span className="text-warning font-bold">{ci === 0 ? 'IF' : rule.conditionLogic}</span>{' '}
                                  <span className="text-muted-foreground">{cond.variable}</span>{' '}
                                  <span className="text-primary">{cond.id}</span>{' '}
                                  <span className="text-muted-foreground">{cond.attribute}</span>{' '}
                                  <span className="text-destructive">{cond.relation}</span>{' '}
                                  <span className="text-success">{cond.value}</span>
                                </div>
                              ))}
                              {rule.actions.map((act, ai) => (
                                <div key={ai} className="text-foreground">
                                  <span className="text-warning font-bold">THEN</span>{' '}
                                  <span className="text-primary">{act.link}</span>{' '}
                                  <span className="text-muted-foreground">{act.attribute}</span>{' '}
                                  <span className="text-foreground">=</span>{' '}
                                  <span className="text-success">{act.value}</span>
                                </div>
                              ))}
                              {rule.elseActions.map((act, ai) => (
                                <div key={ai} className="text-foreground">
                                  <span className="text-destructive font-bold">ELSE</span>{' '}
                                  <span className="text-primary">{act.link}</span>{' '}
                                  <span className="text-muted-foreground">{act.attribute}</span>{' '}
                                  <span className="text-foreground">=</span>{' '}
                                  <span className="text-success">{act.value}</span>
                                </div>
                              ))}
                              {rule.priority > 1 && (
                                <div className="text-muted-foreground">PRIORITY {rule.priority}</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-mono">Control Rules Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  {['Rule', 'Conditions', 'Logic', 'Actions', 'Else Actions', 'Priority'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.controlRules.map((rule, i) => (
                                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="px-3 py-1.5 font-mono text-xs text-primary font-medium">{rule.name}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs">{rule.conditions.length}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-warning">{rule.conditionLogic}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs">{rule.actions.length}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs">{rule.elseActions.length}</td>
                                    <td className="px-3 py-1.5 font-mono text-xs text-right">{rule.priority}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="jobctrl">
                  {Object.keys(result.jobControl).length === 0 ? (
                    <Card><CardContent className="py-4 text-sm text-muted-foreground">No job control data found.</CardContent></Card>
                  ) : (
                    (() => {
                      const grps: Record<string, { k: string; v: string }[]> = {};
                      for (const [k, v] of Object.entries(result.jobControl)) {
                        const d = DB[k]; const c = d ? d.c : 'Other';
                        if (!grps[c]) grps[c] = [];
                        grps[c].push({ k, v });
                      }
                      return Object.entries(grps).map(([card, fields]) => (
                        <Card key={card} className="mb-3">
                          <CardHeader className="py-2"><CardTitle className="text-sm font-mono">Card: {card}</CardTitle></CardHeader>
                          <CardContent className="py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {fields.map(({ k, v }) => (
                                <div key={k} className="flex justify-between px-3 py-1.5 bg-muted/50 rounded font-mono text-sm">
                                  <span className="text-muted-foreground">{k}</span>
                                  <span className="text-primary font-bold">{v}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()
                  )}
                </TabsContent>

                {/* Network Map */}
                <TabsContent value="map">
                  <NetworkMap nodes={result.nodes} links={result.links} />
                </TabsContent>

                {/* Raw Cards */}
                <TabsContent value="rawcards">
                  <Card>
                    <CardContent className="py-4">
                      <pre className="font-mono text-xs leading-relaxed text-muted-foreground overflow-auto max-h-[600px] whitespace-pre">
                        {Object.keys(result.rawCards).sort().map(key => {
                          const recs = result.rawCards[key];
                          const shown = recs.slice(0, 15);
                          return `═══ ${key} (${recs.length} records) ═══\nCol: ....5...10...15...20...25...30...35...40...45...50...55...60...65...70...75...80\n${shown.map(r => r.data.padEnd(80)).join('\n')}${recs.length > 15 ? `\n  ... +${recs.length - 15} more` : ''}\n\n`;
                        }).join('')}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Export */}
                <TabsContent value="export">
                  <Card>
                    <CardContent className="py-4 space-y-4">
                      <p className="text-sm text-muted-foreground">Export parsed data using <code className="bg-muted px-1 rounded font-mono text-xs">DbFieldDef</code> column positions from <code className="bg-muted px-1 rounded font-mono text-xs">Swmfield.c</code>.</p>
                      <div className="flex gap-3 flex-wrap">
                        <Button onClick={() => download(buildCSV(result.nodes as any), 'xpswmm_nodes.csv', 'text/csv')}>
                          <FileDown className="h-4 w-4 mr-2" /> Nodes CSV
                        </Button>
                        <Button onClick={() => download(buildCSV(result.links as any), 'xpswmm_links.csv', 'text/csv')}>
                          <FileDown className="h-4 w-4 mr-2" /> Links CSV
                        </Button>
                        {result.subcatchments.length > 0 && (
                          <Button onClick={() => download(buildCSV(result.subcatchments as any), 'xpswmm_subcatchments.csv', 'text/csv')}>
                            <FileDown className="h-4 w-4 mr-2" /> Subcatchments CSV
                          </Button>
                        )}
                        {result.pumpCurves.length > 0 && (
                          <Button onClick={() => {
                            const rows = result.pumpCurves.flatMap(pc => pc.points.map(pt => ({ curve: pc.name, type: pc.curveType, pumpType: pc.pumpTypeName, x: pt.x, y: pt.y })));
                            download(buildCSV(rows as any), 'xpswmm_pump_curves.csv', 'text/csv');
                          }}>
                            <FileDown className="h-4 w-4 mr-2" /> Pump Curves CSV
                          </Button>
                        )}
                        {result.transects.length > 0 && (
                          <Button onClick={() => {
                            const rows = result.transects.flatMap(t => t.points.map(pt => ({ transect: t.name, link: result.links.find(l => l.idx === t.linkIdx)?.name || '', n: t.nChannel, station: pt.station, elevation: pt.elevation })));
                            download(buildCSV(rows as any), 'xpswmm_transects.csv', 'text/csv');
                          }}>
                            <FileDown className="h-4 w-4 mr-2" /> Transects CSV
                          </Button>
                        )}
                        {result.pollutants.length > 0 && (
                          <Button onClick={() => download(buildCSV(result.pollutants as any), 'xpswmm_pollutants.csv', 'text/csv')}>
                            <FileDown className="h-4 w-4 mr-2" /> Pollutants CSV
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => download(JSON.stringify({ format: result.format, title: result.title, nodes: result.nodes, links: result.links, subcatchments: result.subcatchments, timeSeries: result.timeSeries, pumpCurves: result.pumpCurves, transects: result.transects, controlRules: result.controlRules, pollutants: result.pollutants, landuses: result.landuses, buildups: result.buildups, washoffs: result.washoffs, loadings: result.loadings, jobControl: result.jobControl }, null, 2), 'xpswmm_data.json', 'application/json')}>
                          Full JSON
                        </Button>
                        <Button variant="outline" onClick={() => download(buildINP(result), 'xpswmm_converted.inp', 'text/plain')}>
                          SWMM5 .inp
                        </Button>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-mono text-sm font-bold mb-3">DbFieldDef Reference</h4>
                        <div className="overflow-x-auto border rounded-lg max-h-96">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 border-b">
                                {['Field', 'Group', 'Card', 'Col', 'Width', 'Type'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left font-mono text-muted-foreground uppercase">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(DB).map(([name, d]) => (
                                <tr key={name} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="px-3 py-1 font-mono text-primary font-medium">{name}</td>
                                  <td className="px-3 py-1 font-mono">{d.g}</td>
                                  <td className="px-3 py-1 font-mono">{d.c}</td>
                                  <td className="px-3 py-1 font-mono text-right">{d.p}</td>
                                  <td className="px-3 py-1 font-mono text-right">{d.w}</td>
                                  <td className="px-3 py-1 font-mono">{['', 'int', 'real', 'coded', 'flag', 'str'][d.t] || d.t}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Network Map SVG Component
function NetworkMap({ nodes, links }: { nodes: XPNode[]; links: XPLink[] }) {
  const nc = nodes.filter(n => n.x || n.y);
  if (!nc.length) return <Card><CardContent className="py-4 text-sm text-muted-foreground">No node coordinates found. Network map needs spatial data from SP1N NODX/NODY.</CardContent></Card>;

  const xs = nc.map(n => n.x), ys = nc.map(n => n.y);
  const xn = Math.min(...xs), xx = Math.max(...xs), yn = Math.min(...ys), yx = Math.max(...ys);
  const pd = 40, w = 900, h = 500, xr = xx - xn || 1, yr = yx - yn || 1;
  const sx = (x: number) => pd + ((x - xn) / xr) * (w - 2 * pd);
  const sy = (y: number) => h - pd - ((y - yn) / yr) * (h - 2 * pd);
  const nm: Record<string, XPNode> = {};
  nc.forEach(n => { nm[n.name] = n; });

  const colors: Record<string, string> = { Junction: 'hsl(var(--primary))', Outfall: 'hsl(var(--warning))', Storage: '#9a8aef' };

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground mb-3">{nc.length} nodes • X[{f(xn)}..{f(xx)}] Y[{f(yn)}..{f(yx)}]</p>
        <div className="border rounded-lg overflow-hidden">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 500 }}>
            <rect width={w} height={h} fill="hsl(var(--card))" />
            {links.map((l, i) => {
              const u = nm[l.usNode], d = nm[l.dsNode];
              return u && d ? <line key={i} x1={sx(u.x)} y1={sy(u.y)} x2={sx(d.x)} y2={sy(d.y)} stroke="hsl(var(--border))" strokeWidth={1.5} opacity={0.7} /> : null;
            })}
            {nc.map((n, i) => {
              const cx = sx(n.x), cy = sy(n.y);
              const cl = colors[n.type] || 'hsl(var(--primary))';
              const r = n.type === 'Junction' ? 3 : 5;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r} fill={cl} stroke="hsl(var(--background))" strokeWidth={1}>
                    <title>{n.name} ({n.type})\nElev: {n.grelev}</title>
                  </circle>
                  {nc.length < 80 && <text x={cx + 5} y={cy - 5} fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="monospace">{n.name}</text>}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex gap-4 mt-3 font-mono text-xs text-muted-foreground">
          <span><span style={{ color: 'hsl(var(--primary))' }}>●</span> Junction</span>
          <span><span style={{ color: 'hsl(var(--warning))' }}>●</span> Outfall</span>
          <span><span style={{ color: '#9a8aef' }}>●</span> Storage</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default XPReader;
