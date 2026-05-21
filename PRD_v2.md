# Creative Media Analyser: Product Requirements

Author: Theo Rajan
Date: 2026-05
Status: v2.1. Supersedes v2 (2026-05-16). Updated for open-source repositioning.
Repository: github.com/theodoreheroldrajan-sketch/media-analyzer
License: MIT

## 1. Problem statement

Performance marketers running paid campaigns on Meta and Google generate dozens to hundreds of creative variants per quarter. The platforms report metrics at the creative level (impressions, clicks, spend, conversions, revenue) but offer no structured analysis of why certain creatives outperform others. Practitioners fall back on manual eyeballing, ad-hoc spreadsheets, or inconsistent tagging conventions that decay over time.

The result is decision-making by anecdote. A marketer might believe "warm colours work for our brand" because the last hero ad happened to feature them, when the real driver was an unrelated copy hook. Without structured variable extraction and a sample-size-aware comparison, post-campaign learnings are unreliable and rarely transfer to the next brief.

Existing platforms address fragments of this problem. Motion (motionapp.com) and Benly (benly.ai) are well-resourced paid SaaS tools doing AI-assisted creative analysis at scale. Agency tools tag creatives manually (expensive and inconsistent). MMM software focuses on channel-level rather than creative-level signal. Generic LLM image taggers extract free-text descriptions that cannot be grouped or compared. There is no open-source tool in this category that closes the loop from image to structured variable to performance to ranked insight in a single workflow.

## 2. Why this exists

This project is open source (MIT) and built in public. Primary motivation is learning: the author is a performance marketer building with AI to understand the full pipeline end-to-end (vision extraction, matching, statistics, dashboards). Secondary motivation is that no open-source equivalent exists in this category; if the tool earns the right to be used, anyone can clone it and run their own instance with their own API keys.

This shapes a few things in the rest of this document:

- Feedback and methodology critique are explicit asks, not aspirational extras. The methodology document is a public invitation for review.
- Real anonymised datasets are needed to validate the production OLS backend. Anyone willing to share is the canonical contributor.
- Productisation is not a goal. If the tool turns into something multiple people want to use commercially, that becomes a fork question, not a roadmap item for this repo.

## 3. Target user

**Primary persona:** in-house performance marketers at consumer brands managing £50,000+ monthly paid spend on Meta and Google, with 50+ creative variants per quarter. Comfortable in ad platform dashboards but not in Python or R. They want to know which creative patterns to brief next, supported by evidence stronger than gut feel.

**Secondary persona:** agency planners running paid media for several mid-sized clients. Same problem shape, larger total dataset, less continuity between campaigns.

**Lighthouse case:** a high-volume DTC advertiser running approximately £150,000 per month in spend across roughly 200 creatives. This scale is the canonical Pro-mode case: enough data for proper modelling, technical enough to read coefficients and p-values.

Because the tool is open source and self-hosted, the operator and the person who deploys it are the same. This shapes the trust model (no auth needed, UUID access is sufficient) and the feedback loop (operators running the tool are the natural source of bug reports and contribution).

**Open question, not yet resolved.** The primary persona description ("not Python or R") sits in tension with the Pro mode UI, which references coefficients and p-values inline. Resolution depends on first real-user testing: if the operator reads coefficients comfortably, the persona description is wrong and gets updated; if they do not, the Pro UI needs plain-English translation. Both paths are designed; the decision waits for evidence.

## 4. Value proposition and differentiation

**What is commodity.** Vision-based extraction of structured variables from images is now a near-commodity capability available through any major LLM provider with tool-use. The tool depends on this commodity (Claude Haiku 4.5 with forced tool_use) but does not claim it as differentiation.

**What is differentiated.**

**Open source and self-hostable.** Marketers and analysts run their own instance, BYO API keys, own their data and costs end-to-end. The methodology is in the open and the code is in the open. Motion and Benly are paid closed SaaS; there is no equivalent open-source tool in the category. The structural differentiator is open vs closed.

**Schema rigour.** A fixed set of 24 universal variables (format, visual, colour, text, brand, CTA, strategy) plus 4 to 6 category-specific variables drawn from one of ten brand-vertical templates. Variables are typed (boolean, enum, integer, string) so they can be grouped, compared, and regressed. The schema is project-versioned: a re-run extracts under the same definitions.

