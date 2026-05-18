# Post-Audit Instructions for Claude Code

**Source:** Decisions from review conversation between Theo and Claude (chat assistant), grounded in `AUDIT_FINDINGS.md`
**Date:** 2026-05-15
**Scope:** Get the app to a single-user-ready state for one specific external user (Betterhalf-style high-spend operator). Not productizing for many users yet.
**Reader:** Claude Code, with full repo access

---

## 1. Context

The audit (`AUDIT_FINDINGS.md`) found real gaps between the documented state and the actual code. The decisions in this document came from a review conversation working through each finding. This file is the actionable digest — what to do, in what order, with what acceptance criteria.

The product goal at this stage is narrow: one trusted user, one link, real data at scale, no auth, no multi-tenancy. Features that depend on real data or on multi-user scenarios are explicitly deferred and listed in the final section. Do not implement deferred items even if they look easy.

---

## 2. Priority 1 — Investigation (do first, blocks decisions on everything else)

### 2.1 Verify extraction confidence column is being populated

**The issue.** The audit flagged that `extraction_results.confidence` may always be null, with the trust score code falling back to `0.8` (per `e.confidence ?? 0.8` referenced at `route.ts` line 177). If the column is always null, every trust score on the platform has a uniformly-inflated `extractionConfidence` sub-score.

**What to do.**

1. Query the database directly:
   ```sql
   SELECT
     COUNT(*) AS total_rows,
     COUNT(confidence) AS rows_with_confidence,
     AVG(confidence) AS avg_confidence,
     MIN(confidence) AS min_confidence,
     MAX(confidence) AS max_confidence
   FROM extraction_results;
   ```
2. If `rows_with_confidence` is 0, the column is never populated. Examine the extraction code (`src/app/api/analysis/route.ts`) around the tool_use response handling. Identify where confidence *should* be derived from the Claude response and propose either (a) wiring it up properly, or (b) removing the column and the trust-score fallback to make the dashboard honest about what it's measuring.
3. If `rows_with_confidence` is > 0 but values look suspicious (all the same number, all very high/low, etc.), examine those too.
4. Write a short summary of findings to `INVESTIGATION_CONFIDENCE.md` in the repo root before doing any of the work in priority 2.

**Why first.** Until we know the answer, the trust score's reliability is unknown. This investigation is a prerequisite for deciding whether the trust-score code needs additional work beyond Fix 4.

---

## 3. Priority 2 — Code changes (ship these to feature branch)

### 3.1 Amend Fix 3 — make pre-registration persist to the database

**The gap.** The shipped Fix 3 implementation persists hypothesis variables to `localStorage` only. The original spec required a database column. For the real app (which is what gets shipped to the one user), localStorage isn't acceptable — switching browsers or clearing storage loses the user's pre-registration.

**What to do.**

1. Add a Supabase migration to the `projects` table:
   ```sql
   ALTER TABLE projects
   ADD COLUMN pre_registered_variables jsonb NOT NULL DEFAULT '[]'::jsonb;
   ```
