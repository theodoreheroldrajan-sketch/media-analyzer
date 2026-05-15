# Creative Media Analyzer — Roadmap (v2)

**Author:** Theo Rajan
**Date:** 2026-05-16
**Status:** Canonical forward-looking document. Supersedes roadmap.pdf v1 for sections 3 onward; v1 build-journey content (section 4 below) is preserved as historical record.
**Deployment:** https://media-analyzer-theta.vercel.app
**Repository:** github.com/theodoreheroldrajan-sketch/media-analyzer
**Supersedes:** roadmap.pdf v1 (2026-05-13)

---

## 1. Purpose of this document

This is the single forward-looking source of truth for the project. Every item the team has discussed but deferred lives here, organized by *what's blocking it from shipping now*. The structure exists to make the answer to "what should I work on next?" obvious.

Three companion documents remain canonical for their respective scopes:

- `methodology.pdf` / `ANALYSIS_METHODOLOGY.md` — how the math works
- `PRD_v2.md` — what the product is and for whom
- `LIMITATIONS.md` — honest accounting of what the tool cannot do (design choices, methodological limits, stack constraints)

This roadmap does not duplicate them. It points to them where relevant.

---

## 2. Current state

**Deployment.** Production at `media-analyzer-theta.vercel.app`. Root URL redirects to `/demo`. Real-app pages reachable by direct URL for the operator. Portfolio embedding via iframe from `portfolio-website-zeta-one-76.vercel.app/analyser`.

**Architecture.**

- Next.js 16.2.6 (App Router, Turbopack) on Vercel Hobby
- TypeScript 5.9.3, React 19.2.4, Tailwind 4
- Supabase Postgres (eu-west-2) with 9 tables and a creatives storage bucket
- Claude Haiku 4.5 (`claude-haiku-4-5-20241022`) via Anthropic SDK with forced tool_use
- Streaming NDJSON over Node.js runtime
- GitHub Actions CI gating every PR to main (tsc, eslint, next build)

**Codebase health (as of this writing).** TypeScript clean. ESLint clean (zero errors, zero warnings). All findings from feature audit and code hygiene audit either shipped or deliberately deferred with documentation. CI workflow gating against regressions.

---

## 3. What's now shipped (post-v1)

Items that landed since the roadmap v1 was written, in rough chronological order:

**Review fixes (REVIEW_FIXES.md, six items).**

- Fix 1 — Model stability indicator (green/yellow/red traffic light for N/predictor ratio in Pro mode)
- Fix 3 — Pre-registration of hypothesis variables (database-backed, real app + demo)
- Fix 4 — Gated trust score (floor sub-scores cannot be averaged into a misleadingly good composite); since reduced to 5 sub-scores after `confidence` column was dropped
- Fix 5 — "Patterns to investigate" framing replaces "Top findings"; noise-adjusted ranking on both insights panel and variable performance table
- Fix 6 — Bootstrap 95% confidence intervals on every Lite delta, displayed as error bars and numeric ranges
- Fix 2 — Deferred pending user test (see section 6.2)

**Post-audit work.**

- Snapshot data layer: dashboard filters by `is_latest = true`, upload route flips flags correctly, re-uploads handled without mixing data
- "Showing snapshot N of M" indicator on dashboard
- Trust score formula updated in methodology paper and `ANALYSIS_METHODOLOGY.md` to match shipped code
- LIMITATIONS.md expanded with audit-surfaced operational gaps
- Confidence column investigation documented in `INVESTIGATION_CONFIDENCE.md`

**Audit cycle 1 (feature/correctness).** Two reviews — external (chat-based, documentation-only) and internal (Claude Code, code-grounded). Findings consolidated in `AUDIT_FINDINGS.md` and addressed via `POST_AUDIT_INSTRUCTIONS.md`.

**Audit cycle 2 (code hygiene).** First hygiene audit. Findings in `CODE_HYGIENE_FINDINGS_2026-05-15.md`. Cleanup PRs:

- PR #16: app-shell deletion, README model name, `notes` column drop, unused exports, magic-number extraction, env-var assertion fix, eslint config — 8 findings addressed
- PR #17: React 19 effect refactor (`useSyncExternalStore` for localStorage contexts), patch bumps, Prettier toolchain, editor config, GitHub Actions CI workflow — 5 findings addressed

---

## 4. Build journey (preserved from v1)

This section is historical and unchanged from the v1 roadmap. It documents how the project was built, not where it's going. The forward-looking content is in sections 5 onward.

**Streamlit prototype (April 22-23, 2026).** Five commits. Single-page Streamlit app proving Claude vision with tool_use could replace manual creative tagging. Preserved in `legacy/` as reference.

**Next.js shell and Supabase foundation (May 11).** Pivot to Next.js 16 App Router with sidebar-based nine-step stepper. Supabase project, nine-table schema with snapshot model on `performance_rows`.

