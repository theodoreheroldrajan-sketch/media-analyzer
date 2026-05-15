"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/project-context";
import { getSupabase } from "@/lib/supabase";

type MappingRow = {
  id: string;
  creative_id: string;
  performance_row_id: string;
  match_method: string;
  match_confidence: number;
  status: "confirmed" | "pending" | "rejected";
  creativeFilename?: string;
  performanceIdentifier?: string;
};

type UnmatchedCreative = { id: string; filename: string };
type UnmatchedPerformance = {
  id: string;
  source_filename: string | null;
  source_ad_name: string | null;
};

export default function MappingPage() {
  const router = useRouter();
  const { project } = useProject();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [autoMatches, setAutoMatches] = useState<MappingRow[]>([]);
  const [suggested, setSuggested] = useState<MappingRow[]>([]);
  const [unmatchedCreatives, setUnmatchedCreatives] = useState<
    UnmatchedCreative[]
  >([]);
  const [unmatchedPerformance, setUnmatchedPerformance] = useState<
    UnmatchedPerformance[]
  >([]);
  const [totalCreatives, setTotalCreatives] = useState(0);
  const [totalPerfRows, setTotalPerfRows] = useState(0);
  const [hasData, setHasData] = useState(false);

  // Load existing mappings from DB
  const loadMappings = useCallback(async () => {
    if (!project) return;
    setLoading(true);

    try {
      const supabase = getSupabase();

      // Fetch mappings
      const { data: mappings, error: mErr } = await supabase
        .from("creative_mappings")
        .select("*")
        .eq("project_id", project.id);

      if (mErr) throw new Error(mErr.message);

      if (!mappings || mappings.length === 0) {
        // Check if we have data to run matching on
        const [{ count: cCount }, { count: pCount }] = await Promise.all([
          supabase
            .from("creatives")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id),
          supabase
            .from("performance_rows")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id)
            .eq("is_latest", true),
        ]);

        setTotalCreatives(cCount ?? 0);
        setTotalPerfRows(pCount ?? 0);
        setHasData((cCount ?? 0) > 0 && (pCount ?? 0) > 0);
        setLoading(false);
        return;
      }

      // Resolve creative filenames
      const creativeIds = [
        ...new Set(mappings.map((m) => m.creative_id)),
      ];
      const { data: creatives } = await supabase
        .from("creatives")
        .select("id, filename")
        .in("id", creativeIds);

      const filenameMap = new Map(
        (creatives ?? []).map((c) => [c.id, c.filename])
      );

      // Resolve performance identifiers
      const perfIds = [
        ...new Set(mappings.map((m) => m.performance_row_id)),
      ];
      const { data: perfRows } = await supabase
        .from("performance_rows")
        .select(
          "id, source_filename, source_ad_id, source_ad_name, source_creative_name"
        )
        .in("id", perfIds);

      const perfMap = new Map(
        (perfRows ?? []).map((p) => [
          p.id,
          p.source_filename ||
            p.source_ad_name ||
            p.source_creative_name ||
            p.source_ad_id ||
            "—",
        ])
      );

      const enriched: MappingRow[] = mappings.map((m) => ({
        id: m.id,
        creative_id: m.creative_id,
        performance_row_id: m.performance_row_id,
        match_method: m.match_method ?? "",
        match_confidence: m.match_confidence ?? 0,
        status: m.status as "confirmed" | "pending" | "rejected",
        creativeFilename: filenameMap.get(m.creative_id) ?? "—",
        performanceIdentifier: perfMap.get(m.performance_row_id) ?? "—",
      }));

      const auto = enriched.filter(
        (m) => m.status === "confirmed" && m.match_confidence >= 0.8
      );
      const sug = enriched.filter(
        (m) => m.status === "pending" || m.match_confidence < 0.8
      );

      setAutoMatches(auto);
      setSuggested(sug);
      setHasData(true);

      // Get totals
      const [{ count: cCount }, { count: pCount }] = await Promise.all([
        supabase
          .from("creatives")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id),
        supabase
          .from("performance_rows")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("is_latest", true),
      ]);

      setTotalCreatives(cCount ?? 0);
      setTotalPerfRows(pCount ?? 0);

      // Unmatched creatives
      const matchedCreativeIds = new Set(
        enriched.filter((m) => m.status !== "rejected").map((m) => m.creative_id)
      );
      const { data: allCreatives } = await supabase
        .from("creatives")
        .select("id, filename")
        .eq("project_id", project.id);

      setUnmatchedCreatives(
        (allCreatives ?? []).filter((c) => !matchedCreativeIds.has(c.id))
      );

      // Unmatched performance rows
      const matchedPerfIds = new Set(
        enriched
          .filter((m) => m.status !== "rejected")
          .map((m) => m.performance_row_id)
      );
      const { data: allPerf } = await supabase
        .from("performance_rows")
        .select("id, source_filename, source_ad_name")
        .eq("project_id", project.id)
        .eq("is_latest", true);

      setUnmatchedPerformance(
        (allPerf ?? []).filter((p) => !matchedPerfIds.has(p.id))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mappings");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async Supabase multi-query via loadMappings; setState happens inside the awaited callback
    loadMappings();
  }, [loadMappings]);

  // Run the matching engine
  async function runMatcher() {
    if (!project) return;
    setRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Matching failed");

      // Reload from DB to get the mapping IDs
      await loadMappings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setRunning(false);
    }
  }

  // Confirm or reject a suggested mapping
  async function updateMapping(mappingId: string, newStatus: "confirmed" | "rejected") {
    try {
      const res = await fetch("/api/mapping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      // Move from suggested to auto (if confirmed) or remove (if rejected)
      setSuggested((prev) => prev.filter((m) => m.id !== mappingId));

      if (newStatus === "confirmed") {
        const match = suggested.find((m) => m.id === mappingId);
        if (match) {
          setAutoMatches((prev) => [
            ...prev,
            { ...match, status: "confirmed" },
          ]);
        }
      } else {
        // Rejected — reload to update unmatched lists
        await loadMappings();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  const confirmedCount = autoMatches.length;
  const pendingCount = suggested.filter((m) => m.status === "pending").length;
  const unmatchedCount = unmatchedCreatives.length;
  const qualityPct =
    totalCreatives > 0
      ? Math.round(((confirmedCount) / totalCreatives) * 100)
      : 0;

  const allReviewed = pendingCount === 0;
  const canContinue = hasData && confirmedCount > 0 && allReviewed;

  // Method label helper
  function methodLabel(method: string): string {
    const labels: Record<string, string> = {
      exact_filename: "Exact filename",
      filename_no_ext: "Filename (no ext)",
      platform_id: "Platform ID",
      prefix: "Prefix match",
      contains: "Contains match",
      fuzzy: "Fuzzy match",
    };
    return labels[method] ?? method;
  }

  function confidenceBadge(confidence: number) {
    const pct = Math.round(confidence * 100);
    const color =
      confidence >= 0.85
        ? "var(--green)"
        : confidence >= 0.6
          ? "var(--amber)"
          : "var(--red)";
    return (
      <span className="badge mono" style={{ color, borderColor: color }}>
        {pct}%
      </span>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 04 of 08</p>
        <h1 className="page-title">
          Review creative ↔ performance mapping
        </h1>
        <p className="page-sub">
          Auto-matched rows are linked already. Suggested matches need explicit
          confirmation. Unmatched creatives must be linked manually or
          they&apos;ll be excluded.
        </p>
      </div>

      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-stat">
          <span className="summary-stat-num">{totalCreatives}</span>
          <span className="summary-stat-label">Total creatives</span>
        </div>
        <div className="divider" />
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--green)" }}>
            {confirmedCount}
          </span>
          <span className="summary-stat-label">Auto-matched</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--amber)" }}>
            {pendingCount}
          </span>
          <span className="summary-stat-label">Suggested</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--red)" }}>
            {unmatchedCount}
          </span>
          <span className="summary-stat-label">Unmatched</span>
        </div>
        <div className="quality">
          <p className="summary-stat-label">Mapping quality</p>
          <p className="summary-stat-num">{qualityPct}%</p>
        </div>
      </div>

      {error && (
        <div className="callout" style={{ marginBottom: 16, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ padding: 14 }}>
          <p className="muted" style={{ fontSize: 13, padding: 12 }}>
            Loading mappings…
          </p>
        </div>
      ) : !hasData ? (
        <div className="panel" style={{ padding: 14 }}>
          <p className="muted" style={{ fontSize: 13, padding: 12 }}>
            Upload creatives and CSV first. The mapping engine will run
            automatically and show results here for your review.
          </p>
        </div>
      ) : (
        <>
          {/* Run / re-run button */}
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={runMatcher}
              disabled={running}
            >
              {running
                ? "Running matching engine…"
                : autoMatches.length > 0 || suggested.length > 0
                  ? "Re-run matching engine"
                  : "Run matching engine"}
            </button>
            {totalPerfRows > 0 && (
              <span
                className="muted"
                style={{ fontSize: 12, marginLeft: 12 }}
              >
                {totalCreatives} creatives · {totalPerfRows} performance rows
              </span>
            )}
          </div>

          {/* Auto-matched section */}
          {autoMatches.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="between" style={{ marginBottom: 12 }}>
                <h3 className="panel-title" style={{ color: "var(--green)" }}>
                  ✓ Auto-matched ({autoMatches.length})
                </h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Creative</th>
                      <th>Performance row</th>
                      <th>Method</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoMatches.map((m) => (
                      <tr key={m.id}>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {m.creativeFilename}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {m.performanceIdentifier}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {methodLabel(m.match_method)}
                        </td>
                        <td>{confidenceBadge(m.match_confidence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suggested matches section */}
          {suggested.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="between" style={{ marginBottom: 12 }}>
                <h3
                  className="panel-title"
                  style={{ color: "var(--amber)" }}
                >
                  ⚡ Suggested matches ({suggested.length})
                </h3>
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                  Review each and confirm or reject
                </p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Creative</th>
                      <th>Performance row</th>
                      <th>Method</th>
                      <th>Confidence</th>
                      <th style={{ width: 140 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggested.map((m) => (
                      <tr key={m.id}>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {m.creativeFilename}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {m.performanceIdentifier}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {methodLabel(m.match_method)}
                        </td>
                        <td>{confidenceBadge(m.match_confidence)}</td>
                        <td>
                          <div className="btn-row" style={{ gap: 6 }}>
                            <button
                              className="btn"
                              style={{
                                fontSize: 11,
                                padding: "3px 10px",
                                color: "var(--green)",
                                borderColor: "var(--green)",
                              }}
                              onClick={() =>
                                updateMapping(m.id, "confirmed")
                              }
                            >
                              ✓ Confirm
                            </button>
                            <button
                              className="btn"
                              style={{
                                fontSize: 11,
                                padding: "3px 10px",
                                color: "var(--red)",
                                borderColor: "var(--red)",
                              }}
                              onClick={() =>
                                updateMapping(m.id, "rejected")
                              }
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched section */}
          {(unmatchedCreatives.length > 0 ||
            unmatchedPerformance.length > 0) && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3
                className="panel-title"
                style={{ color: "var(--red)", marginBottom: 12 }}
              >
                ✗ Unmatched ({unmatchedCreatives.length} creatives,{" "}
                {unmatchedPerformance.length} perf rows)
              </h3>

              {unmatchedCreatives.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p
                    className="muted"
                    style={{ fontSize: 12, marginBottom: 6 }}
                  >
                    Creatives without a match:
                  </p>
                  <div
                    style={{
                      maxHeight: 120,
                      overflowY: "auto",
                      fontSize: 12,
                    }}
                  >
                    {unmatchedCreatives.map((c) => (
                      <div key={c.id} className="mono" style={{ padding: "2px 0" }}>
                        {c.filename}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unmatchedPerformance.length > 0 && (
                <div>
                  <p
                    className="muted"
                    style={{ fontSize: 12, marginBottom: 6 }}
                  >
                    Performance rows without a match:
                  </p>
                  <div
                    style={{
                      maxHeight: 120,
                      overflowY: "auto",
                      fontSize: 12,
                    }}
                  >
                    {unmatchedPerformance.map((p) => (
                      <div key={p.id} className="mono" style={{ padding: "2px 0" }}>
                        {p.source_filename || p.source_ad_name || p.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="page-actions">
        <Link href="/upload" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        {!canContinue && hasData && (
          <p
            className="muted"
            style={{ fontSize: 12, margin: 0, marginRight: 12 }}
          >
            {pendingCount > 0
              ? `Review ${pendingCount} suggested match${pendingCount !== 1 ? "es" : ""} to continue.`
              : confirmedCount === 0
                ? "Run the matching engine to continue."
                : ""}
          </p>
        )}
        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => router.push("/variables")}
        >
          Confirm reviewed mappings &amp; continue →
        </button>
      </div>
    </div>
  );
}
