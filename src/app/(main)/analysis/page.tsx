"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useProject } from "@/context/project-context";
import { getSupabase } from "@/lib/supabase";

type ProgressEvent = {
  type: "start" | "progress" | "error" | "done";
  runId?: string;
  creativeId?: string;
  filename?: string;
  completed?: number;
  failed?: number;
  total?: number;
  variables?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  totalCost?: number;
  durationMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  error?: string;
  extracted?: Record<string, unknown>;
};

type ResultRow = {
  filename: string;
  status: "completed" | "failed";
  cost: number;
  durationMs: number;
  extracted: Record<string, unknown>;
  error?: string;
};

export default function AnalysisPage() {
  const router = useRouter();
  const { project } = useProject();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preflight
  const [mappedCount, setMappedCount] = useState(0);
  const [variableCount, setVariableCount] = useState(0);
  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Progress
  const [progress, setProgress] = useState({
    completed: 0,
    failed: 0,
    total: 0,
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  });
  const [results, setResults] = useState<ResultRow[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Load preflight data
  const loadPreflight = useCallback(async () => {
    if (!project) return;
    setLoading(true);

    try {
      const supabase = getSupabase();

      // Count confirmed mappings
      const { count: mapCount } = await supabase
        .from("creative_mappings")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("status", "confirmed");

      setMappedCount(mapCount ?? 0);

      // Get active schema
      const { data: schema } = await supabase
        .from("variable_schemas")
        .select("id, variables")
        .eq("project_id", project.id)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (schema) {
        setSchemaId(schema.id);
        const vars = schema.variables as { enabled: boolean }[];
        setVariableCount(vars.filter((v) => v.enabled).length);
      }

      // Check for existing run
      const res = await fetch(`/api/analysis?projectId=${project.id}`);
      const data = await res.json();

      if (data.run) {
        setHasRun(true);
        setProgress({
          completed: data.run.completed_creatives,
          failed: data.run.failed_creatives,
          total: data.run.total_creatives,
          totalCost: data.run.total_cost,
          totalInputTokens: data.run.total_input_tokens,
          totalOutputTokens: data.run.total_output_tokens,
        });

        // Resolve filenames for results
        if (data.results?.length) {
          const creativeIds = data.results.map(
            (r: { creative_id: string }) => r.creative_id
          );
          const { data: creatives } = await supabase
            .from("creatives")
            .select("id, filename")
            .in("id", creativeIds);

          const nameMap = new Map(
            (creatives ?? []).map((c) => [c.id, c.filename])
          );

          setResults(
            data.results.map(
              (r: {
                creative_id: string;
                status: string;
                cost: number;
                duration_ms: number;
                extracted_variables: Record<string, unknown>;
                error_message: string | null;
              }) => ({
                filename: nameMap.get(r.creative_id) ?? r.creative_id,
                status: r.status,
                cost: r.cost,
                durationMs: r.duration_ms ?? 0,
                extracted: r.extracted_variables,
                error: r.error_message ?? undefined,
              })
            )
          );
        }
      }
    } catch {
      // Silent fail — we'll show the preflight anyway
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async Supabase + API fetch via loadPreflight; setState happens inside the awaited callback
    loadPreflight();
  }, [loadPreflight]);

  // Auto-scroll log — imperative DOM work; no setState
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [results]);

  // Start analysis
  async function startAnalysis() {
    if (!project || !schemaId) return;
    setRunning(true);
    setError(null);
    setResults([]);
    setCurrentFile(null);
    setProgress({
      completed: 0,
      failed: 0,
      total: 0,
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    });

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          schemaId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }

      // Read the stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event: ProgressEvent = JSON.parse(line);

            if (event.type === "start") {
              setProgress((prev) => ({
                ...prev,
                total: event.total ?? 0,
              }));
            } else if (event.type === "progress") {
              setCurrentFile(event.filename ?? null);
              setProgress((prev) => ({
                completed: event.completed ?? 0,
                failed: event.failed ?? 0,
                total: event.total ?? 0,
                totalCost: event.totalCost ?? 0,
                totalInputTokens:
                  (event.totalInputTokens ?? 0) ||
                  prev.totalInputTokens + (event.inputTokens ?? 0),
                totalOutputTokens:
                  (event.totalOutputTokens ?? 0) ||
                  prev.totalOutputTokens + (event.outputTokens ?? 0),
              }));
              setResults((prev) => [
                ...prev,
                {
                  filename: event.filename ?? "—",
                  status: "completed",
                  cost: event.cost ?? 0,
                  durationMs: event.durationMs ?? 0,
                  extracted: event.extracted ?? {},
                },
              ]);
            } else if (event.type === "error") {
              setProgress((prev) => ({
                ...prev,
                completed: event.completed ?? prev.completed,
                failed: event.failed ?? prev.failed,
              }));
              setResults((prev) => [
                ...prev,
                {
                  filename: event.filename ?? "—",
                  status: "failed",
                  cost: 0,
                  durationMs: 0,
                  extracted: {},
                  error: event.error,
                },
              ]);
            } else if (event.type === "done") {
              setProgress({
                completed: event.completed ?? 0,
                failed: event.failed ?? 0,
                total: event.total ?? 0,
                totalCost: event.totalCost ?? 0,
                totalInputTokens: event.totalInputTokens ?? 0,
                totalOutputTokens: event.totalOutputTokens ?? 0,
              });
              setHasRun(true);
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setRunning(false);
      setCurrentFile(null);
    }
  }

  const estimatedCost =
    mappedCount > 0
      ? // ~1850 input tokens avg (image + prompt), ~300 output tokens avg
        // Haiku 4.5: $0.80/M input, $4.00/M output
        Math.round(
          mappedCount * (1850 * 0.0000008 + 300 * 0.000004) * 10000
        ) / 10000
      : 0;

  const estimatedTime = mappedCount * 3; // ~3 seconds per image
  const canStart =
    mappedCount > 0 && schemaId !== null && variableCount > 0 && !running;
  const progressPct =
    progress.total > 0
      ? Math.round(
          ((progress.completed + progress.failed) / progress.total) * 100
        )
      : 0;

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 06 of 08</p>
        <h1 className="page-title">Run AI extraction</h1>
        <p className="page-sub">
          For each mapped creative, the AI extracts every variable in your
          approved schema. Cost scales linearly with creative count.
        </p>
      </div>

      {error && (
        <div
          className="callout"
          style={{ marginBottom: 16, color: "var(--red)" }}
        >
          {error}
        </div>
      )}

      {/* Preflight panel */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 className="panel-title">Pre-flight</h3>
        <p className="panel-sub">Confirm before spending tokens.</p>
        <div className="kv-grid mt-2">
          <div className="kv-row">
            <div className="k">creatives_mapped</div>
            <div className="v">{loading ? "…" : mappedCount}</div>
          </div>
          <div className="kv-row">
            <div className="k">variables_in_schema</div>
            <div className="v">{loading ? "…" : variableCount}</div>
          </div>
          <div className="kv-row">
            <div className="k">model</div>
            <div className="v">claude-haiku-4-5 · vision + tool_use</div>
          </div>
          <div className="kv-row">
            <div className="k">avg_tokens_per_image</div>
            <div className="v">~1,850 input · ~300 output</div>
          </div>
          <div className="kv-row">
            <div className="k">estimated_cost_usd</div>
            <div className="v">
              {loading ? "…" : `$${estimatedCost.toFixed(4)}`}
            </div>
          </div>
          <div className="kv-row">
            <div className="k">estimated_runtime</div>
            <div className="v">
              {loading
                ? "…"
                : estimatedTime < 60
                  ? `~${estimatedTime}s`
                  : `~${Math.ceil(estimatedTime / 60)}min`}
            </div>
          </div>
        </div>
        <div className="callout mt-2">
          Estimates are based on average token counts. Actual cost is shown live
          during the run. Images with more detail use more tokens.
        </div>
      </div>

      {/* Progress panel — shown during and after runs */}
      {(running || hasRun) && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <h3 className="panel-title">
              {running ? "Running…" : "Results"}
            </h3>
            <span className="badge mono">
              {progress.completed + progress.failed} / {progress.total}
              {progress.failed > 0 && (
                <span style={{ color: "var(--red)", marginLeft: 6 }}>
                  ({progress.failed} failed)
                </span>
              )}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              background: "var(--bg-2)",
              borderRadius: 3,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background:
                  progress.failed > 0 ? "var(--amber)" : "var(--green)",
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {running && currentFile && (
            <p
              className="mono muted"
              style={{ fontSize: 11, marginBottom: 8 }}
            >
              Analysing: {currentFile}
            </p>
          )}

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            <span className="mono">
              Cost:{" "}
              <strong>${progress.totalCost.toFixed(4)}</strong>
            </span>
            <span className="mono">
              Tokens:{" "}
              <strong>
                {(
                  progress.totalInputTokens + progress.totalOutputTokens
                ).toLocaleString()}
              </strong>
            </span>
          </div>

          {/* Results log */}
          <div
            ref={logRef}
            style={{
              maxHeight: 300,
              overflowY: "auto",
              fontSize: 12,
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 8,
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                  borderBottom: "1px solid var(--border)",
                  color:
                    r.status === "failed"
                      ? "var(--red)"
                      : "var(--text-1)",
                }}
              >
                <span className="mono" style={{ flex: 1 }}>
                  {r.status === "completed" ? "✓" : "✗"} {r.filename}
                </span>
                {r.status === "completed" ? (
                  <>
                    <span
                      className="muted"
                      style={{ marginLeft: 12, whiteSpace: "nowrap" }}
                    >
                      ${r.cost.toFixed(4)}
                    </span>
                    <span
                      className="muted"
                      style={{ marginLeft: 12, whiteSpace: "nowrap" }}
                    >
                      {(r.durationMs / 1000).toFixed(1)}s
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      marginLeft: 12,
                      color: "var(--red)",
                      fontSize: 11,
                    }}
                  >
                    {r.error}
                  </span>
                )}
              </div>
            ))}
            {results.length === 0 && !running && (
              <p className="muted" style={{ padding: 8 }}>
                No results yet.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="page-actions">
        <Link href="/variables" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        {!hasRun ? (
          <button
            className="btn btn-primary"
            onClick={startAnalysis}
            disabled={!canStart}
          >
            {running ? "Running…" : "Start analysis →"}
          </button>
        ) : (
          <>
            <button
              className="btn"
              style={{ marginRight: 8 }}
              onClick={startAnalysis}
              disabled={running}
            >
              {running ? "Running…" : "Re-run analysis"}
            </button>
            <button
              className="btn btn-primary"
              disabled={running || progress.completed === 0}
              onClick={() => router.push("/dashboard")}
            >
              View dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
