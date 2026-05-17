"use client";

import { useMemo } from "react";
import type { DemoInsight } from "@/lib/demo-data";
import { RECOMMENDATION_PRIORITY, getVariableCopy } from "@/lib/simplified-copy";

function actionVerb(type: DemoInsight["type"]): string {
  if (type === "positive") return "Lean in";
  if (type === "negative") return "Watch out";
  return "Try this";
}

function pickTopThree(insights: DemoInsight[]): DemoInsight[] {
  // Prefer insights whose variable matches the recommendation priority list,
  // in priority order. Fall back to insight order to fill any remaining slots.
  const byVariable = new Map<string, DemoInsight>();
  for (const ins of insights) {
    if (!byVariable.has(ins.variable)) byVariable.set(ins.variable, ins);
  }

  const picked: DemoInsight[] = [];
  for (const variable of RECOMMENDATION_PRIORITY) {
    const match = byVariable.get(variable);
    if (match) {
      picked.push(match);
      if (picked.length === 3) return picked;
    }
  }
  // Fill any remaining with the first insights not yet picked
  const pickedSet = new Set(picked);
  for (const ins of insights) {
    if (picked.length === 3) break;
    if (!pickedSet.has(ins)) {
      picked.push(ins);
      pickedSet.add(ins);
    }
  }
  return picked;
}


export default function RecommendationsSimple({
  insights,
}: {
  insights: DemoInsight[] | null;
}) {
  const top3 = useMemo<DemoInsight[]>(() => {
    if (!insights || insights.length === 0) return [];
    return pickTopThree(insights);
  }, [insights]);

  if (top3.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">What to do next</h3>
        <p className="muted" style={{ fontSize: 13, textAlign: "center", padding: 32 }}>
          Once your dataset grows, we&apos;ll surface action-oriented recommendations here.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">What to do next</h3>
      <p className="panel-sub">
        Three actions to take based on what your creatives are telling us.
      </p>

      <div className="recommendation-list mt-3">
        {top3.map((ins, i) => {
          const copy = getVariableCopy(ins.variable);
          const verb = actionVerb(ins.type);
          const body = ins.type === "negative" ? copy.tipNegative : copy.tipPositive;

          return (
            <div key={`rec-${i}`} className={`recommendation-card recommendation-${ins.type}`}>
              <div className="recommendation-number mono">{i + 1}</div>
              <div className="recommendation-body">
                <p className="recommendation-eyebrow mono">{verb}</p>
                <h4 className="recommendation-headline">{copy.plainName}</h4>
                <p className="recommendation-detail">{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
