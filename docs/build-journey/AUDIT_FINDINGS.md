# Audit Findings — Code-Level Review

**Auditor:** Claude Code
**Date:** 2026-05-15
**Codebase commit:** `5579512dd87f02ff57b493415ca92ff7dfd63d54` (branch `feature/review-fixes`)
**Documents reviewed:** `methodology.pdf`, `PRD.pdf`, `roadmap.pdf`, `REVIEW_FIXES.md`, `AUDIT_INSTRUCTIONS.md`
**v2 docs (METHODOLOGY_v2.md, PRD_v2.md, LIMITATIONS.md):** Not present in this workspace — Phase 3 skipped per the audit instructions.

## Summary

Most large-scale claims in the methodology paper, PRD, and roadmap are accurate: the 24 universal variables, 10 category templates, 6-method matching cascade, confidence thresholds, tool name, volume-weighted aggregation, model id, pricing, runtime, and 100-creative threshold all hold up against the code. The audit surfaced one **blocking** issue for Fix 3 (the `pre_registered_variables` JSONB column the spec assumes was never added — current implementation persists only to localStorage, which is fine for the demo but cannot survive in the real app), one **doc drift caused by our own work** (the trust-score formula in the methodology paper now contradicts the gated composite Fix 4 introduced), and a cluster of independent limitations the documents either don't flag or under-state — most importantly, no retry logic for transient Anthropic failures, no server-side enforcement of the 10 MB image cap, and structural infrastructure for performance-row snapshots (`is_latest`, `snapshot_number`) that exists in schema but is never used by analysis.

The 5 implemented fixes can merge to `main` as-is **with one amendment** (Fix 3 needs a schema migration if the real-app behavior is to match the demo).

---

## Critical findings

Findings that affect whether a proposed fix can ship as specified.

### Fix 3 specifies a database column that does not exist

**Claim or assumption:** `REVIEW_FIXES.md` Fix 3 §"Files affected" says: "Database schema: add `pre_registered_variables` JSONB column to the `projects` table, default `[]`" and "Database types regenerated".

**Code reality:** No such column exists. `src/types/database.ts` lines 4–42 (the `projects` table type definition) has: `id, name, brand_name, brand_category, campaign_goal, target_audience, primary_kpi, tone, platform, created_at, updated_at`. The committed Fix 3 implementation (`ab3b485`) skipped the schema work entirely and persists the hypothesis selection in `localStorage` under key `media-analyzer-hypothesis-vars` on the demo's `/variables` page. The real app's `/variables` page (`src/app/(main)/variables/page.tsx`) has no hypothesis UI at all — only the demo flow was updated.

**Why this matters:** For the portfolio demo this is fine (everything runs on localStorage). For the real app, the moment a user clicks "Reset project" or switches browsers, their hypothesis pre-registration is lost — and Fix 3's whole point is to lock in pre-registration *before* analysis. The Pro regression table will still apply BH-FDR (because that's a code-level change), but the partitioning into "Hypotheses tested" vs "Exploratory" cannot persist without a real column.

**Suggested action:** Either (a) add a Supabase migration to `projects` with `pre_registered_variables jsonb not null default '[]'::jsonb`, regenerate types, mirror the hypothesis-toggle UI into the real app's variables page, and have the dashboard route read from the projects table; or (b) explicitly amend Fix 3 to be demo-only and add a note to `LIMITATIONS.md` that real-app pre-registration is not yet wired. Recommend (a) since the migration is one line. Fix 3 cannot ship to production as specified until this lands.

### Trust-score formula in the methodology paper now contradicts the code

**Claim or assumption:** `methodology.pdf` §3.4 documents the composite trust score as a **weighted average** with weights `0.20 / 0.15 / 0.20 / 0.15 / 0.15 / 0.15` summing to 1.

**Code reality:** After Fix 4 (commit `5e5ddcb`), the formula in `src/lib/analytics.ts` lines 256–262 is no longer a weighted average. It is now:

