"use client";

export type ChartType = "bar" | "scatter" | "regression" | "distribution" | "heatmap";

const CHART_TYPES: { key: ChartType; label: string; icon: string; sub: string }[] = [
  { key: "bar", label: "Bar", icon: "▭", sub: "Compare values" },
  { key: "scatter", label: "Scatter", icon: "⋰", sub: "Per-creative dots" },
  { key: "regression", label: "Regression", icon: "↗", sub: "Fit line + R²" },
  { key: "distribution", label: "Distribution", icon: "▁▃▅▇▅▃▁", sub: "Histogram" },
  { key: "heatmap", label: "Heatmap", icon: "▦", sub: "Variable × variable" },
];

export default function ChartTypeSelector({
  active,
  onChange,
  available,
}: {
  active: ChartType;
  onChange: (t: ChartType) => void;
  available?: ChartType[];
}) {
  const visible = available
    ? CHART_TYPES.filter((c) => available.includes(c.key))
    : CHART_TYPES;

  return (
    <div className="chart-type-pills">
      {visible.map((c) => (
        <button
          key={c.key}
          className={`chart-type-pill ${active === c.key ? "active" : ""}`}
          onClick={() => onChange(c.key)}
          title={c.sub}
        >
          <span className="chart-type-icon mono">{c.icon}</span>
          <span className="chart-type-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