**Wizard steps 1-8 (May 11-12).** Eight PRs in roughly 24 hours, one per step.

**Interactive demo (May 13).** `/demo` route with deterministically-generated fake creatives, componentized dashboard, Pro/Lite mode split, inline SVG chart types.

**Access control lockdown (May 13).** Root redirects to demo; real-app pages reachable by direct URL only.

**Portfolio documentation set (May 13).** PRD, methodology, roadmap PDFs written and embedded on portfolio site.

**Review and audit cycles (May 14-16).** Two audits, six review fixes, two cleanup PRs. State documented in this roadmap.

---

## 5. What's next — overview

Pending work falls into four categories distinguished by *what's blocking it*. The categories matter because they imply different conditions for unblocking:

- **Engineering hygiene** — ship when convenient. No external dependency.
- **Waiting for the first real user** — gated on the Betterhalf-style operator actually using the tool and providing feedback.
- **Waiting for real data at scale** — gated on the first 100-plus creative real dataset arriving.
- **Productization-only** — only matters if the project moves beyond single-user. Each item is documented; none ships in current scope.

A documentation maintenance task is also pending and is described at the end.

---

## 6. Pending work, by blocker

### 6.1 Engineering hygiene (ship when convenient)

No external dependency. These are quality-of-life improvements the team can tackle whenever there's time.

**Major package bumps.** Three packages are multiple major versions behind:

- `@types/node` 20 → 25 (Node 22 LTS now widespread)
- `eslint` 9 → 10
- `typescript` 5 → 6

Each needs its own scoped PR with breaking-change review. Do not batch.