```ts
const floorScore = Math.min(creativeCount, mappingQuality, dataCompleteness);
const upperScore = volumeScore * 0.4 + extractionConfidence * 0.3 + bucketBalance * 0.3;
const overall = Math.round(floorScore * (upperScore / 100));
```

**Why this matters:** This is the only doc-vs-code drift that the audit *created*. The methodology paper is now stale on its core scoring method. Any reader of the methodology paper will compute a different number than the dashboard shows. The paper is described in the PDF as "the canonical reference."

**Suggested action:** When `feature/review-fixes` merges to `main`, update `methodology.pdf` and `ANALYSIS_METHODOLOGY.md` §3.4 to the floor-gated formula. Per the `REVIEW_FIXES.md` coordination notes: "The methodology paper is a release artifact. When fixes land in code, update the paper in the same commit." This commit window has passed; the docs need to follow.

---

## Notable findings

Findings worth amending fixes or docs for, but not blockers.

### Bootstrap CI in Fix 6 is not volume-weighted at the resampling level

**Claim or assumption:** `REVIEW_FIXES.md` Fix 6 §"Bootstrap procedure" says "Use the existing volume-weighted aggregation (sum-of-raws, not mean-of-rates) inside the bootstrap. Don't re-derive it."

**Code reality:** `bootstrapDeltaCI()` in `src/lib/analytics.ts` lines 162–193 calls `getMetricValue()` on each resample, which IS sum-of-raws (volume-weighted aggregation). However, the resampling itself (`resampleWithReplacement`) samples *creative records* with uniform probability — a creative with 100,000 impressions is no more likely to be drawn than one with 100 impressions. The aggregation inside the loop is volume-weighted, but the resampling is not.

**Why this matters:** A statistically rigorous volume-weighted bootstrap would resample with probability proportional to impressions. As implemented, the CI bounds capture variation in *which creatives* are drawn (and their aggregated raw counts), but not the precision difference between high- and low-impression creatives. For most demo use this is acceptable; for production reliability claims, it widens CIs more than necessary on high-volume creatives and tightens them less than warranted on low-volume ones.

**Suggested action:** Document this as a known approximation in the methodology paper (alongside the existing "Pro statistics are mocked" admission). For Pro mode, when the real OLS backend ships, weighted least squares (already designed in methodology §4.3) supersedes this anyway. No code change recommended right now.

### SaaS category template drifts from the methodology paper

**Claim or assumption:** `methodology.pdf` §2 says SaaS adds: `screenshot, feature_highlighted, demo_or_free_trial, social_proof_type, persona_targeted`.

**Code reality:** `src/lib/variables.ts` lines 273–310 contains: `screenshot_visible` (different name from "screenshot"), `feature_highlighted`, `demo_or_free_trial`, `social_proof_type`, `integration_mentioned` (extra). `persona_targeted` is **missing**.

**Why this matters:** A SaaS operator using the tool will not get the persona-targeting axis the methodology paper promises. The methodology paper appears to predate or post-date the code by enough that the SaaS template was edited without updating the paper.

**Suggested action:** Choose a direction. Either add `persona_targeted` to the SaaS template and rename `screenshot_visible` → `screenshot` (one-line edits, no downstream impact); or update the methodology paper to reflect what actually ships. Renaming is preferable since `screenshot` reads cleaner in dashboards.

### "Row hidden from dashboard" is only partially true

**Claim or assumption:** `methodology.pdf` §3.3 confidence-label table says `n < 3` rows have treatment "Row hidden from dashboard."

**Code reality:** This is true only for the bar chart (`src/components/dashboard/variable-chart.tsx` line 37: `.filter((d) => d.confidence !== "insufficient")`) and the variable-explorer mini-stats. In `src/components/dashboard/variable-table.tsx` lines 135–193, insufficient rows are still rendered — the count is shown, but the avg-metric and delta cells display "—" placeholders.

