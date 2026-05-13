"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";
import { getDemoVariables } from "@/lib/demo-data";
import AISuggestionCard from "@/components/variables/ai-suggestion-card";
import CustomVariableForm, { type CustomVariable } from "@/components/variables/custom-variable-form";

function VariablesContent() {
  const { data, mode } = useDemo();
  const demoVars = getDemoVariables();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(demoVars.map((v) => [v.name, true]))
  );

  function toggle(name: string) {
    setEnabled((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  if (mode === "lite") {
    return <LiteVariables vars={demoVars} enabled={enabled} toggle={toggle} />;
  }

  return <ProVariables vars={demoVars} enabled={enabled} toggle={toggle} aiSuggestions={data?.aiSuggestedVariables ?? []} />;
}

function LiteVariables({
  vars,
  enabled,
  toggle,
}: {
  vars: ReturnType<typeof getDemoVariables>;
  enabled: Record<string, boolean>;
  toggle: (name: string) => void;
}) {
  const enabledCount = Object.values(enabled).filter(Boolean).length;

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
          <h3 className="panel-title">Variable schema</h3>
          <span className="badge badge-accent">{enabledCount} enabled</span>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginTop: 12 }}>
          {vars.map((v) => (
            <div className="var-row" key={v.name}>
              <input type="checkbox" checked={enabled[v.name]} onChange={() => toggle(v.name)} />
              <div><span className="var-name">{v.name}</span></div>
              <span className="var-allowed">
                {v.type === "boolean" ? "true / false" :
                 v.type === "integer" ? "0, 1, 2, 3..." :
                 v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10, justifySelf: "end" }}>{v.type}</span>
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
  aiSuggestions,
}: {
  vars: ReturnType<typeof getDemoVariables>;
  enabled: Record<string, boolean>;
  toggle: (name: string) => void;
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
            <div className="var-row" key={v.name}>
              <input type="checkbox" checked={enabled[v.name]} onChange={() => toggle(v.name)} />
              <div><span className="var-name">{v.name}</span></div>
              <span className="var-allowed">
                {v.type === "boolean" ? "true / false" :
                 v.type === "integer" ? "0, 1, 2..." :
                 v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10, justifySelf: "end" }}>{v.type}</span>
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
            <div className="var-row" key={v.name}>
              <input type="checkbox" checked={enabled[v.name]} onChange={() => toggle(v.name)} />
              <div><span className="var-name">{v.name}</span></div>
              <span className="var-allowed">
                {v.type === "boolean" ? "true / false" :
                 v.type === "integer" ? "0, 1, 2..." :
                 v.values?.join(", ") ?? ""}
              </span>
              <span className="badge" style={{ fontSize: 10, justifySelf: "end" }}>{v.type}</span>
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
