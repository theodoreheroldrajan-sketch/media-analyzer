"use client";

import Link from "next/link";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";

function UploadContent() {
  const { data } = useDemo();
  const creatives = data!.creatives;
  const performanceRows = data!.performanceRows;

  const totalImpressions = performanceRows.reduce((s, r) => s + r.impressions, 0);
  const totalSpend = performanceRows.reduce((s, r) => s + r.spend, 0);

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 03 · Demo</p>
        <h1 className="page-title">Upload</h1>
        <p className="page-sub">
          In a real project you would drag-and-drop creative images and a
          performance CSV here. This demo has {creatives.length} creatives
          pre-loaded.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">Creatives</h3>
        <p className="panel-sub">{creatives.length} images uploaded</p>
        <div className="thumb-grid" style={{ maxHeight: 500, overflowY: "auto" }}>
          {creatives.map((c) => (
            <div key={c.id} className="thumb">
              <div
                className="thumb-img"
                style={{
                  background: `linear-gradient(135deg, hsl(${c.hue}, 45%, 72%), hsl(${(c.hue + 40) % 360}, 50%, 60%))`,
                }}
              />
              <div className="thumb-meta">
                <p className="thumb-name">{c.filename}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Performance CSV</h3>
        <p className="panel-sub">{performanceRows.length} rows loaded</p>
        <div className="stat-grid">
          <div className="stat">
            <p className="stat-label">Rows</p>
            <p className="stat-value">{performanceRows.length}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Total impressions</p>
            <p className="stat-value">{totalImpressions.toLocaleString()}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Total spend</p>
            <p className="stat-value">
              ${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/demo/instructions" className="btn">
          ← Back to instructions
        </Link>
        <div className="spacer" />
        <Link href="/demo/mapping" className="btn btn-primary">
          Continue to mapping →
        </Link>
      </div>
    </div>
  );
}

export default function DemoUploadPage() {
  return (
    <DemoModeGuard>
      <UploadContent />
    </DemoModeGuard>
  );
}
