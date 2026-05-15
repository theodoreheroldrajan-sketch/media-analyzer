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

  // Animation trigger: flip to false then to true on next frame to restart
  // the CSS transition when data/metric changes. setState-in-effect is the
  // correct pattern for this animation cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional animation reset; setAnimate(false) immediately, then setAnimate(true) on the next frame to restart the CSS transition
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

  // Find max absolute delta (including CI bounds) for scaling
  const maxAbsDelta = Math.max(
    ...rows.flatMap((r) => [
      Math.abs(r.delta),
      Math.abs(r.delta95Lower),
      Math.abs(r.delta95Upper),
    ]),
    1
  );

  return (
    <div className="bar-chart">
      {/* Overall average line label */}
      <div className="bar-chart-baseline">
        <span className="muted" style={{ fontSize: 11 }}>
          Overall avg: {METRIC_FORMAT[metric](rows[0].overallAvg)} · whiskers
          show 95% CI
        </span>
      </div>

      {rows.map((row, i) => {
        const good = isGoodDelta(row.delta, metric);
        const barWidth = Math.max(4, (Math.abs(row.delta) / maxAbsDelta) * 100);
        const ciLowerPct = (Math.abs(row.delta95Lower) / maxAbsDelta) * 100;
        const ciUpperPct = (Math.abs(row.delta95Upper) / maxAbsDelta) * 100;
        const ciLeft = Math.min(ciLowerPct, ciUpperPct);
        const ciRight = Math.max(ciLowerPct, ciUpperPct);

        return (
          <div className="bar-row" key={`${row.value}-${i}`}>
            <div className="bar-label" title={row.value}>
              <span className="bar-label-text">{row.value}</span>
              <span className="bar-label-count mono">n={row.count}</span>
            </div>
            <div className="bar-track" style={{ position: "relative" }}>
              <div
                className="bar-fill"
                style={{
                  width: animate ? `${barWidth}%` : "0%",
                  background: good ? "linear-gradient(90deg, #1e8e3e, #34a853)" : "linear-gradient(90deg, #d93025, #ea4335)",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
              <div
                className="bar-ci"
                title={`95% CI: ${row.delta95Lower > 0 ? "+" : ""}${row.delta95Lower.toFixed(1)}% to ${row.delta95Upper > 0 ? "+" : ""}${row.delta95Upper.toFixed(1)}%`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${ciLeft}%`,
                  width: `${Math.max(ciRight - ciLeft, 0.5)}%`,
                  height: 1,
                  background: "rgba(255,255,255,0.7)",
                  transform: "translateY(-50%)",
                  opacity: animate ? 1 : 0,
                  transition: `opacity 300ms ease ${i * 40 + 300}ms`,
                  pointerEvents: "auto",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -4,
                    width: 1,
                    height: 9,
                    background: "rgba(255,255,255,0.85)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 0,
                    top: -4,
                    width: 1,
                    height: 9,
                    background: "rgba(255,255,255,0.85)",
                  }}
                />
              </div>
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
