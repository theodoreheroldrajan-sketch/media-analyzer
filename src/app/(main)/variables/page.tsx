"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/project-context";
import type { VariableDefinition } from "@/types/database";
import {
  UNIVERSAL_VARIABLES,
  getCategoryVariables,
} from "@/lib/variables";

export default function VariablesPage() {
  const router = useRouter();
  const { project } = useProject();

  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom variable form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<VariableDefinition["type"]>("boolean");
  const [customEnumValues, setCustomEnumValues] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Load existing schema or build default
  const loadSchema = useCallback(async () => {
    if (!project) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/variables?projectId=${project.id}`
      );
      const data = await res.json();

      if (data.schema?.variables) {
        setVariables(data.schema.variables);
      } else {
        // Build default from universal + category
        const categoryVars = getCategoryVariables(
          project.brand_category
        );
        setVariables([...UNIVERSAL_VARIABLES, ...categoryVars]);
      }
    } catch {
      // Fallback to defaults
      const categoryVars = getCategoryVariables(
        project.brand_category
      );
      setVariables([...UNIVERSAL_VARIABLES, ...categoryVars]);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // Toggle a variable on/off
  function toggleVariable(index: number) {
    setSaved(false);
    setVariables((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, enabled: !v.enabled } : v
      )
    );
  }

  // Add custom variable
  function addCustomVariable() {
    const name = customName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    if (!name) return;
    if (variables.some((v) => v.name === name)) {
      setError(`Variable "${name}" already exists`);
      return;
    }

    const newVar: VariableDefinition = {
      name,
      type: customType,
      description: customDescription.trim() || undefined,
      source: "custom",
      enabled: true,
    };

    if (customType === "enum" && customEnumValues.trim()) {
      newVar.enum_values = customEnumValues
        .split(",")
        .map((v) => v.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean);
    }

    setVariables((prev) => [...prev, newVar]);
    setCustomName("");
    setCustomType("boolean");
    setCustomEnumValues("");
    setCustomDescription("");
    setShowCustomForm(false);
    setSaved(false);
    setError(null);
  }

  // Remove a custom variable
  function removeCustomVariable(index: number) {
    setSaved(false);
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }

  // Save schema
  async function saveSchema() {
    if (!project) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          variables,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Counts
  const universal = variables.filter((v) => v.source === "universal");
  const category = variables.filter((v) => v.source === "category");
  const custom = variables.filter((v) => v.source === "custom");
  const enabledCount = variables.filter((v) => v.enabled).length;
  const universalEnabled = universal.filter((v) => v.enabled).length;
  const categoryEnabled = category.filter((v) => v.enabled).length;

  function typeColor(type: string) {
    switch (type) {
      case "boolean":
        return "var(--blue, #3b82f6)";
      case "enum":
        return "var(--purple, #8b5cf6)";
      case "integer":
        return "var(--amber)";
      case "string":
        return "var(--green)";
      default:
        return "var(--text-2)";
    }
  }

  function renderVariableRow(v: VariableDefinition, globalIndex: number) {
    return (
      <label
        className="checkbox-row"
        key={v.name}
        style={{ breakInside: "avoid" as const }}
      >
        <input
          type="checkbox"
          checked={v.enabled}
          onChange={() => toggleVariable(globalIndex)}
        />
        <span className="cb-name">{v.name}</span>
        <span
          className="cb-type"
          style={{ color: typeColor(v.type) }}
        >
          {v.type}
          {v.type === "enum" && v.enum_values
            ? ` (${v.enum_values.length})`
            : ""}
        </span>
        {v.source === "custom" && (
          <button
            className="btn"
            style={{
              fontSize: 10,
              padding: "1px 6px",
              marginLeft: 8,
              color: "var(--red)",
              borderColor: "var(--red)",
            }}
            onClick={(e) => {
              e.preventDefault();
              removeCustomVariable(globalIndex);
            }}
          >
            ✗
          </button>
        )}
      </label>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 06 of 09</p>
        <h1 className="page-title">Approve the variable schema</h1>
        <p className="page-sub">
          These are the variables the AI will extract from each creative. Keep
          the schema tight — every variable you add is more cost and a smaller
          per-bucket sample size.
        </p>
      </div>

      {!project && (
        <div className="callout" style={{ marginBottom: 16 }}>
          Complete the setup step first to create a project.
        </div>
      )}

      {error && (
        <div
          className="callout"
          style={{ marginBottom: 16, color: "var(--red)" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ padding: 14 }}>
          <p className="muted" style={{ fontSize: 13, padding: 12 }}>
            Loading variable schema…
          </p>
        </div>
      ) : (
        <>
          {/* Universal variables */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <div>
                <h3 className="panel-title">1 · Universal variables</h3>
                <p className="panel-sub" style={{ marginBottom: 0 }}>
                  Applied to every project. Uncheck any you don&apos;t need.
                </p>
              </div>
              <span className="badge mono">
                {universalEnabled} / {universal.length} included
              </span>
            </div>
            <div style={{ marginTop: 14, columnCount: 2, columnGap: 28 }}>
              {variables.map((v, i) =>
                v.source === "universal"
                  ? renderVariableRow(v, i)
                  : null
              )}
            </div>
          </div>

          {/* Category variables */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <div>
                <h3 className="panel-title">2 · Category variables</h3>
                <p className="panel-sub" style={{ marginBottom: 0 }}>
                  {project
                    ? `Based on your brand category: ${project.brand_category}`
                    : "Loaded from the brand category template you picked in setup."}
                </p>
              </div>
              <span className="badge mono">
                {categoryEnabled} / {category.length} included
              </span>
            </div>
            {category.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                {variables.map((v, i) =>
                  v.source === "category"
                    ? renderVariableRow(v, i)
                    : null
                )}
              </div>
            ) : (
              <p className="muted mt-2" style={{ fontSize: 13 }}>
                No category-specific variables found for this brand category.
              </p>
            )}
          </div>

          {/* AI-suggested variables */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <div>
                <h3 className="panel-title">3 · AI-suggested variables</h3>
                <p className="panel-sub" style={{ marginBottom: 0 }}>
                  Generated from your brand context and a sample of uploaded
                  creatives. Available after running analysis.
                </p>
              </div>
              <button className="btn" disabled>
                Ask AI to suggest variables
              </button>
            </div>
            <p
              className="muted mt-2"
              style={{ fontSize: 12, fontStyle: "italic" }}
            >
              AI suggestions will be available in a future update.
            </p>
          </div>

          {/* Custom variables */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="between">
              <div>
                <h3 className="panel-title">4 · Custom variables</h3>
                <p className="panel-sub" style={{ marginBottom: 0 }}>
                  Add anything specific to your hypothesis.
                </p>
              </div>
              <button
                className="btn"
                onClick={() => setShowCustomForm(!showCustomForm)}
              >
                {showCustomForm ? "Cancel" : "+ Add custom variable"}
              </button>
            </div>

            {custom.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {variables.map((v, i) =>
                  v.source === "custom"
                    ? renderVariableRow(v, i)
                    : null
                )}
              </div>
            )}

            {showCustomForm && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                  <div>
                    <label
                      className="label"
                      style={{ fontSize: 12, marginBottom: 4 }}
                    >
                      Variable name
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. background_type"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="label"
                      style={{ fontSize: 12, marginBottom: 4 }}
                    >
                      Type
                    </label>
                    <select
                      className="select"
                      value={customType}
                      onChange={(e) =>
                        setCustomType(
                          e.target.value as VariableDefinition["type"]
                        )
                      }
                    >
                      <option value="boolean">boolean</option>
                      <option value="enum">enum</option>
                      <option value="string">string</option>
                      <option value="integer">integer</option>
                    </select>
                  </div>
                </div>

                {customType === "enum" && (
                  <div style={{ marginBottom: 12 }}>
                    <label
                      className="label"
                      style={{ fontSize: 12, marginBottom: 4 }}
                    >
                      Enum values (comma-separated)
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. solid, gradient, photo, illustration"
                      value={customEnumValues}
                      onChange={(e) => setCustomEnumValues(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label
                    className="label"
                    style={{ fontSize: 12, marginBottom: 4 }}
                  >
                    Description (optional)
                  </label>
                  <input
                    className="input"
                    placeholder="What should the AI look for?"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12 }}
                  onClick={addCustomVariable}
                  disabled={!customName.trim()}
                >
                  Add variable
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="page-actions">
        <Link href="/mapping" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        <p className="mono" style={{ fontSize: 12, marginRight: 14 }}>
          <strong>{enabledCount}</strong> variables in final schema
        </p>
        {saved && (
          <span
            style={{
              fontSize: 12,
              color: "var(--green)",
              marginRight: 12,
            }}
          >
            ✓ Saved
          </span>
        )}
        <button
          className="btn"
          style={{ marginRight: 8 }}
          onClick={saveSchema}
          disabled={saving || !project}
        >
          {saving ? "Saving…" : "Save schema"}
        </button>
        <button
          className="btn btn-primary"
          disabled={!saved || enabledCount === 0}
          onClick={() => router.push("/analysis")}
        >
          Approve schema &amp; continue →
        </button>
      </div>
    </div>
  );
}
