"use client";

import { useState } from "react";
import type { MetricKey, CreativeData } from "@/lib/analytics";

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

function getMetric(c: CreativeData, metric: MetricKey): number {
  switch (metric) {
    case "ctr": return c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
    case "cpc": return c.clicks > 0 ? c.spend / c.clicks : 0;
    case "cpa": return c.conversions > 0 ? c.spend / c.conversions : 0;
    case "cvr": return c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
    case "roas": return c.spend > 0 ? c.revenue / c.spend : 0;
  }
}

export default function ScatterChart({
  data,
  metric,
  colorByVariable,
  height = 320,
}: {
  data: CreativeData[];
  metric: MetricKey;
  colorByVariable?: string;
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 700;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Compute axes
  const points = data.map((c) => ({
    creative: c,
    x: c.impressions,
    y: getMetric(c, metric),
  }));

  const xMin = Math.max(1, Math.min(...points.map((p) => p.x)));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));

  // Log scale on x-axis
  const logXMin = Math.log10(xMin);
  const logXMax = Math.log10(xMax);

  function xToPixel(x: number): number {
    const v = (Math.log10(x) - logXMin) / (logXMax - logXMin);
    return padding.left + v * innerW;
  }

  function yToPixel(y: number): number {
    const v = (y - yMin) / Math.max(yMax - yMin, 0.001);
    return padding.top + (1 - v) * innerH;
  }

  // Color by variable
  const uniqueValues = colorByVariable
    ? Array.from(new Set(data.map((c) => String(c.extractedVariables[colorByVariable]))))
    : [];

  function pointColor(c: CreativeData): string {
    if (!colorByVariable) return "var(--accent)";
    const val = String(c.extractedVariables[colorByVariable]);
    const idx = uniqueValues.indexOf(val);
    const hue = (idx * 73) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  }

  // X-axis ticks (log scale)
  const xTicks: number[] = [];
  for (let p = Math.ceil(logXMin); p <= Math.floor(logXMax); p++) {
    xTicks.push(Math.pow(10, p));
  }

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (yMax - yMin) * (i / yTickCount));
  }

  return (
    <div className="scatter-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto" }}
        className="scatter-svg"
      >
        {/* Y-axis grid */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yToPixel(t)}
              y2={yToPixel(t)}
              stroke="var(--border)"
              strokeDasharray="2 3"
            />
            <text
              x={padding.left - 8}
              y={yToPixel(t) + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="var(--text-3)"
            >
              {METRIC_FORMAT[metric](t)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xTicks.map((t, i) => (
          <text
            key={`x-${i}`}
            x={xToPixel(t)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            fill="var(--text-3)"
          >
            {t >= 1000 ? `${t / 1000}K` : t}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-2)"
        >
          Impressions (log scale)
        </text>
        <text
          x={-height / 2}
          y={14}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-2)"
        >
          {metric.toUpperCase()}
        </text>

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={p.creative.creativeId}
            cx={xToPixel(p.x)}
            cy={yToPixel(p.y)}
            r={hovered === i ? 6 : 4}
            fill={pointColor(p.creative)}
            opacity={hovered === null || hovered === i ? 0.85 : 0.3}
            stroke="white"
            strokeWidth="1"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", transition: "r 0.1s, opacity 0.1s" }}
          />
        ))}

        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const p = points[hovered];
          const tx = xToPixel(p.x);
          const ty = yToPixel(p.y);
          const tooltipW = 200;
          const tooltipH = 56;
          const tooltipX = tx + tooltipW > width ? tx - tooltipW - 10 : tx + 10;
          const tooltipY = ty + tooltipH > height ? ty - tooltipH - 10 : ty + 10;

          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                fill="var(--surface)"
                stroke="var(--border-strong)"
                rx={4}
              />
              <text x={tooltipX + 8} y={tooltipY + 16} fontSize="10" fontFamily="JetBrains Mono, monospace">
                {p.creative.filename}
              </text>
              <text x={tooltipX + 8} y={tooltipY + 32} fontSize="10" fill="var(--text-2)">
                {METRIC_FORMAT[metric](p.y)} · {p.x.toLocaleString()} imps
              </text>
              {colorByVariable && (
                <text x={tooltipX + 8} y={tooltipY + 48} fontSize="9" fill="var(--text-3)">
                  {colorByVariable}: {String(p.creative.extractedVariables[colorByVariable])}
                </text>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      {colorByVariable && uniqueValues.length > 0 && uniqueValues.length <= 8 && (
        <div className="scatter-legend">
          {uniqueValues.map((v, idx) => (
            <span className="scatter-legend-item" key={v}>
              <span
                className="scatter-legend-dot"
                style={{ background: `hsl(${(idx * 73) % 360}, 60%, 55%)` }}
              />
              <span style={{ fontSize: 11 }}>{v}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