**Mass Prettier reformat.** Prettier toolchain is installed (PR #17) but the codebase hasn't been reformatted. Running `npm run format` will produce a large diff. Worth doing as a standalone PR with no other changes mixed in, so the reformat noise doesn't obscure substantive changes in code review.

**React 19 rule semantics follow-up.** The `react-hooks/set-state-in-effect` rule is new in React 19. Several `eslint-disable-next-line` comments were added in PR #17 where the effect pattern was correct but the rule could not detect that. When the rule stabilizes (in a future React 19 minor release), revisit those sites and remove the disables if the rule can now distinguish "setState inside awaited callback" from genuine problems.

**M3 empty catch blocks.** Five `try { ... } catch (e) {}` blocks across `analysis/page.tsx`, `settings/page.tsx`, and `variables/page.tsx`. All have inline comments documenting the silent-fail pattern as intentional. Not a finding to fix; flagged here only so future audits know they've been considered.

### 6.2 Waiting for the first real user

These items are gated on the Betterhalf-style operator using the tool with a real dataset at scale. Building them on assumptions before that conversation risks shipping the wrong design.

**Full snapshot UI.** Data-layer shipped; UI deferred. When real, the user will have re-uploaded CSVs and will want to see history. The minimum extension is a "Recent uploads" list on the settings page showing date, row count, and a current-badge on the latest. Bigger extensions — switching the current snapshot, comparing two snapshots, deleting old ones — depend on what the user actually asks for. Don't pre-build.

**Fix 2 — Pro UI translation OR persona description correction.** Persona in PRD says "comfortable in ad platforms but not Python or R." Pro insights panel references coefficients and p-values inline. The user-test conversation resolves this: if they read coefficients comfortably, the persona description is wrong (update PRD); if they don't, the Pro UI needs plain-English translation. The translation patterns are specified in `REVIEW_FIXES.md` Fix 2 if needed.

**AI insights narration design.** Depends on the outcome of Fix 2. If translation is the path, this is where the narration patterns get implemented. If persona update is the path, narration becomes optional polish.

**Bootstrap CI performance benchmark.** Bootstrap is computationally trivial on Lite-scale datasets but has not been measured on a real 120+ creative dataset on Vercel Hobby. Benchmark with real data when available; tune iteration count or move computation client-side only if latency becomes user-visible.

### 6.3 Waiting for real data at scale

These items are gated on the first 100-plus creative real dataset arriving. Methodological choices depend on the empirical structure of real ad-performance data, not synthesized data.

**Production OLS backend.** Pro coefficient table remains mocked. Real backend builds against the first real dataset, with empirical decisions on regularization, impression weighting (count vs sqrt), and interaction selection threshold. Specification in `METHODOLOGY_v2.md` section 4 is the design contract.

**Personal knowledge-base layer.** Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes get injected into extraction prompts so repeated campaigns inherit context. Designing this well needs to see what real campaign continuity looks like — does the operator run distinctly different concepts across campaigns, or iterate on a stable visual direction? The answer determines what context is worth persisting.

**Longitudinal / temporal analysis (v3 direction).** Cross-snapshot analysis — creative fatigue, seasonality, pre/post brand campaigns, platform algorithm shifts. Methodological choices (time as continuous variable, fixed effects per snapshot, panel data with creative-level random effects) depend on what real multi-snapshot data looks like. Gated on the first real user accumulating 3+ snapshots over a 60-day window.

### 6.4 Productization-only

These only matter if the project moves beyond single-user deployment to a productized offering. Documented for completeness; none should ship in current scope.

**Authentication and authorization.** Currently UUID-based access — anyone with a project URL has full destructive permissions. A productized version needs proper auth (Supabase Auth, RLS policies, role-based permissions).

**Multi-user collaboration.** Shared workspaces, comments, audit trails, role-based access.

**Video creatives.** Frame extraction, motion variables, audio extraction. Hybrid pathway with marketer-input variables for things AI can't see (talent identity, music choice, production type). Probably v3 or later.

**Real-time platform API integration.** Replaces CSV uploads with direct Meta/Google API integration. Requires credential management beyond current scope.

**Advanced modeling.** Mixed-effects models for campaign-nested data. Bayesian regression for small-sample uncertainty. Tree-based methods (random forests, gradient boosting) with SHAP for interpretability. Only worth building if real data justifies the complexity.

**Operational hardening.** Retry logic for transient Anthropic API failures. Concurrency guards for simultaneous extraction runs. Cleanup for stuck or partial extractions. Server-side enforcement of the 10MB file cap. CSV all-zero-row validation. Each is small in isolation; together they constitute the operational baseline for multi-user production.

**Resumable extraction.** Current practical batch ceiling is ~150-200 creatives per run on Vercel Hobby. Batching and resumable runs become necessary above that.

**Accessibility audit.** Current dashboard relies on color heavily (traffic-light indicators, sub-score bars). Productization for diverse audiences needs a proper accessibility pass.

---

## 7. Documentation maintenance

**Regenerate the PDFs.** The methodology, PRD, and roadmap markdown sources have been updated multiple times across the recent work cycles. The deployed PDFs on the portfolio site are stale. The script `scripts/build_portfolio_docs.py` regenerates them. Run after any source markdown change that affects published content.

When this roadmap (v2) is finalized, regenerate `methodology.pdf`, `PRD.pdf`, and add `roadmap.pdf` v2 alongside the others.

---

## 8. Pointers to canonical references

For specific topics, the source-of-truth document is:

- **What the tool does** → `PRD_v2.md`
- **How the math works** → `methodology.pdf` / `ANALYSIS_METHODOLOGY.md`
- **What the tool can't do** → `LIMITATIONS.md`
- **How fixes were specified** → `REVIEW_FIXES.md`
- **Findings from feature audit** → `AUDIT_FINDINGS.md`
- **Post-audit work performed** → `POST_AUDIT_COMPLETION.md`
- **Confidence column investigation** → `INVESTIGATION_CONFIDENCE.md`
- **Findings from code hygiene audit** → `CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md` (latest dated file)
- **How to run audits** → `AUDIT_INSTRUCTIONS.md`, `CODE_HYGIENE_AUDIT.md`
- **Original build journey** → roadmap.pdf v1 + section 4 above

If a topic isn't covered by any of these, this roadmap is the residual reference.

---

## 9. Open strategic questions

Decisions deferred until there's evidence to resolve them, not until "later." Listed so future-Theo doesn't forget they're open.

- **Productize or keep as a personal tool.** The architecture supports either. Productization needs auth, billing, and a support story. Personal-tool use needs only the current shape. Decision depends on how the Betterhalf engagement plays out.
- **Paid media vs social.** Current functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema. Both remain open.
- **Pricing model if productized.** Subscription tiered on Lite/Pro? Single price? Per-creative usage? Per-seat? Decision not load-bearing until productization itself is committed.
- **Lighthouse customer commitment.** The Betterhalf-style operator is the intended Pro validation case. Whether to formally commit them as the gating event for the production OLS backend or leave it open.
- **Hybrid manual-input variables for video and image.** Custom variables exist but route through Claude vision. A future architecture extension would let users mark a variable as human-tagged (filled in by the marketer rather than extracted by AI). Useful for video where vision extraction is unreliable, and for image variables AI can't see (talent identity, designer, internal A/B labels). Not committed.

---

## 10. Appendix: Confirm with Theo

Items the team should resolve when ready:

- Whether the live deployment URL should be promoted publicly or kept for portfolio-share-only viewing.
- Personal knowledge-base layer — preferred scope and timing relative to production regression backend.
- Whether the Pro/Lite split should be carried over to a future subscription model and what naming/pricing would look like.
- Whether to commit the Betterhalf engagement as the explicit gating event for production OLS, or leave it open.
- Whether the `legacy/` folder (Streamlit prototype) should be removed before the next public-facing iteration or retained as build-journey context.
- Whether `INVESTIGATION_CONFIDENCE.md` should be merged into `POST_AUDIT_COMPLETION.md` now that the confidence column has been dropped, or kept as a standalone artifact.
