"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useProject } from "@/context/project-context";


const CATEGORIES = [
  "Generic ecommerce",
  "Food/restaurant",
  "App install",
  "Matrimony/dating",
  "Local service",
  "B2B lead generation",
  "Personal brand/content creator",
];
const KPIS = ["CTR", "CPC", "CPA", "CVR", "ROAS"];
const PLATFORMS = ["Meta Ads", "Google Ads", "Generic/Other"];

export default function SetupPage() {
  const router = useRouter();
  const { project, loading: projectLoading, setProjectId, refresh } = useProject();

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [primaryKpi, setPrimaryKpi] = useState("");
  const [tone, setTone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form if project already exists
  useEffect(() => {
    if (project) {
      setName(project.name);
      setBrandName(project.brand_name);
      setBrandCategory(project.brand_category);
      setPlatform(project.platform);
      setCampaignGoal(project.campaign_goal ?? "");
      setTargetAudience(project.target_audience ?? "");
      setPrimaryKpi(project.primary_kpi);
      setTone(project.tone ?? "");
    }
  }, [project]);

  const isValid = name && brandName && brandCategory && platform && primaryKpi;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const payload = {
      name,
      brand_name: brandName,
      brand_category: brandCategory,
      platform,
      campaign_goal: campaignGoal || null,
      target_audience: targetAudience || null,
      primary_kpi: primaryKpi,
      tone: tone || null,
    };

    try {
      if (project) {
        // Update existing project
        const { error: updateError } = await getSupabase()
          .from("projects")
          .update(payload)
          .eq("id", project.id);

        if (updateError) throw updateError;
        await refresh();
      } else {
        // Create new project
        const { data, error: insertError } = await getSupabase()
          .from("projects")
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) {
          setProjectId(data.id);
        }
      }

      router.push("/instructions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 01 of 08</p>
        <h1 className="page-title">Set up your project</h1>
        <p className="page-sub">
          Tell us about the brand and what you&apos;re optimising for. This
          context shapes the variable schema and the way insights are framed.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="panel" style={{ maxWidth: 820 }}>
          <h3 className="panel-title">Brand context</h3>
          <p className="panel-sub">
            All fields except where marked optional are required for analysis to
            produce useful results.
          </p>

          {error && (
            <div className="callout" style={{ borderColor: "var(--red)", color: "var(--red)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label className="label">
                Project name<span className="req">*</span>
              </label>
              <input
                className="input"
                placeholder="Spring launch — Meta video"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label">
                Brand name<span className="req">*</span>
              </label>
              <input
                className="input"
                placeholder="Acme"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">
                Brand category<span className="req">*</span>
              </label>
              <select
                className="select"
                value={brandCategory}
                onChange={(e) => setBrandCategory(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select category…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="hint">
                Used to load category-specific variables in the next step.
              </p>
            </div>
            <div className="field">
              <label className="label">
                Platform / source<span className="req">*</span>
              </label>
              <select
                className="select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select platform…
                </option>
                {PLATFORMS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="hint">
                Determines expected CSV columns and naming conventions.
              </p>
            </div>
          </div>

          <div className="field">
            <label className="label">Campaign goal</label>
            <input
              className="input"
              placeholder="App installs, lead generation, online sales…"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Target audience</label>
            <textarea
              className="textarea"
              placeholder="Urban Indian singles, 25-34, English-speaking, salaried professionals in metros…"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">
                Primary KPI<span className="req">*</span>
              </label>
              <select
                className="select"
                value={primaryKpi}
                onChange={(e) => setPrimaryKpi(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select KPI…
                </option>
                {KPIS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">
                Tone / positioning <span className="muted">(optional)</span>
              </label>
              <input
                className="input"
                placeholder="Bold, irreverent, value-conscious…"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="page-actions">
          <Link href="/" className="btn">
            ← Back
          </Link>
          <div className="spacer" />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || saving || projectLoading}
          >
            {saving ? "Saving…" : project ? "Update & continue →" : "Save & continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}
