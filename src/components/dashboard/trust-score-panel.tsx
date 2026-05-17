"use client";

import type { ModelStability, TrustScore } from "@/lib/analytics";

function trustColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--blue, #3b82f6)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

function stabilityColor(s: ModelStability): string {
  if (s === "green") return "var(--green)";
  if (s === "yellow") return "var(--amber)";
  return "var(--red)";
}

const STABILITY_TOOLTIP =
  "Statistical reliability of the regression depends on observations per predictor. Green: 10+ observations per predictor. Yellow: 5-10 (regularization recommended). Red: under 5 (results not reliable).";

const SUB_SCORES: { key: keyof TrustScore; label: string }[] = [
  { key: "creativeCount", label: "Creative count" },
  { key: "volumeScore", label: "Volume (impressions)" },
  { key: "mappingQuality", label: "Mapping quality" },
  { key: "dataCompleteness", label: "Data completeness" },
  { key: "bucketBalance", label: "Bucket balance" },
];

export type ModelStabilityInfo = {
  color: ModelStability;
  ratio: number;
  predictorCount: number;
  creativeCount: number;
};

function plainOverallExplain(score: number): string {
  if (score >= 80) return "Excellent — your dataset is large and varied enough to trust these patterns confidently.";
  if (score >= 60) return "Good — enough data to spot real patterns. Strong findings are worth acting on.";
  if (score >= 40) return "Fair — patterns are emerging but treat them as hypotheses, not facts. More data would sharpen things up.";
  return "Limited — you can still see directional hints, but don't make big decisions on this alone yet.";
}

const SUB_LABELS: Record<keyof TrustScore, string> = {
  overall: "Overall",
  creativeCount: "Number of creatives",
  volumeScore: "How much they were shown",
  mappingQuality: "Clean variable mapping",
  dataCompleteness: "Data completeness",
  bucketBalance: "Variety across variables",
  level: "Level",
};

export default function TrustScorePanel({
  trustScore,
  modelStability,
  simplified = false,
}: {
  trustScore: TrustScore;
  modelStability?: ModelStabilityInfo;
  simplified?: boolean;
}) {
  // Identify strong and weak sub-scores for the simplified prose blocks
  const subKeys: (keyof TrustScore)[] = ["creativeCount", "volumeScore", "mappingQuality", "dataCompleteness", "bucketBalance"];
  const strongSubs = subKeys.filter((k) => (trustScore[k] as number) >= 70);
  const weakSubs = subKeys.filter((k) => (trustScore[k] as number) <= 50);

  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3
            className="panel-title"
            title={simplified ? undefined : "Trust score is gated by mapping quality, data completeness, and creative count. If any of these is low, the overall score reflects that. Volume and bucket balance contribute proportionally."}
          >
            {simplified ? "How much to trust these results" : "Dataset trust score"}
          </h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            {simplified
              ? "A combined score across dataset size, data cleanness, and variable variety."
              : "Gated by mapping quality, data completeness, and creative count. Lowest of those three caps the overall."}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {!simplified && modelStability && (
            <span
              className="badge mono"
              title={STABILITY_TOOLTIP}
              style={{
                color: stabilityColor(modelStability.color),
                borderColor: stabilityColor(modelStability.color),
                fontSize: 10,
                whiteSpace: "nowrap",
              }}
            >
              Stability {modelStability.ratio.toFixed(1)}:1
            </span>
          )}
          <span
            className="badge"
            style={{
              color: trustColor(trustScore.overall),
              whiteSpace: "nowrap",
            }}
          >
            {trustScore.level}
          </span>
        </div>
      </div>
      <div className="trust-card mt-3">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="gauge-ring"
            style={
              {
                "--p": trustScore.overall,
                "--c": trustColor(trustScore.overall),
                margin: "0 auto",
              } as React.CSSProperties
            }
          >
            <div className="gauge-ring-inner">
              <span className="trust-gauge-num">{trustScore.overall}</span>
              <span className="trust-gauge-max">/100</span>
              <p className="trust-level mono">{trustScore.level}</p>
            </div>
          </div>
        </div>
        {simplified ? (
          <div className="simple-prose-stack">
            <div className="simple-prose-block">
              <p className="simple-prose-eyebrow mono">What this means</p>
              <p className="simple-prose-text">{plainOverallExplain(trustScore.overall)}</p>
            </div>
            {strongSubs.length > 0 && (
              <div className="simple-prose-block simple-prose-good">
                <p className="simple-prose-eyebrow mono">What&apos;s strong</p>
                <p className="simple-prose-text">
                  {strongSubs.map((k) => SUB_LABELS[k]).join(", ")}.
                </p>
              </div>
            )}
            {weakSubs.length > 0 && (
              <div className="simple-prose-block simple-prose-warn">
                <p className="simple-prose-eyebrow mono">What needs more data</p>
                <p className="simple-prose-text">
                  {weakSubs.map((k) => SUB_LABELS[k]).join(", ")}. These would benefit from more, more varied creatives.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="trust-bars">
            {SUB_SCORES.map(({ key, label }) => {
              const score = trustScore[key] as number;
              return (
                <div key={key}>
                  <div className="trust-bar-label">
                    <span>{label}</span>
                    <span className="mono">{score}</span>
                  </div>
                  <div className="trust-bar-track">
                    <div
                      className="trust-bar-fill"
                      style={{
                        width: `${score}%`,
                        background: trustColor(score),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
