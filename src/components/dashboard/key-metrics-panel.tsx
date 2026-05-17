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

type SimpleStat = {
  label: string;
  value: (km: KeyMetrics) => string;
  explain: (km: KeyMetrics) => string;
  highlight?: MetricKey[];
};

const REACH_AND_SPEND: SimpleStat[] = [
  {
    label: "Creatives analysed",
    value: (km) => String(km.creativesAnalysed),
    explain: () => "How many of your ads we have results for.",
  },
  {
    label: "Total impressions",
    value: (km) => km.totalImpressions.toLocaleString(),
    explain: () => "How many times these ads were shown to people.",
  },
  {
    label: "Total clicks",
    value: (km) => km.totalClicks.toLocaleString(),
    explain: () => "How many people tapped or clicked your ads.",
  },
  {
    label: "Total spend",
    value: (km) => `$${km.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    explain: () => "The total ad budget behind these creatives.",
  },
];

const PERFORMANCE: SimpleStat[] = [
  {
    label: "Click-through rate",
    value: (km) => `${km.avgCTR.toFixed(2)}%`,
    explain: (km) => `About ${km.avgCTR.toFixed(1)} out of every 100 people who saw your ad clicked it.`,
    highlight: ["ctr"],
  },
  {
    label: "Cost per click",
    value: (km) => `$${km.avgCPC.toFixed(2)}`,
    explain: (km) =>
      km.avgCPC < 1
        ? `You paid about ${Math.round(km.avgCPC * 100)} cents each time someone clicked.`
        : `You paid about $${km.avgCPC.toFixed(2)} each time someone clicked.`,
    highlight: ["cpc"],
  },
  {
    label: "Conversion rate",
    value: (km) => `${km.avgCVR.toFixed(2)}%`,
    explain: (km) => `Of those who clicked, about ${Math.round(km.avgCVR)} in 100 took the desired action.`,
    highlight: ["cvr"],
  },
  {
    label: "Cost per action",
    value: (km) => `$${km.avgCPA.toFixed(2)}`,
    explain: (km) => `Each conversion costs you about $${km.avgCPA.toFixed(2)}.`,
    highlight: ["cpa"],
  },
  {
    label: "Return on ad spend",
    value: (km) => `${km.avgROAS.toFixed(2)}x`,
    explain: (km) => `For every $1 you spent, you got $${km.avgROAS.toFixed(2)} back in revenue.`,
    highlight: ["roas"],
  },
];

export default function KeyMetricsPanel({
  keyMetrics,
  metric,
  simplified = false,
}: {
  keyMetrics: KeyMetrics;
  metric: MetricKey;
  simplified?: boolean;
}) {
  if (simplified) {
    return (
      <div className="panel">
        <h3 className="panel-title">Your numbers, in plain English</h3>
        <p className="panel-sub">
          What your creatives have done so far, broken down so anyone can read it.
        </p>

        <div className="simple-stat-group mt-3">
          <h4 className="simple-stat-group-title">Your creative sample</h4>
          <div className="simple-stat-grid">
            {REACH_AND_SPEND.map((s) => (
              <div className="simple-stat" key={s.label}>
                <p className="simple-stat-label">{s.label}</p>
                <p className="simple-stat-value">{s.value(keyMetrics)}</p>
                <p className="simple-stat-explain">{s.explain(keyMetrics)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="simple-stat-group mt-3">
          <h4 className="simple-stat-group-title">How they performed on average</h4>
          <div className="simple-stat-grid">
            {PERFORMANCE.map((s) => {
              const isHighlighted = s.highlight?.includes(metric);
              return (
                <div
                  className={`simple-stat ${isHighlighted ? "simple-stat-highlighted" : ""}`}
                  key={s.label}
                >
                  <p className="simple-stat-label">{s.label}</p>
                  <p className="simple-stat-value">{s.value(keyMetrics)}</p>
                  <p className="simple-stat-explain">{s.explain(keyMetrics)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
