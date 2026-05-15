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

export default function TrustScorePanel({
  trustScore,
  modelStability,
}: {
  trustScore: TrustScore;
  modelStability?: ModelStabilityInfo;
}) {
  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3
            className="panel-title"
            title="Trust score is gated by mapping quality, data completeness, and creative count. If any of these is low, the overall score reflects that. Volume and bucket balance contribute proportionally."
          >
            Dataset trust score
          </h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Gated by mapping quality, data completeness, and creative count.
            Lowest of those three caps the overall.
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
          {modelStability && (
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
      </div>
    </div>
  );
}
