import { useMemo, useRef, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Move, Grid3x3 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import type { MakeNode, MakeLink, MakeSubcatchment } from "@/lib/xp-generator";

interface Props {
  nodes: MakeNode[];
  links: MakeLink[];
  subcatchments: MakeSubcatchment[];
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
  junction: 'hsl(var(--primary))',
  outfall: 'hsl(var(--warning))',
  storage: '#9a8aef',
};

const LINK_COLORS: Record<string, string> = {
  conduit: 'hsl(var(--muted-foreground))',
  pump: '#f472b6',
  orifice: '#38bdf8',
  weir: '#34d399',
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.2;
const SNAP_SIZES = [0, 1, 5, 10, 25, 50, 100] as const;

export function MakeNetworkMap({ nodes, links, subcatchments, onNodeMove }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [snapIndex, setSnapIndex] = useState(3); // default 10
  const snapSize = SNAP_SIZES[snapIndex];

  // Zoom/pan state: viewBox origin and zoom level
  const [zoom, setZoom] = useState(1);
  const [viewOrigin, setViewOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const hasCoords = nodes.some(n => n.x !== 0 || n.y !== 0);

  const layout = useMemo(() => {
    if (!nodes.length) return null;

    const pad = 50;
    const w = 900;
    const baseH = 460;

    let positioned: { node: MakeNode; px: number; py: number }[];
    let h = baseH;
    let xMin = 0, xRange = 0, yMin = 0, yRange = 0;

    if (hasCoords) {
      const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
      xMin = Math.min(...xs);
      const xx = Math.max(...xs);
      yMin = Math.min(...ys);
      const yx = Math.max(...ys);
      xRange = xx - xMin;
      yRange = yx - yMin;
      if (xRange > 0 && yRange > 0) {
        h = Math.max(300, Math.min(800, 2 * pad + (w - 2 * pad) * (yRange / xRange)));
      }
      positioned = nodes.map(n => {
        const px = xRange > 0
          ? pad + ((n.x - xMin) / xRange) * (w - 2 * pad)
          : w / 2;
        const py = yRange > 0
          ? h - pad - ((n.y - yMin) / yRange) * (h - 2 * pad)
          : h / 2;
        return { node: n, px, py };
      });
    } else {
      h = baseH;
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const gx = (w - 2 * pad) / Math.max(cols - 1, 1);
      const rows = Math.ceil(nodes.length / cols);
      const gy = (h - 2 * pad) / Math.max(rows - 1, 1);
      xMin = 0; xRange = (cols - 1) * gx || w - 2 * pad;
      yMin = 0; yRange = (rows - 1) * gy || h - 2 * pad;
      positioned = nodes.map((n, i) => ({
        node: n,
        px: pad + (i % cols) * gx,
        py: pad + Math.floor(i / cols) * gy,
      }));
    }

    const posMap: Record<string, { px: number; py: number }> = {};
    positioned.forEach(p => { posMap[p.node.name] = { px: p.px, py: p.py }; });

    return { w, h, pad, positioned, posMap, xMin, xRange, yMin, yRange };
  }, [nodes, hasCoords]);

  // Convert SVG pixel coordinates back to data coordinates
  const svgToData = useCallback((svgX: number, svgY: number) => {
    if (!layout) return { x: 0, y: 0 };
    const { w, h, pad, xRange, xMin, yRange, yMin } = layout;
    const dataX = xRange > 0
      ? xMin + ((svgX - pad) / (w - 2 * pad)) * xRange
      : xMin;
    const dataY = yRange > 0
      ? yMin + ((h - pad - svgY) / (h - 2 * pad)) * yRange
      : yMin;
    return { x: Math.round(dataX * 10) / 10, y: Math.round(dataY * 10) / 10 };
  }, [layout]);

  // Convert client mouse position to SVG coordinates (accounting for zoom/pan viewBox)
  const clientToSVG = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Zoom toward a point in SVG coordinates
  const zoomAt = useCallback((factor: number, svgX: number, svgY: number) => {
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
      const actualFactor = next / prev;
      setViewOrigin(o => ({
        x: svgX - (svgX - o.x) / actualFactor,
        y: svgY - (svgY - o.y) / actualFactor,
      }));
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!layout) return;
    zoomAt(ZOOM_STEP, viewOrigin.x + layout.w / zoom / 2, viewOrigin.y + layout.h / zoom / 2);
  }, [layout, zoom, viewOrigin, zoomAt]);

  const handleZoomOut = useCallback(() => {
    if (!layout) return;
    zoomAt(1 / ZOOM_STEP, viewOrigin.x + layout.w / zoom / 2, viewOrigin.y + layout.h / zoom / 2);
  }, [layout, zoom, viewOrigin, zoomAt]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setViewOrigin({ x: 0, y: 0 });
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const svgPt = clientToSVG(e.clientX, e.clientY);
    zoomAt(factor, svgPt.x, svgPt.y);
  }, [clientToSVG, zoomAt]);

  // Node dragging
  const handlePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    if (!onNodeMove) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragNodeId(nodeId);
  }, [onNodeMove]);

  // Pan: middle-click or Ctrl+left-click on background
  const handleSvgPointerDown = useCallback((e: React.PointerEvent) => {
    // Only start pan if not dragging a node
    if (dragNodeId) return;
    const isMiddle = e.button === 1;
    const isCtrlLeft = e.button === 0 && (e.ctrlKey || e.metaKey);
    const isRightBackground = e.button === 0 && !onNodeMove; // pan with left-click when no drag mode
    if (isMiddle || isCtrlLeft) {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewOrigin.x, vy: viewOrigin.y };
    }
  }, [dragNodeId, onNodeMove, viewOrigin]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Pan
    if (isPanning && panStart.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!layout) return;
      const vbW = layout.w / zoom;
      const vbH = layout.h / zoom;
      const dx = (e.clientX - panStart.current.x) / rect.width * vbW;
      const dy = (e.clientY - panStart.current.y) / rect.height * vbH;
      setViewOrigin({
        x: panStart.current.vx - dx,
        y: panStart.current.vy - dy,
      });
      return;
    }
    // Node drag
    if (!dragNodeId || !onNodeMove) return;
    const svgPt = clientToSVG(e.clientX, e.clientY);
    const data = svgToData(svgPt.x, svgPt.y);
    const snapped = snapSize > 0
      ? { x: Math.round(data.x / snapSize) * snapSize, y: Math.round(data.y / snapSize) * snapSize }
      : data;
    onNodeMove(dragNodeId, snapped.x, snapped.y);
  }, [isPanning, dragNodeId, onNodeMove, clientToSVG, svgToData, layout, zoom, snapSize]);

  const handlePointerUp = useCallback(() => {
    setDragNodeId(null);
    setIsPanning(false);
    panStart.current = null;
  }, []);

  if (!nodes.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Add nodes and links to see the network map. Nodes with X/Y coordinates will be positioned spatially.
        </CardContent>
      </Card>
    );
  }

  if (!layout) return null;
  const { w, h, positioned, posMap } = layout;

  // Compute the zoomed viewBox
  const vbW = w / zoom;
  const vbH = h / zoom;
  const viewBox = `${viewOrigin.x} ${viewOrigin.y} ${vbW} ${vbH}`;

  const scOutlets = subcatchments.map(sc => ({
    name: sc.name,
    outlet: sc.outlet,
    pos: posMap[sc.outlet],
  })).filter(s => s.pos);

  const zoomPct = Math.round(zoom * 100);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-mono">
            {nodes.length} nodes • {links.length} links • {subcatchments.length} subcatchments
            {onNodeMove && <span className="ml-2 text-xs text-primary opacity-80">⤡ Drag nodes to reposition</span>}
            {!hasCoords && nodes.length > 0 && !onNodeMove && <span className="ml-2 text-xs opacity-60">(auto-layout)</span>}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-muted-foreground mr-1">{zoomPct}%</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleResetView} title="Reset view">
              <Maximize className="h-3.5 w-3.5" />
            </Button>
            {onNodeMove && (
              <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
                <Toggle
                  size="sm"
                  pressed={snapSize > 0}
                  onPressedChange={() => setSnapIndex(i => i === 0 ? 3 : 0)}
                  className="h-7 w-7 p-0"
                  title={snapSize > 0 ? `Snap: ${snapSize}` : 'Snap off'}
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </Toggle>
                {snapSize > 0 && (
                  <select
                    value={snapIndex}
                    onChange={e => setSnapIndex(Number(e.target.value))}
                    className="h-7 text-xs font-mono bg-transparent border border-border rounded px-1 text-foreground"
                  >
                    {SNAP_SIZES.filter(s => s > 0).map((s, i) => (
                      <option key={s} value={i + 1}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline opacity-60">
              <Move className="h-3 w-3 inline mr-0.5" />Ctrl+drag or scroll to zoom/pan
            </span>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-card relative">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className={`w-full ${isPanning ? 'cursor-grabbing' : 'touch-none'}`}
            style={{ minHeight: 300 }}
            onWheel={handleWheel}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <rect x={viewOrigin.x} y={viewOrigin.y} width={vbW} height={vbH} fill="hsl(var(--card))" />

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(f => (
              <g key={f}>
                <line x1={w * f} y1={0} x2={w * f} y2={h} stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.3} />
                <line x1={0} y1={h * f} x2={w} y2={h * f} stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.3} />
              </g>
            ))}

            {/* Subcatchment outflow indicators */}
            {scOutlets.map((sc, i) => (
              <g key={`sc-${i}`}>
                <circle cx={sc.pos!.px} cy={sc.pos!.py} r={18} fill="hsl(var(--primary))" opacity={0.08} stroke="hsl(var(--primary))" strokeWidth={0.5} strokeDasharray="3 2" />
                <text x={sc.pos!.px} y={sc.pos!.py + 22} fill="hsl(var(--primary))" fontSize={7} fontFamily="monospace" textAnchor="middle" opacity={0.6}>{sc.name}</text>
              </g>
            ))}

            {/* Links */}
            {links.map((l, i) => {
              const u = posMap[l.fromNode], d = posMap[l.toNode];
              if (!u || !d) return null;
              const color = LINK_COLORS[l.type] || 'hsl(var(--muted-foreground))';
              const isPump = l.type === 'pump';
              const isWeir = l.type === 'weir';
              const isOrif = l.type === 'orifice';
              const mx = (u.px + d.px) / 2, my = (u.py + d.py) / 2;

              return (
                <g key={`link-${i}`}>
                  <line
                    x1={u.px} y1={u.py} x2={d.px} y2={d.py}
                    stroke={color} strokeWidth={isPump || isWeir || isOrif ? 2.5 : 1.5}
                    strokeDasharray={isPump ? '6 3' : isOrif ? '3 3' : undefined}
                    opacity={0.8}
                  />
                  <text x={mx} y={my - 6} fill={color} fontSize={7} fontFamily="monospace" textAnchor="middle" opacity={0.7}>
                    {l.name}
                  </text>
                  {(() => {
                    const dx = d.px - u.px, dy = d.py - u.py;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 20) return null;
                    const nx = dx / dist, ny = dy / dist;
                    const ax = mx + nx * 2, ay = my + ny * 2;
                    const s = 5;
                    return (
                      <polygon
                        points={`${ax + nx * s},${ay + ny * s} ${ax - ny * s * 0.5 - nx * s},${ay + nx * s * 0.5 - ny * s} ${ax + ny * s * 0.5 - nx * s},${ay - nx * s * 0.5 - ny * s}`}
                        fill={color} opacity={0.6}
                      />
                    );
                  })()}
                  {isWeir && (
                    <line x1={mx - 6} y1={my + 2} x2={mx + 6} y2={my + 2} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {positioned.map((p, i) => {
              const { node, px, py } = p;
              const color = TYPE_COLORS[node.type] || 'hsl(var(--primary))';
              const isOutfall = node.type === 'outfall';
              const isStorage = node.type === 'storage';
              const isDragging = dragNodeId === node.id;
              const r = isOutfall ? 7 : isStorage ? 6 : 4;
              const hitR = Math.max(r + 6, 12);

              return (
                <g
                  key={`node-${i}`}
                  style={{ cursor: onNodeMove ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  onPointerDown={(e) => handlePointerDown(e, node.id)}
                >
                  {/* Invisible hit area */}
                  {onNodeMove && (
                    <circle cx={px} cy={py} r={hitR} fill="transparent" />
                  )}
                  {/* Drag highlight */}
                  {isDragging && (
                    <circle cx={px} cy={py} r={r + 8} fill="hsl(var(--primary))" opacity={0.12} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="4 2" />
                  )}
                  {/* Glow */}
                  <circle cx={px} cy={py} r={r + 3} fill={color} opacity={isDragging ? 0.3 : 0.15} />
                  {/* Shape */}
                  {isOutfall ? (
                    <polygon
                      points={`${px},${py - r} ${px + r},${py + r * 0.6} ${px - r},${py + r * 0.6}`}
                      fill={color} stroke="hsl(var(--background))" strokeWidth={1.5}
                    />
                  ) : isStorage ? (
                    <rect x={px - r} y={py - r * 0.7} width={r * 2} height={r * 1.4} rx={2} fill={color} stroke="hsl(var(--background))" strokeWidth={1.5} />
                  ) : (
                    <circle cx={px} cy={py} r={r} fill={color} stroke="hsl(var(--background))" strokeWidth={1.5} />
                  )}
                  {/* Label */}
                  <text x={px + r + 4} y={py - r - 2} fill="hsl(var(--foreground))" fontSize={9} fontFamily="monospace" fontWeight="bold" opacity={0.85}>
                    {node.name}
                  </text>
                  <text x={px + r + 4} y={py - r + 8} fill="hsl(var(--muted-foreground))" fontSize={7} fontFamily="monospace" opacity={0.6}>
                    {isDragging ? `${node.x.toFixed(0)}, ${node.y.toFixed(0)}` : node.elevation.toFixed(1)}
                  </text>
                  <title>{node.name} ({node.type}) — X: {node.x}, Y: {node.y}, Elev: {node.elevation}</title>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 font-mono text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/70 mr-1">Nodes:</span>
          <span><span style={{ color: TYPE_COLORS.junction }}>●</span> Junction</span>
          <span><span style={{ color: TYPE_COLORS.outfall }}>▲</span> Outfall</span>
          <span><span style={{ color: TYPE_COLORS.storage }}>■</span> Storage</span>
          <span className="font-semibold text-foreground/70 ml-3 mr-1">Links:</span>
          <span><span style={{ color: LINK_COLORS.conduit }}>—</span> Conduit</span>
          <span><span style={{ color: LINK_COLORS.pump }}>╌</span> Pump</span>
          <span><span style={{ color: LINK_COLORS.orifice }}>┄</span> Orifice</span>
          <span><span style={{ color: LINK_COLORS.weir }}>━</span> Weir</span>
        </div>
      </CardContent>
    </Card>
  );
}