**Why this matters:** A reader who trusts the methodology paper will be surprised to see `n=1` and `n=2` rows in the performance table. This isn't a bug — showing the count with a "—" delta is arguably more honest than hiding the row entirely — but it contradicts the documentation.

**Suggested action:** Update methodology paper §3.3 treatment column to read "Excluded from charts; shown with placeholder values in the detail table for transparency."

### `GOAL` and `AUDIENCE` are conditional in the brand-context prompt, not mandatory

**Claim or assumption:** `methodology.pdf` §2 "Brand context injection" gives the exact format: `Brand: {brand}, Category: {category}, Platform: {platform}, KPI: {kpi}, Goal: {goal}, Audience: {audience}`.

**Code reality:** `src/app/api/analysis/route.ts` lines 186–188 makes `Goal` and `Audience` optional: they're appended only when the project row has non-null values for those fields. The setup form (verified by Agent B) marks both as optional fields.

**Why this matters:** Most readers will assume the prompt always contains the full template, when in practice projects with empty Goal/Audience get a shorter context string. This affects extraction quality reproducibility and the disambiguation claim ("skincare warmth versus fintech minimalism").

**Suggested action:** Update methodology paper §2 to show the conditional version, e.g. `Brand: {brand}, Category: {category}, Platform: {platform}, KPI: {kpi}[, Goal: {goal}][, Audience: {audience}]`. Or change the setup form to require all six fields. Recommend the doc update — Goal/Audience are reasonable to leave optional.

### Snapshot model exists in schema but isn't surfaced in UI or analysis

**Claim or assumption:** `roadmap.pdf` §2.2 documents an "is_latest flag on performance_rows instead of destructive overwrites" with `performance_uploads` as the parent batch — a snapshot model designed for re-imports.

**Code reality:** Both columns exist (`src/types/database.ts` lines 111–181: `is_latest`, `snapshot_number` on `performance_rows`; line 102: `snapshot_number` on `performance_uploads`). However, no UI surfaces snapshot management. The dashboard route doesn't filter by `is_latest`; nor do the export routes. The infrastructure is half-built — columns are set on insert (assumed), but no consumer reads them.

**Why this matters:** This is exactly the "feature in code but undocumented in product surface" pattern the audit instructions §4 calls out. A user re-importing a CSV after edits will produce two batches with no way to roll back, compare, or even know which is "current." The schema implies a feature that the product doesn't deliver.

**Suggested action:** Either (a) surface snapshot management in the settings page (show batches, allow rollback) and filter analysis by `is_latest = true`; or (b) drop the columns and remove the snapshot mention from the roadmap. Without doing one of these, the next reviewer will flag the same gap.

### Wizard step numbering is off

**Claim or assumption:** `PRD.pdf` §6 says "Nine-step wizard: Home, Setup, Instructions, Upload, Mapping, Variables, Analysis, Dashboard, Settings."

**Code reality:** Per Agent B, the rendered step labels in the real app (under `src/app/(main)/`) are: Setup `Step 02`, Instructions (no number, labeled "Required reading"), Upload `Step 04`, Mapping `Step 05`, Variables `Step 06`, Analysis `Step 07`, Dashboard `Step 08`, Settings `Step 09`. Home redirects to `/demo`. Steps 01 and 03 are missing from the numbering.

**Why this matters:** Cosmetic but visible. A user reading "Step 02" first will wonder where step 01 went.

**Suggested action:** Re-number 02 → 01 down the chain so the visible steps are 01–08 (8 steps, since home is a redirect). Or give Instructions a step number (03) and bump the rest. Either fixes the gap.

---

## Minor findings

### Deprecated `supabase` export still present

`src/lib/supabase.ts` line 22: `supabase` is marked `@deprecated` in favor of `getSupabase()`. Still exported. No current code imports it (per Agent C). Safe to remove during the next cleanup pass.

