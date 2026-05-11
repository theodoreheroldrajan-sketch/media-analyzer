"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/project-context";
import type {
  KeyMetrics,
  VariablePerformance,
  TrustScore,
  MetricKey,
} from "@/lib/analytics";

type GalleryItem = {
  creativeId: string;
  filename: string;
  metricValue: number;
  impressions: number;
  clicks: number;
  spend: number;
};

const METRIC_LABELS: Record<MetricKey, string> = {
  ctr: "CTR (%)",
  cpc: "CPC",
  cpa: "CPA",
  cvr: "CVR (%)",
  roas: "ROAS",
};

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

function trustColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--blue, #3b82f6)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

export default function DashboardPage() {
  const { project } = useProject();
  const [metric, setMetric] = useState<MetricKey>("ctr");
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [varPerf, setVarPerf] = useState<VariablePerformance[]>([]);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [creativeCount, setCreativeCount] = useState(0);
  const [regressionReady, setRegressionReady] = useState(false);
  const [regressionThreshold, setRegressionThreshold] = useState(100);

  const loadDashboard = useCallback(
    async (m: MetricKey) => {
      if (!project) return;
      setLoading(true);

      try {
        const res = await fetch(
          `/api/dashboard?projectId=${project.id}&metric=${m}`
        );
        const data = await res.json();

        if (data.hasData) {
          setHasData(true);
          setKeyMetrics(data.keyMetrics);
          setVarPerf(data.variablePerformance);
          setTrustScore(data.trustScore);
          setGallery(data.gallery);
          setCreativeCount(data.creativeCount);
          setRegressionReady(data.regressionReady);
          setRegressionThreshold(data.regressionThreshold);
        } else {
          setHasData(false);
        }
      } catch {
        setHasData(false);
      } finally {
        setLoading(false);
      }
    },
    [project]
  );

  useEffect(() => {
    loadDashboard(metric);
  }, [loadDashboard, metric]);

  function handleMetricChange(m: MetricKey) {
    setMetric(m);
  }

  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <p className="page-eyebrow">Step 08 of 09</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">
          Dataset health, top-line metrics, and which variables correlate with
          the metric you care about.
        </p>
      </div>

      {loading ? (
        <div className="panel" style={{ padding: 32 }}>
          <p className="muted" style={{ textAlign: "center" }}>
            Loading dashboard data…
          </p>
        </div>
      ) : !hasData ? (
        <div className="panel" style={{ padding: 32 }}>
          <p className="muted" style={{ textAlign: "center" }}>
            No analysis data yet. Complete the AI extraction step first, then
            come back here.
          </p>
        </div>
      ) : (
        <>
          {/* Regression unlock indicator */}
          <div
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              borderRadius: 8,
              border: `1px solid ${regressionReady ? "var(--green)" : "var(--border)"}`,
              background: regressionReady
                ? "rgba(34,197,94,0.06)"
                : "var(--bg-2)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${regressionReady ? "var(--green)" : "var(--border-strong)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {regressionReady ? "🔓" : "🔒"}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                {regressionReady
                  ? "Advanced regression analysis unlocked"
                  : "Advanced regression analysis"}
              </p>
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                {regressionReady
                  ? `${creativeCount} creatives analysed — multiple regression, interaction terms, and coefficient analysis are now available.`
                  : `Unlocks at ${regressionThreshold} creatives. You have ${creativeCount}. Current analysis uses group-by comparison (solid for ${creativeCount < 20 ? "exploratory" : "directional"} insights).`}
              </p>
            </div>
            {!regressionReady && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    width: 60,
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (creativeCount / regressionThreshold) * 100)}%`,
                      height: "100%",
                      background: "var(--amber)",
                      borderRadius: 3,
                    }}
                  />
                </div>
                <p
                  className="mono muted"
                  style={{ fontSize: 10, marginTop: 2 }}
                >
                  {creativeCount}/{regressionThreshold}
                </p>
              </div>
            )}
          </div>

          {/* Trust score */}
          {trustScore && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="between">
                <div>
                  <h3 className="panel-title">Dataset trust score</h3>
                  <p className="panel-sub" style={{ marginBottom: 0 }}>
                    A composite of six sub-scores. Read it before reading
                    anything else on this page.
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
                <div
                  style={{ display: "flex", justifyContent: "center" }}
                >
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
                      <span className="trust-gauge-num">
                        {trustScore.overall}
                      </span>
                      <span className="trust-gauge-max">/100</span>
                      <p className="trust-level mono">
                        {trustScore.level}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="trust-bars">
                  {[
                    {
                      label: "Creative count",
                      score: trustScore.creativeCount,
                    },
                    {
                      label: "Volume (impressions)",
                      score: trustScore.volumeScore,
                    },
                    {
                      label: "Mapping quality",
                      score: trustScore.mappingQuality,
                    },
                    {
                      label: "Data completeness",
                      score: trustScore.dataCompleteness,
                    },
                    {
                      label: "Extraction confidence",
                      score: trustScore.extractionConfidence,
                    },
                    {
                      label: "Bucket balance",
                      score: trustScore.bucketBalance,
                    },
                  ].map(({ label, score }) => (
                    <div key={label}>
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key metrics */}
          {keyMetrics && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3 className="panel-title">Key metrics</h3>
              <p className="panel-sub">
                Aggregated across mapped creatives only.
              </p>
              <div className="stat-grid mt-2">
                <div className="stat">
                  <p className="stat-label">Creatives analysed</p>
                  <p className="stat-value">
                    {keyMetrics.creativesAnalysed}
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Total impressions</p>
                  <p className="stat-value">
                    {keyMetrics.totalImpressions.toLocaleString()}
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Total clicks</p>
                  <p className="stat-value">
                    {keyMetrics.totalClicks.toLocaleString()}
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Total spend</p>
                  <p className="stat-value">
                    ${keyMetrics.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Avg CTR</p>
                  <p className="stat-value">
                    {keyMetrics.avgCTR.toFixed(2)}%
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Avg CPC</p>
                  <p className="stat-value">
                    ${keyMetrics.avgCPC.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Variable performance */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <div>
                <h3 className="panel-title">Variable performance</h3>
                <p className="panel-sub" style={{ marginBottom: 0 }}>
                  How each variable value performs against the chosen metric.
                  Rows with n &lt; 3 show &quot;insufficient data&quot;.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Metric:
                </span>
                <select
                  className="select"
                  style={{ width: 110 }}
                  value={metric}
                  onChange={(e) =>
                    handleMetricChange(e.target.value as MetricKey)
                  }
                >
                  {(
                    Object.entries(METRIC_LABELS) as [
                      MetricKey,
                      string,
                    ][]
                  ).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tbl-wrap mt-2">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Value</th>
                    <th>Count (n)</th>
                    <th>Avg {METRIC_LABELS[metric]}</th>
                    <th>vs Overall</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {varPerf.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "var(--text-3)",
                        }}
                      >
                        No variable performance data available.
                      </td>
                    </tr>
                  ) : (
                    varPerf.slice(0, 50).map((vp, i) => (
                      <tr key={`${vp.variable}-${vp.value}-${i}`}>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {vp.variable}
                        </td>
                        <td style={{ fontSize: 12 }}>{vp.value}</td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {vp.count}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {vp.confidence === "insufficient"
                            ? "—"
                            : METRIC_FORMAT[metric](vp.avgMetric)}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              vp.confidence === "insufficient"
                                ? "var(--text-3)"
                                : vp.delta > 0
                                  ? metric === "cpc" || metric === "cpa"
                                    ? "var(--red)"
                                    : "var(--green)"
                                  : vp.delta < 0
                                    ? metric === "cpc" || metric === "cpa"
                                      ? "var(--green)"
                                      : "var(--red)"
                                    : "var(--text-2)",
                          }}
                        >
                          {vp.confidence === "insufficient"
                            ? "—"
                            : `${vp.delta > 0 ? "+" : ""}${vp.delta.toFixed(1)}%`}
                        </td>
                        <td>
                          <span
                            className="badge mono"
                            style={{
                              fontSize: 10,
                              color:
                                vp.confidence === "high"
                                  ? "var(--green)"
                                  : vp.confidence === "medium"
                                    ? "var(--amber)"
                                    : vp.confidence === "low"
                                      ? "var(--red)"
                                      : "var(--text-3)",
                            }}
                          >
                            {vp.confidence === "insufficient"
                              ? "n < 3"
                              : vp.confidence}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {varPerf.length > 50 && (
              <p
                className="muted"
                style={{ fontSize: 12, marginTop: 8 }}
              >
                Showing top 50 of {varPerf.length} variable-value pairs
                (sorted by impact).
              </p>
            )}
          </div>

          {/* Creative gallery */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <h3 className="panel-title">
                Creative gallery — sorted by{" "}
                {METRIC_LABELS[metric]}
              </h3>
              <span className="badge mono">
                {metric === "cpc" || metric === "cpa"
                  ? "best (lowest) → worst"
                  : "best → worst"}
              </span>
            </div>
            {gallery.length === 0 ? (
              <p
                className="muted mt-2"
                style={{
                  fontSize: 13,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                No gallery data available.
              </p>
            ) : (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {gallery.slice(0, 24).map((item, i) => (
                  <div
                    key={item.creativeId}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    <div className="between" style={{ marginBottom: 6 }}>
                      <span
                        className="badge mono"
                        style={{
                          fontSize: 10,
                          color:
                            i < 3
                              ? "var(--green)"
                              : i >= gallery.length - 3
                                ? "var(--red)"
                                : "var(--text-2)",
                        }}
                      >
                        #{i + 1}
                      </span>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {METRIC_FORMAT[metric](item.metricValue)}
                      </span>
                    </div>
                    <p
                      className="mono"
                      style={{
                        fontSize: 11,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 4,
                      }}
                    >
                      {item.filename}
                    </p>
                    <p className="muted" style={{ fontSize: 10, margin: 0 }}>
                      {item.impressions.toLocaleString()} imps ·{" "}
                      {item.clicks.toLocaleString()} clicks
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI insights placeholder */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <h3 className="panel-title">AI insights</h3>
              <span className="badge mono">coming soon</span>
            </div>
            <p
              className="muted mt-2"
              style={{
                fontSize: 13,
                textAlign: "center",
                padding: 32,
              }}
            >
              AI-generated insights and pattern narration will be added in a
              future update.
            </p>
          </div>
        </>
      )}

      <div className="page-actions">
        <Link href="/analysis" className="btn">
          ← Back to analysis
        </Link>
        <div className="spacer" />
        <Link href="/settings" className="btn">
          Project settings →
        </Link>
      </div>
    </div>
  );
}
