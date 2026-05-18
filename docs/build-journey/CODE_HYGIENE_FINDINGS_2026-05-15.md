# Code Hygiene Findings — 2026-05-15

**Auditor:** Claude Code
**Codebase commit:** `27f68187cd2ce80d3cdd4ada3122fb1d9f6847ba` (main, post review-fixes merge)
**Comparison to previous audit:** First run. No previous `CODE_HYGIENE_FINDINGS_*.md` exists.

## Summary

The codebase is healthier than the volume of files suggests. TypeScript compiles cleanly with no errors. There are zero `any` types, zero `as unknown as` casts, zero `@ts-ignore` directives, zero `console.log` debug statements, and zero TODO/FIXME/HACK comments — categories that often accumulate in AI-assisted code but here have been kept clean. The most actionable findings are: (1) one truly unused component file (`src/components/app-shell.tsx`) that should be deleted; (2) the README claims the AI model is Claude Sonnet when the code actually uses Haiku 4.5; (3) two unread database columns (`extraction_results.confidence` and `extraction_results.notes`) — the `confidence` one was already flagged in `INVESTIGATION_CONFIDENCE.md`, `notes` is a new find; (4) eslint reports 70 problems, but 55 of those are in `claude-design/` (a gitignored design-export drop that's locally lint-scoped), leaving 14 React 19 `set-state-in-effect` warnings and 1 `prefer-const` in real product code; (5) two moderate npm audit advisories on transitive PostCSS via Next.js that cannot be fixed without downgrading Next. Nothing is actively broken. No security exposures beyond what `LIMITATIONS.md` already documents.

---

## Critical findings

None.

The Cluster B exploration agent initially flagged "hardcoded live credentials in `.env.local`" as critical. On verification: `.env.local` is correctly listed in `.gitignore` (line 35: `.env*.local`) and is **not** tracked in git (`git ls-files | grep env` returns only `.env.local.example`). The presence of a local `.env.local` containing dev credentials is standard local-development practice, not a critical finding. Recategorised to "Verified-as-clean."

---

## Notable findings

### N1. Unused component: `src/components/app-shell.tsx`

**Category:** Phase 1 (dead code).
**Location:** `src/components/app-shell.tsx`.
**What's wrong:** The file exports `default function AppShell({ children })` but `grep -r "app-shell\|AppShell" src/` returns only the definition itself — no imports anywhere. Likely a remnant from an earlier scaffolding pattern that was replaced by the per-route layout files (`src/app/(main)/layout.tsx` etc.).
**Impact:** Adds a file readers have to mentally categorise. Compiles into the build pipeline but tree-shaken from output bundles, so no runtime cost. Maintenance burden only.
**Suggested action:** Delete the file. Verify with `npx next build` that nothing breaks.

### N2. README model claim is stale — says Sonnet, code uses Haiku

**Category:** Phase 8 (documentation-code drift).
**Location:** `README.md` line 10: `"**AI:** Anthropic Claude Sonnet (structured extraction via tool use)"`. Actual code: `src/app/api/analysis/route.ts` line 103: `model: "claude-haiku-4-5-20241022"`.
**What's wrong:** README describes the wrong model.
**Impact:** A reader sizing cost or capability assumes Sonnet (~12× the per-token cost of Haiku, and a different speed/accuracy trade-off). Methodology PDF §1 correctly says Haiku 4.5; only the README is wrong.
**Suggested action:** Update README line 10 to: `**AI:** Anthropic Claude Haiku 4.5 (structured extraction via forced tool use)`.

### N3. `extraction_results.notes` column is never read or written

**Category:** Phase 4 (schema-code consistency).
**Location:** Schema: `src/types/database.ts` (the `extraction_results` type, `notes: string | null` field). Code: zero references anywhere in `src/` to `notes` on this table (verified via Cluster A grep).
**What's wrong:** Column exists in production schema with nullable type and no default. Nothing in code populates it; nothing reads it. Sister to the already-documented `confidence` column (see `INVESTIGATION_CONFIDENCE.md`).
**Impact:** Cosmetic. A reader of `database.ts` assumes the column is meaningful when it isn't.
**Suggested action:** Bundle with the `INVESTIGATION_CONFIDENCE.md` Option A follow-up — drop `notes` in the same migration that drops `confidence`. Or document explicitly in `LIMITATIONS.md` that both columns are reserved for future use.

### N4. 14 React 19 `react-hooks/set-state-in-effect` warnings in `src/`

**Category:** Phase 3 (type/runtime safety).
**Location:** Top examples:
- `src/context/demo-context.tsx:33` — `setModeState(stored)` inside mount-time `useEffect`
- `src/context/project-context.tsx:40` — `setProjectIdState(stored)` inside mount-time `useEffect`
- `src/context/project-context.tsx:68` — `fetchProject(projectId)` (indirectly setStates) inside effect
- `src/app/(main)/dashboard/page.tsx:82`, plus 7 other wizard pages with similar patterns
- `src/components/dashboard/variable-chart.tsx:30`, `src/components/dashboard/variable-table.tsx` (line not captured)
- `src/components/sidebar.tsx:105`

**What's wrong:** React 19's lint surface recommends moving "load X from external source then setState" patterns out of effects — they cause a render → effect → setState → re-render cascade. Each instance is a warning, not an error; the build passes.
**Impact:** Performance cost is small at this app's scale (one extra render per page load). The recommended fix is non-trivial (use `useSyncExternalStore` for localStorage subscriptions, or move state-derivation to component bodies). For now, accepting the warnings is reasonable.
**Suggested action:** Either (a) silence the rule for `localStorage`-driven mount effects with a targeted `// eslint-disable-next-line` and a comment explaining why; or (b) migrate `demo-context.tsx` and `project-context.tsx` to `useSyncExternalStore` (idiomatic but bigger change). No action required this cycle.

### N5. `npm audit`: 2 moderate vulnerabilities via transitive PostCSS

**Category:** Phase 2 (dependency hygiene).
**Location:** `node_modules/next/node_modules/postcss` (transitive).
**What's wrong:**
```
postcss <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
- GHSA-qx2v-qp2m-jg93
fix available via `npm audit fix --force` (would downgrade Next from 16.x to 9.3.3 — not viable)
```
**Impact:** The vulnerability is in PostCSS's CSS stringification path, which is exercised only at build time (not at request time). For a Next.js app on Vercel, PostCSS runs in the build container, not the request runtime. No user input flows into PostCSS at runtime. Practically not exploitable in this deployment shape.
**Suggested action:** Leave as-is. Re-run `npm audit` after the next `next@16.x` patch release — the PostCSS bump usually propagates within 1-2 Next minor releases. Document in `LIMITATIONS.md` if not already there (it isn't).

### N6. Unused type exports in `src/lib/demo-data.ts`

**Category:** Phase 1 (dead code).
**Location:** `src/lib/demo-data.ts` — `export type DemoDashboardPayload`, `export type DemoProject`, `export type InteractionCell`, `export type MatchSplit`. All exported but never imported outside the file.
**Impact:** Minor — types are erased at compile time, no runtime cost. Adds noise to anyone scanning the module's public surface.
**Suggested action:** Remove the `export` keyword on those four (downgrade to internal types) during the next cleanup. Verify the build still passes.

### N7. Magic numbers in trust-score thresholds and weights

**Category:** Phase 7 (configuration / magic numbers).
**Location:** `src/lib/analytics.ts`:
- Line 370: `volumeScore * 0.4 + extractionConfidence * 0.3 + bucketBalance * 0.3` (composite weights)
- Lines 375-381: `overall >= 80 ? "excellent" : overall >= 60 ? "good" : overall >= 40 ? "fair" : "poor"` (level thresholds)
- Lines 337-338: `min(100, (n_creatives / 50) * 100)` (creative-count sub-score curve)

**What's wrong:** These are the scoring constants. They're well-commented and documented in `ANALYSIS_METHODOLOGY.md`, but appear as inline literals rather than named constants. If someone changes one without updating the methodology doc, the docs drift silently.
**Impact:** Low. Methodology doc is the canonical reference, and trust-score formula is unlikely to change without a deliberate review.
**Suggested action:** Extract to named constants (`COMPOSITE_VOLUME_WEIGHT = 0.4`, `TRUST_THRESHOLD_EXCELLENT = 80`, etc.) at the top of the file. Pairs with any future change to the formula.

---

## Minor findings

Bundle into a future cleanup pass.

### M1. `npm outdated` — 6 packages with newer versions
- `@anthropic-ai/sdk` 0.95.2 → 0.96.0 (patch)
- `@types/node` 20.19.40 → 25.8.0 (major; Node 22 LTS now widespread)
- `eslint` 9.39.4 → 10.3.0 (major)
- `react`/`react-dom` 19.2.4 → 19.2.6 (patch)
- `typescript` 5.9.3 → 6.0.3 (major)

All known-safe minor/patch bumps could land trivially. Major bumps need separate review.

### M2. One risky `!` non-null assertion on environment variable

**Location:** `src/app/api/analysis/route.ts:82` — `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;`.

The same file at line 79 also asserts on `SUPABASE_SERVICE_ROLE_KEY`. Both will crash at request time if the env var is missing. The `getServerSupabase()` helper used in 5 other API routes throws a clearer error message instead. Suggested: use the helper or replicate its check pattern here.

### M3. 5 empty catch blocks with explanatory comments

All have inline `// Silent fail` or `// Fallback to defaults` comments, which is the documented pattern for this codebase. Not problematic, just worth noting they exist. Locations: `src/app/(main)/analysis/page.tsx:148, 276`, `src/app/(main)/settings/page.tsx:42, 134`, `src/app/(main)/variables/page.tsx:54`.

### M4. No `.editorconfig` or `.prettierrc`

The repo relies on Next.js defaults and the developer's editor settings. Multi-contributor cleanup will need them eventually. Not urgent for a single-operator project.

### M5. No CI configuration (`.github/workflows/` absent)

Builds and merges currently rely on Vercel's auto-deploy and local `npx next build` verification. Acceptable for a single-operator project; flagged for productization.

### M6. 1 `prefer-const` lint error in `src/`

Single instance (per the eslint summary). The codebase otherwise respects `const` strictly. Will be cleaned up by `eslint --fix` if run.

### M7. `claude-design/` is locally lint-scoped despite being gitignored

The eslint config (`eslint.config.mjs`) doesn't exclude `claude-design/`, so when running `npx eslint .` locally, the 2.7MB design-export drop produces 55 lint errors (32 `react/no-unescaped-entities`, 15 `@typescript-eslint/no-unused-vars`, 8 `react/jsx-no-undef`). These do NOT affect the deployed bundle (claude-design isn't in git or the build) but they pollute the lint output. Suggested: add `claude-design/**` to the `ignores` array in `eslint.config.mjs`.

---

## Tool output

Verbatim, abbreviated where massive.

### `npm audit`
```
postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
- https://github.com/advisories/GHSA-qx2v-qp2m-jg93
fix available via `npm audit fix --force`
Will install next@9.3.3, which is a breaking change
node_modules/next/node_modules/postcss
  next  9.3.4-canary.0 - 16.3.0-canary.5
  Depends on vulnerable versions of postcss
  node_modules/next

2 moderate severity vulnerabilities
```

### `npx tsc --noEmit`
Clean. Exit code 0. No output.

### `npm outdated`
```
Package             Current    Wanted  Latest
@anthropic-ai/sdk    0.95.2    0.95.2   0.96.0
@types/node        20.19.40  20.19.41   25.8.0
eslint               9.39.4    9.39.4   10.3.0
react                19.2.4    19.2.4   19.2.6
react-dom            19.2.4    19.2.4   19.2.6
typescript            5.9.3     5.9.3    6.0.3
```

### `npx eslint .` — summary by rule
```
32  react/no-unescaped-entities          (all in claude-design/)
15  @typescript-eslint/no-unused-vars    (all in claude-design/)
14  react-hooks/set-state-in-effect      (all in src/, warnings)
 8  react/jsx-no-undef                   (all in claude-design/)
 1  prefer-const                         (in src/)
70  total (55 errors, 15 warnings — errors are in gitignored claude-design/)
```

### `npx depcheck`
```
Unused devDependencies:
  - @tailwindcss/postcss
  - @types/node
  - @types/react-dom
  - tailwindcss
```
All four are false positives: `tailwindcss` and `@tailwindcss/postcss` are consumed by `postcss.config.mjs` and the Tailwind directives in `globals.css`; `@types/node` and `@types/react-dom` are TS-resolved at compile time, not directly imported.

### `git ls-files | xargs du -b | sort -rn | head` (top 10 by size, in bytes)
```
230571  package-lock.json
55093   scripts/build_portfolio_docs.py
51494   src/app/globals.css
29678   AUDIT_FINDINGS.md
29569   src/lib/demo-data.ts
25931   src/app/favicon.ico
21451   docs/methodology.pdf
20389   src/app/(main)/mapping/page.tsx
19552   src/components/instructions-content.tsx
19236   src/app/(main)/variables/page.tsx
```
No surprises. Largest committed file is `package-lock.json` (~225KB) which is expected.

### Git noise survey
- `.DS_Store` / `Thumbs.db` / `desktop.ini` in git: **none**.
- Build artifacts (`.next/`, `dist/`, `build/`, `out/`) in git: **none**.
- Largest non-lock-file: a Python build script for the portfolio PDFs (~55KB), then `globals.css` (~51KB). Acceptable.

---

## Verified-as-clean

Dimensions checked that came up clean:

- **No TODO / FIXME / HACK / XXX** in `src/` (Phase 1).
- **No `console.log` or `console.debug`** in non-test code (Phase 1).
- **No multi-line commented-out code** blocks (Phase 1).
- **No explicit `any` types** in `src/` (Phase 3).
- **No `as unknown as X` casts** (Phase 3).
- **No `@ts-ignore` or `@ts-expect-error`** directives (Phase 3).
- **TypeScript compilation:** `tsc --noEmit` exits clean (Phase 3).
- **Schema-code consistency:** all 9 Supabase tables are referenced; only 2 columns on `extraction_results` (`confidence`, `notes`) are unreferenced (Phase 4).
- **Pattern consistency:** data fetching uses consistent helpers (`getSupabase()` client-side; `getServerSupabase()` server-side defined per-route); function naming follows `getX` / `computeX` / `buildX` conventions; styling is Tailwind + occasional inline `style={}`, no mixed CSS approaches (Phase 5).
- **No hardcoded secrets in tracked source.** `.env.local` is correctly gitignored (verified by `git ls-files | grep env` returning only `.env.local.example`) (Phase 6).
- **`NEXT_PUBLIC_*` exposure:** only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — both intended-public per Supabase design. `SUPABASE_SERVICE_ROLE_KEY` is correctly server-only (Phase 6).
- **No `dangerouslySetInnerHTML`** anywhere in `src/` (Phase 6).
- **No `eval()`, `new Function()`, or string-argument `setTimeout`** (Phase 6).
- **No raw SQL interpolation** — all Supabase queries use the parameterised query builder (Phase 6).
- **No CORS headers** set on API routes — using Next.js defaults (Phase 6).
- **Env vars used in code match those documented** in `.env.local.example` exactly: 4 used (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`), 4 documented, no drift (Phase 7).
- **JSDoc / TSDoc accuracy:** spot-checked 5 key functions in `src/lib/analytics.ts` and `src/app/api/analysis/route.ts`; all docstrings match current signatures and behavior (Phase 8).
- **No cross-file `// See foo.ts:NNN` line-number references** (Phase 8).
- **No committed build artifacts.** `.next/`, `dist/`, `out/`, `build/` all absent from `git ls-files` (Phase 9).
- **No `.DS_Store`, `Thumbs.db`, `desktop.ini`** in tracked files (Phase 9).
- **No large binaries** in git history beyond expected PDFs and `package-lock.json` (Phase 9).
- **`claude-design/`** is gitignored (`.gitignore:44 /claude-design`) and not referenced from `src/` (Phase 9).

---

## Next steps (for the human)

This report is read-only. To act on the findings:

1. **Quick wins (one short PR):** delete `src/components/app-shell.tsx`, fix the README model name to Haiku, downgrade the 4 unused exports in `demo-data.ts` to internal types, add `claude-design/**` to `eslint.config.mjs` ignores. Single commit, ~15 minutes.
2. **Bundled with `INVESTIGATION_CONFIDENCE.md` follow-up:** drop `notes` from `extraction_results` in the same migration that drops `confidence`.
3. **Defer:** the 14 React 19 `set-state-in-effect` warnings, the 6 outdated packages (one minor + 4 majors), the PostCSS audit advisory. Track in `LIMITATIONS.md` if useful; otherwise re-check next audit.
4. **Workflow:** if a multi-week cadence is set for hygiene audits, the next file will be `CODE_HYGIENE_FINDINGS_2026-MM-DD.md` and the "Comparison to previous audit" section will summarise the delta from this one.
