"use client";

import type { DemoInsight } from "@/lib/demo-data";

export default function InsightsPanel({
  insights,
}: {
  insights: DemoInsight[] | null;
}) {
  if (!insights || insights.length === 0) {
    return (
      <div className="panel">
        <div className="between">
          <h3 className="panel-title">AI insights</h3>
          <span className="badge mono">coming soon</span>
        </div>
        <p
          className="muted mt-2"
          style={{ fontSize: 13, textAlign: "center", padding: 32 }}
        >
          AI-generated insights and pattern narration will be added in a future
          update.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Key insights</h3>
      <p className="panel-sub">
        Patterns detected across your creative dataset.
      </p>
      <div className="insights-grid mt-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`insight-card insight-${insight.type}`}
          >
            <div className="between" style={{ marginBottom: 6 }}>
              <h4 className="insight-title">{insight.title}</h4>
              <span className="badge mono" style={{ fontSize: 10 }}>
                {insight.delta}
              </span>
            </div>
            <p className="insight-body">{insight.body}</p>
            <p className="insight-var mono">
              Variable: {insight.variable.replace(/_/g, " ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
