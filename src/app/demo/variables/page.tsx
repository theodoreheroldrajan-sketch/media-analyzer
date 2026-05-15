"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";
import { getDemoVariables } from "@/lib/demo-data";
import AISuggestionCard from "@/components/variables/ai-suggestion-card";
import CustomVariableForm, { type CustomVariable } from "@/components/variables/custom-variable-form";

const ENABLED_VARS_KEY = "media-analyzer-enabled-vars";
const HYPOTHESIS_VARS_KEY = "media-analyzer-hypothesis-vars";
const MAX_HYPOTHESES = 5;

// Lazy initializers read localStorage once on first render — no mount-time
// useEffect+setState cascade. Works because this is a "use client" page;
// the server renders with defaults, then the client picks up stored values
// during hydration. The two persist-on-change effects below are pure
// side effects (no setState), but the lint rule flags them anyway, so
// they're suppressed with a comment.

function loadEnabled(demoVars: ReturnType<typeof getDemoVariables>): Record<string, boolean> {
  const defaults = Object.fromEntries(demoVars.map((v) => [v.name, true]));
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(ENABLED_VARS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function loadHypotheses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HYPOTHESIS_VARS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HYPOTHESES) : [];
  } catch {
    return [];
  }
}

function VariablesContent() {
  const { data, mode } = useDemo();
  const demoVars = getDemoVariables();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    loadEnabled(demoVars)
  );
  const [hypotheses, setHypotheses] = useState<string[]>(() => loadHypotheses());

  // Persist enabled state on change. Pure side effect — no setState.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ENABLED_VARS_KEY, JSON.stringify(enabled));
    } catch {
      /* ignore storage errors */
    }
  }, [enabled]);

  // Persist hypothesis selection on change. Pure side effect — no setState.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HYPOTHESIS_VARS_KEY, JSON.stringify(hypotheses));
    } catch {
      /* ignore storage errors */
    }
  }, [hypotheses]);

  function toggle(name: string) {
    setEnabled((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function toggleHypothesis(name: string) {
    setHypotheses((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_HYPOTHESES) return prev;
      return [...prev, name];
    });
  }

  if (mode === "lite") {
    return (
      <LiteVariables
        vars={demoVars}
        enabled={enabled}
        toggle={toggle}
        hypotheses={hypotheses}
        toggleHypothesis={toggleHypothesis}
      />
    );
  }

  return (
    <ProVariables
      vars={demoVars}
      enabled={enabled}
      toggle={toggle}
      hypotheses={hypotheses}
      toggleHypothesis={toggleHypothesis}
      aiSuggestions={data?.aiSuggestedVariables ?? []}
    />
  );
}

function HypothesisToggle({
  name,
  isHypothesis,
  atLimit,
  onToggle,
}: {
  name: string;
  isHypothesis: boolean;
  atLimit: boolean;
  onToggle: () => void;
}) {
  const disabled = !isHypothesis && atLimit;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={
        isHypothesis
          ? "This variable is flagged as a specific hypothesis"
          : disabled
            ? `Maximum ${MAX_HYPOTHESES} hypotheses reached`
            : "Flag as a specific hypothesis you're testing"
      }
      className="badge mono"
      style={{
        fontSize: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: isHypothesis ? "rgba(193, 60, 62, 0.16)" : "transparent",
        color: isHypothesis ? "var(--red)" : "var(--text-2)",
        borderColor: isHypothesis ? "var(--red)" : "var(--border)",
        justifySelf: "end",
      }}
      aria-label={`Toggle hypothesis flag for ${name}`}
    >
      {isHypothesis ? "★ hypothesis" : "+ hypothesis"}
    </button>
  );
}

