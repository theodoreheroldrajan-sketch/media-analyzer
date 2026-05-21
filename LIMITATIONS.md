# Creative Media Analyser: Limitations

Last updated: 2026-05
Audience: anyone considering self-hosting the tool, contributing to it, reviewing the methodology, or assessing whether the outputs are sound enough to act on.

This document lists what the tool cannot do, what it silently does wrong, and what it leaves to the user to handle. The point is honesty, not feature negativity. Most items below are deliberate trade-offs given the self-hosted single-operator design. The document calls out which ones are real concerns at any scale, and which ones become real concerns only if someone forks for multi-tenant use.

The methodology document covers inferential limits (no hypothesis testing in Lite, no multiple-comparison correction in Lite, no interactions in Lite, etc.). This file extends that list with operational, reliability, and product-shape limits surfaced during the 2026-05-15 code audit.

## 1. Methodological (already in the methodology paper)

These exist in production. Cross-reference: `ANALYSIS_METHODOLOGY.md` §4.3.

### No hypothesis testing in Lite production

Lite output is descriptive. Group A's CTR being 20% higher than Group B's is a number, not a test result. The dashboard's "Patterns to investigate" section explicitly flags exploratory findings as hypothesis-generating only.

### Limited multiple-comparison correction in Lite

Fix 5 introduced two corrections: (a) the Pro regression table applies Benjamini-Hochberg FDR to exploratory variables, (b) the variable performance table ranks exploratory rows by noise-adjusted effect size (`|delta| * sqrt(n)`). However, the Lite group-by deltas themselves are still uncorrected point estimates. The bootstrap CIs (Fix 6) on each delta give the user variance, but the family-wise comparison rate is unaddressed in Lite.

Why it matters: with 24 universal variables, multiple enum values each, and 5 metrics, the Lite dashboard makes dozens of implicit comparisons. Some "top findings" are noise.

Design choice: BH-FDR is a Pro-mode feature; Lite stays descriptive by design. The UI directs users to treat Lite deltas as hypothesis-generating only. Open to revisiting if someone with stats expertise argues for FDR correction in Lite too; raise on GitHub.

### No interaction effects in Lite production

Each variable is analysed independently in Lite. Pairs that matter together (e.g. `human_present × urgency_cue`) are invisible. Pro mode's interaction matrix is currently mocked; the production OLS backend with interaction terms is gated on the first real 100+ creative dataset.

### Confidence label ignores impression volume

n=3 creatives delivering 300,000 impressions each are labelled "low confidence". n=10 creatives delivering 1,000 impressions each are labelled "high". The former has more statistical power.

Open: move to a continuous, volume-weighted confidence score. Contribution-friendly.

### Pro statistics in the demo are mocked

The Pro mode regression table, interaction matrices, and insights in `/demo` are deterministic noise added to group-by deltas. Internally consistent but not the output of a real regression. The real OLS backend is gated on the first real 100+ creative dataset; the demo exists so the UI experience is portfolio-visible without API budget exposure.

### Correlation, not causation

Every dashboard output is correlational. The tool generates informed hypotheses for the next brief, not causal claims.

## 2. Reliability gaps (surfaced by 2026-05-15 audit)

### Transitive PostCSS XSS advisory: not exploitable in this deployment

`npm audit` flags two moderate-severity advisories on PostCSS < 8.5.10 (GHSA-qx2v-qp2m-jg93: PostCSS has XSS via unescaped `</style>` in its CSS Stringify Output) reached transitively via Next.js's bundled CSS pipeline.

Why it matters in theory: PostCSS's CSS stringification could mishandle a crafted `</style>` substring and produce output that, if rendered into HTML without sanitisation, creates an XSS vector.

Why it doesn't matter here: PostCSS runs only at build time inside the Vercel build container. It does not run in the request runtime. No user-controlled input flows into PostCSS at any point; the only CSS PostCSS processes is the static `globals.css` and Tailwind generated output, both authored by us. There is no path from a user input to a `</style>`-bearing string reaching PostCSS's stringification stage.

Plan: wait for Next.js to bump its bundled PostCSS version (the fix is already published upstream as postcss@8.5.10+). Forcing the fix today would require `npm audit fix --force`, which proposes a Next.js downgrade to 9.3.x, a breaking change that's refused. Re-run `npm audit` after the next Next.js minor release.

### ~~No retry on transient Anthropic API failures~~ (Resolved)

Resolved in PR #21. `withRetry` with exponential backoff (2 attempts, 1s base) now wraps each per-image Anthropic call. Transient errors (429, 5xx, network timeouts) are retried automatically. A `pMap` concurrency pool (5 workers) prevents rate-limit storms. Client errors (400, 401, 404) still fail immediately.

### No protection against concurrent extraction runs

Two browser tabs triggering `/api/analysis` for the same project simultaneously would both write to `extraction_results` and `analysis_runs` without an advisory lock. Cost duplication is possible.

Why it matters: at single-operator scale, this is unlikely. If anyone forks for multi-tenant or shares an instance with a colleague, it becomes a real cost surprise risk.

Open. A guard refusing a new run if `analysis_runs.status = 'running'` for the project within the last 10 minutes would resolve it. Contribution-friendly.

### No cleanup for stuck extraction runs

If the streaming extraction process is killed mid-batch (Vercel function timeout, server restart, dropped connection), the `analysis_runs` row remains in `status = 'running'` permanently. There is no janitor process. The dashboard may try to read partial `extraction_results`.

Why it matters: the project becomes inoperable from the operator's view; the dashboard shows partial data or refuses to render. Workaround: delete and recreate the project.

Open. A "stuck run" heuristic (`status = 'running' AND started_at < now() - interval '15 minutes' → mark failed`) run either on dashboard load or as a Vercel cron job would resolve it. Contribution-friendly.