**Lite vs Pro methodology split.** Two analysis paths gated on dataset size. Under 100 creatives runs descriptive group-by analysis with explicit sample-size confidence labels and bootstrap 95% confidence intervals on every delta. At 100+ creatives, the tool surfaces multiple-regression outputs (coefficients, p-values, interaction matrices) with Benjamini-Hochberg FDR correction on exploratory variables. The split is honest about what each path can and cannot infer. Closed competitors in the category do not surface this distinction.

**Pre-registration of hypothesis variables.** Before running the analysis, the operator can pre-register which variables they expect to matter. The dashboard separates pre-registered findings (treated as confirmatory) from exploratory findings (treated as hypothesis-generating). This closes a common pitfall where every observed delta looks like a finding.

**Trust score (floor-gated).** A composite 0 to 100 quality indicator shown above every dashboard, combining five sub-scores: creative count, impression volume, mapping quality, data completeness, and bucket balance. The first three act as floors; the composite cannot exceed the worst of them. Closes the failure mode where a low mapping rate could be averaged into a misleadingly "Good" score. Marketers see the ceiling on how seriously to take the numbers before they read them.

**Planned personal-knowledge-base layer.** The brand context passed into extraction (brand, category, KPI, audience, campaign goal) is the seed for a markdown-based knowledge store the operator maintains over time. Repeated campaigns inherit context rather than starting from zero.

## 5. Scope (v1)

**In scope.**

- Static image creatives (PNG or JPEG), one file per variant.
- CSV exports from Meta Ads Manager and Google Ads. Auto-detected column mapping for the standard headers; the upload module accepts variants on filename, ad_id, ad_name, impressions, clicks, spend, conversions, revenue, date, campaign, ad set, platform, placement.
- Six-method matching cascade linking creatives to performance rows (exact, normalised, embedded platform ID, prefix, contains, fuzzy Levenshtein).
- Structured variable extraction via Claude Haiku 4.5 with tool_use forcing.
- Group-by analysis for any chosen metric (CTR, CPC, CPA, CVR, ROAS).
- Bootstrap 95% confidence intervals on every Lite delta, displayed as error bars and numeric ranges.
- "Patterns to investigate" framing for exploratory findings, with noise-adjusted ranking (`|delta| * sqrt(n)`) on both the insights panel and the variable performance table.
- Pre-registration of hypothesis variables (database-backed, real app + demo).
- Snapshot data layer: re-uploaded CSVs are preserved as historical snapshots; dashboard filters to the latest by default with a "Showing snapshot N of M" indicator.
- Dashboard with trust score, key metrics, variable explorer, sortable performance table, ranked creative gallery, and an insights panel.
- CSV exports of variables, performance, and a combined view.
- Interactive demo with sample data so portfolio visitors and prospective contributors can explore without API budget exposure.

**Out of scope (v1).**

- Video and dynamic creatives.
- Real-time platform API integrations (Meta or Google); CSV uploads only.
- Multi-user collaboration, comments, or shared workspaces.
- Authentication and authorisation. UUID-based access is the design for self-host single-operator use.
- Causal claims. The tool is correlational by design and labels outputs as directional hypotheses.

## 6. Lite vs Pro

The application splits its dashboard on a hard threshold of 100 creatives. The threshold is set in `src/app/api/dashboard/route.ts` and is justified as the conservative floor for an OLS model with roughly 25 predictors (rule of thumb: 5 to 10 observations per predictor).

| Aspect | Lite (<100) | Pro (100+) |
|---|---|---|
| Primary user | Solo marketer, small ad set, founder | In-house growth team, agency planner |
| Statistical method | Group-by descriptive with bootstrap 95% CI | Group-by + multiple regression with FDR correction |
| Visualisations | Bar chart | Bar, scatter, regression, distribution, heatmap |
| Mapping UI | Flat confirmed table | Match cards with confidence and method badges; suggested and unmatched panels |
| Variables UI | Toggle list | Four-tier: Universal, Category, AI suggestions, Custom builder |
| Multiple-comparison control | None on Lite deltas (descriptive only); CI shows variance | Benjamini-Hochberg FDR on exploratory regression variables |
| Stability indicator | n/a | Green/yellow/red traffic light for N/predictor ratio |
| Insights tone | Plain English; "Patterns to investigate" framing | Coefficient and p-value referenced inline |

**Implementation note.** The Pro UI ships in the interactive demo with mocked statistics so the experience is portfolio-visible and contribution-evaluable. The production regression backend is designed in the methodology document but not yet wired; it will be built against the first real 100+ creative dataset rather than synthesised in advance.

## 7. Key features (shipped)

