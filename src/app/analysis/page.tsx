import Link from "next/link";

export default function AnalysisPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 07 of 09</p>
        <h1 className="page-title">Run AI extraction</h1>
        <p className="page-sub">
          For each mapped creative, the AI extracts every variable in your
          approved schema. Cost scales linearly with creative count.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">Pre-flight</h3>
        <p className="panel-sub">Confirm before spending tokens.</p>
        <div className="kv-grid mt-2">
          <div className="kv-row">
            <div className="k">creatives_mapped</div>
            <div className="v">—</div>
          </div>
          <div className="kv-row">
            <div className="k">variables_in_schema</div>
            <div className="v">—</div>
          </div>
          <div className="kv-row">
            <div className="k">model</div>
            <div className="v">claude-haiku-4-5 · vision</div>
          </div>
          <div className="kv-row">
            <div className="k">avg_tokens_per_image</div>
            <div className="v">~1,850</div>
          </div>
          <div className="kv-row">
            <div className="k">estimated_cost_usd</div>
            <div className="v">—</div>
          </div>
          <div className="kv-row">
            <div className="k">estimated_runtime</div>
            <div className="v">—</div>
          </div>
        </div>
        <div className="callout mt-2">
          Estimates are based on the average token count from recent runs of
          similar size. Actual cost is shown live during the run.
        </div>
        <div className="btn-row mt-3">
          <Link href="/variables" className="btn">
            ← Back
          </Link>
          <button className="btn btn-primary" disabled>
            Start analysis →
          </button>
        </div>
      </div>
    </div>
  );
}
