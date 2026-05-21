# Contributing

Contributions are welcome. This section covers how to file issues, set up a dev environment, and submit a PR.

## Filing issues

- **Bugs:** use the [bug report template](https://github.com/theodoreheroldrajan-sketch/media-analyzer/issues/new?template=bug_report.md). Include your Node version, browser, and steps to reproduce.
- **Feature requests:** use the [feature request template](https://github.com/theodoreheroldrajan-sketch/media-analyzer/issues/new?template=feature_request.md).
- **Methodology feedback:** use the [methodology review template](https://github.com/theodoreheroldrajan-sketch/media-analyzer/issues/new?template=methodology_review.md) or open a GitHub Discussion. The open questions in `ANALYSIS_METHODOLOGY.md` section 8 are genuine; informed critique is welcome.

## Dev environment setup

Follow the [self-hosting guide](docs/self-hosting.md) to get the app running locally. In short:

1. Create a Supabase project and run `supabase/schema.sql`.
2. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com).
3. Copy `.env.example` to `.env.local` and fill in your keys.
4. `npm install && npm run dev`.

## Code style

- **TypeScript strict mode.** The codebase uses TypeScript with strict checks enabled.
- **ESLint.** Configuration is in `eslint.config.mjs`. Run `npx eslint .` to check.
- **Prettier.** Configuration is in `.prettierrc.json`. Run `npm run format:check` to verify formatting.

## PR process

Every PR to `main` is gated by CI. Before submitting, make sure these pass locally:

```bash
npx tsc --noEmit     # TypeScript type check
npx eslint .         # Linting
npx next build       # Production build
```

Use the PR template checklist. Keep PRs focused: one change per PR where practical.

## Where contributions are welcome

**Engineering hygiene (contribution-friendly, no external dependency):**

- Major package bumps (`@types/node` 20 to 25, `eslint` 9 to 10, `typescript` 5 to 6). Each in its own PR with breaking-change review.
- Mass Prettier reformat (standalone PR, no other changes mixed in).
- React 19 eslint-disable comment cleanup once rule semantics stabilise.

See [ROADMAP_v2.md](ROADMAP_v2.md) section 6.1 for the full list.

**If you have a real dataset:**

The tool has only been tested against generated demo data. If you are a performance marketer with a real paid-campaign dataset (50+ creatives with performance CSV), running the tool against real data and reporting what works and what breaks is the single most valuable contribution right now. The production OLS backend (Pro mode) is designed but gated on the first real 100+ creative dataset. See [ROADMAP_v2.md](ROADMAP_v2.md) section 6.2.

**Operational hardening.**

The single-operator operational baseline (retry on transient Anthropic failures, concurrency guard, stuck-run cleanup, 10MB image cap, CSV all-zero-row rejection) shipped in PRs #21–#23. What remains in [ROADMAP_v2.md](ROADMAP_v2.md) section 6.4 is the multi-tenant baseline — relevant only if you fork for multi-user use.

**Multi-tenant fork territory:**

If you want to take this codebase and turn it into a multi-user product, the roadmap section 6.4 documents what you would need to add (auth, RLS, shared workspaces, role-based access). That work is out of scope for this repo but documented for anyone who wants to fork.
