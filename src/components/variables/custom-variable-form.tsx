"use client";

import { useState } from "react";

export type CustomVariable = {
  id: string;
  name: string;
  type: "boolean" | "integer" | "string" | "enum";
  enumValues?: string[];
  description: string;
};

export default function CustomVariableForm({
  variables,
  onAdd,
  onRemove,
}: {
  variables: CustomVariable[];
  onAdd: (v: CustomVariable) => void;
  onRemove: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomVariable["type"]>("boolean");
  const [enumValues, setEnumValues] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setName("");
    setType("boolean");
    setEnumValues("");
    setDescription("");
    setShowForm(false);
  }

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim().toLowerCase().replace(/\s+/g, "_"),
      type,
      enumValues: type === "enum" ? enumValues.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      description: description.trim(),
    });
    reset();
  }

  return (
    <div className="custom-variables-section">
      {variables.length > 0 && (
        <div className="custom-variables-list mb-2">
          {variables.map((v) => (
            <div key={v.id} className="custom-variable-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                  {v.name}
                </span>
                {v.description && (
                  <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                    {v.description}
                  </span>
                )}
              </div>
              <span className="badge mono" style={{ fontSize: 10 }}>
                {v.type}
              </span>
              {v.enumValues && v.enumValues.length > 0 && (
                <span className="mono muted" style={{ fontSize: 10 }}>
                  {v.enumValues.join(", ")}
                </span>
              )}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => onRemove(v.id)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!showForm && (
        <button className="btn" onClick={() => setShowForm(true)}>
          + Add custom variable
        </button>
      )}

      {showForm && (
        <div className="custom-variable-form panel" style={{ background: "var(--surface-2)" }}>
          <div className="field-row">
            <div className="field">
              <label className="label">Variable name</label>
              <input
                className="input"
                placeholder="e.g. festive_motif"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="hint">Lowercase, underscores; auto-formatted.</p>
            </div>
            <div className="field">
              <label className="label">Type</label>
              <select
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value as CustomVariable["type"])}
              >
                <option value="boolean">boolean (true/false)</option>
                <option value="enum">enum (fixed values)</option>
                <option value="integer">integer (number)</option>
                <option value="string">string (free text)</option>
              </select>
            </div>
          </div>

          {type === "enum" && (
            <div className="field">
              <label className="label">Allowed values</label>
              <input
                className="input"
                placeholder="warm, cool, neutral"
                value={enumValues}
                onChange={(e) => setEnumValues(e.target.value)}
              />
              <p className="hint">Comma-separated list of allowed values.</p>
            </div>
          )}

          <div className="field">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              placeholder="What does this variable capture?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="btn-row">
            <button className="btn" onClick={reset}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              Add variable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
