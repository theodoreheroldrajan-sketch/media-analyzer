"use client";

export type MatchStatus = "auto" | "suggested" | "unmatched" | "confirmed" | "rejected";

type MatchMethod = "exact" | "normalised" | "ad_name" | "fuzzy" | "manual";

const METHOD_LABEL: Record<MatchMethod, string> = {
  exact: "exact filename",
  normalised: "normalised",
  ad_name: "ad name",
  fuzzy: "fuzzy match",
  manual: "manual",
};

export default function MatchCard({
  filename,
  hue,
  status,
  confidence,
  method,
  impressions,
  clicks,
  spend,
  perfRowLabel,
  onConfirm,
  onReject,
  onChange,
}: {
  filename: string;
  hue: number;
  status: MatchStatus;
  confidence?: number;
  method?: MatchMethod;
  impressions?: number;
  clicks?: number;
  spend?: number;
  perfRowLabel?: string;
  onConfirm?: () => void;
  onReject?: () => void;
  onChange?: () => void;
}) {
  const statusColor =
    status === "auto" || status === "confirmed" ? "var(--green)" :
    status === "suggested" ? "var(--amber)" :
    "var(--red)";

  const statusLabel =
    status === "auto" ? "auto-matched" :
    status === "confirmed" ? "confirmed" :
    status === "suggested" ? "suggested" :
    status === "rejected" ? "rejected" :
    "unmatched";

  return (
    <div className="match-card-pro">
      <div
        className="match-thumb-pro"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 45%, 72%), hsl(${(hue + 40) % 360}, 50%, 60%))`,
        }}
      />

      <div className="match-info-pro">
        <div className="between" style={{ marginBottom: 4 }}>
          <p className="mono" style={{ fontSize: 12, margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {filename}
          </p>
          <span
            className="badge mono"
            style={{ fontSize: 10, color: statusColor, flexShrink: 0 }}
          >
            {statusLabel}
          </span>
        </div>

        {perfRowLabel && (
          <p className="muted mono" style={{ fontSize: 10, margin: "0 0 4px" }}>
            → {perfRowLabel}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {confidence !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="muted" style={{ fontSize: 10 }}>conf:</span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    confidence >= 0.85 ? "var(--green)" :
                    confidence >= 0.65 ? "var(--amber)" :
                    "var(--red)",
                }}
              >
                {confidence.toFixed(2)}
              </span>
            </div>
          )}
          {method && (
            <span className="badge mono" style={{ fontSize: 9 }}>
              {METHOD_LABEL[method]}
            </span>
          )}
          {(impressions !== undefined || clicks !== undefined || spend !== undefined) && (
            <span className="muted mono" style={{ fontSize: 10 }}>
              {impressions?.toLocaleString() ?? "—"} imps · {clicks?.toLocaleString() ?? "—"} clk · ${spend?.toFixed(0) ?? "—"}
            </span>
          )}
        </div>
      </div>

      {(onConfirm || onReject || onChange) && (
        <div className="match-actions-pro">
          {onConfirm && (
            <button className="btn btn-sm btn-primary" onClick={onConfirm}>
              Confirm
            </button>
          )}
          {onReject && (
            <button className="btn btn-sm btn-danger" onClick={onReject}>
              Reject
            </button>
          )}
          {onChange && (
            <button className="btn btn-sm" onClick={onChange}>
              Change
            </button>
          )}
        </div>
      )}
    </div>
  );
}
