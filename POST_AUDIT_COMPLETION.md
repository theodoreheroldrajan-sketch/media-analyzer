# Post-Audit Completion Summary

**Date:** 2026-05-15
**Source:** `POST_AUDIT_INSTRUCTIONS.md` §2–6
**Branch:** `feature/review-fixes` (commits `f1a193c` → `32ac91e`)
**Reader:** Theo, and anyone reviewing the project later who wants to know what landed and what didn't

---

## What was done

### Phase 1 — Investigation (`INVESTIGATION_CONFIDENCE.md`)

SQL probe + code path probe established that `extraction_results.confidence` is never written. The column exists in schema as nullable; the analysis route inserts without it; the Anthropic tool_use API doesn't return a confidence value to set. Every trust-score `extractionConfidence` sub-score has been silently using the fallback `0.8` (rendered as 80). Cosmetic / honesty issue, not functional. Recommendation in `INVESTIGATION_CONFIDENCE.md` is to drop the column + the sub-score (Option A). **Decision deferred per post-audit instructions §2.1 — no code change made in this commit cycle.**

Commit: `f1a193c`.

### Phase 2.1 — Fix 3 amendment (database-backed pre-registration)

Supabase MCP migration `add_pre_registered_variables` applied to project `chemjncvsjlhwtmexhge`:

```sql
ALTER TABLE projects
ADD COLUMN pre_registered_variables jsonb NOT NULL DEFAULT '[]'::jsonb;
```

`src/types/database.ts` updated for the new column on projects.Row/Insert/Update. Real-app `/variables` page (`src/app/(main)/variables/page.tsx`) now renders the hypothesis pre-registration panel and a `+ hyp` toggle per row (max 5). Selection persists to `projects.pre_registered_variables` when the user clicks "Save schema". Dashboard route (`src/app/api/dashboard/route.ts`) reads the array from the project row and exposes it in the response as `hypothesisVariables`. The real-app dashboard page passes it through to `VariableTable` and `InsightsPanel`. Demo flow untouched.

Commit: `3fc07df`.

### Phase 2.2 — Fix 5 amendment (variable performance table)

`src/components/dashboard/variable-table.tsx` accepts optional `hypothesisVariables` prop. When provided:
- Hypothesis rows pin to the top regardless of sort
- They render with a red star marker and tinted background
- The header banner explains the partition

Default delta sort now uses `noiseAdjustedRank()` (`|delta| × √n`) instead of raw absolute delta, closing the data-dredging gap the original Fix 5 only addressed in the insights panel. Demo dashboard now also passes the prop through.

Commit: `d4da4cc`.

### Phase 2.3 — Snapshot data layer

Discovered that most of the work was already done. The upload-csv route correctly flips old `performance_rows.is_latest = false`, computes a new `snapshot_number`, and inserts new rows with `is_latest = true`. Database defaults (`is_latest = true`, `snapshot_number = 1`) verified via `information_schema`. Of the routes reading `performance_rows`, all were already filtering by `is_latest = true` except the "combined" export type (`src/app/api/export/route.ts` line 207). That was fixed.

`performance_uploads` does **not** have an `is_latest` column (audit was slightly off there). Only `snapshot_number` exists. The dashboard route now exposes `currentSnapshot` and `totalSnapshots` in the response; the real-app dashboard page renders "Showing snapshot N of M" near the metric switcher when `totalSnapshots > 0`.

Commit: `b84bda8`.

### Phase 3 — Documentation

**`ANALYSIS_METHODOLOGY.md` §5.2** — replaced the weighted-average composite description with the floor-gated formula introduced in Fix 4. Added a "v2 update (2026-05-15)" note explaining the rationale. Added a note about the confidence-column caveat (`extractionConfidence` sub-score is effectively constant; see `INVESTIGATION_CONFIDENCE.md`).

**`LIMITATIONS.md`** — new file. Comprehensive register of methodological, reliability, data-integrity, security, product-shape, and scale limitations surfaced by the 2026-05-15 audit. Each entry has a "what / why it matters / planned response" structure. Replaces the scattered limitations sections across the three PDFs with a single canonical reference.

**`PRD_v2.md`** — new file. Captures (a) features that exist in code but were missing from PRD v1 (API usage observability, edit-project flow, 40+ CSV column aliases auto-mapped, hypothesis pre-registration, snapshot data layer) and (b) v3 forward direction (longitudinal analysis gated on real multi-snapshot data, full snapshot management UI gated on operator feedback).

**`AUDIT_FINDINGS.md`** — committed in this cycle (it had been written during the audit but not committed at the time).

Commits: `e81b939` (`AUDIT_FINDINGS.md`), `cead507` (the three doc updates).

### Phase 4 — Bundled cleanup

- SaaS category template (`src/lib/variables.ts`): renamed `screenshot_visible` → `screenshot`, added `persona_targeted` enum, removed `integration_mentioned`. Brings code in line with methodology paper §2.
- Wizard renumbering: real-app pages went from 02, 04, 05, 06, 07, 08, 09 (skipping 01 and 03) to consecutive 01–08. Instructions stays without a number ("required reading", not a wizard step the user advances through deliberately).
- Dropped deprecated `supabase` export from `src/lib/supabase.ts`. Verified no remaining imports — everything uses `getSupabase()` for lazy init.
- Updated `ANALYSIS_METHODOLOGY.md` §4.2 confidence-label table to accurately describe `n < 3` treatment ("Excluded from charts; shown with placeholder values in the variable table for transparency" instead of the inaccurate "Results hidden").
- `legacy/README.md`: archival note explaining the Streamlit prototype is preserved for build-journey context, not part of the build.

