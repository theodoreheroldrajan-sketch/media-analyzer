"use client";

import { useState } from "react";
import type { MetricKey } from "@/lib/analytics";
import type { VariableInteraction } from "@/lib/demo-data";
import HeatmapChart from "./charts/heatmap-chart";

export default function InteractionMatrix({
  interactions,
  metric,
}: {
  interactions: VariableInteraction[];
  metric: MetricKey;
}) {
  const [expanded, setExpanded] = useState<number>(0);

  if (interactions.length === 0) {
    return null;
  }

  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3 className="panel-title">Variable interactions</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            How do two variables combined affect{" "}
            <strong>{metric.toUpperCase()}</strong>? Each cell shows the metric for that
            combination of values. Cells with n &lt; 2 are hidden.
          </p>
        </div>
      </div>

      <div className="interaction-grid mt-3">
        {interactions.map((interaction, i) => (
          <button
            key={`${interaction.var1}-${interaction.var2}`}
            className={`interaction-mini ${expanded === i ? "active" : ""}`}
            onClick={() => setExpanded(i)}
          >
            <div className="interaction-mini-title mono">
              {interaction.var1.replace(/_/g, " ")} × {interaction.var2.replace(/_/g, " ")}
            </div>
            <HeatmapChart interaction={interaction} metric={metric} mini />
          </button>
        ))}
      </div>

      <div className="interaction-expanded mt-3">
        <HeatmapChart interaction={interactions[expanded]} metric={metric} />
      </div>
    </div>
  );
}
