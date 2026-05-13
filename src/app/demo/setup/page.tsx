"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";

function SetupContent() {
  const { data } = useDemo();
  const project = data!.project;

  const [name, setName] = useState(project.name);
  const [brand, setBrand] = useState(project.brand_name);
  const [category, setCategory] = useState(project.brand_category);
  const [platform, setPlatform] = useState(project.platform);
  const [kpi, setKpi] = useState(project.primary_kpi);
  const [goal, setGoal] = useState(project.campaign_goal);
  const [audience, setAudience] = useState(project.target_audience);

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 01 · Demo</p>
        <h1 className="page-title">Project setup</h1>
        <p className="page-sub">
          All fields are pre-filled with sample data. Edit anything you like —
          nothing is saved.
        </p>
      </div>

      <div className="panel">
        <div className="field-row">
          <div className="field">
            <label className="label">Project name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Brand name</label>
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">Category</label>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Platform</label>
            <select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>Meta Ads</option>
              <option>Google Ads</option>
              <option>TikTok Ads</option>
              <option>LinkedIn Ads</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">Primary KPI</label>
            <select className="select" value={kpi} onChange={(e) => setKpi(e.target.value)}>
              <option value="ctr">CTR</option>
              <option value="cpc">CPC</option>
              <option value="cpa">CPA</option>
              <option value="cvr">CVR</option>
              <option value="roas">ROAS</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Target audience</label>
            <input className="input" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="label">Campaign goal</label>
          <textarea className="textarea" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
      </div>

      <div className="page-actions">
        <Link href="/demo" className="btn">
          ← Change mode
        </Link>
        <div className="spacer" />
        <Link href="/demo/instructions" className="btn btn-primary">
          Continue to instructions →
        </Link>
      </div>
    </div>
  );
}

export default function DemoSetupPage() {
  return (
    <DemoModeGuard>
      <SetupContent />
    </DemoModeGuard>
  );
}
