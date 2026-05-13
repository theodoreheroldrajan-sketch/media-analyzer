"use client";

import { useState, useMemo } from "react";
import type { MetricKey, VariablePerformance } from "@/lib/analytics";
import VariableChart from "./variable-chart";

const METRIC_LABELS: Record<MetricKey, string> = {
  ctr: "CTR",
  cpc: "CPC",
  cpa: "CPA",
  cvr: "CVR",
  roas: "ROAS",
};

function isLowerBetter(metric: MetricKey): boolean {
  return metric === "cpc" || metric === "cpa";
}

export default function VariableExplorer({
  varPerf,
  metric,
}: {
  varPerf: VariablePerformance[];
  metric: MetricKey;
}) {
  // Group by variable name
  const grouped = useMemo(() => {
    const map = new Map<string, VariablePerformance[]>();
    for (const vp of varPerf) {
      if (!map.has(vp.variable)) map.set(vp.variable, []);
      map.get(vp.variable)!.push(vp);
    }
    return map;
  }, [varPerf]);

  const variableNames = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const [selected, setSelected] = useState<string>(variableNames[0] ?? "");

  // Update selected if variable list changes
  if (selected && !grouped.has(selected) && variableNames.length > 0) {
    // Can't call setState in render, so we use fallback
  }
  const activeVariable = grouped.has(selected)
    ? selected
    : variableNames[0] ?? "";
  const activeData = grouped.get(activeVariable) ?? [];

  // Compute mini stats for the active variable
  const validData = activeData.filter((d) => d.confidence !== "insufficient");
  const bestRow = validData.length > 0
    ? validData.reduce((best, d) =>
        isLowerBetter(metric)
          ? d.delta < best.delta ? d : best
          : d.delta > best.delta ? d : best
      )
    : null;
  const worstRow = validData.length > 0
    ? validData.reduce((worst, d) =>
        isLowerBetter(metric)
          ? d.delta > worst.delta ? d : worst
          : d.delta < worst.delta ? d : worst
      )
    : null;

  return (
    <div className="panel variable-explorer">
      <div className="between">
        <div>
          <h3 className="panel-title">Variable explorer</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Select a variable to see how each value performs against{" "}
            <strong>{METRIC_LABELS[metric]}</strong>. Bars show % difference
            from the overall average.
          </p>
        </div>
      </div>

      {/* Variable pill selector */}
      <div className="var-pills mt-3">
        {variableNames.map((name) => (
          <button
            key={name}
            className={`var-pill ${activeVariable === name ? "active" : ""}`}
            onClick={() => setSelected(name)}
          >
            {name.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-3">
        <VariableChart data={activeData} metric={metric} />
      </div>

      {/* Mini stats row */}
      {bestRow && worstRow && (
        <div className="explorer-stats mt-3">
          <div className="explorer-stat">
            <span className="explorer-stat-label">Best performer</span>
            <span className="explorer-stat-value" style={{ color: "var(--green)" }}>
              {bestRow.value}
            </span>
            <span className="explorer-stat-delta mono">
              {bestRow.delta > 0 ? "+" : ""}{bestRow.delta.toFixed(1)}% vs avg
            </span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-label">Worst performer</span>
            <span className="explorer-stat-value" style={{ color: "var(--red)" }}>
              {worstRow.value}
            </span>
            <span className="explorer-stat-delta mono">
              {worstRow.delta > 0 ? "+" : ""}{worstRow.delta.toFixed(1)}% vs avg
            </span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-label">Values compared</span>
            <span className="explorer-stat-value">{validData.length}</span>
            <span className="explorer-stat-delta mono">
              {activeData.length - validData.length > 0
                ? `${activeData.length - validData.length} insufficient`
                : "all sufficient"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