function LiteVariables({
  vars,
  enabled,
  toggle,
  hypotheses,
  toggleHypothesis,
}: {
  vars: ReturnType<typeof getDemoVariables>;
  enabled: Record<string, boolean>;
  toggle: (name: string) => void;
  hypotheses: string[];
  toggleHypothesis: (name: string) => void;
}) {
  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const atLimit = hypotheses.length >= MAX_HYPOTHESES;

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 05 · Demo (Lite)</p>
        <h1 className="page-title">Variables</h1>
        <p className="page-sub">
          These are the creative variables that AI will extract from each image.
          Toggle any variable on or off. {enabledCount} of {vars.length} enabled.
        </p>
      </div>

      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">Variable schema</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Mark up to {MAX_HYPOTHESES} variables you have a specific
              hypothesis about. Optional. Hypotheses appear in their own section
              on the dashboard, separate from exploratory patterns.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge mono" style={{ fontSize: 10 }}>
              {hypotheses.length}/{MAX_HYPOTHESES} hypotheses
            </span>
            <span className="badge badge-accent">{enabledCount} enabled</span>
          </div>
        </div>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            marginTop: 12,
          }}
        >
          {vars.map((v) => (
            <div
              className="var-row"
              key={v.name}
              style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}
            >
              <input
                type="checkbox"
                checked={enabled[v.name]}
                onChange={() => toggle(v.name)}
              />
              <div>
                <span className="var-name">{v.name}</span>
              </div>
              <span className="var-allowed">
                {v.type === "boolean"
                  ? "true / false"
                  : v.type === "integer"
                    ? "0, 1, 2, 3..."
                    : v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10 }}>
                {v.type}
              </span>
              <HypothesisToggle
                name={v.name}
                isHypothesis={hypotheses.includes(v.name)}
                atLimit={atLimit}
                onToggle={() => toggleHypothesis(v.name)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="page-actions">
        <Link href="/demo/mapping" className="btn">← Back to mapping</Link>
        <div className="spacer" />
        <Link href="/demo/analysis" className="btn btn-primary">Continue to analysis →</Link>
      </div>
    </div>
  );
}

