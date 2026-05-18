# Creative Media Analyser

Open-source creative analytics for paid-ads marketers. Vision-based variable extraction, statistically honest reporting.

<!-- TODO: hero screenshot of the dashboard -->

**[Live demo](https://media-analyzer-theta.vercel.app)** (deterministic sample data, no API cost)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/theodoreheroldrajan-sketch/media-analyzer&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ANTHROPIC_API_KEY)

## Why this exists

This is an open-source tool for paid-media performance marketers, built in public by a marketer who is also learning to build with AI. Vision-based variable extraction from ad creatives is now a near-commodity capability; the question this project asks is what an honest, methodologically rigorous, self-hostable version of that workflow would look like.

The methodology document is a public invitation for review, and real anonymised datasets are an explicit ask. If you have an applied-stats background or a dataset you would consider sharing, see the [Looking for](#looking-for) section below.

## Why not just use Motion or Benly

[Motion](https://motionapp.com) and [Benly](https://benly.ai) are well-resourced paid SaaS tools doing AI-assisted creative analysis at scale. This project is not trying to compete with either of them on features. It is the open-source alternative: self-host it, BYO API keys, own your data and costs, read and audit the code and methodology. If you are running enough spend to justify a paid SaaS subscription and prefer it, use one of theirs. If you want to run it yourself, contribute to it, or critique the methodology, this is the option that exists.

## What's different

**Open source and self-hostable.** Run your own instance, bring your own API keys, own your data and costs end-to-end. The methodology is in the open and the code is in the open. There is no equivalent open-source tool in this category.

**Schema rigour.** A fixed set of 24 universal variables (format, visual, colour, text, brand, CTA, strategy) plus 4 to 6 category-specific variables drawn from one of ten brand-vertical templates. Variables are typed (boolean, enum, integer, string) so they can be grouped, compared, and regressed. The schema is project-versioned: a re-run extracts under the same definitions.

**Lite vs Pro methodology split.** Two analysis paths gated on dataset size. Under 100 creatives: descriptive group-by analysis with explicit sample-size confidence labels and bootstrap 95% confidence intervals on every delta. At 100+ creatives: multiple-regression outputs (coefficients, p-values, interaction matrices) with Benjamini-Hochberg FDR correction on exploratory variables. The split is honest about what each path can and cannot infer.

**Pre-registration and floor-gated trust.** Before running the analysis, the operator pre-registers which variables they expect to matter. The dashboard separates pre-registered findings (confirmatory) from exploratory findings (hypothesis-generating). A composite trust score (0 to 100) uses floor gating: the worst of the three critical sub-scores (creative count, mapping quality, data completeness) caps the headline number, so a low mapping rate cannot be averaged into a misleadingly good score.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4 |
| Backend | Next.js Route Handlers (Node.js runtime) |
| Database | Supabase Postgres + Storage |
| AI | Anthropic Claude Haiku 4.5 (structured extraction via forced tool use) |
| Hosting | Vercel |

## Quick start

```bash
git clone https://github.com/theodoreheroldrajan-sketch/media-analyzer.git
cd media-analyzer
npm install
cp .env.example .env.local
# Fill in your Supabase and Anthropic keys (see docs/self-hosting.md)
npm run dev
```

## Self-hosting

Full setup instructions (Supabase project, database schema, environment variables): [docs/self-hosting.md](docs/self-hosting.md).

## Cost transparency

This is BYO API key. You pay Anthropic directly for extraction usage; there is no markup or per-seat pricing.

Current Claude Haiku 4.5 rates: USD 0.80 per million input tokens, USD 4.00 per million output tokens.

**Per-creative estimate:** each image extraction uses roughly 2,800 input tokens (image + prompt + tool schema) and roughly 400 output tokens (structured variable extraction).

```
Input cost:  2,800 tokens x $0.0000008/token = $0.00224
Output cost:   400 tokens x $0.000004/token  = $0.00160
                                        Total: ~$0.004 per creative
```

A 50-creative project costs approximately $0.15 to $0.25 depending on image resolution and variable count. The settings page tracks cumulative token usage and cost per project.

## Looking for

Specific things that would help this project:

- **Methodology critique.** Anyone with an applied-stats background willing to review `ANALYSIS_METHODOLOGY.md` and the open questions in section 8. File an issue with the `methodology` label or open a GitHub Discussion.
- **Real anonymised datasets.** The production OLS backend (Pro mode) is designed but not yet wired to real data. A real 100+ creative dataset from a paid campaign would be the validation case. Open a GitHub Discussion or use GitHub's Private Vulnerability Reporting channel for anything confidential.
- **Bug reports from self-hosters.** The tool has only been run by the author so far. If you clone it and something breaks, that is a valuable report.
- **Contributions on engineering hygiene and operational hardening.** Package bumps, retry logic, concurrency guards, accessibility improvements. See [ROADMAP_v2.md](ROADMAP_v2.md) sections 6.1 and 6.4 for specifics.

## Roadmap

[ROADMAP_v2.md](ROADMAP_v2.md) | [PDF](docs/roadmap.pdf)

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md)

## Build journey

The [docs/build-journey/](docs/build-journey/) directory preserves the audit findings, review fixes, and code hygiene reports from the project's development as build-in-public artefacts.

## License

[MIT](LICENSE)

## Author

Theo Rajan ([portfolio](https://portfolio-website-zeta-one-76.vercel.app))