2. Regenerate database types: `npx supabase gen types typescript --project-id <id> > src/types/database.ts` (or whatever command the existing tooling uses; check `package.json` scripts).
3. Mirror the hypothesis-toggle UI from the demo's `/demo/variables` page into the real app's `/variables` page (`src/app/(main)/variables/page.tsx`).
4. Update the upload/save flow so when the user toggles hypothesis variables, the selection writes to `projects.pre_registered_variables`.
5. Update the dashboard route (`src/app/api/dashboard/route.ts`) to read pre-registered variables from the projects table instead of from request headers/body assumptions about localStorage state.
6. Keep the localStorage version in the demo path (the demo is supposed to work without a backend; don't break it).

**Acceptance criteria.**
- A user toggles hypothesis variables in the real app, closes the browser, switches to a different browser, opens the project — the toggles persist.
- The dashboard's hypothesis/exploratory partitioning works in the real app, not just the demo.

### 3.2 Amend Fix 5 — apply noise-adjusted ranking to the variable performance table

**The gap.** Fix 5 restructured the insights panel into hypotheses + patterns sections, but the variable performance table below it still shows all 60–80 implicit comparisons ranked by absolute delta. The "data dredging" problem the original fix was supposed to solve still applies to the table.

**What to do.**

1. In `src/components/dashboard/variable-table.tsx`, change the default sort key for exploratory variables from `Math.abs(delta)` to `Math.abs(delta) * Math.sqrt(n)`.
2. Pre-registered variables in the table should sort separately and remain at the top (mirroring the insights panel structure).
3. Add a banner or tooltip above the table that explains exploratory rows are hypothesis-generating, not corrected for multiple comparisons.
4. Confirm the existing column "Sort by confidence" option still works.

**Acceptance criteria.**
- Default table sort reflects noise-adjusted ranking for exploratory rows.
- Pre-registered rows appear above exploratory rows regardless of sort.
- Banner copy is consistent with the insights panel framing ("Patterns to investigate — hypothesis-generating only").

### 3.3 Implement the snapshot data layer (option b from the conversation)

**The gap.** The database has `is_latest` and `snapshot_number` columns on `performance_rows` and `performance_uploads`, but nothing in the app actually uses them. When a user re-uploads a CSV, the analysis mixes both batches together. This will break the one-user use case where multiple CSV uploads over time are part of the value.

**This is the data-layer minimum. The UI for browsing snapshots is deferred (see section 6) until the one user has provided feedback.**

**What to do.**

1. Update the CSV upload route (find it under `src/app/api/upload/` or similar):
   - When a new performance_upload completes successfully, set `is_latest = false` on all existing rows in `performance_uploads` and `performance_rows` for the same project.
   - Set `is_latest = true` on the newly inserted rows.
   - Increment `snapshot_number` for the new batch (find max existing + 1).
2. Update the dashboard API route (`src/app/api/dashboard/route.ts`) and any other analysis routes:
   - Filter `performance_rows` queries by `is_latest = true`.
   - Old snapshots stay in the database (preserved) but are not analyzed by default.
3. Update the export routes (`src/app/api/export/route.ts`) to filter the same way unless an explicit "include all snapshots" flag is set (don't build that flag now; just default to `is_latest = true`).
4. Add a single line to the dashboard UI somewhere unobtrusive (e.g. near the trust score or in the metric switcher area): "Showing snapshot N of M" so the user has a signal of how many uploads exist.

**Acceptance criteria.**
- Uploading CSV #2 to an existing project flips CSV #1's rows to `is_latest = false`.
- Dashboard analysis reflects only the most recent snapshot.
- Old snapshots are preserved in the database (verify with a SQL count before/after upload).
- The "snapshot N of M" indicator displays correctly.

---

## 4. Priority 3 — Documentation updates

### 4.1 Update methodology paper for Fix 4 trust-score formula change

**The gap.** `methodology.pdf` §3.4 documents the trust score as a weighted average. The shipped Fix 4 code uses a floor-gated formula. Doc and code disagree.

**What to do.**

1. In `ANALYSIS_METHODOLOGY.md` (repo root) section 3.4, replace the weighted-average composite description with the new formula:

   ```
   composite = min(creativeCount, mappingQuality, dataCompleteness)
             × (volume × 0.4 + extractionConfidence × 0.3 + bucketBalance × 0.3) / 100
   ```

   Explain in prose: the first three sub-scores are floor conditions — the composite cannot exceed the worst of them. The remaining three contribute proportionally on top. A dataset with mapping quality of 40 cannot score above 40 regardless of other components.

2. Update the methodology PDF (`methodology.pdf`) the same way. If the PDF is generated from a source file (likely `methodology.md` or similar), edit that and regenerate.

3. Add a note in the same section explaining the change: "v2 update (2026-05-15): replaced weighted-average composite with floor-gated formula to ensure floor sub-scores cannot be averaged into a misleadingly good overall score."

4. Also update the documented `analytics.ts` line count in the methodology paper (was 266, now closer to 393 per the audit). Or remove the line count claim entirely — line counts drift constantly and aren't worth maintaining.

### 4.2 Update LIMITATIONS.md with audit-surfaced limitations

**The gap.** The audit surfaced several real production-style limitations that aren't documented anywhere. These need to be in `LIMITATIONS.md` for portfolio honesty, even though they won't be code-fixed for the one-user version.

**What to add to LIMITATIONS.md.**

Add the following to the existing structure (likely under "Remaining limitations: stack and infrastructure" or a new "operational limitations" subsection):

- **No retry on transient Anthropic API failures.** The extraction route wraps each per-image call in a single try/catch with no exponential backoff or per-image retry. A 429 (rate limit), 503 (server overloaded), or transient network error fails the image immediately. The user loses tokens paid for the failed extraction. Workaround: re-run the extraction.
- **No protection against concurrent extraction runs on the same project.** Two browser tabs triggering extraction simultaneously would write to `extraction_results` and update `analysis_runs` without an advisory lock. Cost duplication possible.
- **10MB image cap is advertised but not enforced server-side.** Client-side help text mentions 10MB; no code rejects oversized uploads before they consume bandwidth and storage.
- **UUID-based project access is destructive if a URL is shared.** Anyone with a project UUID can view, export, or delete the project via unauthenticated API routes. UUIDs are not guessable in practice (128-bit), but they're not secret in the cryptographic sense. A leaked URL grants destructive access. Acceptable for single-operator deployment; not acceptable for productization.
- **Missing values silently excluded.** Creatives with a null value on a given variable are dropped from that variable's group computation. The dashboard doesn't surface how many creatives were dropped per variable, so the user can't tell whether a variable's group has weak data because of low confidence or because of high missingness.
- **No cleanup for stuck extraction runs.** If extraction is killed mid-batch (Vercel function timeout, server restart, dropped connection), the `analysis_runs` row remains in `status='running'` permanently. No janitor process exists. Workaround: delete and recreate the project.
- **No CSV all-zero-row rejection.** A header row mistakenly included as data (impressions=0, clicks=0, etc.) lands in `performance_rows` and inflates the `creativeCount` sub-score of the trust score.

For each, follow the existing LIMITATIONS.md format (problem statement, why it matters, planned response or "deferred for productization").

### 4.3 Add longitudinal analysis as v3 future direction

**Context.** The single-user use case will eventually want progression analysis (creative fatigue, seasonal effects, time-series patterns across multiple snapshots). This is intentionally deferred until real multi-snapshot data exists to inform the design, but should be flagged as a planned direction.

**What to do.**

1. In `PRD_v2.md` (or the current PRD), under "Future direction" or equivalent, add:

   > **Longitudinal analysis (v3).** With the snapshot infrastructure in place from v2, the next analytical capability is comparing performance across snapshots over time. Use cases include creative fatigue detection (CTR decay within a campaign run), seasonal effects, pre/post brand campaign comparisons, and platform algorithm shifts. Methodological choices (continuous time variable vs fixed effects per snapshot vs panel data with creative-level random effects) depend on the empirical structure of real multi-snapshot data. Gated on the first real user accumulating 3+ snapshots over a 60-day window.

2. In `LIMITATIONS.md` under "No temporal handling," update the entry to reference the v3 plan:

   > "Date ranges from the CSV are read but seasonality, fatigue, and platform algorithm changes are unmodeled. **Planned for v3** once real multi-snapshot data is available to inform the methodological design (see PRD v2 future direction)."

### 4.4 Update PRD with discovered features not previously documented

**The gap.** The audit found features that exist in the code but aren't mentioned in the PRD. Document them.

**What to add to PRD_v2.md (or wherever the canonical PRD lives).**

Under "Key features (shipped)" or equivalent, add:

- **API usage observability.** The settings page exposes a project-level dashboard of token usage, cost, run count, and last-run timestamp.
- **Edit project metadata.** The settings page provides an edit affordance that returns the user to `/setup` with the existing project context loaded for modification.
- **40+ CSV column aliases auto-mapped.** The CSV parser auto-detects common column-name variants across Meta Ads Manager and Google Ads exports (filename, file_name, creative_filename, image_name, asset_name, impressions, imps, clicks, spend, cost, amount_spent, and ~30 more). Surface the supported aliases on the Instructions page or in a tooltip on the upload page.

---

## 5. Priority 4 — Bundled cleanup PR

These are small, cosmetic, or doc-drift items. Bundle into one cleanup PR when priorities 1-3 are complete and nothing else is pending.

- **SaaS template variable name drift.** `src/lib/variables.ts` has `screenshot_visible`; methodology paper documents it as `screenshot`. Either rename in code (preferred — `screenshot` reads cleaner in dashboards) or update the methodology paper.
- **Missing SaaS variable.** Methodology paper lists `persona_targeted` as part of the SaaS template; it's missing from the code. Add it to the code.
- **Extra SaaS variable.** Code has `integration_mentioned` in the SaaS template; methodology paper doesn't mention it. Either remove from code or add to the paper.
- **Wizard step numbering.** Steps in the real app are numbered 02, 04, 05, 06, 07, 08, 09 — skipping 01 and 03. Re-number to be consecutive (01-08) or give Instructions a number (e.g. 03).
- **"Row hidden from dashboard" partial truth.** Methodology §3.3 says `n<3` rows are hidden. They are hidden from the bar chart but still rendered in the variable performance table with placeholder ("—") values. Update the methodology paper to clarify: "Excluded from charts; shown with placeholder values in the variable table for transparency."
- **Brand-context prompt conditional fields.** Methodology §2 shows GOAL and AUDIENCE as always-present in the extraction prompt. They're actually conditional (only included when non-null). Update the methodology paper to reflect the conditional format.
- **Deprecated `supabase` export.** `src/lib/supabase.ts` line 22 has a `@deprecated` export still present. Confirm no remaining imports, then remove.
- **Streamlit legacy folder.** `legacy/app.py` exists, is unreferenced, and serves only as build-journey context. Decide: delete entirely, or add a `legacy/README.md` noting it's archival only and not part of the current build.

Each of these is a 5-minute change. Don't spread them across multiple PRs.

---

## 6. Explicitly deferred (do NOT implement now)

The following items are real and acknowledged but should NOT be implemented in this round. They are either gated on real data, gated on user feedback, or productization concerns that don't apply to the single-user deployment.

- **Fix 2 (Pro UI plain-English translation).** Requires user-test conversation with the actual Betterhalf-style operator before implementation. Persona description may need updating rather than the UI needing translation. Hold.
- **Production OLS backend.** Gated on first real 100+ creative dataset to inform regularization, weighting, and interaction selection. Pro coefficient table remains mocked until that dataset arrives.
- **Bootstrap CI performance benchmarking.** Performance acceptable in audit visual testing but no formal measurement at 120+ creatives. Benchmark with real data when available.
- **Full snapshot management UI.** Section 3.3 implements only the data-layer fix. The UI for browsing snapshots, switching the current snapshot, comparing two snapshots, and rolling back is deferred until the one user has used the tool with multiple uploads and given feedback on what they actually want.
- **Longitudinal analysis.** Methodological design depends on real multi-snapshot data. Flagged in PRD as v3 direction; do not begin design work.
- **Multi-user authentication.** Not needed for the single-user deployment. Listed in LIMITATIONS for productization context only.
- **Retry logic, concurrency guards, file-size enforcement, partial-extraction cleanup, CSV all-zero rejection.** All acknowledged in LIMITATIONS for honesty. Not code-fixed because they don't apply to a single trusted user with a small data volume. Address only if real usage surfaces actual incidents.
- **Snapshot bootstrap weighting (impression-weighted resampling).** Audit flagged that the current bootstrap CI resamples creatives uniformly rather than by impression weight. Real concern when the production OLS backend ships (WLS is the design); not worth re-implementing for the bootstrap now.
- **Accessibility audit (color reliance).** Real concern for productization. For portfolio + single-user use, document in LIMITATIONS without code changes.

---

## 7. Final sequence

Recommended order of execution, end-to-end:

1. **Investigation** (section 2.1): Confidence column SQL check → `INVESTIGATION_CONFIDENCE.md`
2. **Code changes** (section 3): Fix 3 amendment → Fix 5 amendment → Snapshot data layer
3. **Documentation** (section 4): Methodology update → LIMITATIONS update → PRD update
4. **Cleanup PR** (section 5): One bundled commit with all small items
5. **Stop.** Do not begin deferred items.

When all of the above is complete, the project state will be:
- Single-user deployable
- Real data integrity (re-uploads handled correctly)
- Documentation matches code
- Limitations honestly acknowledged
- Optionality preserved for future work without commitment

Post-implementation, write a brief summary of what was done to `POST_AUDIT_COMPLETION.md` in the repo root so the build journey is preserved.
