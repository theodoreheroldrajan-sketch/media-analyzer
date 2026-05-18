# Creative Media Analyser: Roadmap

Author: Theo Rajan
Date: 2026-05
Status: v2.1. Canonical forward-looking document. Supersedes v2 (2026-05-16) for sections 3 onward; v1 build-journey content (section 4) is preserved as historical record. Updated for open-source repositioning.
Repository: github.com/theodoreheroldrajan-sketch/media-analyzer
License: MIT

## 1. Purpose of this document

This is the single forward-looking source of truth for the project. Every item that has been discussed but deferred lives here, organised by what's blocking it from shipping now. The structure exists to make the answer to "what should I work on next?" obvious. Anyone reading the roadmap with an eye to contributing should be able to find an area where help would be useful within 30 seconds.

The roadmap is for this self-hosted single-operator codebase. Multi-tenant productisation is intentionally out of scope; see §6.4.

Three companion documents remain canonical for their respective scopes:

- `ANALYSIS_METHODOLOGY.md`: how the math works.
- `PRD_v2.md`: what the product is and for whom.
- `LIMITATIONS.md`: honest accounting of what the tool cannot do (design choices, methodological limits, stack constraints).

This roadmap does not duplicate them. It points to them where relevant.

## 2. Current state

**Deployment.** Deployed to Vercel Hobby. Root URL redirects to `/demo`; real-app pages reachable by direct URL for the operator. Portfolio embedding via iframe from `portfolio-website-zeta-one-76.vercel.app/analyser`.

**Architecture.**

- Next.js 16.2.6 (App Router, Turbopack) on Vercel Hobby.
- TypeScript 5.9.3, React 19.2.4, Tailwind 4.
- Supabase Postgres (eu-west-2) with 9 tables and a `creatives` storage bucket.
- Claude Haiku 4.5 (`claude-haiku-4-5-20241022`) via Anthropic SDK with forced tool_use.
- Streaming NDJSON over Node.js runtime.
- GitHub Actions CI gating every PR to main (tsc, eslint, next build).

**Codebase health.** TypeScript clean. ESLint clean (zero errors, zero warnings). All findings from feature audit and code hygiene audit either shipped or deliberately deferred with documentation. CI workflow gating against regressions.

**Licensing and access.** Open source under MIT. Single-operator self-host model with UUID-based access. Anyone can clone, fork, or run their own instance.

## 3. What's now shipped (post-v1)

Items that landed since the roadmap v1 was written, in rough chronological order:

**Review fixes** (`docs/build-journey/REVIEW_FIXES.md`, six items):

- Fix 1: Model stability indicator (green/yellow/red traffic light for N/predictor ratio in Pro mode).
- Fix 3: Pre-registration of hypothesis variables (database-backed, real app + demo).
- Fix 4: Gated trust score (floor sub-scores cannot be averaged into a misleadingly good composite); since reduced to 5 sub-scores after confidence column was dropped.
- Fix 5: "Patterns to investigate" framing replaces "Top findings"; noise-adjusted ranking on both insights panel and variable performance table.
- Fix 6: Bootstrap 95% confidence intervals on every Lite delta, displayed as error bars and numeric ranges.
- Fix 2: Deferred pending user test (see §6.2).

**Post-audit work.**

- Snapshot data layer: dashboard filters by `is_latest = true`, upload route flips flags correctly, re-uploads handled without mixing data.
- "Showing snapshot N of M" indicator on dashboard.
- Trust score formula updated in methodology paper and `ANALYSIS_METHODOLOGY.md` to match shipped code.
- `LIMITATIONS.md` expanded with audit-surfaced operational gaps.
- Confidence column investigation documented in `docs/build-journey/POST_AUDIT_COMPLETION.md` (appendix); column subsequently dropped in PR #16.

**Audit cycle 1 (feature/correctness).** Two reviews: external (chat-based, documentation-only) and internal (Claude Code, code-grounded). Findings consolidated in `docs/build-journey/AUDIT_FINDINGS.md` and addressed via `docs/build-journey/POST_AUDIT_INSTRUCTIONS.md`.

