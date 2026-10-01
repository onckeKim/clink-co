"use client";

import * as React from "react";

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Single-series line + area chart (e.g. daily sales over the last 30 days).
 * One series needs no legend — the card title already names what's plotted
 * (see the dataviz skill's marks-and-anatomy guidance). Ships a crosshair +
 * tooltip on hover/focus so every value is reachable without guessing at a
 * 2px line, and a visually-hidden table underneath so the data is reachable
 * without hovering at all.
 */
export function AreaLineChart({
  data,
  formatValue = (v) => v.toLocaleString("en-ZA"),
  height = 220,
  color = "#1c1c1a",
}: {
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  height?: number;
  color?: string;
}) {
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerHeight - (d.value / maxValue) * innerHeight,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? 0} ${padding.top + innerHeight} L ${points[0]?.x ?? 0} ${padding.top + innerHeight} Z`;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let nearestDistance = Infinity;
    points.forEach((p, i) => {
      const distance = Math.abs(p.x - relativeX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;
  const gridY = [0, 0.5, 1].map((t) => padding.top + innerHeight * t);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none"
        role="img"
        aria-label="Sales over time"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridY.map((y) => (
          <line key={y} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e9e7e2" strokeWidth={1} />
        ))}

        <path d={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={padding.top} y2={padding.top + innerHeight} stroke="#c3c2b7" strokeWidth={1} />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="#fcfbf8" strokeWidth={2} />
          </>
        )}

        {points.length > 0 && (
          <>
            <text x={points[0]!.x} y={height - 8} fontSize={11} fill="#746c62" textAnchor="start">
              {points[0]!.label}
            </text>
            <text x={points.at(-1)!.x} y={height - 8} fontSize={11} fill="#746c62" textAnchor="end">
              {points.at(-1)!.label}
            </text>
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-xl border border-sand bg-warm-white px-3 py-2 text-xs shadow-lifted"
          style={{ left: `${(hovered.x / width) * 100}%` }}
        >
          <p className="text-stone">{hovered.label}</p>
          <p className="font-medium text-charcoal">{formatValue(hovered.value)}</p>
        </div>
      )}

      <table className="sr-only">
        <caption>Sales over time</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
