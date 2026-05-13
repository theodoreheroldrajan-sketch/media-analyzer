"use client";

import { useState, useMemo } from "react";
import type { MetricKey, VariablePerformance, CreativeData } from "@/lib/analytics";
import type { VariableInteraction } from "@/lib/demo-data";
import VariableChart from "./variable-chart";
import ChartTypeSelector, { type ChartType } from "./charts/chart-type-selector";
import ScatterChart from "./charts/scatter-chart";
import RegressionChart from "./charts/regression-chart";
import DistributionChart from "./charts/distribution-chart";
import HeatmapChart from "./charts/heatmap-chart";

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
  isPro = false,
  creativeData,
  interactions,
}: {
  varPerf: VariablePerformance[];
  metric: MetricKey;
  isPro?: boolean;
  creativeData?: CreativeData[];
  interactions?: VariableInteraction[];
}) {
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
  const [chartType, setChartType] = useState<ChartType>("bar");

  const activeVariable = grouped.has(selected) ? selected : variableNames[0] ?? "";
  const activeData = grouped.get(activeVariable) ?? [];

  // For mini stats
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

  // Available chart types
  const availableCharts: ChartType[] = isPro
    ? ["bar", "scatter", "regression", "distribution", "heatmap"]
    : ["bar"];

  // For heatmap, find matching interaction
  const heatmapInteraction = interactions?.find(
    (i) => i.var1 === activeVariable || i.var2 === activeVariable
  ) ?? interactions?.[0];

  // For Pro regression mocked stats
  const proCoef = activeData[0]?.delta ? activeData[0].delta / 100 * 0.5 : undefined;
  const proPValue = isPro ? (activeData[0]?.confidence === "high" ? 0.02 : 0.08) : undefined;

  return (
    <div className="panel variable-explorer">
      <div className="between">
        <div>
          <h3 className="panel-title">Variable explorer</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Select a variable to see how each value performs against{" "}
            <strong>{METRIC_LABELS[metric]}</strong>.
            {isPro && " Pick a chart type to view it in different ways."}
          </p>
        </div>
      </div>

      {isPro && (
        <div className="mt-3">
          <ChartTypeSelector
            active={chartType}
            onChange={setChartType}
            available={availableCharts}
          />
        </div>
      )}

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
        {chartType === "bar" && (
          <VariableChart data={activeData} metric={metric} />
        )}
        {chartType === "scatter" && creativeData && (
          <ScatterChart
            data={creativeData}
            metric={metric}
            colorByVariable={activeVariable}
          />
        )}
        {chartType === "regression" && creativeData && (
          <RegressionChart
            data={creativeData}
            metric={metric}
            mockedCoef={proCoef}
            mockedPValue={proPValue}
          />
        )}
        {chartType === "distribution" && creativeData && (
          <DistributionChart data={creativeData} metric={metric} />
        )}
        {chartType === "heatmap" && heatmapInteraction && (
          <HeatmapChart interaction={heatmapInteraction} metric={metric} />
        )}
        {chartType === "heatmap" && !heatmapInteraction && (
          <div className="muted" style={{ padding: 24, textAlign: "center" }}>
            No interaction data available for this variable.
          </div>
        )}
      </div>

      {/* Mini stats row — only show for bar chart */}
      {chartType === "bar" && bestRow && worstRow && (
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
