"use client";

import type { MetricKey } from "@/lib/analytics";
import type { VariableInteraction } from "@/lib/demo-data";

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

function colorForValue(
  v: number,
  min: number,
  max: number,
  lowerIsBetter: boolean
): string {
  if (max === min) return "var(--surface-3)";
  const t = (v - min) / (max - min);
  // For lower-is-better metrics, flip the gradient
  const tFinal = lowerIsBetter ? 1 - t : t;
  // Green → yellow → red gradient
  const r = Math.round(255 * (1 - tFinal));
  const g = Math.round(180 * tFinal + 75);
  const b = Math.round(80);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HeatmapChart({
  interaction,
  metric,
  mini = false,
}: {
  interaction: VariableInteraction;
  metric: MetricKey;
  mini?: boolean;
}) {
  const xValues = Array.from(new Set(interaction.cells.map((c) => c.var2Value))).sort();
  const yValues = Array.from(new Set(interaction.cells.map((c) => c.var1Value))).sort();

  const cellMap = new Map<string, typeof interaction.cells[0]>();
  for (const c of interaction.cells) {
    cellMap.set(`${c.var1Value}|${c.var2Value}`, c);
  }

  const values = interaction.cells
    .filter((c) => c.count >= 2)
    .map((c) => c.metricValue);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const lowerIsBetter = metric === "cpc" || metric === "cpa";

  const cellSize = mini ? 32 : 56;
  const labelSize = mini ? 9 : 11;

  return (
    <div className="heatmap-wrap">
      {!mini && (
        <div className="heatmap-title">
          <span className="mono">{interaction.var1.replace(/_/g, " ")}</span>
          <span style={{ margin: "0 6px", color: "var(--text-3)" }}>×</span>
          <span className="mono">{interaction.var2.replace(/_/g, " ")}</span>
        </div>
      )}
      <div className="heatmap-grid-wrap">
        <table className="heatmap-grid" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th />
              {xValues.map((xv) => (
                <th
                  key={xv}
                  style={{
                    fontSize: labelSize,
                    padding: mini ? "2px 4px" : "4px 8px",
                    color: "var(--text-3)",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  {xv}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yValues.map((yv) => (
              <tr key={yv}>
                <td
                  style={{
                    fontSize: labelSize,
                    padding: mini ? "2px 6px" : "4px 10px",
                    color: "var(--text-3)",
                    textAlign: "right",
                  }}
                >
                  {yv}
                </td>
                {xValues.map((xv) => {
                  const cell = cellMap.get(`${yv}|${xv}`);
                  if (!cell || cell.count < 2) {
                    return (
                      <td
                        key={xv}
                        className="heatmap-cell heatmap-cell-empty"
                        style={{ width: cellSize, height: cellSize }}
                      >
                        <span style={{ fontSize: labelSize - 1, color: "var(--text-3)" }}>—</span>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={xv}
                      className="heatmap-cell"
                      title={`${interaction.var1}=${yv}, ${interaction.var2}=${xv}\n${METRIC_FORMAT[metric](cell.metricValue)} (n=${cell.count})`}
                      style={{
                        background: colorForValue(cell.metricValue, min, max, lowerIsBetter),
                        width: cellSize,
                        height: cellSize,
                      }}
                    >
                      <span className="heatmap-cell-value" style={{ fontSize: labelSize, color: "white", fontWeight: 600 }}>
                        {mini ? cell.metricValue.toFixed(1) : METRIC_FORMAT[metric](cell.metricValue)}
                      </span>
                      {!mini && (
                        <span className="heatmap-cell-count" style={{ fontSize: 9, color: "white", opacity: 0.85 }}>
                          n={cell.count}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!mini && (
        <div className="heatmap-legend">
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
            {METRIC_FORMAT[metric](min)}
          </span>
          <div className="heatmap-legend-bar" />
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
            {METRIC_FORMAT[metric](max)}
          </span>
        </div>
      )}
    </div>
  );
}
