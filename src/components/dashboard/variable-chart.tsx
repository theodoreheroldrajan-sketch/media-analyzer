"use client";

import { useState, useEffect } from "react";
import type { MetricKey, VariablePerformance } from "@/lib/analytics";

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

/** For CPC/CPA, lower is better → invert the "good" color logic */
function isGoodDelta(delta: number, metric: MetricKey): boolean {
  if (metric === "cpc" || metric === "cpa") return delta < 0;
  return delta > 0;
}

export default function VariableChart({
  data,
  metric,
}: {
  data: VariablePerformance[];
  metric: MetricKey;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, [data, metric]);

  // Filter out insufficient data, sort by delta
  const rows = data
    .filter((d) => d.confidence !== "insufficient")
    .sort((a, b) => {
      // Sort so "good" values are on top
      if (metric === "cpc" || metric === "cpa") {
        return a.delta - b.delta; // lowest delta first (biggest savings)
      }
      return b.delta - a.delta; // highest delta first
    });

  if (rows.length === 0) {
    return (
      <div className="bar-chart-empty">
        <p className="muted">Not enough data for this variable.</p>
      </div>
    );
  }

  // Find max absolute delta for scaling
  const maxAbsDelta = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);

  return (
    <div className="bar-chart">
      {/* Overall average line label */}
      <div className="bar-chart-baseline">
        <span className="muted" style={{ fontSize: 11 }}>
          Overall avg: {METRIC_FORMAT[metric](rows[0].overallAvg)}
        </span>
      </div>

      {rows.map((row, i) => {
        const good = isGoodDelta(row.delta, metric);
        const barWidth = Math.max(4, (Math.abs(row.delta) / maxAbsDelta) * 100);

        return (
          <div className="bar-row" key={`${row.value}-${i}`}>
            <div className="bar-label" title={row.value}>
              <span className="bar-label-text">{row.value}</span>
              <span className="bar-label-count mono">n={row.count}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: animate ? `${barWidth}%` : "0%",
                  background: good ? "var(--green)" : "var(--red)",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            </div>
            <div className="bar-value mono">
              <span
                style={{
                  color: good ? "var(--green)" : "var(--red)",
                  fontWeight: 600,
                }}
              >
                {row.delta > 0 ? "+" : ""}
                {row.delta.toFixed(1)}%
              </span>
              <span className="bar-value-abs">
                {METRIC_FORMAT[metric](row.avgMetric)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
