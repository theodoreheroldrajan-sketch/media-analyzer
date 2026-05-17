"use client";

import type { TrustScore, VariablePerformance } from "@/lib/analytics";

export default function HeadsUpCard({
  trustScore,
  variablePerformance,
  creativeCount,
  regressionReady,
  regressionThreshold,
}: {
  trustScore: TrustScore;
  variablePerformance: VariablePerformance[];
  creativeCount: number;
  regressionReady: boolean;
  regressionThreshold: number;
}) {
  const insufficientCount = variablePerformance.filter(
    (vp) => vp.confidence === "insufficient" || vp.confidence === "low"
  ).length;

  const messages: { title: string; body: string }[] = [];

  if (!regressionReady) {
    messages.push({
      title: "Some advanced analysis is locked",
      body: `You have ${creativeCount} creatives. The deeper statistical model needs ${regressionThreshold}+ to give reliable answers. Until then, treat findings as directional hints rather than confirmed rules.`,
    });
  }

  if (trustScore.mappingQuality < 60) {
    messages.push({
      title: "Some variables may not be mapping cleanly",
      body: "We're guessing at the meaning of a few variables. Re-check the mapping step if results look off.",
    });
  }

  if (insufficientCount > 0) {
    messages.push({
      title: `${insufficientCount} ${insufficientCount === 1 ? "variable has" : "variables have"} too few examples`,
      body: "We've quietly excluded variable values with fewer than 5 matching creatives from the findings — there's not enough signal to be confident yet.",
    });
  }

  if (trustScore.bucketBalance < 50) {
    messages.push({
      title: "Your creatives lean heavily one way",
      body: "Most of your creatives share the same value on a few variables, so it's hard to isolate cause-and-effect. Try briefing more variety in your next round.",
    });
  }

  if (messages.length === 0) return null;

  return (
    <div className="heads-up">
      <div className="heads-up-icon" aria-hidden>!</div>
      <div className="heads-up-body">
        <h3 className="heads-up-title">Heads up</h3>
        <p className="heads-up-sub">
          A few things to keep in mind while reading these results:
        </p>
        <ul className="heads-up-list">
          {messages.map((m, i) => (
            <li key={i}>
              <strong>{m.title}.</strong> {m.body}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