### `analytics.ts` line count differs from methodology claim

`methodology.pdf` §3 says "Source: `src/lib/analytics.ts` (266 lines)." After `feature/review-fixes` the file is **393 lines** (verified via `wc -l`). This is expected drift — the audit fixes added bootstrap CI, BH-FDR, model stability, and noise-adjusted rank helpers. The paper just needs the line count refreshed (or removed) when re-published.

### Anthropic SDK retry behavior is implicit

`src/app/api/analysis/route.ts` lines 283–350 (per Agent B) has a single try/catch per image with no explicit retry. The Anthropic SDK has internal retry on 5xx, but the route doesn't extend or surface that to the user. A 429 or transient 503 will mark the image `failed` immediately. Not flagged in any doc. See "Independent limitations" below — this overlaps with reliability.

---

## Custom-variables-style misses

Features that exist in code but were missed or mis-described by document-only review.

### Snapshot/versioning infrastructure on performance uploads

Already covered under "Notable findings." Repeating here because it's the cleanest example of the audit pattern: schema columns (`is_latest`, `snapshot_number`) imply a feature; product doesn't expose it. The external reviewer working from PDFs would never have seen this.

### `integration_mentioned` SaaS variable

`src/lib/variables.ts` line 273–310 includes a SaaS-template variable `integration_mentioned` that isn't in the methodology paper. The reviewer scanning the PDF would assume the SaaS template was 5 variables; it's 5 variables plus `integration_mentioned`.

### CSV column auto-mapping handles ~40 column-name variants

`src/lib/upload.ts` lines 86–133 has `COLUMN_MAP` with 40+ aliases across Meta Ads Manager and Google Ads exports: `filename`, `file_name`, `creative_filename`, `image_name`, `asset_name`, `impressions`, `imps`, `clicks`, `spend`, `cost`, `amount_spent`, etc. The PRD §6 mentions "auto-detected column mapping" but doesn't list what's mapped. Users running unusual exports won't know whether their column names will work.

**Suggested action:** Surface the supported column-name aliases on the Instructions page or in a tooltip on the upload page.

### Settings page exposes API usage details not in PRD

`src/app/(main)/settings/page.tsx` (per Agent C) shows a project-level API usage dashboard: token usage, cost, run count, last-run timestamp. The PRD §6 lists "Settings with CSV export and project delete" without mentioning the usage display. A reviewer would underrate the operator-facing observability.

### "Edit project" affordance via settings page

The settings page links back to `/setup` with project context loaded, allowing the operator to re-edit project metadata. The PRD doesn't describe this affordance. It's a real feature; the documentation undersells it.

### `ANALYSIS_METHODOLOGY.md` exists in repo root

The methodology paper §7 references this as the longer technical specification. Confirmed present at `C:\Users\My PC\media-analyzer-v2\ANALYSIS_METHODOLOGY.md` (17.6 KB). Per Agent C, it covers sections 1–7 (overview, variables, metrics, matching, analysis engine, Pro thresholds, limitations) but **omits any mention of the snapshot model** that the database schema implements. So the in-repo "canonical" methodology document has the same gap as the PDF on this point.

### Streamlit `legacy/` folder is present and unreferenced

`C:\Users\My PC\media-analyzer-v2\legacy\app.py` (9.6 KB) + `requirements.txt` exist. Zero imports from `src/`. The roadmap §2.1 documents this. Audit confirms: safe to delete if the build-journey narrative no longer needs it, or to add a top-level `README.md` note that it's archival only.

---

## Independent limitations

Limitations discovered without reference to existing documentation.

### No retry on transient Anthropic API failures

`src/app/api/analysis/route.ts` (per Agent B, lines 283–350) wraps each per-image extraction in a single try/catch. A 429 (rate limit), 503 (server overloaded), or transient network error fails the image immediately and the batch continues. There's no exponential backoff, no per-image retry, no batch-level retry option. The Anthropic SDK has internal retry but only for specific status codes and limited attempts.

