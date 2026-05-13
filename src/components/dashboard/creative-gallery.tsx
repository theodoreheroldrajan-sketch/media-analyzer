"use client";

import { useState } from "react";
import type { MetricKey } from "@/lib/analytics";
import type { CreativeData } from "@/lib/analytics";

type GalleryItem = {
  creativeId: string;
  filename: string;
  metricValue: number;
  impressions: number;
  clicks: number;
  spend: number;
};

const METRIC_LABELS: Record<MetricKey, string> = {
  ctr: "CTR",
  cpc: "CPC",
  cpa: "CPA",
  cvr: "CVR",
  roas: "ROAS",
};

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

export default function CreativeGallery({
  gallery,
  metric,
  creativeData,
}: {
  gallery: GalleryItem[];
  metric: MetricKey;
  creativeData?: CreativeData[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? gallery : gallery.slice(0, 24);

  function getCreativeVars(creativeId: string): Record<string, unknown> | null {
    if (!creativeData) return null;
    const c = creativeData.find((d) => d.creativeId === creativeId);
    return c?.extractedVariables ?? null;
  }

  return (
    <div className="panel">
      <div className="between">
        <h3 className="panel-title">
          Creative gallery — sorted by {METRIC_LABELS[metric]}
        </h3>
        <span className="badge mono" style={{ fontSize: 11 }}>
          {metric === "cpc" || metric === "cpa"
            ? "best (lowest) → worst"
            : "best → worst"}
        </span>
      </div>

      {gallery.length === 0 ? (
        <p className="muted mt-2" style={{ fontSize: 13, textAlign: "center", padding: 32 }}>
          No gallery data available.
        </p>
      ) : (
        <>
          <div className="gallery-grid mt-2">
            {displayed.map((item, i) => {
              const isExpanded = expandedId === item.creativeId;
              const vars = isExpanded ? getCreativeVars(item.creativeId) : null;
              // Generate a deterministic hue from the creative index
              const hue = (i * 37 + 200) % 360;

              return (
                <div
                  key={item.creativeId}
                  className={`gallery-card ${isExpanded ? "expanded" : ""}`}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.creativeId)
                  }
                >
                  {/* Placeholder thumbnail */}
                  <div
                    className="gallery-thumb"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 45%, 72%), hsl(${(hue + 40) % 360}, 50%, 60%))`,
                    }}
                  >
                    <span className="gallery-rank-badge" style={{
                      color: i < 3 ? "var(--green)" : i >= gallery.length - 3 ? "var(--red)" : "var(--text-2)",
                    }}>
                      #{i + 1}
                    </span>
                  </div>

                  <div className="gallery-info">
                    <div className="between" style={{ marginBottom: 4 }}>
                      <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                        {METRIC_FORMAT[metric](item.metricValue)}
                      </span>
                    </div>
                    <p className="mono gallery-filename">{item.filename}</p>
                    <p className="muted" style={{ fontSize: 10, margin: 0 }}>
                      {item.impressions.toLocaleString()} imps · {item.clicks.toLocaleString()} clicks
                    </p>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && vars && (
                    <div className="gallery-detail">
                      <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                        Extracted variables
                      </p>
                      <div className="gallery-vars">
                        {Object.entries(vars).map(([k, v]) => (
                          <div key={k} className="gallery-var-row">
                            <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                              {k}
                            </span>
                            <span className="mono" style={{ fontSize: 10 }}>
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAll && gallery.length > 24 && (
            <button
              className="btn mt-2"
              style={{ width: "100%", fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
            >
              Show all {gallery.length} creatives
            </button>
          )}
        </>
      )}
    </div>
  );
}
