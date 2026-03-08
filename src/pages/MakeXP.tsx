import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileDown, Eye, Copy, Layers } from "lucide-react";
import { generateXP, createDefaultModel, type MakeModel, type MakeNode, type MakeLink, type MakeSubcatchment, type MakeControl } from "@/lib/xp-generator";
import { TEMPLATES } from "@/lib/xp-templates";
import { SHAPE_CODES, PUMP_CODES, WEIR_CODES } from "@/lib/xp-parser";

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

let _uid = 0;
const uid = () => `id_${++_uid}`;

const MakeXP = () => {
  const [model, setModel] = useState<MakeModel>(createDefaultModel);
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  const loadTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setModel(JSON.parse(JSON.stringify(tmpl.model)));
      setActiveTab('settings');
    }
  };

  const updateModel = useCallback((updater: (m: MakeModel) => MakeModel) => {
    setModel(prev => updater(prev));
  }, []);

  const addNode = () => {
    updateModel(m => ({
      ...m,
      nodes: [...m.nodes, {
        id: uid(), name: `Node_${m.nodes.length + 1}`, x: (m.nodes.length % 5) * 200,
        y: Math.floor(m.nodes.length / 5) * 200, elevation: 100, maxDepth: 10, initDepth: 0,
        type: 'junction',
      }],
    }));
  };

  const addLink = () => {
    const from = model.nodes[0]?.name || '';
    const to = model.nodes[1]?.name || model.nodes[0]?.name || '';
    updateModel(m => ({
      ...m,
      links: [...m.links, {
        id: uid(), name: `Link_${m.links.length + 1}`, fromNode: from, toNode: to,
        type: 'conduit', shape: 1, depth: 1, width: 0, length: 100, roughness: 0.013,
        usInvert: 0, dsInvert: 0, barrels: 1,
      }],
    }));
  };

  const addSubcatchment = () => {
    const outlet = model.nodes[0]?.name || '';
    updateModel(m => ({
      ...m,
      subcatchments: [...m.subcatchments, {
        id: uid(), name: `Sub_${m.subcatchments.length + 1}`, area: 10, width: 500,
        slope: 0.5, imperv: 25, outlet, nImperv: 0.01, nPerv: 0.1,
        dsImperv: 0.05, dsPerv: 0.05, f0: 3.0, ff: 0.5, fDecay: 4.0,
      }],
    }));
  };

  const addControl = () => {
    const sensor = model.nodes[0]?.name || '';
    const action = model.links[0]?.name || '';
    updateModel(m => ({
      ...m,
      controls: [...m.controls, {
        id: uid(), name: `Rule_${m.controls.length + 1}`, sensorNode: sensor,
        attribute: 'DEPTH', relation: '>', threshold: 2.0, actionLink: action,
        action: 'ON', elseAction: 'OFF', priority: 1,
      }],
    }));
  };

  const removeItem = <T extends { id: string }>(arr: T[], id: string): T[] => arr.filter(x => x.id !== id);

  const updateNode = (id: string, updates: Partial<MakeNode>) => {
    updateModel(m => ({ ...m, nodes: m.nodes.map(n => n.id === id ? { ...n, ...updates } : n) }));
  };

  const updateLink = (id: string, updates: Partial<MakeLink>) => {
    updateModel(m => ({ ...m, links: m.links.map(l => l.id === id ? { ...l, ...updates } : l) }));
  };

  const updateSubcatchment = (id: string, updates: Partial<MakeSubcatchment>) => {
    updateModel(m => ({ ...m, subcatchments: m.subcatchments.map(s => s.id === id ? { ...s, ...updates } : s) }));
  };

  const updateControl = (id: string, updates: Partial<MakeControl>) => {
    updateModel(m => ({ ...m, controls: m.controls.map(c => c.id === id ? { ...c, ...updates } : c) }));
  };

  const handlePreview = () => {
    const xp = generateXP(model);
    setPreview(xp);
    setActiveTab('preview');
  };

  const handleDownload = () => {
    const xp = generateXP(model);
    const name = (model.jobControl.title || 'model').replace(/\s+/g, '_');
    download(xp, `${name}.xp`);
  };

  const nodeNames = model.nodes.map(n => n.name);
  const linkNames = model.links.map(l => l.name);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-mono text-foreground">Make .xp</h2>
              <p className="text-sm text-muted-foreground">Define SWMM parameters and generate .xp files from scratch</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button onClick={handleDownload}>
                <FileDown className="h-4 w-4 mr-2" /> Download .xp
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nodes', value: model.nodes.length, color: 'text-primary' },
              { label: 'Links', value: model.links.length, color: 'text-success' },
              { label: 'Subcatchments', value: model.subcatchments.length, color: 'text-warning' },
              { label: 'Controls', value: model.controls.length, color: 'text-destructive' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="py-3 px-4">
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="settings" className="font-mono text-xs">Settings</TabsTrigger>
              <TabsTrigger value="nodes" className="font-mono text-xs">Nodes <Badge variant="secondary" className="ml-1 text-xs">{model.nodes.length}</Badge></TabsTrigger>
              <TabsTrigger value="links" className="font-mono text-xs">Links <Badge variant="secondary" className="ml-1 text-xs">{model.links.length}</Badge></TabsTrigger>
              <TabsTrigger value="subcatchments" className="font-mono text-xs">Subcatchments <Badge variant="secondary" className="ml-1 text-xs">{model.subcatchments.length}</Badge></TabsTrigger>
              <TabsTrigger value="controls" className="font-mono text-xs">Controls <Badge variant="secondary" className="ml-1 text-xs">{model.controls.length}</Badge></TabsTrigger>
              <TabsTrigger value="preview" className="font-mono text-xs">Preview</TabsTrigger>
            </TabsList>

            {/* Settings */}
            <TabsContent value="settings">
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm font-mono">Job Control Settings</CardTitle></CardHeader>
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">Model Title</Label>
                      <Input className="font-mono text-sm" value={model.jobControl.title}
                        onChange={e => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, title: e.target.value } }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">Routing Method</Label>
                      <Select value={String(model.jobControl.routingMethod)}
                        onValueChange={v => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, routingMethod: parseInt(v) } }))}>
                        <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Dynamic Wave</SelectItem>
                          <SelectItem value="3">Kinematic Wave</SelectItem>
                          <SelectItem value="4">Diffusion Wave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">Time Step (sec)</Label>
                      <Input type="number" className="font-mono text-sm" value={model.jobControl.timeStep}
                        onChange={e => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, timeStep: parseFloat(e.target.value) || 30 } }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">Max Trials</Label>
                      <Input type="number" className="font-mono text-sm" value={model.jobControl.maxTrials}
                        onChange={e => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, maxTrials: parseInt(e.target.value) || 8 } }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">Head Tolerance</Label>
                      <Input type="number" step="0.001" className="font-mono text-sm" value={model.jobControl.headTolerance}
                        onChange={e => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, headTolerance: parseFloat(e.target.value) || 0.005 } }))} />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch checked={model.jobControl.metric}
                        onCheckedChange={v => updateModel(m => ({ ...m, jobControl: { ...m.jobControl, metric: v } }))} />
                      <Label className="font-mono text-xs">Metric Units</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nodes */}
            <TabsContent value="nodes">
              <div className="space-y-3">
                <Button size="sm" onClick={addNode}><Plus className="h-4 w-4 mr-1" /> Add Node</Button>
                {model.nodes.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No nodes defined. Click "Add Node" to create one.</CardContent></Card>
                )}
                {model.nodes.map(n => (
                  <Card key={n.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Name</Label>
                            <Input className="font-mono text-sm" value={n.name} onChange={e => updateNode(n.id, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Type</Label>
                            <Select value={n.type} onValueChange={v => updateNode(n.id, { type: v as MakeNode['type'] })}>
                              <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="junction">Junction</SelectItem>
                                <SelectItem value="outfall">Outfall</SelectItem>
                                <SelectItem value="storage">Storage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Elevation</Label>
                            <Input type="number" className="font-mono text-sm" value={n.elevation} onChange={e => updateNode(n.id, { elevation: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Max Depth</Label>
                            <Input type="number" className="font-mono text-sm" value={n.maxDepth} onChange={e => updateNode(n.id, { maxDepth: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">X Coord</Label>
                            <Input type="number" className="font-mono text-sm" value={n.x} onChange={e => updateNode(n.id, { x: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Y Coord</Label>
                            <Input type="number" className="font-mono text-sm" value={n.y} onChange={e => updateNode(n.id, { y: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Init Depth</Label>
                            <Input type="number" className="font-mono text-sm" value={n.initDepth} onChange={e => updateNode(n.id, { initDepth: parseFloat(e.target.value) || 0 })} />
                          </div>
                          {n.type === 'storage' && (
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Storage Area</Label>
                              <Input type="number" className="font-mono text-sm" value={n.storageArea || 0} onChange={e => updateNode(n.id, { storageArea: parseFloat(e.target.value) || 0 })} />
                            </div>
                          )}
                          {n.type === 'outfall' && (
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Outfall Type</Label>
                              <Select value={String(n.outfallType || 1)} onValueChange={v => updateNode(n.id, { outfallType: parseInt(v) })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Free</SelectItem>
                                  <SelectItem value="2">Fixed</SelectItem>
                                  <SelectItem value="3">Tidal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 mt-5"
                          onClick={() => updateModel(m => ({ ...m, nodes: removeItem(m.nodes, n.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Links */}
            <TabsContent value="links">
              <div className="space-y-3">
                <Button size="sm" onClick={addLink} disabled={model.nodes.length < 1}>
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
                {model.nodes.length < 1 && <p className="text-sm text-muted-foreground">Add at least one node before creating links.</p>}
                {model.links.map(l => (
                  <Card key={l.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Name</Label>
                            <Input className="font-mono text-sm" value={l.name} onChange={e => updateLink(l.id, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Type</Label>
                            <Select value={l.type} onValueChange={v => updateLink(l.id, { type: v as MakeLink['type'] })}>
                              <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conduit">Conduit</SelectItem>
                                <SelectItem value="pump">Pump</SelectItem>
                                <SelectItem value="orifice">Orifice</SelectItem>
                                <SelectItem value="weir">Weir</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">From Node</Label>
                            <Select value={l.fromNode} onValueChange={v => updateLink(l.id, { fromNode: v })}>
                              <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{nodeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">To Node</Label>
                            <Select value={l.toNode} onValueChange={v => updateLink(l.id, { toNode: v })}>
                              <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{nodeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>

                          {/* Conduit fields */}
                          {l.type === 'conduit' && <>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Shape</Label>
                              <Select value={String(l.shape || 1)} onValueChange={v => updateLink(l.id, { shape: parseInt(v) })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,6].map(s => <SelectItem key={s} value={String(s)}>{SHAPE_CODES[s]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Depth/Diam</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.depth || 1} onChange={e => updateLink(l.id, { depth: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Width</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.width || 0} onChange={e => updateLink(l.id, { width: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Length</Label>
                              <Input type="number" className="font-mono text-sm" value={l.length || 100} onChange={e => updateLink(l.id, { length: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Roughness (n)</Label>
                              <Input type="number" step="0.001" className="font-mono text-sm" value={l.roughness || 0.013} onChange={e => updateLink(l.id, { roughness: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">US Invert</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.usInvert || 0} onChange={e => updateLink(l.id, { usInvert: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">DS Invert</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.dsInvert || 0} onChange={e => updateLink(l.id, { dsInvert: parseFloat(e.target.value) || 0 })} />
                            </div>
                          </>}

                          {/* Pump fields */}
                          {l.type === 'pump' && <>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Pump Type</Label>
                              <Select value={String(l.pumpType || 2)} onValueChange={v => updateLink(l.id, { pumpType: parseInt(v) })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4].map(t => <SelectItem key={t} value={String(t)}>{PUMP_CODES[t]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">On Depth</Label>
                              <Input type="number" step="0.1" className="font-mono text-sm" value={l.pumpOnDepth || 0} onChange={e => updateLink(l.id, { pumpOnDepth: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Off Depth</Label>
                              <Input type="number" step="0.1" className="font-mono text-sm" value={l.pumpOffDepth || 0} onChange={e => updateLink(l.id, { pumpOffDepth: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Curve Name</Label>
                              <Input className="font-mono text-sm" value={l.pumpCurveName || ''} onChange={e => updateLink(l.id, { pumpCurveName: e.target.value })} />
                            </div>
                          </>}

                          {/* Orifice fields */}
                          {l.type === 'orifice' && <>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Shape</Label>
                              <Select value={String(l.orificeShape || 2)} onValueChange={v => updateLink(l.id, { orificeShape: parseInt(v) })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Side</SelectItem>
                                  <SelectItem value="2">Circular</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Diameter</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.orificeDiam || 1} onChange={e => updateLink(l.id, { orificeDiam: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Coeff</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.orificeCoeff || 0.65} onChange={e => updateLink(l.id, { orificeCoeff: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Offset</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.orificeOffset || 0} onChange={e => updateLink(l.id, { orificeOffset: parseFloat(e.target.value) || 0 })} />
                            </div>
                          </>}

                          {/* Weir fields */}
                          {l.type === 'weir' && <>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Weir Type</Label>
                              <Select value={String(l.weirType || 1)} onValueChange={v => updateLink(l.id, { weirType: parseInt(v) })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4].map(t => <SelectItem key={t} value={String(t)}>{WEIR_CODES[t]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Crest Height</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.weirCrest || 0} onChange={e => updateLink(l.id, { weirCrest: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Top Elev</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.weirTop || 1} onChange={e => updateLink(l.id, { weirTop: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Length</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.weirLength || 1} onChange={e => updateLink(l.id, { weirLength: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Coeff</Label>
                              <Input type="number" step="0.01" className="font-mono text-sm" value={l.weirCoeff || 1.84} onChange={e => updateLink(l.id, { weirCoeff: parseFloat(e.target.value) || 0 })} />
                            </div>
                          </>}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 mt-5"
                          onClick={() => updateModel(m => ({ ...m, links: removeItem(m.links, l.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Subcatchments */}
            <TabsContent value="subcatchments">
              <div className="space-y-3">
                <Button size="sm" onClick={addSubcatchment}><Plus className="h-4 w-4 mr-1" /> Add Subcatchment</Button>
                {model.subcatchments.map(sc => (
                  <Card key={sc.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Name</Label>
                            <Input className="font-mono text-sm" value={sc.name} onChange={e => updateSubcatchment(sc.id, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Outlet Node</Label>
                            <Select value={sc.outlet} onValueChange={v => updateSubcatchment(sc.id, { outlet: v })}>
                              <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{nodeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Area</Label>
                            <Input type="number" step="0.1" className="font-mono text-sm" value={sc.area} onChange={e => updateSubcatchment(sc.id, { area: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Width</Label>
                            <Input type="number" className="font-mono text-sm" value={sc.width} onChange={e => updateSubcatchment(sc.id, { width: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">Slope %</Label>
                            <Input type="number" step="0.01" className="font-mono text-sm" value={sc.slope} onChange={e => updateSubcatchment(sc.id, { slope: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">% Imperv</Label>
                            <Input type="number" step="1" className="font-mono text-sm" value={sc.imperv} onChange={e => updateSubcatchment(sc.id, { imperv: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">N Imperv</Label>
                            <Input type="number" step="0.001" className="font-mono text-sm" value={sc.nImperv} onChange={e => updateSubcatchment(sc.id, { nImperv: parseFloat(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-mono text-xs">N Perv</Label>
                            <Input type="number" step="0.001" className="font-mono text-sm" value={sc.nPerv} onChange={e => updateSubcatchment(sc.id, { nPerv: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 mt-5"
                          onClick={() => updateModel(m => ({ ...m, subcatchments: removeItem(m.subcatchments, sc.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Infiltration row */}
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <Label className="font-mono text-xs text-muted-foreground">Horton f₀</Label>
                          <Input type="number" step="0.1" className="font-mono text-sm" value={sc.f0} onChange={e => updateSubcatchment(sc.id, { f0: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-mono text-xs text-muted-foreground">Horton f∞</Label>
                          <Input type="number" step="0.1" className="font-mono text-sm" value={sc.ff} onChange={e => updateSubcatchment(sc.id, { ff: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-mono text-xs text-muted-foreground">Decay (1/hr)</Label>
                          <Input type="number" step="0.1" className="font-mono text-sm" value={sc.fDecay} onChange={e => updateSubcatchment(sc.id, { fDecay: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Controls */}
            <TabsContent value="controls">
              <div className="space-y-3">
                <Button size="sm" onClick={addControl} disabled={model.nodes.length < 1 || model.links.length < 1}>
                  <Plus className="h-4 w-4 mr-1" /> Add Control Rule
                </Button>
                {(model.nodes.length < 1 || model.links.length < 1) && <p className="text-sm text-muted-foreground">Add at least one node and one link to create controls.</p>}
                {model.controls.map(ctrl => (
                  <Card key={ctrl.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Rule Name</Label>
                              <Input className="font-mono text-sm" value={ctrl.name} onChange={e => updateControl(ctrl.id, { name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Sensor Node</Label>
                              <Select value={ctrl.sensorNode} onValueChange={v => updateControl(ctrl.id, { sensorNode: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{nodeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Attribute</Label>
                              <Select value={ctrl.attribute} onValueChange={v => updateControl(ctrl.id, { attribute: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DEPTH">DEPTH</SelectItem>
                                  <SelectItem value="HEAD">HEAD</SelectItem>
                                  <SelectItem value="FLOW">FLOW</SelectItem>
                                  <SelectItem value="VOLUME">VOLUME</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Relation</Label>
                              <Select value={ctrl.relation} onValueChange={v => updateControl(ctrl.id, { relation: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value=">">{'>'}</SelectItem>
                                  <SelectItem value="<">{'<'}</SelectItem>
                                  <SelectItem value="=">{'='}</SelectItem>
                                  <SelectItem value=">=">{'>='}</SelectItem>
                                  <SelectItem value="<=">{'<='}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Threshold</Label>
                              <Input type="number" step="0.1" className="font-mono text-sm" value={ctrl.threshold} onChange={e => updateControl(ctrl.id, { threshold: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">Action Link</Label>
                              <Select value={ctrl.actionLink} onValueChange={v => updateControl(ctrl.id, { actionLink: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{linkNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">THEN Action</Label>
                              <Select value={ctrl.action} onValueChange={v => updateControl(ctrl.id, { action: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ON">ON</SelectItem>
                                  <SelectItem value="OFF">OFF</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="font-mono text-xs">ELSE Action</Label>
                              <Select value={ctrl.elseAction} onValueChange={v => updateControl(ctrl.id, { elseAction: v })}>
                                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OFF">OFF</SelectItem>
                                  <SelectItem value="ON">ON</SelectItem>
                                  <SelectItem value="">(none)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* Rule preview */}
                          <div className="mt-3 p-2 bg-muted/30 rounded border border-border font-mono text-xs">
                            <span className="text-primary font-bold">RULE</span> {ctrl.name}{' '}
                            <span className="text-warning font-bold">IF</span> NODE {ctrl.sensorNode} {ctrl.attribute} {ctrl.relation} {ctrl.threshold}{' '}
                            <span className="text-warning font-bold">THEN</span> {ctrl.actionLink} STATUS = {ctrl.action}
                            {ctrl.elseAction && <>{' '}<span className="text-destructive font-bold">ELSE</span> {ctrl.actionLink} STATUS = {ctrl.elseAction}</>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 mt-5"
                          onClick={() => updateModel(m => ({ ...m, controls: removeItem(m.controls, ctrl.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview">
              <Card>
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-mono">Generated .xp File</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(preview || generateXP(model)); }}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                      <FileDown className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <pre className="font-mono text-xs leading-relaxed text-muted-foreground overflow-auto max-h-[600px] whitespace-pre bg-muted/30 p-4 rounded-lg border border-border">
                    {preview || generateXP(model)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MakeXP;
