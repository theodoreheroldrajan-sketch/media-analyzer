"use client";

import type { TrustScore } from "@/lib/analytics";

function trustColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--blue, #3b82f6)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

const SUB_SCORES: { key: keyof TrustScore; label: string }[] = [
  { key: "creativeCount", label: "Creative count" },
  { key: "volumeScore", label: "Volume (impressions)" },
  { key: "mappingQuality", label: "Mapping quality" },
  { key: "dataCompleteness", label: "Data completeness" },
  { key: "extractionConfidence", label: "Extraction confidence" },
  { key: "bucketBalance", label: "Bucket balance" },
];

export default function TrustScorePanel({
  trustScore,
}: {
  trustScore: TrustScore;
}) {
  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3 className="panel-title">Dataset trust score</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Composite quality indicator — read before interpreting results.
          </p>
        </div>
        <span
          className="badge"
          style={{ color: trustColor(trustScore.overall) }}
        >
          {trustScore.level}
        </span>
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