**Impact:** On a 200-creative batch, even a 1% transient failure rate loses 2 creatives the user paid tokens for. Reruns require uploading new images (no re-extract endpoint per creative visible in the code).

**Suggested action:** Add a 3x retry with exponential backoff for status codes [429, 503, 502, 408] before marking the image failed. Add a "re-extract failed images" button on the analysis page.

### No server-side enforcement of the 10 MB image upload cap

PRD §6 claims "Image upload to Supabase Storage with PNG/JPEG validation and 10 MB cap per file." Agent B confirms: the client-side help text says "10 MB each" but no code (client or server) validates file size. Supabase Storage will reject extreme cases (default object size limit) but a 50 MB PNG would still consume bandwidth before failing.

**Impact:** Cost surprise — Supabase egress is not free. A malicious or careless user could upload large files repeatedly.

**Suggested action:** Add `if (file.size > 10 * 1024 * 1024) reject` in `src/lib/upload.ts` before the storage call, and mirror it server-side on any API route that proxies uploads.

### No schema validation on tool_use response

`src/app/api/analysis/route.ts` (per Agent B, line 140) casts `toolBlock.input` directly to `Record<string, unknown>` without validating against the variable schema. The Anthropic API does enforce the `input_schema` at the model level (forced tool_use rejects malformed outputs upstream), so this is defense-in-depth rather than load-bearing. But if Anthropic ever ships a model that produces a partial response on context window overflow, the database would store an incomplete record without anyone noticing.

**Suggested action:** Add a runtime check before insert that every required schema variable is present in the response. Log and mark `failed` if not.

### No retry / cleanup for partial extraction runs

If the streaming extraction process is killed mid-batch (Vercel function timeout, server restart, dropped connection), the `analysis_runs` row is left in status `running` permanently. There's no janitor process to mark it failed. The next dashboard load may try to read partial extraction_results.

**Impact:** Project becomes inoperable from the user's perspective — the dashboard either shows partial data or refuses to render. The user must manually delete the project to restart.

**Suggested action:** Add a "stuck run" heuristic (`status='running' AND started_at < now() - interval '15 minutes'`) and either a cron job or a check-on-load that marks such runs as `failed`.

### No concurrent-extraction protection

If two browser tabs trigger `/api/analysis` for the same project simultaneously, both write to `extraction_results` and update `analysis_runs` with no advisory lock. The user could pay double for tokens without realizing.

**Impact:** Cost duplication. Data integrity not violated (extraction_results is per-creative), but token bills double.

**Suggested action:** Add a guard at the start of `/api/analysis`: if there is an `analysis_runs` row for this project with `status='running'` and `started_at` within the last 10 minutes, refuse the new run.

### No CSV all-zero-row validation

Per Agent B, `src/lib/upload.ts` does not reject rows where all metric columns are 0. A CSV with a header row mistakenly included as data (impressions=0, clicks=0, etc.) would land in `performance_rows`. The volume-weighted aggregation in `analytics.ts` would silently ignore these rows when their group is computed, but they still inflate the `creativeCount` sub-score of the trust score.

**Impact:** Trust score over-reports creative count. Mostly cosmetic but undermines the score's premise.

**Suggested action:** In `parseCSV` (or before insert), reject rows where every numeric metric column is `0` or `null`. Surface those rejections in the upload UI.

### Authentication / access control gap is documented but its implications are not

`roadmap.pdf` §5 lists "Single-user. No auth, no shared workspaces, no comments." as a known limitation. What's not documented: project IDs are UUIDs stored in `localStorage` under `media-analyser-project-id`. Any visitor who knows or guesses a project UUID can, via the unauthenticated API routes:
- View all of that project's extractions, performance rows, and insights
- Delete the project and its storage bucket contents
- Export CSVs