function ProVariables({
  vars,
  enabled,
  toggle,
  hypotheses,
  toggleHypothesis,
  aiSuggestions,
}: {
  vars: ReturnType<typeof getDemoVariables>;
  enabled: Record<string, boolean>;
  toggle: (name: string) => void;
  hypotheses: string[];
  toggleHypothesis: (name: string) => void;
  aiSuggestions: import("@/lib/demo-data").AISuggestion[];
}) {
  // Category vs universal split — vars after index 12 are roughly category
  const universalVars = vars.slice(0, 14);
  const categoryVars = vars.slice(14);

  const [aiStatus, setAiStatus] = useState<Record<string, "pending" | "accepted" | "dismissed">>(() => {
    const init: Record<string, "pending" | "accepted" | "dismissed"> = {};
    aiSuggestions?.forEach((s) => { init[s.name] = "pending"; });
    return init;
  });

  const [customVars, setCustomVars] = useState<CustomVariable[]>([]);

  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const acceptedAICount = Object.values(aiStatus).filter((s) => s === "accepted").length;
  const totalActive = enabledCount + acceptedAICount + customVars.length;
  const atLimit = hypotheses.length >= MAX_HYPOTHESES;

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 05 · Demo (Pro)</p>
        <h1 className="page-title">Variable schema builder</h1>
        <p className="page-sub">
          A four-tier schema combines universal variables, category-specific ones,
          AI-suggested additions based on your dataset, and any custom variables
          you define.
        </p>
      </div>

      <div className="schema-summary mb-2">
        <span className="badge badge-accent mono">{totalActive} variables active</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {enabledCount} universal · {acceptedAICount} AI-accepted · {customVars.length} custom
        </span>
        <span className="badge mono" style={{ fontSize: 10, marginLeft: 8 }}>
          {hypotheses.length}/{MAX_HYPOTHESES} hypotheses marked
        </span>
      </div>

      <div
        className="panel"
        style={{
          background: "rgba(193, 60, 62, 0.06)",
          borderColor: "rgba(193, 60, 62, 0.4)",
        }}
      >
        <h3 className="panel-title" style={{ marginBottom: 4 }}>
          Pre-register your hypotheses
        </h3>
        <p className="panel-sub" style={{ marginBottom: 0 }}>
          Mark up to {MAX_HYPOTHESES} variables you have a specific hypothesis
          about. Optional — leave empty if exploring. Pre-registered variables
          appear in their own section on the dashboard; everything else goes
          through Benjamini-Hochberg FDR correction.
        </p>
      </div>

      {/* Tier 1: Universal */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">1 · Universal variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Applied to every creative — visual elements, colours, text, CTAs.
            </p>
          </div>
          <span className="badge mono">{universalVars.filter((v) => enabled[v.name]).length} / {universalVars.length}</span>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginTop: 12 }}>
          {universalVars.map((v) => (
            <div
              className="var-row"
              key={v.name}
              style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}
            >
              <input type="checkbox" checked={enabled[v.name]} onChange={() => toggle(v.name)} />
              <div><span className="var-name">{v.name}</span></div>
              <span className="var-allowed">
                {v.type === "boolean" ? "true / false" :
                 v.type === "integer" ? "0, 1, 2..." :
                 v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10 }}>{v.type}</span>
              <HypothesisToggle
                name={v.name}
                isHypothesis={hypotheses.includes(v.name)}
                atLimit={atLimit}
                onToggle={() => toggleHypothesis(v.name)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2: Category */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">2 · Category-specific variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Loaded from the E-commerce/DTC Beauty template. Product photography,
              promotional language, lifestyle vs studio framing.
            </p>
          </div>
          <span className="badge mono">{categoryVars.filter((v) => enabled[v.name]).length} / {categoryVars.length}</span>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginTop: 12 }}>
          {categoryVars.map((v) => (
            <div
              className="var-row"
              key={v.name}
              style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}
            >
              <input type="checkbox" checked={enabled[v.name]} onChange={() => toggle(v.name)} />
              <div><span className="var-name">{v.name}</span></div>
              <span className="var-allowed">
                {v.type === "boolean" ? "true / false" :
                 v.type === "integer" ? "0, 1, 2..." :
                 v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10 }}>{v.type}</span>
              <HypothesisToggle
                name={v.name}
                isHypothesis={hypotheses.includes(v.name)}
                atLimit={atLimit}
                onToggle={() => toggleHypothesis(v.name)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tier 3: AI suggestions */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">3 · AI-suggested variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Generated from a quick scan of your creatives + brand context.
              Each one has a rationale explaining why it might matter.
            </p>
          </div>
          <span className="badge badge-accent mono">
            {Object.values(aiStatus).filter((s) => s === "pending").length} pending
          </span>
        </div>
        <div className="ai-suggestions-grid mt-3">
          {aiSuggestions?.map((s) => {
            const status = aiStatus[s.name];
            if (status === "dismissed") return null;
            return (
              <AISuggestionCard
                key={s.name}
                suggestion={s}
                accepted={status === "accepted"}
                onAccept={() => setAiStatus({ ...aiStatus, [s.name]: "accepted" })}
                onDismiss={() => setAiStatus({ ...aiStatus, [s.name]: "dismissed" })}
              />
            );
          })}
        </div>
      </div>

      {/* Tier 4: Custom */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">4 · Custom variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Add anything specific to your brand or creative strategy that
              isn&apos;t covered above.
            </p>
          </div>
          <span className="badge mono">{customVars.length} added</span>
        </div>
        <div className="mt-3">
          <CustomVariableForm
            variables={customVars}
            onAdd={(v) => setCustomVars([...customVars, v])}
            onRemove={(id) => setCustomVars(customVars.filter((v) => v.id !== id))}
          />
        </div>
      </div>

      <div className="page-actions">
        <Link href="/demo/mapping" className="btn">← Back to mapping</Link>
        <div className="spacer" />
        <Link href="/demo/analysis" className="btn btn-primary">Continue to analysis →</Link>
      </div>
    </div>
  );
}

export default function DemoVariablesPage() {
  return (
    <DemoModeGuard>
      <VariablesContent />
    </DemoModeGuard>
  );
}
