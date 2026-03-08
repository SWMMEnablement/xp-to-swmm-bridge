import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { MakeNode, MakeLink, MakeSubcatchment } from "@/lib/xp-generator";

interface Props {
  nodes: MakeNode[];
  links: MakeLink[];
  subcatchments: MakeSubcatchment[];
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

export function MakeNetworkMap({ nodes, links, subcatchments }: Props) {
  const hasCoords = nodes.some(n => n.x !== 0 || n.y !== 0);

  const layout = useMemo(() => {
    if (!nodes.length) return null;

    const pad = 50;
    const w = 900;
    const h = 460;

    // Use coordinates if available, else auto-layout in a grid
    let positioned: { node: MakeNode; px: number; py: number }[];
    if (hasCoords) {
      const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
      const xn = Math.min(...xs), xx = Math.max(...xs);
      const yn = Math.min(...ys), yx = Math.max(...ys);
      const xr = xx - xn || 1, yr = yx - yn || 1;
      positioned = nodes.map(n => ({
        node: n,
        px: pad + ((n.x - xn) / xr) * (w - 2 * pad),
        py: h - pad - ((n.y - yn) / yr) * (h - 2 * pad),
      }));
    } else {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const gx = (w - 2 * pad) / Math.max(cols - 1, 1);
      const rows = Math.ceil(nodes.length / cols);
      const gy = (h - 2 * pad) / Math.max(rows - 1, 1);
      positioned = nodes.map((n, i) => ({
        node: n,
        px: pad + (i % cols) * gx,
        py: pad + Math.floor(i / cols) * gy,
      }));
    }

    const posMap: Record<string, { px: number; py: number }> = {};
    positioned.forEach(p => { posMap[p.node.name] = { px: p.px, py: p.py }; });

    return { w, h, positioned, posMap };
  }, [nodes, hasCoords]);

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

  // Find subcatchment outlet positions for annotation
  const scOutlets = subcatchments.map(sc => ({
    name: sc.name,
    outlet: sc.outlet,
    pos: posMap[sc.outlet],
  })).filter(s => s.pos);

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground mb-3 font-mono">
          {nodes.length} nodes • {links.length} links • {subcatchments.length} subcatchments
          {!hasCoords && nodes.length > 0 && <span className="ml-2 text-xs opacity-60">(auto-layout — set X/Y on nodes for spatial positioning)</span>}
        </p>

        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 460 }}>
            <rect width={w} height={h} fill="hsl(var(--card))" />

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
                  {/* Link label */}
                  <text x={mx} y={my - 6} fill={color} fontSize={7} fontFamily="monospace" textAnchor="middle" opacity={0.7}>
                    {l.name}
                  </text>
                  {/* Direction arrow */}
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
                  {/* Weir crest indicator */}
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
              const r = isOutfall ? 7 : isStorage ? 6 : 4;

              return (
                <g key={`node-${i}`}>
                  {/* Glow */}
                  <circle cx={px} cy={py} r={r + 3} fill={color} opacity={0.15} />
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
                    {node.elevation.toFixed(1)}
                  </text>
                  <title>{node.name} ({node.type}) — Elev: {node.elevation}, MaxD: {node.maxDepth}</title>
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