- Nine-step wizard: Home, Setup, Instructions, Upload, Mapping, Variables, Analysis, Dashboard, Settings.
- Image upload to Supabase Storage with PNG/JPEG validation and 10MB advisory cap per file.
- CSV parser (PapaParse) with auto-detected column mapping across Meta and Google export conventions.
- Six-method matching cascade with confidence scoring per match and a manual override flow for the unmatched.
- Variable schema builder: 24 universal definitions, 10 category templates, custom variables in Pro.
- Streaming AI extraction over Node.js runtime via NDJSON (Edge runtime is incompatible with the Anthropic SDK).
- Live cost tracking per image, priced at the Haiku 4.5 rate of USD 0.80 per million input tokens and USD 4.00 per million output tokens.
- Dashboard: metric switcher, trust score gauge (5 sub-scores, floor-gated), variable explorer (bar in Lite; bar plus four more chart types in Pro), sortable variable performance table, ranked creative gallery, insights panel.
- Bootstrap 95% confidence intervals on every Lite delta.
- Pre-registration of hypothesis variables, with the dashboard separating confirmatory from exploratory findings.
- Snapshot data layer: historical CSV uploads preserved; latest snapshot selected for display by default.
- Model stability indicator in Pro mode (green/yellow/red traffic light for N/predictor ratio).
- "Patterns to investigate" framing on exploratory findings, with noise-adjusted ranking.
- Three CSV exports: variables, performance, and a combined view.
- Project delete with cascade across all nine database tables and the storage bucket.
- Comprehensive instructions page with Meta and Google export step-by-step guides, sample CSV previews, common pitfalls, and a pre-upload checklist.
- CI workflow gating every PR (TypeScript, ESLint, Next build).

## 8. Success criteria

**Functional.** A user starting with a folder of 50 creative images and a fresh Meta CSV export can complete the full pipeline (setup through dashboard) in under 10 minutes. The trust score reaches Good or better. At least three variable-value pairs return a delta with at least Medium confidence and a bootstrap CI that does not cross zero.

**Decision quality.** The output passes the "would a marketer change their next brief?" test: the ranked insights surface at least one pattern the user did not already know, or refute one they wrongly believed.

**Trust.** The user can articulate, after reading the dashboard, both what the data shows and what it does not show. Sample-size labels, the regression-unlock indicator, the trust score, and the pre-registered-vs-exploratory split together make the limits legible.

**Public iteration.** At least one external reviewer engages substantively with the methodology document or the limitations document and either confirms the approach or surfaces a real gap. At least one external operator clones the repo and reports back on the experience (positive or negative). These are the validation events that the project actually needs.

## 9. Non-goals

These are deliberate omissions, not future work.

- **No causal claims.** Group-by deltas are descriptive. Regression coefficients (when shipped) are conditional associations. The tool produces hypotheses, not causes.
- **No real-time platform integration.** CSV uploads are the contract. Real-time APIs change too often and require credential management out of scope.
- **No multi-user collaboration.** Designed for a single operator. Shared workspaces, comments, audit trails, and role-based access are a separate product surface; a fork can add them.
- **No video creatives.** Frame extraction, motion tagging, and audio variables are a different problem.
- **No machine learning beyond OLS in v1.** Outputs stay in the regime where they are interpretable line by line. Random forests, gradient boosting, and Bayesian regression are listed as future extensions only.
- **No authentication.** UUID-based access is the design, not a stopgap. The deployment model is single-operator self-host; multi-tenant deployments are out of scope for this codebase and would be a fork.

## 10. Future direction (post-v1)

**Production regression backend.** Move the mocked Pro statistics out of `demo-data.ts` and into a real server-side OLS pipeline. Gate on the first 100+ creative real dataset to validate the design end-to-end before generalising. Empirical decisions on regularisation, impression weighting (count vs sqrt), and interaction-selection threshold all wait on real data.

**AI insight narration.** Replace the current insights panel copy with Claude-generated explanations grounded in actual coefficients and deltas. Path depends on the persona-vs-translation decision (see §3 open question).

**Personal knowledge-base layer.** Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes get injected into extraction prompts so repeated campaigns inherit context. Design depends on observing how the first real operator runs continuous campaigns: do they iterate on a stable visual direction, or run distinctly different concepts? The answer determines what context is worth persisting.

**Longitudinal / temporal analysis (v3 direction).** Cross-snapshot analysis: creative fatigue, seasonality, pre/post brand campaigns, platform algorithm shifts. Methodological choices (time as continuous variable, fixed effects per snapshot, panel data with creative-level random effects) depend on what real multi-snapshot data looks like. Gated on the first real operator accumulating 3+ snapshots over a 60-day window.