**Audit cycle 2 (code hygiene).** First hygiene audit. Findings in `docs/build-journey/CODE_HYGIENE_FINDINGS_2026-05-15.md`. Cleanup PRs:

- PR #16: app-shell deletion, README model name, notes column drop, unused exports, magic-number extraction, env-var assertion fix, eslint config (8 findings addressed).
- PR #17: React 19 effect refactor (useSyncExternalStore for localStorage contexts), patch bumps, Prettier toolchain, editor config, GitHub Actions CI workflow (5 findings addressed).

**Open-source repositioning** (in progress at time of writing).

- LICENSE (MIT), README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT files.
- `.env.example`, `docs/self-hosting.md`, schema export.
- Deploy-to-Vercel button.
- PRD, LIMITATIONS, Methodology, and this roadmap reframed for open-source / public-iteration posture.
- Build journey audit files moved to `docs/build-journey/`.

## 4. Build journey (preserved from v1)

This section is historical and unchanged. It documents how the project was built, not where it's going. The forward-looking content is in sections 5 onward.

**Streamlit prototype (April 22 to 23, 2026).** Five commits. Single-page Streamlit app proving Claude vision with tool_use could replace manual creative tagging. Preserved in `legacy/` as reference.

**Next.js shell and Supabase foundation (May 11).** Pivot to Next.js 16 App Router with sidebar-based nine-step stepper. Supabase project, nine-table schema with snapshot model on `performance_rows`.

**Wizard steps 1 to 8 (May 11 to 12).** Eight PRs in roughly 24 hours, one per step.

**Interactive demo (May 13).** `/demo` route with deterministically-generated fake creatives, componentized dashboard, Pro/Lite mode split, inline SVG chart types.

**Access control lockdown (May 13).** Root redirects to demo; real-app pages reachable by direct URL only.

**Portfolio documentation set (May 13).** PRD, methodology, roadmap PDFs written and embedded on portfolio site.

**Review and audit cycles (May 14 to 16).** Two audits, six review fixes, two cleanup PRs. State documented in this roadmap.

**Open-source repositioning (May 16+).** Repo restructure: LICENSE, README, CONTRIBUTING, self-hosting docs. Doc framing edits. Build-journey artefacts moved under `docs/`. See `OPEN_SOURCE_RESTRUCTURE.md` for the brief that drove this.

## 5. What's next: overview

Pending work falls into four categories distinguished by what's blocking it. The categories imply different conditions for unblocking:

- **Engineering hygiene.** Ship when convenient. No external dependency. Contribution-friendly.
- **Waiting for the first real user.** Gated on the first real operator actually using the tool with real data and providing feedback.
- **Waiting for real data at scale.** Gated on the first 100+ creative real dataset arriving.
- **Multi-tenant fork territory.** Only matters if someone wants to take the codebase and turn it into a multi-user product. Documented for completeness; none of these ship on this repo.

A documentation maintenance task is also pending and is described at the end.

## 6. Pending work, by blocker

### 6.1 Engineering hygiene (ship when convenient)

No external dependency. These are quality-of-life improvements anyone can tackle whenever there's time. Contribution-friendly across the board.

**Major package bumps.** Three packages are multiple major versions behind:

- `@types/node` 20 → 25 (Node 22 LTS now widespread).
- `eslint` 9 → 10.
- `typescript` 5 → 6.

Each needs its own scoped PR with breaking-change review. Do not batch.

