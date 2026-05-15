"use client";

import { useMemo } from "react";
import type { DemoInsight } from "@/lib/demo-data";

function InsightCard({ insight }: { insight: DemoInsight }) {
  return (
    <div className={`insight-card insight-${insight.type}`}>
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
  );
}

export default function InsightsPanel({
  insights,
  hypothesisVariables = [],
}: {
  insights: DemoInsight[] | null;
  hypothesisVariables?: string[];
}) {
  // Always run hooks at top level (rules of hooks)
  const { hypothesisInsights, exploratoryInsights } = useMemo(() => {
    if (!insights) return { hypothesisInsights: [], exploratoryInsights: [] };
    const hypSet = new Set(hypothesisVariables);
    const hyp: DemoInsight[] = [];
    const exp: DemoInsight[] = [];
    for (const ins of insights) {
      // Priority: user-marked hypothesis variables override the demo category
      if (hypSet.size > 0) {
        if (hypSet.has(ins.variable)) hyp.push(ins);
        else exp.push(ins);
      } else {
        if (ins.category === "hypothesis") hyp.push(ins);
        else exp.push(ins);
      }
    }
    return { hypothesisInsights: hyp, exploratoryInsights: exp };
  }, [insights, hypothesisVariables]);

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
      <h3 className="panel-title">Key findings</h3>
      <p className="panel-sub">
        Patterns detected across your creative dataset. Hypotheses you
        pre-registered appear first, separate from exploratory findings.
      </p>

      {hypothesisInsights.length > 0 && (
        <>
          <h4
            className="mono"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 18,
              marginBottom: 0,
              color: "var(--red)",
            }}
          >
            Hypotheses tested ({hypothesisInsights.length})
          </h4>
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 4, marginBottom: 12 }}
          >
            Variables you flagged with a specific prediction up front.
          </p>
          <div className="insights-grid">
            {hypothesisInsights.map((insight, i) => (
              <InsightCard key={`hyp-${i}`} insight={insight} />
            ))}
          </div>
        </>
      )}

      {exploratoryInsights.length > 0 && (
        <>
          <h4
            className="mono"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: hypothesisInsights.length > 0 ? 24 : 18,
              marginBottom: 0,
              color: "var(--text-2)",
            }}
          >
            Patterns to investigate ({exploratoryInsights.length})
          </h4>
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 4, marginBottom: 12 }}
          >
            Hypothesis-generating only. Not corrected for multiple comparisons.
            Use as starting points for new hypotheses, not conclusions.
          </p>
          <div className="insights-grid">
            {exploratoryInsights.map((insight, i) => (
              <InsightCard key={`exp-${i}`} insight={insight} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
