"use client";

export default function InstructionsContent() {
  return (
    <>
      <div className="page-head">
        <p className="page-eyebrow">Required reading</p>
        <h1 className="page-title">Data requirements & how to export</h1>
        <p className="page-sub">
          The difference between useful results and noise is in your CSV. Read
          this carefully before requesting a real demo or uploading data — the
          analyser is only as good as the data fed to it.
        </p>
      </div>

      {/* 1. What you need */}
      <div className="panel">
        <h3 className="panel-title">1 · What you need</h3>
        <p className="panel-sub">Two files. Gather both before you begin.</p>
        <div className="grid-2 mt-2">
          <div className="diagram">
            <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
              FILES · IMAGE
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 6px" }}>
              Your ad creative files
            </p>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
              .png .jpg .jpeg — one file per creative variant. Static images
              only in this version. Filenames must contain a match key (creative
              ID, ad name, or similar — see section 4).
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
              source. One row per creative. Must include impressions, clicks,
              spend at minimum.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Export from Meta Ads */}
      <div className="panel">
        <h3 className="panel-title">2 · Export from Meta Ads Manager</h3>
        <p className="panel-sub">For Facebook and Instagram ad accounts.</p>

        <div className="instructions-steps">
          <div className="instructions-step">
            <span className="instructions-step-num mono">01</span>
            <div>
              <p className="instructions-step-title">Open Ads Manager → Ads tab</p>
              <p className="instructions-step-body">
                Make sure you&apos;re viewing at the <strong>Ad level</strong>{" "}
                (not Campaign or Ad Set). Each row should be one ad creative.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">02</span>
            <div>
              <p className="instructions-step-title">Set date range to at least 30 days</p>
              <p className="instructions-step-body">
                Shorter ranges produce unstable performance numbers. 60-90 days
                is ideal for Pro mode regression analysis.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">03</span>
            <div>
              <p className="instructions-step-title">Customise columns</p>
              <p className="instructions-step-body">
                Click <strong>Columns</strong> → <strong>Customise columns</strong>.
                Add the required and recommended fields below.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">04</span>
            <div>
              <p className="instructions-step-title">Export to CSV</p>
              <p className="instructions-step-body">
                Click <strong>Reports</strong> → <strong>Export table data</strong> →
                CSV format. Save to your machine.
              </p>
            </div>
          </div>
        </div>

        <div className="callout mt-3">
          <strong>Required columns:</strong>{" "}
          <span className="mono" style={{ fontSize: 12 }}>
            Ad name, Ad ID, Impressions, Link clicks (or Clicks (all)), Amount spent (GBP/USD/...),
            Results, Purchase ROAS, Purchase conversion value
          </span>
        </div>

        <div className="callout callout-amber mt-2">
          <strong>Recommended (improves analysis):</strong>{" "}
          <span className="mono" style={{ fontSize: 12 }}>
            Frequency, Reach, Cost per result, CTR (link click-through rate),
            CPC (cost per link click), Campaign name, Ad set name, Delivery,
            Placements
          </span>
        </div>
      </div>

      {/* 3. Export from Google Ads */}
      <div className="panel">
        <h3 className="panel-title">3 · Export from Google Ads</h3>
        <p className="panel-sub">For Google Ads, including Performance Max and Display.</p>

        <div className="instructions-steps">
          <div className="instructions-step">
            <span className="instructions-step-num mono">01</span>
            <div>
              <p className="instructions-step-title">Open Reports → Predefined Reports</p>
              <p className="instructions-step-body">
                For standard search/display: <strong>Ad Performance</strong>{" "}
                report. For Performance Max: <strong>Asset Groups</strong> report.
                For YouTube: <strong>Video Performance</strong>.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">02</span>
            <div>
              <p className="instructions-step-title">Set date range</p>
              <p className="instructions-step-body">
                Last 30 days minimum. Use <strong>Day</strong> as the segment
                only if you want time-series data; otherwise leave it off for a
                cleaner per-creative summary.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">03</span>
            <div>
              <p className="instructions-step-title">Customise columns</p>
              <p className="instructions-step-body">
                Click the columns icon and add the fields listed below. Make
                sure you include both the asset/ad identifier AND the
                performance metrics.
              </p>
            </div>
          </div>

          <div className="instructions-step">
            <span className="instructions-step-num mono">04</span>
            <div>
              <p className="instructions-step-title">Download CSV</p>
              <p className="instructions-step-body">
                Click the download icon → <strong>CSV</strong>. Excel-formatted
                CSVs work too but plain CSV is safest.
              </p>
            </div>
          </div>
        </div>

        <div className="callout mt-3">
          <strong>Required columns:</strong>{" "}
          <span className="mono" style={{ fontSize: 12 }}>
            Ad name (or Asset name for PMax), Ad ID (or Asset ID), Impressions,
            Clicks, Cost, Conversions, Conv. value
          </span>
        </div>

        <div className="callout callout-amber mt-2">
          <strong>Recommended (improves analysis):</strong>{" "}
          <span className="mono" style={{ fontSize: 12 }}>
            Campaign, Ad group, CTR, Avg. CPC, Cost / conv., Search impr. share,
            Quality score (for Search), Asset performance label
          </span>
        </div>
      </div>

      {/* 4. Naming convention */}
      <div className="panel">
        <h3 className="panel-title">4 · Creative filename naming convention</h3>
        <p className="panel-sub">
          Filenames are how creatives get matched to performance rows. Good
          naming is non-negotiable.
        </p>

        <div className="callout mt-2">
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Recommended pattern:</p>
          <p className="mono" style={{ fontSize: 13, margin: 0 }}>
            {`{platform}_{campaign}_{adset}_{adname}_{creativeid}_{variant}.ext`}
          </p>
        </div>

        <div className="grid-2 mt-3">
          <div className="diagram">
            <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>Meta example</p>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", margin: 0 }}>
              meta_ramadan2026_broadaudience_offer1_238472384_staticA.png
            </p>
          </div>
          <div className="diagram">
            <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>Google example</p>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", margin: 0 }}>
              google_pmax_springlaunch_asset983742_squareimage_v1.png
            </p>
          </div>
        </div>

        <p className="muted mt-2" style={{ fontSize: 13 }}>
          The matching engine uses a six-method cascade: exact filename match →
          filename minus extension → embedded ad ID → prefix → contains →
          fuzzy Levenshtein. At minimum, your filenames should contain{" "}
          <strong>either</strong> the exact ad name <strong>or</strong> the ad
          ID found in your CSV.
        </p>
      </div>

      {/* 5. Sample CSV */}
      <div className="panel">
        <h3 className="panel-title">5 · What a valid CSV looks like</h3>
        <p className="panel-sub">
          Sample rows showing the minimum required columns plus a few
          recommended fields.
        </p>

        <p style={{ fontSize: 12, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
          Meta Ads Manager export (sample):
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ad name</th>
                <th>Ad ID</th>
                <th>Impressions</th>
                <th>Link clicks</th>
                <th>Amount spent</th>
                <th>Results</th>
                <th>Purchase value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono" style={{ fontSize: 11 }}>meta_summer24_brand_static_001</td>
                <td className="mono" style={{ fontSize: 11 }}>238472384</td>
                <td className="mono" style={{ fontSize: 11 }}>48,231</td>
                <td className="mono" style={{ fontSize: 11 }}>1,124</td>
                <td className="mono" style={{ fontSize: 11 }}>$487.20</td>
                <td className="mono" style={{ fontSize: 11 }}>42</td>
                <td className="mono" style={{ fontSize: 11 }}>$1,890</td>
              </tr>
              <tr>
                <td className="mono" style={{ fontSize: 11 }}>meta_summer24_offer_video_002</td>
                <td className="mono" style={{ fontSize: 11 }}>238472385</td>
                <td className="mono" style={{ fontSize: 11 }}>62,884</td>
                <td className="mono" style={{ fontSize: 11 }}>1,890</td>
                <td className="mono" style={{ fontSize: 11 }}>$612.50</td>
                <td className="mono" style={{ fontSize: 11 }}>71</td>
                <td className="mono" style={{ fontSize: 11 }}>$3,121</td>
              </tr>
              <tr>
                <td className="mono" style={{ fontSize: 11 }}>meta_summer24_lifestyle_003</td>
                <td className="mono" style={{ fontSize: 11 }}>238472386</td>
                <td className="mono" style={{ fontSize: 11 }}>31,442</td>
                <td className="mono" style={{ fontSize: 11 }}>743</td>
                <td className="mono" style={{ fontSize: 11 }}>$304.80</td>
                <td className="mono" style={{ fontSize: 11 }}>28</td>
                <td className="mono" style={{ fontSize: 11 }}>$1,234</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>
          Google Ads export (sample):
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ad name</th>
                <th>Ad ID</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Cost</th>
                <th>Conversions</th>
                <th>Conv. value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono" style={{ fontSize: 11 }}>google_pmax_spring_asset_983742</td>
                <td className="mono" style={{ fontSize: 11 }}>983742</td>
                <td className="mono" style={{ fontSize: 11 }}>22,108</td>
                <td className="mono" style={{ fontSize: 11 }}>512</td>
                <td className="mono" style={{ fontSize: 11 }}>$284.30</td>
                <td className="mono" style={{ fontSize: 11 }}>18</td>
                <td className="mono" style={{ fontSize: 11 }}>$890</td>
              </tr>
              <tr>
                <td className="mono" style={{ fontSize: 11 }}>google_pmax_spring_asset_983743</td>
                <td className="mono" style={{ fontSize: 11 }}>983743</td>
                <td className="mono" style={{ fontSize: 11 }}>34,891</td>
                <td className="mono" style={{ fontSize: 11 }}>891</td>
                <td className="mono" style={{ fontSize: 11 }}>$401.20</td>
                <td className="mono" style={{ fontSize: 11 }}>32</td>
                <td className="mono" style={{ fontSize: 11 }}>$1,602</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Pitfalls */}
      <div className="panel">
        <h3 className="panel-title">6 · Common pitfalls</h3>
        <p className="panel-sub">
          These are the mistakes that cause the most pain when re-running an analysis.
        </p>

        <div className="instructions-pitfall">
          <span className="instructions-pitfall-icon">⚠</span>
          <div>
            <p className="instructions-pitfall-title">Wrong granularity (campaign vs ad level)</p>
            <p className="instructions-pitfall-body">
              Exports at campaign level give one row per campaign — not per
              creative. The analyser cannot link campaign-level rows to
              individual creative images.{" "}
              <strong>Always export at Ad level (Meta) or Ad row (Google).</strong>
            </p>
          </div>
        </div>

        <div className="instructions-pitfall">
          <span className="instructions-pitfall-icon">⚠</span>
          <div>
            <p className="instructions-pitfall-title">Encoding issues (UTF-8 vs UTF-16)</p>
            <p className="instructions-pitfall-body">
              Excel sometimes saves CSVs in UTF-16 with a BOM. The parser
              expects UTF-8. If you see garbled characters in the preview, open
              the CSV in a text editor and re-save as UTF-8.
            </p>
          </div>
        </div>

        <div className="instructions-pitfall">
          <span className="instructions-pitfall-icon">⚠</span>
          <div>
            <p className="instructions-pitfall-title">Date range too short</p>
            <p className="instructions-pitfall-body">
              Less than 30 days produces unstable per-creative metrics — small
              random variations dominate the signal. For Pro mode regression,
              60-90 days is the minimum for stable coefficients.
            </p>
          </div>
        </div>

        <div className="instructions-pitfall">
          <span className="instructions-pitfall-icon">⚠</span>
          <div>
            <p className="instructions-pitfall-title">Same creative across multiple ad sets</p>
            <p className="instructions-pitfall-body">
              If you run the same creative in 3 ad sets, Meta&apos;s export
              gives you 3 rows for that creative. The matcher will pair the
              image with the first row found. Aggregate at the creative level
              first, OR break out the creative file into 3 variants
              (creative_A1.jpg, creative_A2.jpg, creative_A3.jpg).
            </p>
          </div>
        </div>

        <div className="instructions-pitfall">
          <span className="instructions-pitfall-icon">⚠</span>
          <div>
            <p className="instructions-pitfall-title">Missing identifier column</p>
            <p className="instructions-pitfall-body">
              Your CSV must contain <strong>at least one</strong> of: filename,
              creative_id, ad_id, asset_id, ad_name, creative_name. Without an
              identifier, the matcher cannot link anything.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Checklist */}
      <div className="panel">
        <h3 className="panel-title">7 · Pre-upload checklist</h3>
        <p className="panel-sub">Tick all of these before uploading.</p>

        <div className="instructions-checklist mt-2">
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>CSV is exported at <strong>ad level</strong> (not campaign or ad set)</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Date range is at least <strong>30 days</strong> (60-90 for Pro)</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>CSV includes <strong>impressions, clicks, and spend</strong></span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>CSV includes an <strong>identifier column</strong> (ad name, ad ID, asset ID, or creative ID)</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Image filenames contain the same identifier as the CSV</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>One image file per unique creative — no duplicates</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>CSV is saved as UTF-8 (open in a text editor to verify)</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>For ROAS analysis: revenue/purchase value column included</span>
          </label>
        </div>
      </div>
    </>
  );
}