**Video creatives (v3 or later).** Frame extraction, motion variables, audio extraction. Hybrid pathway with marketer-input variables for things AI cannot see (talent identity, music choice, production type).

**Additional platforms.** TikTok and LinkedIn CSV formats. Demand-driven.

**Optional advanced modelling.** Mixed-effects models for campaign-nested data, Bayesian regression for small-sample uncertainty, tree-based methods (random forests, gradient boosting) with SHAP for interpretability. Explored only if real datasets justify the complexity.

**Multi-tenant fork (separate codebase).** Supabase Auth + Row Level Security scoped per user, shared workspaces, comments, audit trails, role-based permissions. Not on this repo's roadmap; this is what a fork would need to add if anyone wants to run the tool as a multi-user product. (The single-operator operational baseline — retry on transient Anthropic failures, concurrency guard, stuck-run cleanup, 10MB image cap enforcement, CSV all-zero-row rejection — shipped in PRs #21–#23 and is no longer pending.)

## 11. Limitations summary

A condensed view of what the tool cannot do or does silently differently from the user's expectations. Included so the PRD reads standalone. Full version in `LIMITATIONS.md`.

**Methodological.** No hypothesis testing in Lite (descriptive only). No interaction effects in Lite (each variable analysed independently). Confidence label ignores impression volume: n=3 with 300k impressions each is labelled "low" even though it has more statistical power than n=10 with 1k impressions each. Pro statistics in the demo are mocked. Everything is correlational.

**Reliability.** Transient Anthropic API failures retry with exponential backoff (2 attempts, 1s base) inside a 5-worker concurrency pool (PR #21–#22). Simultaneous extraction runs on the same project are blocked: the second returns 409 if a run started within the last 15 minutes is still in `running` state. Stuck `analysis_runs` rows auto-fail after 15 minutes on the next dashboard load (PR #22). Transitive PostCSS XSS advisory present in `npm audit` is not exploitable in this deployment (PostCSS runs only at build time, no user input reaches CSS stringification); see `LIMITATIONS.md` §2.

**Data integrity.** 10MB image cap enforced client-side in `src/lib/upload.ts` (PR #23). CSV rows with all-zero metrics are filtered server-side in the upload route with a `skippedRows` count returned to the client (PR #23). Missing values are still silently excluded from each variable's group computation without a per-variable missing-count surface — open and contribution-friendly.

**Access and security.** UUID-based project access: anyone with a project URL has full destructive access. This is the design for single-operator self-host. Multi-tenant deployments need a fork with proper auth.

**Scale.** Vercel Hobby practical batch ceiling 150 to 200 creatives per run. Bootstrap CI compute not yet benchmarked under cold start at Pro scale. Bootstrap resampling is uniform, not impression-weighted (production OLS uses WLS instead).

**Product surface.** No snapshot-browsing UI yet (the data layer is in place; UI deferred until first real-operator feedback shapes the design). No temporal handling for seasonality, fatigue, or algorithm shifts. Dashboard relies on colour gradients for accessibility-sensitive cues.

## 12. Open questions

Decisions deferred until there is evidence to resolve them.

- **Pro UI translation vs persona description correction.** See §3. Resolved by first real-user test of Pro mode.
- **Paid media vs organic social.** Current functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema.
- **First real-data engagement.** How to source the first real 100+ creative dataset for production OLS validation. Options: wait for someone to clone the repo and offer it, actively recruit performance marketers willing to share anonymised data, or simulate from public benchmarks (probably worse than waiting). Open to suggestions from anyone who has done this kind of recruitment.
- **Methodology review channel.** Whether to publish a short call-for-review post (LinkedIn, Substack, etc.) targeting people with applied-stats backgrounds, or rely on the README + GitHub Discussions to surface reviewers organically.

## 13. How to engage

- Self-host or read the code: see `README.md`.
- Methodology critique: open a GitHub Discussion on the repo, or file an issue with the `methodology` label.
- Bug reports and reliability issues: GitHub issue with the `bug` label.
- Contribution: see `CONTRIBUTING.md`. Engineering hygiene items in the roadmap §6.1 and operational hardening items in §10 are all welcome.
- Sharing anonymised datasets for production OLS validation: open a GitHub Discussion or use GitHub's Private Vulnerability Reporting channel for anything that needs to stay confidential.
