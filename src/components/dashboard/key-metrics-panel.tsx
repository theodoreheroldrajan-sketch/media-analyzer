"use client";

import type { KeyMetrics, MetricKey } from "@/lib/analytics";

const STATS: {
  key: string;
  label: string;
  format: (km: KeyMetrics) => string;
  highlight?: MetricKey[];
}[] = [
  {
    key: "creatives",
    label: "Creatives analysed",
    format: (km) => String(km.creativesAnalysed),
  },
  {
    key: "impressions",
    label: "Total impressions",
    format: (km) => km.totalImpressions.toLocaleString(),
  },
  {
    key: "clicks",
    label: "Total clicks",
    format: (km) => km.totalClicks.toLocaleString(),
  },
  {
    key: "spend",
    label: "Total spend",
    format: (km) => `$${km.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  },
  {
    key: "ctr",
    label: "Avg CTR",
    format: (km) => `${km.avgCTR.toFixed(2)}%`,
    highlight: ["ctr"],
  },
  {
    key: "cpc",
    label: "Avg CPC",
    format: (km) => `$${km.avgCPC.toFixed(2)}`,
    highlight: ["cpc"],
  },
  {
    key: "cpa",
    label: "Avg CPA",
    format: (km) => `$${km.avgCPA.toFixed(2)}`,
    highlight: ["cpa"],
  },
  {
    key: "cvr",
    label: "Avg CVR",
    format: (km) => `${km.avgCVR.toFixed(2)}%`,
    highlight: ["cvr"],
  },
  {
    key: "roas",
    label: "Avg ROAS",
    format: (km) => `${km.avgROAS.toFixed(2)}x`,
    highlight: ["roas"],
  },
];

export default function KeyMetricsPanel({
  keyMetrics,
  metric,
}: {
  keyMetrics: KeyMetrics;
  metric: MetricKey;
}) {
  return (
    <div className="panel">
      <h3 className="panel-title">Key metrics</h3>
      <p className="panel-sub">
        Aggregated across all mapped creatives.
      </p>
      <div className="stat-grid mt-2">
        {STATS.map((s) => {
          const isHighlighted = s.highlight?.includes(metric);
          return (
            <div
              className={`stat ${isHighlighted ? "stat-highlighted" : ""}`}
              key={s.key}
            >
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.format(keyMetrics)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
