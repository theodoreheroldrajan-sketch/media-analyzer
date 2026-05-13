"use client";

import Link from "next/link";
import { useDemo } from "@/context/demo-context";

export default function DemoAnalysisPage() {
  const { creatives, variableNames } = useDemo();

  const estimatedCost = (creatives.length * 0.003).toFixed(3);
  const estimatedTokens = creatives.length * 1800;

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 05 · Demo</p>
        <h1 className="page-title">Analysis</h1>
        <p className="page-sub">
          In a real project, this step sends each creative to Claude Haiku 4.5
          for AI vision extraction. In demo mode, extraction is already
          complete.
        </p>
      </div>

      {/* Preflight summary */}
      <div className="panel">
        <h3 className="panel-title">Extraction summary</h3>
        <div className="stat-grid mt-2">
          <div className="stat">
            <p className="stat-label">Creatives</p>
            <p className="stat-value">{creatives.length}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Variables extracted</p>
            <p className="stat-value">{variableNames.length}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Model</p>
            <p className="stat-value" style={{ fontSize: 16 }}>
              Claude Haiku 4.5
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Est. cost</p>
            <p className="stat-value">${estimatedCost}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Est. tokens</p>
            <p className="stat-value">
              {estimatedTokens.toLocaleString()}
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Status</p>
            <p className="stat-value" style={{ color: "var(--green)" }}>
              Complete ✓
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar (complete) */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="between">
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
            Extraction progress
          </p>
          <span className="badge badge-green">
            {creatives.length}/{creatives.length} done
          </span>
        </div>
        <div className="progress-track mt-2">
          <div
            className="progress-fill"
            style={{ width: "100%", background: "var(--green)" }}
          />
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          All {creatives.length} creatives processed successfully. 0 failures.
        </p>
      </div>

      <div className="page-actions">
        <Link href="/demo/variables" className="btn">
          ← Back to variables
        </Link>
        <div className="spacer" />
        <Link href="/demo/dashboard" className="btn btn-primary">
          View dashboard →
        </Link>
      </div>
    </div>
  );
}