The roadmap framing ("single-user") suggests this is acceptable because the deployment is single-operator. The implications go beyond that: anyone with a UUID has full destructive access. UUIDs are not guessable in practice, but they're also not secret in the cryptographic sense.

**Impact:** Low in practice (UUIDs are 128-bit), but the design is one URL share away from being a security incident.

**Suggested action:** Either (a) acknowledge the gap explicitly in `LIMITATIONS.md` with this framing; or (b) add Supabase Auth + RLS scoped by user. Recommend (a) for the portfolio piece, (b) when productized.

### No multiple-comparison correction in the Lite variable performance table

Fix 5 restructured the Lite *insights panel* into hypotheses + patterns. But the Lite **variable performance table** (`src/components/dashboard/variable-table.tsx`) still shows all 60–80 implicit comparisons (24+ variables × multiple enum values × 5 metrics) ranked by absolute delta, with no correction. The methodology paper's "No multiple-comparison correction" limitation still applies to this table.

**Impact:** A user scanning the table for "top deltas" can still draw conclusions from noise. The insights panel restructure is necessary but not sufficient.

**Suggested action:** Either apply the same noise-adjusted ranking (`|delta| × sqrt(n)`) to the default sort of the variable table, or add a banner above the table reiterating that table rows are not corrected. The user can already sort by confidence — making that the default sort would help.

### Missing-value handling is documented but applied silently

`src/lib/analytics.ts` lines 250–252: `if (raw === undefined || raw === null) continue;` — creatives with a null value for a given variable are dropped from that variable's group computation. The methodology paper §6 lists this as a limitation. The dashboard doesn't surface *how many* creatives were dropped per variable, so the user can't tell whether a variable's group has weak data because of low confidence or because of high missingness.

**Suggested action:** In `VariablePerformance` rows, add a `missingCount: number` field so the variable table and chart can show "n=8 (3 with null values)" when relevant.

### Accessibility was not directly audited but the dashboard relies heavily on color for meaning

The variable chart uses green/red gradients to indicate good/bad deltas. The CI whiskers use semi-transparent white. The model stability pill uses color alone to differentiate green/yellow/red. Without seeing screen-reader testing, these are likely to be hard to interpret without sight. The methodology paper, PRD, and roadmap don't claim accessibility, but the portfolio context (potential employers viewing) makes this worth flagging.

**Suggested action:** Add text labels alongside color (e.g. "+22% ↑ good" or "+22% ⚠ low confidence"). Pair the model stability pill's color with a label that doesn't depend on color recognition. None of this is blocking; flagged as roadmap-worthy.

---

## Uncertainties

Places where the code is unclear and I wasn't able to determine intent.

### Whether the demo's Pro regression model accounts for the `enabled` flag on variables

The demo's `generateDemoData('pro')` (`src/lib/demo-data.ts`) constructs `regressionModels` for each metric, with coefficients for variables that are tagged in the demo's `DEMO_VARIABLES` list. The user can toggle vars on/off on the `/demo/variables` page, but the regression table on `/demo/dashboard` shows whichever coefficients the demo data was generated with — not a re-run filtered to enabled vars. So Fix 1's model stability indicator updates based on the user's enabled selection, but the regression table itself does not. This may be intentional ("the table shows the model that was fit"), or it may be a missed coupling. Not blocking.

### Whether `confidence` in `extraction_results` is ever populated

The `extraction_results.confidence` column is nullable. Per Agent B, the tool-use response doesn't include a confidence field — the methodology paper doesn't describe how confidence is computed at extraction time. Trust score's `extractionConfidence` sub-score reads from this column with a fallback `e.confidence ?? 0.8` (per Agent B reference to `route.ts` line 177). If the column is always null, the trust score's extractionConfidence is always 80, which would inflate trust scores uniformly. Could not determine without running an actual extraction whether the column is set or always null.

