import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { XPParser, type XPParseResult, type XPNode, type XPLink, type XPSubcatchment, type XPTimeSeries, DB, SHAPE_CODES, ROUTING_CODES } from "@/lib/xp-parser";
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

                {/* Job Control */}
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
                        <Button variant="outline" onClick={() => download(JSON.stringify({ format: result.format, title: result.title, nodes: result.nodes, links: result.links, subcatchments: result.subcatchments, jobControl: result.jobControl }, null, 2), 'xpswmm_data.json', 'application/json')}>
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
