"use client";

import type { MetricKey } from "@/lib/analytics";

const METRICS: { key: MetricKey; label: string; sub: string }[] = [
  { key: "ctr", label: "CTR", sub: "Click-through rate" },
  { key: "cpc", label: "CPC", sub: "Cost per click" },
  { key: "cpa", label: "CPA", sub: "Cost per acquisition" },
  { key: "cvr", label: "CVR", sub: "Conversion rate" },
  { key: "roas", label: "ROAS", sub: "Return on ad spend" },
];

export default function MetricSwitcher({
  metric,
  onChange,
}: {
  metric: MetricKey;
  onChange: (m: MetricKey) => void;
}) {
  return (
    <div className="metric-pills">
      {METRICS.map((m) => (
        <button
          key={m.key}
          className={`metric-pill ${metric === m.key ? "active" : ""}`}
          onClick={() => onChange(m.key)}
          title={m.sub}
        >
          <span className="metric-pill-label">{m.label}</span>
          <span className="metric-pill-sub">{m.sub}</span>
        </button>
      ))}
    </div>
  );
}