Commit: `32ac91e`.

---

## What was deferred

Per `POST_AUDIT_INSTRUCTIONS.md` §6, the following were explicitly deferred and **NOT** implemented in this cycle:

- **Fix 2 (Pro UI plain-English translation).** Gated on user-test conversation with the actual Betterhalf-style operator. Persona description may need updating instead of the UI needing translation.
- **Production OLS backend.** Gated on first real 100+ creative dataset.
- **Bootstrap CI performance benchmarking.** Acceptable in visual testing; no formal measurement.
- **Full snapshot management UI** (browse, compare, rollback). Only data-layer landed; UI gated on operator feedback after multi-snapshot usage.
- **Longitudinal analysis.** v3 direction documented in `PRD_v2.md` §3.1; not designed.
- **Multi-user authentication / RLS.** Not needed for single-user deployment; flagged in `LIMITATIONS.md` for productization.
- **Retry logic, concurrency guards, server-side file-size enforcement, partial-extraction cleanup, CSV all-zero rejection.** All acknowledged in `LIMITATIONS.md`. Not code-fixed since the single-operator deployment doesn't surface these incidents at scale.
- **Impression-weighted bootstrap resampling.** Real concern when WLS-based production OLS ships. Not worth re-implementing for the bootstrap CI now.
- **Accessibility audit.** Color-reliance documented in `LIMITATIONS.md` §5. Code changes deferred for productization.

Additionally, **the methodology PDF and PRD PDF are not regenerated in this commit cycle.** External regeneration is out of scope. When the v2 cycle is closed, regenerate:
- `methodology.pdf` from the updated `ANALYSIS_METHODOLOGY.md`
- `PRD.pdf` incorporating `PRD_v2.md` content

The PDFs on Desktop currently reflect v1 state and contradict the in-repo `.md` files on the trust-score formula (and a few smaller items per cleanup §5). Reading order: trust `ANALYSIS_METHODOLOGY.md` and `PRD_v2.md` over the PDFs until the PDFs are regenerated.

---

## New findings during execution

A few things surfaced during execution that weren't in the audit:

1. **`performance_uploads` does not have an `is_latest` column.** Only `snapshot_number` exists. The audit said both. Confirmed via `information_schema`. The current snapshot model uses `is_latest` on `performance_rows` and `snapshot_number` on `performance_uploads` to compute "current". This works but is slightly less symmetric than the audit implied.

2. **Most route-level `is_latest` filtering was already in place.** Only the "combined" export type needed adding. The other routes (`dashboard`, `mapping`, `settings`, the sidebar component, the export "performance" type) all already filtered. The audit said this was missing wholesale; actually it was 90% done.

3. **`extraction_results` has 0 rows in production.** The real backend has never been used with real data. Every dashboard the operator has seen on the production app to date was empty-state. This is consistent with `methodology.pdf` §4 ("Pro statistics in the demo are mocked") and roadmap §3 ("Interactive demo at /demo with Pro/Lite mode chooser"). Worth noting because (a) the confidence-column investigation is therefore code-path only, not data-driven, and (b) the trust-score Fix 4 change has never been exercised against real data either.

---

## Verification

- `npx tsc --noEmit` passes (run after every Phase 2 commit and the cleanup commit).
- `npx next build` passes — all 27 routes generate cleanly.
- Manual sanity check on the demo flow: untouched by these changes; the demo's localStorage-based hypothesis selection still works (verified by re-reading `/demo/variables` page code; not retested in browser this cycle since the changes were narrowly scoped to the real-app flow).
- Branch `feature/review-fixes` is 12 commits ahead of `main`.

---

## Commit log (this cycle)

```
32ac91e Cleanup: SaaS template, wizard renumbering, deprecated export, legacy
e81b939 Add AUDIT_FINDINGS.md (code-level audit, 2026-05-15)
cead507 Docs: methodology trust-score update, create LIMITATIONS + PRD_v2
b84bda8 Snapshot data layer: filter combined-export by is_latest
d4da4cc Fix 5 amendment: noise-adjusted ranking on variable performance table
3fc07df Fix 3 amendment: persist pre-registered variables to projects table
f1a193c Phase 1 investigation: confidence column never written
```

Plus the earlier 6 review-fixes commits (`ffa5d78` → `5579512`).

---

## Next decision point

`feature/review-fixes` is now ready for merge to `main`. Merging triggers a production deploy via Vercel which:
- Updates the live demo at `media-analyzer-theta.vercel.app/demo` (the portfolio iframe target)
- Makes the schema migration's effect visible (real-app `/variables` page gets hypothesis UI, dashboard gets the snapshot indicator)

The migration has already been applied to the production database — that's irreversible for this cycle. The code in main needs to match. Merging is the safer state.

Recommendation: merge.
