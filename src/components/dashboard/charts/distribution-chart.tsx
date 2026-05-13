"use client";

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

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export default function DistributionChart({
  data,
  metric,
  bins = 14,
}: {
  data: CreativeData[];
  metric: MetricKey;
  bins?: number;
}) {
  const values = data.map((c) => getMetric(c, metric)).filter((v) => Number.isFinite(v));
  if (values.length === 0) {
    return <div className="muted" style={{ padding: 24, textAlign: "center" }}>No data</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;

  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binWidth));
    counts[idx]++;
  }
  const maxCount = Math.max(...counts);

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const med = median(values);

  // Position of mean and median in bin space
  const meanBin = (mean - min) / binWidth;
  const medBin = (med - min) / binWidth;

  return (
    <div className="distribution-chart">
      <div className="distribution-stats">
        <div className="distribution-stat">
          <span className="distribution-stat-label">Mean</span>
          <span className="mono distribution-stat-value">{METRIC_FORMAT[metric](mean)}</span>
        </div>
        <div className="distribution-stat">
          <span className="distribution-stat-label">Median</span>
          <span className="mono distribution-stat-value">{METRIC_FORMAT[metric](med)}</span>
        </div>
        <div className="distribution-stat">
          <span className="distribution-stat-label">Min</span>
          <span className="mono distribution-stat-value">{METRIC_FORMAT[metric](min)}</span>
        </div>
        <div className="distribution-stat">
          <span className="distribution-stat-label">Max</span>
          <span className="mono distribution-stat-value">{METRIC_FORMAT[metric](max)}</span>
        </div>
        <div className="distribution-stat">
          <span className="distribution-stat-label">n</span>
          <span className="mono distribution-stat-value">{values.length}</span>
        </div>
      </div>

      <div className="distribution-bars-wrap">
        {/* Mean line */}
        <div
          className="distribution-marker"
          style={{
            left: `${(meanBin / bins) * 100}%`,
            background: "var(--accent)",
          }}
          title={`Mean: ${METRIC_FORMAT[metric](mean)}`}
        >
          <span className="distribution-marker-label" style={{ color: "var(--accent-text)" }}>mean</span>
        </div>
        {/* Median line */}
        <div
          className="distribution-marker"
          style={{
            left: `${(medBin / bins) * 100}%`,
            background: "var(--amber)",
            top: 14,
          }}
          title={`Median: ${METRIC_FORMAT[metric](med)}`}
        >
          <span className="distribution-marker-label" style={{ color: "var(--amber)" }}>median</span>
        </div>

        <div className="distribution-bars">
          {counts.map((count, i) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div className="distribution-bar-col" key={i}>
                <div
                  className="distribution-bar"
                  style={{
                    height: `${Math.max(2, height)}%`,
                    background: "var(--accent)",
                    opacity: 0.6 + (count / maxCount) * 0.4,
                  }}
                  title={`${count} creatives between ${METRIC_FORMAT[metric](min + i * binWidth)} and ${METRIC_FORMAT[metric](min + (i + 1) * binWidth)}`}
                >
                  <span className="distribution-bar-count mono">{count > 0 ? count : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="distribution-axis">
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
            {METRIC_FORMAT[metric](min)}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
            {METRIC_FORMAT[metric](max)}
          </span>
        </div>
      </div>
    </div>
  );
}
