"use client";

import type { AISuggestion } from "@/lib/demo-data";

export default function AISuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  accepted,
}: {
  suggestion: AISuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  accepted: boolean;
}) {
  const impactColor =
    suggestion.estimatedImpact === "high" ? "var(--green)" :
    suggestion.estimatedImpact === "medium" ? "var(--amber)" :
    "var(--text-3)";

  return (
    <div className={`ai-suggestion-card ${accepted ? "ai-suggestion-accepted" : ""}`}>
      <div className="between" style={{ marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
          {suggestion.name}
        </span>
        <span className="badge mono" style={{ fontSize: 9 }}>
          {suggestion.type}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 8px", lineHeight: 1.5 }}>
        {suggestion.rationale}
      </p>

      {suggestion.enumValues && (
        <p className="mono muted" style={{ fontSize: 10, margin: "0 0 8px" }}>
          Values: {suggestion.enumValues.join(", ")}
        </p>
      )}

      <div className="between" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Estimated impact:{" "}
          <span style={{ color: impactColor }}>{suggestion.estimatedImpact}</span>
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {accepted ? (
            <span className="badge badge-green mono" style={{ fontSize: 10 }}>
              ✓ added to schema
            </span>
          ) : (
            <>
              <button className="btn btn-sm" onClick={onDismiss}>
                Dismiss
              </button>
              <button className="btn btn-sm btn-primary" onClick={onAccept}>
                Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
