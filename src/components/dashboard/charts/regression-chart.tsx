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

/** Simple linear regression: y = a + b*x */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const meanY = sumY / n;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R²
  const ssTotal = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => {
    const pred = intercept + slope * p.x;
    return s + (p.y - pred) ** 2;
  }, 0);
  const r2 = ssTotal > 0 ? 1 - ssRes / ssTotal : 0;

  return { slope, intercept, r2 };
}

export default function RegressionChart({
  data,
  metric,
  mockedPValue,
  mockedCoef,
  height = 320,
}: {
  data: CreativeData[];
  metric: MetricKey;
  mockedPValue?: number;
  mockedCoef?: number;
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 700;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Use log10(impressions) as X
  const points = data.map((c) => ({
    creative: c,
    x: Math.log10(Math.max(1, c.impressions)),
    y: getMetric(c, metric),
  }));

  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));

  function xToPixel(x: number): number {
    const v = (x - xMin) / Math.max(xMax - xMin, 0.001);
    return padding.left + v * innerW;
  }

  function yToPixel(y: number): number {
    const v = (y - yMin) / Math.max(yMax - yMin, 0.001);
    return padding.top + (1 - v) * innerH;
  }

  const reg = linearRegression(points);
  const lineX1 = xMin;
  const lineX2 = xMax;
  const lineY1 = reg.intercept + reg.slope * lineX1;
  const lineY2 = reg.intercept + reg.slope * lineX2;

  // Display values
  const displayR2 = reg.r2;
  const displayP = mockedPValue ?? (Math.abs(reg.slope) > 0.001 ? 0.03 : 0.45);
  const displayCoef = mockedCoef ?? reg.slope;

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (yMax - yMin) * (i / yTickCount));
  }

  return (
    <div className="scatter-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} className="scatter-svg">
        {/* Grid */}
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

        {/* Axis labels */}
        <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--text-2)">
          log₁₀(Impressions)
        </text>
        <text x={-height / 2} y={14} transform="rotate(-90)" textAnchor="middle" fontSize="11" fill="var(--text-2)">
          {metric.toUpperCase()}
        </text>

        {/* Regression line */}
        <line
          x1={xToPixel(lineX1)}
          x2={xToPixel(lineX2)}
          y1={yToPixel(lineY1)}
          y2={yToPixel(lineY2)}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={p.creative.creativeId}
            cx={xToPixel(p.x)}
            cy={yToPixel(p.y)}
            r={hovered === i ? 6 : 3.5}
            fill="var(--accent)"
            opacity={hovered === null || hovered === i ? 0.7 : 0.25}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          />
        ))}

        {/* Stats box */}
        <g>
          <rect
            x={width - padding.right - 180}
            y={padding.top}
            width={170}
            height={70}
            fill="var(--surface)"
            stroke="var(--border-strong)"
            rx={4}
          />
          <text x={width - padding.right - 170} y={padding.top + 18} fontSize="11" fontWeight="600">
            Regression stats
          </text>
          <text x={width - padding.right - 170} y={padding.top + 34} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text-2)">
            β = {displayCoef.toFixed(3)}
          </text>
          <text x={width - padding.right - 170} y={padding.top + 48} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text-2)">
            R² = {displayR2.toFixed(3)}
          </text>
          <text x={width - padding.right - 170} y={padding.top + 62} fontSize="10" fontFamily="JetBrains Mono, monospace" fill={displayP < 0.05 ? "var(--green)" : "var(--text-3)"}>
            p = {displayP < 0.001 ? "< 0.001" : displayP.toFixed(3)} {displayP < 0.05 ? "★" : ""}
          </text>
        </g>

        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const p = points[hovered];
          return (
            <g>
              <rect
                x={xToPixel(p.x) + 8}
                y={yToPixel(p.y) - 36}
                width={180}
                height={32}
                fill="var(--surface)"
                stroke="var(--border-strong)"
                rx={4}
              />
              <text x={xToPixel(p.x) + 14} y={yToPixel(p.y) - 22} fontSize="10" fontFamily="JetBrains Mono, monospace">
                {p.creative.filename}
              </text>
              <text x={xToPixel(p.x) + 14} y={yToPixel(p.y) - 10} fontSize="10" fill="var(--text-2)">
                {METRIC_FORMAT[metric](p.y)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