### Whether Fix 6's bootstrap CI has acceptable performance on a 120-creative Pro dataset

I verified visually in the dev server that the dashboard renders without obvious lag. I did not measure compute time. With 120 creatives × ~22 variables × ~3 group values per variable × 1000 bootstrap iterations × 5 metrics, the total operation count is in the low millions — modern hardware should handle it under 200 ms, but Vercel cold starts could push the API response into the >1s range. No benchmark was run.

---

## Verified-as-claimed

Short list. The audit's least interesting section.

- **24 universal variables** (12 boolean, 8 enum, 1 integer, 3 string) — `src/lib/variables.ts:13–219`.
- **10 category templates** (ecommerce, saas, fintech, food_delivery, gaming, dating, education, health_fitness, travel, real_estate) plus generic fallback — `src/lib/variables.ts:224–600`.
- **6-method matching cascade** in documented order (`exact_filename`, `filename_no_ext`, `platform_id`, `prefix`, `contains`, `fuzzy`) — `src/lib/matching.ts:140–259`.
- **Confidence thresholds**: n<3 insufficient, 3–4 low, 5–9 medium, 10+ high — `src/lib/analytics.ts:284–292`.
- **Volume-weighted aggregation** (sum of raw counters then compute) — `src/lib/analytics.ts:220–242` (`getMetricValue`).
- **Tool name** `extract_creative_variables` — `src/app/api/analysis/route.ts:67`.
- **Model id** `claude-haiku-4-5-20241022` — `src/app/api/analysis/route.ts:103`.
- **Haiku 4.5 pricing** ($0.80/M input, $4.00/M output) — `src/app/api/analysis/route.ts:278–280`.
- **Streaming NDJSON over Node.js runtime** (no Edge config, explicit comment about Anthropic SDK incompatibility) — `src/app/api/analysis/route.ts:6–7`.
- **100-creative threshold** at `regressionReady: creativeData.length >= 100` — `src/app/api/dashboard/route.ts:237`.
- **9 database tables** — `src/types/database.ts`.
- **PapaParse** for CSV ingestion with header auto-detection — `src/lib/upload.ts:55–82`.
- **3 CSV export types** (variables, performance, combined) — `src/app/api/export/route.ts`.
- **`ANALYSIS_METHODOLOGY.md` in repo root** — exists (17.6 KB).
- **Legacy Streamlit folder** at `legacy/app.py`, not referenced from `src/`.
- **`.env.local` is gitignored** (`.gitignore` line 35 `.env*.local` pattern); only `.env.local.example` is committed. (Note: an interim audit pass mistakenly flagged this as a critical leak — the verification with `git ls-files` confirms the file is correctly ignored.)
- **Snapshot model schema** (`is_latest`, `snapshot_number` columns on performance_rows and performance_uploads) — present in `src/types/database.ts`. Half-implemented in product surface; see Notable findings.

---

## Recommended sequence

1. **Before merging `feature/review-fixes` to main**: amend Fix 3 with the schema migration or explicitly demo-scope it (see Critical findings). Without this decision, the real app won't deliver Fix 3's promise.
2. **In the same merge or immediately after**: update `methodology.pdf` and `ANALYSIS_METHODOLOGY.md` for the trust-score formula change (Fix 4).
3. **As a follow-up branch** (`audit-fixes-7-and-8`): pick up the Notable findings cluster (SaaS template drift, brand-context conditional, snapshot model decision, wizard numbering). Each is small, none blocks the demo's portfolio value.
4. **As a roadmap addition** to `LIMITATIONS.md`: the independent-limitations list. Most matter only when the product moves beyond single-operator portfolio use, but writing them down keeps the doc honest.
5. **Deferred (out of scope for this audit cycle)**: authentication + RLS, the snapshot UI, retry/cleanup infrastructure. These are productization tasks, not portfolio-demo tasks.

End of findings.