**Mass Prettier reformat.** Prettier toolchain is installed (PR #17) but the codebase has not been reformatted. Running `npm run format` will produce a large diff. Worth doing as a standalone PR with no other changes mixed in, so the reformat noise does not obscure substantive changes in code review.

**React 19 rule semantics follow-up.** The `react-hooks/set-state-in-effect` rule is new in React 19. Several `eslint-disable-next-line` comments were added in PR #17 where the effect pattern was correct but the rule could not detect that. When the rule stabilises (in a future React 19 minor release), revisit those sites and remove the disables if the rule can now distinguish "setState inside awaited callback" from genuine problems.

**M3 empty catch blocks.** Five `try { ... } catch (e) {}` blocks across `analysis/page.tsx`, `settings/page.tsx`, and `variables/page.tsx`. All have inline comments documenting the silent-fail pattern as intentional. Not a finding to fix; flagged here only so future audits know they have been considered.

### 6.2 Waiting for the first real user

These items are gated on the first real operator using the tool with a real dataset and providing feedback. Building them on assumptions before that conversation risks shipping the wrong design.

**Full snapshot UI.** Data-layer shipped; UI deferred. When there is a real user, they will have re-uploaded CSVs and will want to see history. The minimum extension is a "Recent uploads" list on the settings page showing date, row count, and a current-badge on the latest. Bigger extensions (switching the current snapshot, comparing two snapshots, deleting old ones) depend on what the user actually asks for. Don't pre-build.

**Fix 2: Pro UI translation OR persona description correction.** Persona in PRD says "comfortable in ad platforms but not Python or R." Pro insights panel references coefficients and p-values inline. The user-test conversation resolves this: if they read coefficients comfortably, the persona description is wrong (update PRD); if they don't, the Pro UI needs plain-English translation. The translation patterns are specified in `docs/build-journey/REVIEW_FIXES.md` Fix 2 if needed.

**AI insights narration design.** Depends on the outcome of Fix 2. If translation is the path, this is where the narration patterns get implemented. If persona update is the path, narration becomes optional polish.

**Bootstrap CI performance benchmark.** Bootstrap is computationally trivial on Lite-scale datasets but has not been measured on a real 120+ creative dataset on Vercel Hobby. Benchmark with real data when available; tune iteration count or move computation client-side only if latency becomes user-visible.

### 6.3 Waiting for real data at scale

These items are gated on the first 100+ creative real dataset arriving. Methodological choices depend on the empirical structure of real ad-performance data, not synthesised data. If you have a real dataset and would consider sharing it (anonymised), see §13 of `PRD_v2.md`.

**Production OLS backend.** Pro coefficient table remains mocked. Real backend builds against the first real dataset, with empirical decisions on regularisation, impression weighting (count vs sqrt), and interaction selection threshold. Specification in `ANALYSIS_METHODOLOGY.md` §6 is the design contract.

**Personal knowledge-base layer.** Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes get injected into extraction prompts so repeated campaigns inherit context. Designing this well needs to see what real campaign continuity looks like: does the operator run distinctly different concepts across campaigns, or iterate on a stable visual direction? The answer determines what context is worth persisting.

**Longitudinal / temporal analysis (v3 direction).** Cross-snapshot analysis: creative fatigue, seasonality, pre/post brand campaigns, platform algorithm shifts. Methodological choices (time as continuous variable, fixed effects per snapshot, panel data with creative-level random effects) depend on what real multi-snapshot data looks like. Gated on the first real user accumulating 3+ snapshots over a 60-day window.

### 6.4 Multi-tenant fork territory

These only matter if someone wants to take the codebase beyond single-operator self-host into a multi-user product. Documented for completeness; none of these ship on this repo. If you fork to build a multi-tenant version, this is what you'd need to add.

**Authentication and authorisation.** Currently UUID-based access. Anyone with a project URL has full destructive permissions. A multi-tenant version needs proper auth (Supabase Auth, RLS policies, role-based permissions).

**Multi-user collaboration.** Shared workspaces, comments, audit trails, role-based access.

**Video creatives.** Frame extraction, motion variables, audio extraction. Hybrid pathway with marketer-input variables for things AI cannot see (talent identity, music choice, production type). Probably v3 or later if anyone tackles it.

**Real-time platform API integration.** Replaces CSV uploads with direct Meta/Google API integration. Requires credential management beyond current scope.

**Advanced modelling.** Mixed-effects models for campaign-nested data. Bayesian regression for small-sample uncertainty. Tree-based methods (random forests, gradient boosting) with SHAP for interpretability. Only worth building if real data justifies the complexity.

**Operational hardening.** Retry logic for transient Anthropic API failures. Concurrency guards for simultaneous extraction runs. Cleanup for stuck or partial extractions. Server-side enforcement of the 10MB file cap. CSV all-zero-row validation. Each is small in isolation; together they constitute the operational baseline for multi-user production. Note: each of these is also welcome as a contribution to *this* repo even if you are not forking, because they improve single-operator robustness too. The reason they sit here rather than in §6.1 is that the value of fixing them scales sharply with multi-tenant use.

**Resumable extraction.** Current practical batch ceiling is ~150 to 200 creatives per run on Vercel Hobby. Batching and resumable runs become necessary above that.

**Accessibility audit.** Current dashboard relies on colour heavily (traffic-light indicators, sub-score bars). A multi-tenant product for diverse audiences needs a proper accessibility pass. Worth doing on this repo too if anyone wants to contribute it; the colour-only cues are a real issue regardless of tenancy.

## 7. Documentation maintenance

**Regenerate the PDFs.** The methodology, PRD, and roadmap markdown sources have been updated multiple times across the recent work cycles. The deployed PDFs on the portfolio site are stale. The script `scripts/build_portfolio_docs.py` regenerates them. Run after any source markdown change that affects published content.

When this roadmap (v2.1) is finalised, regenerate `methodology.pdf`, `PRD.pdf`, and `roadmap.pdf`.

## 8. Pointers to canonical references

For specific topics, the source-of-truth document is:

- What the tool does → `PRD_v2.md`
- How the math works → `ANALYSIS_METHODOLOGY.md`
- What the tool can't do → `LIMITATIONS.md`
- How to self-host → `docs/self-hosting.md`
- How to contribute → `CONTRIBUTING.md`
- How fixes were specified → `docs/build-journey/REVIEW_FIXES.md`
- Findings from feature audit → `docs/build-journey/AUDIT_FINDINGS.md`
- Post-audit work performed → `docs/build-journey/POST_AUDIT_COMPLETION.md`
- Confidence column investigation → `docs/build-journey/POST_AUDIT_COMPLETION.md` (appendix)
- Findings from code hygiene audit → `docs/build-journey/CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md` (latest dated file)
- How to run audits → `docs/build-journey/AUDIT_INSTRUCTIONS.md`, `docs/build-journey/CODE_HYGIENE_AUDIT.md`
- Original build journey → §4 above

If a topic isn't covered by any of these, this roadmap is the residual reference.

## 9. Open strategic questions

Decisions deferred until there is evidence to resolve them, not until "later." Listed so future-Theo (and any contributor reading) does not forget they are open.

- **First real-data engagement.** How to source the first real 100+ creative dataset for production OLS validation. Options: wait for someone to clone the repo and offer it, actively recruit performance marketers willing to share anonymised data, or simulate from public benchmarks (probably worse than waiting). Open to suggestions.
- **Methodology review channel.** Whether to publish a short call-for-review post targeting people with applied-stats backgrounds, or rely on the README + GitHub Discussions to surface reviewers organically.
- **Paid media vs organic social.** Current functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema. Both remain open.
- **Hybrid manual-input variables for video and image.** Custom variables exist but route through Claude vision. A future architecture extension would let users mark a variable as human-tagged (filled in by the marketer rather than extracted by AI). Useful for video where vision extraction is unreliable, and for image variables AI can't see (talent identity, designer, internal A/B labels). Not committed.

## 10. Questions seeking input

Items where feedback from anyone reading the doc would help.

- **Personal knowledge-base layer.** Preferred scope and timing relative to production regression backend.
- **Pro vs Lite naming.** Whether the split should keep this naming if someone forks for a commercial product, or rename to something less paid-SaaS-coded.
- **Legacy folder.** Whether the `legacy/` folder (Streamlit prototype) should be removed before the next public-facing iteration or retained as build-journey context. Currently retained.
- **Roadmap cadence.** Whether to publish dated milestone posts on the portfolio site or in GitHub Discussions tracking what shipped each week. Useful for build-in-public visibility, possible time sink. Open to opinions.
