import { useMemo } from "react";
import type { MakeNode, MakeLink } from "@/lib/xp-generator";

interface Props {
  nodes: { node: MakeNode; px: number; py: number }[];
  links: MakeLink[];
  posMap: Record<string, { px: number; py: number }>;
  fullW: number;
  fullH: number;
  viewOrigin: { x: number; y: number };
  zoom: number;
  onPanTo: (x: number, y: number) => void;
}

const MINIMAP_W = 140;
const MINIMAP_H = 90;

export function NetworkMinimap({ nodes, links, posMap, fullW, fullH, viewOrigin, zoom, onPanTo }: Props) {
  const scale = useMemo(() => {
    const sx = MINIMAP_W / fullW;
    const sy = MINIMAP_H / fullH;
    return Math.min(sx, sy);
  }, [fullW, fullH]);

  const vbW = fullW / zoom;
  const vbH = fullH / zoom;

  // Viewport rect in minimap coordinates
  const vpX = viewOrigin.x * scale;
  const vpY = viewOrigin.y * scale;
  const vpW = vbW * scale;
  const vpH = vbH * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * MINIMAP_W;
    const my = ((e.clientY - rect.top) / rect.height) * MINIMAP_H;
    // Center viewport on clicked point
    onPanTo(mx / scale - vbW / 2, my / scale - vbH / 2);
  };

  return (
    <div className="absolute bottom-2 right-2 border border-border rounded bg-card/90 backdrop-blur-sm shadow-md overflow-hidden pointer-events-auto">
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        viewBox={`0 0 ${MINIMAP_W} ${MINIMAP_H}`}
        className="block cursor-crosshair"
        onClick={handleClick}
      >
        {/* Background */}
        <rect width={MINIMAP_W} height={MINIMAP_H} fill="hsl(var(--card))" />

        {/* Links */}
        {links.map((l, i) => {
          const u = posMap[l.fromNode];
          const d = posMap[l.toNode];
          if (!u || !d) return null;
          return (
            <line
              key={i}
              x1={u.px * scale} y1={u.py * scale}
              x2={d.px * scale} y2={d.py * scale}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={0.5}
              opacity={0.5}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((p, i) => (
          <circle
            key={i}
            cx={p.px * scale}
            cy={p.py * scale}
            r={1.5}
            fill="hsl(var(--primary))"
            opacity={0.8}
          />
        ))}

        {/* Viewport rectangle */}
        <rect
          x={vpX} y={vpY}
          width={Math.max(vpW, 4)} height={Math.max(vpH, 3)}
          fill="hsl(var(--primary))"
          fillOpacity={0.1}
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          strokeOpacity={0.7}
          rx={1}
        />
      </svg>
    </div>
  );
}