## 3. Data integrity gaps

### 10MB image cap is advertised but not enforced server-side

The upload page help text says "10MB each" but no code (client or server) validates file size. Supabase Storage enforces an absolute object size limit, but a 50MB PNG would still consume bandwidth before being rejected upstream.

Why it matters: cost surprise on egress; a careless operator can drive Supabase bills.

Open. Trivial fix: add `if (file.size > 10 * 1024 * 1024) reject` in `src/lib/upload.ts`. Listed for the next maintenance pass.

### No CSV all-zero-row rejection

`src/lib/upload.ts` does not reject rows where every metric column is 0 or null. A header row mistakenly included as data lands in `performance_rows`. The volume-weighted aggregation in `analytics.ts` ignores those rows in group computations, but they still inflate the `creativeCount` sub-score of the trust score.

Why it matters: trust score over-reports creative count. Cosmetic, but it undermines the score's premise.

Open. Trivial fix at parse time. Listed for the next maintenance pass.

### Missing values silently excluded

`src/lib/analytics.ts` drops creatives with a null value for a given variable from that variable's group computation. The dashboard does not surface how many creatives were dropped per variable.

Why it matters: the operator cannot tell whether a variable's group has weak data because of low confidence or because of high missingness.

Open. Adding a `missingCount: number` to the `VariablePerformance` row so the table can show "n=8 (3 with null values)" is the fix. Deferred until someone reports the gap mattering in practice.

### extraction_results.confidence column was never populated

The column existed in the schema as nullable; the analysis route never wrote to it because the Anthropic tool_use API does not return a confidence value. Trust score's `extractionConfidence` sub-score therefore always used the fallback 0.8 (rendered as 80).

Resolved in PR #16 (2026-05-15): the confidence column was dropped along with `notes`, and the trust score was re-weighted to 5 sub-scores. See `docs/build-journey/POST_AUDIT_COMPLETION.md` for the full investigation.

## 4. Access and security

### UUID-based project access

Project IDs are UUIDs stored in localStorage under `media-analyser-project-id`. Anyone with a project UUID can, via the unauthenticated API routes:

- View all of that project's extractions, performance rows, and insights.
- Delete the project and its storage bucket contents.
- Export CSVs.

UUIDs are not guessable in practice (128-bit), but they are not secret in the cryptographic sense. A leaked URL grants destructive access.

Design choice, not a gap. The tool is designed for single-operator self-host where the operator and the only person with the URL are the same. If you self-host and share a project URL with someone, they have full destructive access to that project. This is acceptable for solo use. If multiple people need to share an instance, fork the project and add Supabase Auth + Row Level Security; this is multi-tenant territory and out of scope for this repo.

### No service-role exposure

Service role keys live in `SUPABASE_SERVICE_ROLE_KEY` (env-only, never client-side). The `getServerSupabase()` helper in API routes uses service role server-side; the `getSupabase()` helper for client-side code uses the anon key. No keys are exposed to the browser. Not a gap; listed here so future audits don't re-flag it.

## 5. Product surface gaps

### No real-time platform integration

CSV uploads are the contract. Real-time Meta or Google Ads API integrations are out of scope. Documented in `PRD_v2.md` §8 as a deliberate non-goal.

### Single-snapshot UI

The snapshot data layer preserves historical performance uploads as `is_latest = false` rows, but no UI exists for:

- Browsing past snapshots.
- Comparing two snapshots.
- Rolling back to a previous snapshot.

Open. The data layer is intentionally landed without the UI so the operator can develop a feel for the workflow with multi-snapshot data before the project commits to a UI shape. UI is gated on operator feedback. Contribution-friendly once someone has accumulated real snapshots.

### Mapping ceiling

The fuzzy Levenshtein matching method handles minor filename variation but not creatives renamed entirely between export and upload. Documented in roadmap §5.

### No temporal handling

Date ranges from the CSV are read but seasonality, fatigue, and platform algorithm changes are unmodelled. Planned for v3 once real multi-snapshot data is available to inform the methodological design.

### Accessibility relies on colour

The variable chart uses green/red gradients to indicate good/bad deltas. The CI whiskers use semi-transparent white. The model stability pill (Pro) uses colour alone to differentiate green/yellow/red.

Why it matters: dashboard is hard to interpret without sight.

Open. Adding text labels alongside colour (e.g. "+22% ↑ good") is the fix. Contribution-friendly.

## 6. Scale ceilings

### Vercel Hobby batch ceiling

Streaming AI extraction is practical up to roughly 150 to 200 creatives per run on Vercel Hobby. Above that, batching and resumable runs become necessary. Self-hosters running on their own infrastructure may have different ceilings depending on function timeouts.

### Bootstrap CI compute on large datasets

Fix 6 added 1000-iteration bootstrap CI to every Lite delta. At Pro scale (120 creatives × ~25 variables × ~3 group values × 5 metrics) the total is in the low millions of operations. Fine on modern hardware, but not yet benchmarked under cold start on Vercel. Deferred until real Pro data lands and benchmarking is honest.

### Bootstrap resampling is uniform, not impression-weighted

Currently resamples creative records with uniform probability. A statistically rigorous volume-weighted bootstrap would resample with probability proportional to impressions. Acceptable approximation for the demo; the production OLS backend uses WLS, which supersedes this anyway.

## Reading guide

- Roadmap §5 is the entry-level summary for portfolio readers.
- `ANALYSIS_METHODOLOGY.md` §4.3 is the inferential/methodological list.
- This file is the comprehensive, code-grounded list including operational, reliability, and product-shape gaps surfaced during the 2026-05-15 audit.

When the production OLS backend ships and real data has been through the tool, this document gets re-audited and trimmed. Contributions, corrections, and new findings welcome via GitHub issues.
