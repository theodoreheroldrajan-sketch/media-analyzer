import Link from "next/link";

export default function InstructionsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 03 of 09 · Required reading</p>
        <h1 className="page-title">Before you upload</h1>
        <p className="page-sub">
          This page is the difference between useful results and noise. Read it.
          If creatives can&apos;t be linked to performance rows, the analysis is
          meaningless.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">1 · What you need</h3>
        <p className="panel-sub">Two things, gathered before you start.</p>
        <div className="grid-2">
          <div className="diagram">
            <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
              FILES · IMAGE
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 6px" }}>
              Your ad creative files
            </p>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
              .png .jpg .jpeg — one file per creative variant. Static images
              only in this version.
            </p>
          </div>
          <div className="diagram">
            <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
              FILE · TABULAR
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 6px" }}>
              A performance export CSV
            </p>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
              .csv — exported from Meta Ads Manager, Google Ads, or any generic
              source. One row per creative.
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">
          2 · How creatives connect to performance rows
        </h3>
        <p className="panel-sub">
          We try these matching methods in order, highest confidence first.
          Anything below &quot;fuzzy&quot; requires you to confirm before it
          counts.
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Method</th>
                <th style={{ width: "45%" }}>What it does</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">exact filename</td>
                <td>
                  Filename column in CSV matches uploaded filename
                  byte-for-byte.
                </td>
                <td>
                  <span className="badge badge-green">highest</span>
                </td>
              </tr>
              <tr>
                <td className="mono">normalised filename</td>
                <td>
                  Match ignoring case, spaces, dashes, underscores, and
                  extension.
                </td>
                <td>
                  <span className="badge badge-green">high</span>
                </td>
              </tr>
              <tr>
                <td className="mono">creative_id / ad_id / asset_id</td>
                <td>
                  ID found anywhere in the filename matches an ID column.
                </td>
                <td>
                  <span className="badge badge-green">high</span>
                </td>
              </tr>
              <tr>
                <td className="mono">ad_name</td>
                <td>Filename contains or equals ad_name field.</td>
                <td>
                  <span className="badge badge-amber">medium</span>
                </td>
              </tr>
              <tr>
                <td className="mono">fuzzy</td>
                <td>
                  Best-effort string similarity (Levenshtein ≥ 0.78). Suggested
                  only — must be confirmed.
                </td>
                <td>
                  <span className="badge badge-amber">suggested</span>
                </td>
              </tr>
              <tr>
                <td className="mono">manual</td>
                <td>
                  You connect the creative to a row by hand in the mapping step.
                </td>
                <td>
                  <span className="badge">manual</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">3 · Recommended file naming</h3>
        <p className="panel-sub">
          Follow this pattern when exporting from your DAM or ad platform. Most
          matching problems disappear.
        </p>
        <div className="diagram" style={{ marginBottom: 12 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
            PATTERN
          </p>
          <p className="mono" style={{ fontSize: 14, color: "var(--text)", margin: "6px 0 0" }}>
            {"{platform}_{campaign}_{adset}_{adname}_{creativeid}_{variant}.ext"}
          </p>
        </div>
        <div className="grid-2">
          <div>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 4px" }}>
              EXAMPLE 1 — META
            </p>
            <p className="mono" style={{ fontSize: 12, margin: 0, wordBreak: "break-all" as const }}>
              meta_ramadan2026_broadaudience_offer1_238472384_staticA.png
            </p>
          </div>
          <div>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 4px" }}>
              EXAMPLE 2 — GOOGLE
            </p>
            <p className="mono" style={{ fontSize: 12, margin: 0, wordBreak: "break-all" as const }}>
              google_pmax_springlaunch_asset983742_squareimage_v1.png
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">4 · Required CSV columns</h3>
        <p className="panel-sub">
          Identifier columns let us link. Metric columns are what we analyse.
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Tier</th>
                <th>Columns</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="badge badge-red">required</span>
                </td>
                <td>
                  <p style={{ margin: 0 }}>
                    <strong>At least one identifier:</strong>{" "}
                    <span className="mono">
                      filename · creative_id · ad_id · asset_id · ad_name ·
                      creative_name
                    </span>
                  </p>
                  <p style={{ margin: "8px 0 0" }}>
                    <strong>Plus all three metrics:</strong>{" "}
                    <span className="mono">impressions · clicks · spend</span>
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge badge-green">recommended</span>
                </td>
                <td
                  className="mono"
                  style={{ fontSize: 12 }}
                >
                  conversions · revenue · date_start · date_end · campaign_name
                  · adset_name · platform · placement
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">5 · Why dataset size matters</h3>
        <p className="panel-sub">
          More creatives → more reliable patterns. Below 30 creatives, treat
          anything you see as a hypothesis, not a finding.
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Creative count</th>
                <th style={{ width: 200 }}>Trust level</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">&lt; 10</td>
                <td>
                  <span className="dot dot-red" />{" "}
                  <span style={{ marginLeft: 6 }}>L0 — Not enough data</span>
                </td>
                <td>
                  Analysis runs, but no statistical claims should be made.
                </td>
              </tr>
              <tr>
                <td className="mono">10 – 29</td>
                <td>
                  <span className="dot dot-amber" />{" "}
                  <span style={{ marginLeft: 6 }}>L1 — Directional only</span>
                </td>
                <td>
                  Patterns are suggestive. Use as inspiration, not evidence.
                </td>
              </tr>
              <tr>
                <td className="mono">30 – 99</td>
                <td>
                  <span className="dot dot-amber" />{" "}
                  <span style={{ marginLeft: 6 }}>
                    L2 — Early pattern detection
                  </span>
                </td>
                <td>
                  Top variables become meaningful. Small subgroups still
                  unreliable.
                </td>
              </tr>
              <tr>
                <td className="mono">100 – 299</td>
                <td>
                  <span className="dot dot-green" />{" "}
                  <span style={{ marginLeft: 6 }}>
                    L3 — Moderate confidence
                  </span>
                </td>
                <td>Most rankings stable. Run hold-outs to confirm.</td>
              </tr>
              <tr>
                <td className="mono">300 +</td>
                <td>
                  <span className="dot dot-green" />{" "}
                  <span style={{ marginLeft: 6 }}>
                    L4 — Stronger confidence
                  </span>
                </td>
                <td>Patterns are robust. Use for production decisions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/setup" className="btn">
          ← Back to setup
        </Link>
        <div className="spacer" />
        <Link href="/upload" className="btn btn-primary">
          I understand, continue to upload →
        </Link>
      </div>
    </div>
  );
}
