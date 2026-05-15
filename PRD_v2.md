# Creative Media Analyzer — Product Requirements v2

**Author:** Theo Rajan
**Date:** 2026-05-15
**Status:** Increment to `PRD.pdf` (v1, 2026-05-13). This file captures v2 additions surfaced by the 2026-05-15 code audit. The canonical PRD remains `PRD.pdf`; regenerate the PDF from this file's content when the v2 cycle is closed.

---

## 1. Purpose of this document

The audit (`AUDIT_FINDINGS.md`) and the post-audit decisions (`POST_AUDIT_INSTRUCTIONS.md`) surfaced (a) features that exist in code but were undocumented in `PRD.pdf`, and (b) one v3 forward-looking direction that needs flagging now even though it isn't being built yet. This file captures both.

Everything in `PRD.pdf` v1 remains in force. Read this as additions, not replacements.

---

## 2. Discovered features (already shipped, missing from PRD v1)

These are real capabilities in the codebase that the v1 PRD's "Key features (shipped)" list does not mention. The audit catches them under the "custom-variables-style misses" category — features the documentation-only review couldn't have known about.

### 2.1 API usage observability

The settings page (`src/app/(main)/settings/page.tsx`) renders a project-level dashboard of operational metrics:
- Total input tokens used
- Total output tokens used
- Cumulative API cost (USD, at Haiku 4.5 rates)
- Number of extraction runs
- Timestamp of most recent run

This is useful for the operator to monitor cost-per-project and budget for re-runs. PRD v1 §6 only mentions "Settings with CSV export and project delete" — this dashboard is the missing piece of the description.

### 2.2 Edit project metadata flow

The settings page provides an affordance that returns the operator to `/setup` with the existing project context preloaded, allowing edits to brand, category, KPI, audience, etc. without creating a new project. PRD v1 doesn't describe this — `/setup` is treated as a one-shot wizard step.

### 2.3 40+ CSV column aliases auto-mapped

`src/lib/upload.ts` lines 86–133 contains a `COLUMN_MAP` table that auto-detects ~40 column-name variants across Meta Ads Manager and Google Ads exports. The list covers:

- Filename / asset name aliases: `filename`, `file_name`, `creative_filename`, `image_name`, `asset_name`
- ID aliases: `ad_id`, `creative_id`, `asset_id`, plus their `_id` variants
- Metric aliases: `impressions`, `imps`, `clicks`, `spend`, `cost`, `amount_spent`, `conversions`, `results`, `revenue`, `value`
- Date aliases: `date_start`, `start_date`, `date`, `date_end`, `end_date`
- Context aliases: `campaign_name`, `adset_name`, `ad_group`, `platform`, `placement`

PRD v1 §6 mentions "auto-detected column mapping" but doesn't list what's mapped. The Instructions page should surface this so an operator with an unusual export knows whether their column names will work without manual remapping.

### 2.4 Hypothesis pre-registration (v2 addition)

Added in Fix 3 (commit `ab3b485`) and Fix 3 amendment (commit `3fc07df`). Operators flag up to 5 variables on the `/variables` page as specific hypotheses they're testing. The selection persists to `projects.pre_registered_variables`. The dashboard partitions analysis into "hypotheses tested" (raw p-values) and "exploratory" (BH-FDR adjusted) sections. See methodology paper §5.2 and `ANALYSIS_METHODOLOGY.md` §5.

### 2.5 Snapshot data layer for CSV re-uploads (v2 addition)

Implemented via Phase 2.3 of the post-audit work. Re-uploading a CSV preserves old rows as `is_latest = false`; the dashboard, export, and analysis routes filter to the latest snapshot. The dashboard header shows "Showing snapshot N of M". UI for browsing past snapshots, comparing two snapshots, or rolling back is deferred — see Future direction §3.2.

---

## 3. Future direction

### 3.1 Longitudinal analysis (v3)

With the snapshot infrastructure in place from v2, the next analytical capability is comparing performance across snapshots over time. Use cases:

- **Creative fatigue detection.** CTR decay within a campaign run, or CPA inflation as a creative tires.
- **Seasonal effects.** Holiday creative performance vs. shoulder-season baseline.
- **Pre / post brand campaign comparisons.** Did the brand-awareness campaign measurably shift creative-level performance after it ran?
- **Platform algorithm shifts.** Step-changes in cost-per-result that aren't explained by creative content.

Methodological choices — continuous time variable vs. fixed effects per snapshot vs. panel data with creative-level random effects — depend on the empirical structure of real multi-snapshot data. **Gated on the first real user accumulating 3+ snapshots over a 60-day window.** Do not begin design work without that data.

### 3.2 Snapshot management UI

The data-layer support is in. The UI is intentionally deferred:
- Browse past snapshots (list view per project)
- Compare two snapshots side-by-side on the dashboard
- Roll back to a previous snapshot as the active one
- Mark a specific snapshot as the analysis baseline (independent from "latest")

Gated on operator feedback after they've used the tool with multiple uploads. The current dashboard indicator ("Showing snapshot N of M") is the minimum so the operator knows multiple snapshots exist.

### 3.3 CSV column-alias tooltip (cleanup follow-up)

Surface §2.3's column alias table on the Instructions page or as a tooltip on the upload page. Currently the aliases exist in code but operators don't know what's accepted without trying. Small UX win, listed under the bundled cleanup.

---

## 4. Confirm with Theo (deferred from v1 PRD)

The v1 PRD appendix listed these open questions. Carried forward unchanged:

- Primary persona positioning — Betterhalf.ai-style customer as explicit primary, or one lighthouse example?
- Naming and pricing strategy for Lite versus Pro
- Personal knowledge-base layer — intended scope and rough timeline
- Strategic direction — paid-media focus only, or expand to organic
- Public promotion of the deployment URL

These remain unresolved as of 2026-05-15. The single-user deployment context makes them low-priority for the current cycle.

---

## Reading guide

- `PRD.pdf` v1 — the canonical PRD for v1 features and scope.
- **This file (`PRD_v2.md`)** — v2 additions (discovered features + v3 forward direction).
- `LIMITATIONS.md` — comprehensive limitations register.
- `AUDIT_FINDINGS.md` — the audit that surfaced all the v2 additions.
- `POST_AUDIT_INSTRUCTIONS.md` — the work plan that drove the v2 commits.

When the v2 cycle is closed (operator has run real data, given feedback, and the v3 direction is concrete), regenerate `PRD.pdf` incorporating this file's content.
