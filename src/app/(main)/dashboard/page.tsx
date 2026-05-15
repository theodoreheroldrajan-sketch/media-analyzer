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

import MetricSwitcher from "@/components/dashboard/metric-switcher";
import SummaryHeader from "@/components/dashboard/summary-header";
import TrustScorePanel from "@/components/dashboard/trust-score-panel";
import KeyMetricsPanel from "@/components/dashboard/key-metrics-panel";
import VariableExplorer from "@/components/dashboard/variable-explorer";
import VariableTable from "@/components/dashboard/variable-table";
import CreativeGallery from "@/components/dashboard/creative-gallery";
import InsightsPanel from "@/components/dashboard/insights-panel";

type GalleryItem = {
  creativeId: string;
  filename: string;
  metricValue: number;
  impressions: number;
  clicks: number;
  spend: number;
};

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
  const [hypothesisVariables, setHypothesisVariables] = useState<string[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(0);
  const [totalSnapshots, setTotalSnapshots] = useState(0);

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
          setHypothesisVariables(data.hypothesisVariables ?? []);
          setCurrentSnapshot(data.currentSnapshot ?? 0);
          setTotalSnapshots(data.totalSnapshots ?? 0);
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

  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <p className="page-eyebrow">Step 07 of 08</p>
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
          <MetricSwitcher metric={metric} onChange={setMetric} />

          {totalSnapshots > 0 && (
            <p
              className="mono muted"
              style={{ fontSize: 11, marginTop: 4, marginBottom: 12 }}
            >
              Showing snapshot {currentSnapshot} of {totalSnapshots}
              {totalSnapshots > 1 ? " (older snapshots preserved)" : ""}
            </p>
          )}

          {keyMetrics && (
            <SummaryHeader
              keyMetrics={keyMetrics}
              creativeCount={creativeCount}
              regressionReady={regressionReady}
              regressionThreshold={regressionThreshold}
            />
          )}

          <div className="grid-2 mb-2">
            {trustScore && <TrustScorePanel trustScore={trustScore} />}
            {keyMetrics && (
              <KeyMetricsPanel keyMetrics={keyMetrics} metric={metric} />
            )}
          </div>

          <VariableExplorer varPerf={varPerf} metric={metric} />
          <VariableTable
            varPerf={varPerf}
            metric={metric}
            hypothesisVariables={hypothesisVariables}
          />
          <CreativeGallery gallery={gallery} metric={metric} />
          <InsightsPanel
            insights={null}
            hypothesisVariables={hypothesisVariables}
          />
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
