"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/project-context";
import { getSupabase } from "@/lib/supabase";

type UsageStats = {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  lastRun: string | null;
};

type ExportInfo = {
  creativeCount: number;
  perfRowCount: number;
  extractionCount: number;
  variableCount: number;
};

export default function SettingsPage() {
  const router = useRouter();
  const { project, clear } = useProject();

  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [exports, setExports] = useState<ExportInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!project) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/settings?projectId=${project.id}`);
      const data = await res.json();
      if (data.usage) setUsage(data.usage);
      if (data.exports) setExports(data.exports);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function downloadCSV(type: "variables" | "performance" | "combined") {
    if (!project) return;
    window.open(`/api/export?projectId=${project.id}&type=${type}`, "_blank");
  }

  async function handleDelete() {
    if (!project || !confirmDelete) return;
    setDeleting(true);

    try {
      const supabase = getSupabase();

      // Delete in order: extraction_results → analysis_runs → creative_mappings →
      // performance_rows → performance_uploads → variable_schemas → creatives → project
      // (respecting foreign key constraints)

      // Get run IDs first
      const { data: runs } = await supabase
        .from("analysis_runs")
        .select("id")
        .eq("project_id", project.id);

      const runIds = (runs ?? []).map((r) => r.id);

      if (runIds.length > 0) {
        await supabase
          .from("extraction_results")
          .delete()
          .in("run_id", runIds);
      }

      await supabase
        .from("analysis_runs")
        .delete()
        .eq("project_id", project.id);

      await supabase
        .from("insights")
        .delete()
        .eq("project_id", project.id);

      await supabase
        .from("creative_mappings")
        .delete()
        .eq("project_id", project.id);

      await supabase
        .from("variable_schemas")
        .delete()
        .eq("project_id", project.id);

      await supabase
        .from("performance_rows")
        .delete()
        .eq("project_id", project.id);

      await supabase
        .from("performance_uploads")
        .delete()
        .eq("project_id", project.id);

      // Delete storage files
      const { data: files } = await supabase.storage
        .from("creatives")
        .list(project.id);

      if (files && files.length > 0) {
        await supabase.storage
          .from("creatives")
          .remove(files.map((f) => `${project.id}/${f.name}`));
      }

      await supabase
        .from("creatives")
        .delete()
        .eq("project_id", project.id);

      await supabase.from("projects").delete().eq("id", project.id);

      clear();
      router.push("/");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 08 of 08</p>
        <h1 className="page-title">Project settings</h1>
        <p className="page-sub">
          Manage brand context, export data, see API usage, or delete this
          project.
        </p>
      </div>

      {/* Export data */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 className="panel-title">Export data</h3>
        <p className="panel-sub">
          Download CSVs of the underlying data behind the dashboard. Re-import
          to other tools as needed.
        </p>
        <div className="btn-row mt-2" style={{ flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={() => downloadCSV("variables")}
            disabled={!exports || exports.extractionCount === 0}
          >
            ↓ Variables CSV{" "}
            <span
              className="muted mono"
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              {exports
                ? `${exports.extractionCount} rows · ${exports.variableCount} cols`
                : "— rows · — cols"}
            </span>
          </button>
          <button
            className="btn"
            onClick={() => downloadCSV("performance")}
            disabled={!exports || exports.perfRowCount === 0}
          >
            ↓ Performance CSV{" "}
            <span
              className="muted mono"
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              {exports
                ? `${exports.perfRowCount} rows · 12 cols`
                : "— rows · — cols"}
            </span>
          </button>
          <button
            className="btn"
            onClick={() => downloadCSV("combined")}
            disabled={!exports || exports.extractionCount === 0}
          >
            ↓ Combined analysis CSV{" "}
            <span
              className="muted mono"
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              {exports
                ? `${exports.extractionCount} rows · ${exports.variableCount + 7} cols`
                : "— rows · — cols"}
            </span>
          </button>
        </div>
      </div>

      {/* API usage */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 className="panel-title">API usage</h3>
        <p className="panel-sub">Lifetime usage for this project.</p>
        <div className="kv-grid mt-2">
          <div className="kv-row">
            <div className="k">total_analysis_runs</div>
            <div className="v">
              {loading ? "…" : usage?.totalRuns ?? 0}
            </div>
          </div>
          <div className="kv-row">
            <div className="k">total_tokens_used</div>
            <div className="v">
              {loading
                ? "…"
                : (usage?.totalTokens ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="kv-row">
            <div className="k">total_cost_usd</div>
            <div className="v">
              {loading
                ? "…"
                : `$${(usage?.totalCost ?? 0).toFixed(4)}`}
            </div>
          </div>
          <div className="kv-row">
            <div className="k">last_run</div>
            <div className="v mono" style={{ fontSize: 12 }}>
              {loading
                ? "…"
                : usage?.lastRun
                  ? new Date(usage.lastRun).toLocaleString()
                  : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Project info */}
      {project && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 className="panel-title">Project info</h3>
          <div className="kv-grid mt-2">
            <div className="kv-row">
              <div className="k">project_name</div>
              <div className="v">{project.name}</div>
            </div>
            <div className="kv-row">
              <div className="k">brand</div>
              <div className="v">{project.brand_name}</div>
            </div>
            <div className="kv-row">
              <div className="k">category</div>
              <div className="v">{project.brand_category}</div>
            </div>
            <div className="kv-row">
              <div className="k">platform</div>
              <div className="v">{project.platform}</div>
            </div>
            <div className="kv-row">
              <div className="k">primary_kpi</div>
              <div className="v">{project.primary_kpi}</div>
            </div>
            <div className="kv-row">
              <div className="k">created</div>
              <div className="v mono" style={{ fontSize: 12 }}>
                {new Date(project.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href="/setup" className="btn" style={{ fontSize: 12 }}>
              Edit project settings
            </Link>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div
        className="panel"
        style={{ borderColor: "oklch(0.85 0.06 25)" }}
      >
        <h3 className="panel-title" style={{ color: "var(--red)" }}>
          Danger zone
        </h3>
        <p className="panel-sub">Destructive actions. Cannot be undone.</p>
        <div
          className="between"
          style={{
            padding: "12px 0 0",
            borderTop: "1px solid var(--border)",
            marginTop: 8,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Delete this project
            </p>
            <p
              className="muted"
              style={{ margin: "2px 0 0", fontSize: 12 }}
            >
              Removes all creatives, mappings, extracted variables, and
              dashboard data.
            </p>
          </div>
          {!confirmDelete ? (
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete project
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-actions">
        <Link href="/dashboard" className="btn">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
