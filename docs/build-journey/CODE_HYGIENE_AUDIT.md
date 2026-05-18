# Code Hygiene Audit Instructions

**Target:** This codebase (Creative Media Analyzer, but template is reusable)
**Purpose:** Catch code cleanliness issues that accumulate over time in AI-assisted development
**Output:** `CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md` in repo root, dated so multiple runs can be compared
**Reader of output:** Theo and the external review assistant
**Recommended cadence:** Every 2–4 weeks, or after a batch of feature work

---

## 1. Context

This codebase is built primarily through AI-assisted development (Claude Code). The builder is not a coder and does not read code directly. Over time, AI-assisted development accumulates predictable categories of cruft: deprecated exports that aren't deleted, unused dependencies, type-safety escape hatches, drift between database schema and product surface, and pattern inconsistency across files. None of these are individually critical, but they compound.

This audit is read-only. Do not fix anything during the audit. Findings produce a report; cleanup is a separate task that follows after Theo has reviewed and decided what to act on.

This audit is also focused on *code cleanliness*, not feature gaps. Feature-level review lives in `AUDIT_INSTRUCTIONS.md` and produces `AUDIT_FINDINGS.md`. The two audits are complementary; don't conflate them.

---

## 2. Stance

- **Code is ground truth.** Where comments, docs, or naming suggest one thing and the code does another, the code wins. Document the discrepancy.
- **Use tooling where it exists.** `npm audit`, `tsc --noEmit`, `eslint`, and similar tools give grounded findings. Run them and cite their output rather than eyeballing.
- **Honesty about uncertainty.** If a piece of code looks problematic but you can't determine intent, write that. Don't guess.
- **Concrete over generic.** "Function `foo` in `src/lib/bar.ts:42` is unused" beats "the codebase has unused functions." File paths and line numbers always.
- **Severity calibration matters.** Not everything is critical. Mark accurately so Theo can prioritize.

---

## 3. Audit phases

### Phase 1: Dead code and unused exports

What to look for:

- **Unused exports.** Functions, components, or constants exported from a file but never imported anywhere else. Use `grep` or similar to verify.
- **Deprecated exports still present.** Anything marked `@deprecated` that's still exported. Check whether it's still imported anywhere; if not, it's safe to remove.
- **Unreachable code.** Functions defined but never called, branches that can't be reached, code after `return` or `throw`.
- **Commented-out code blocks.** Multi-line code blocks commented out (vs explanatory comments). These are usually leftovers from edits.
- **Console.logs and debug statements.** `console.log`, `console.debug`, `console.warn` left in non-test code.
- **Unused files.** Entire files that aren't imported from anywhere. Useful command: find files in `src/` not referenced anywhere else in `src/`.
- **TODO/FIXME/HACK/XXX comments.** Surface these in findings — they're explicit acknowledgments of known issues the developer flagged for later.

Tooling: `eslint` with `no-unused-vars` rule. TypeScript's `noUnusedLocals` and `noUnusedParameters` if enabled in tsconfig.

### Phase 2: Dependency hygiene

What to look for:

- **Unused packages.** Packages listed in `package.json` but never imported. Run `npx depcheck` and cite its output.
- **Outdated packages with known vulnerabilities.** Run `npm audit` and cite output. Categorize by severity (critical, high, moderate, low).
- **Major version drift.** Packages where the installed version is multiple major versions behind current. Note them; don't auto-upgrade.
- **Duplicate or near-duplicate dependencies.** Two packages doing the same thing (e.g. `axios` and `node-fetch` both used for HTTP).
- **Heavy dependencies for small uses.** A 2MB package imported only for a one-line utility.
- **Lock file consistency.** `package-lock.json` (or `yarn.lock` / `pnpm-lock.yaml`) exists and is committed. No drift between lock file and `package.json`.

### Phase 3: Type safety and runtime safety

What to look for:

- **`any` types.** Explicit `any` in TypeScript code, especially in function signatures or exported types. Each one is a hole in the type system.
- **Unsafe type casts.** `as unknown as X` patterns, `as` casts that aren't validated at runtime.
- **`@ts-ignore` and `@ts-expect-error` comments.** Each one bypasses the type checker; verify they're still necessary.
- **Missing return types on exported functions.** Functions that don't declare their return type rely on inference, which can drift.
- **`!` non-null assertions.** Each one asserts something the type system thinks could be null. Verify the assertion is safe.
- **Optional chaining without fallback.** `a?.b?.c` patterns that return `undefined` when the chain breaks, with no fallback — often hides bugs.
- **Unhandled promise rejections.** `async` functions called without `await` or `.catch()`.
- **Empty catch blocks.** `try { ... } catch (e) {}` swallows errors silently. Flag each one.

Tooling: `tsc --noEmit` to surface type errors. `tsc --strict` for stricter checks. `eslint` with `@typescript-eslint` rules.

### Phase 4: Schema-code consistency

For this specific codebase (Supabase + TypeScript), look for:

- **Database columns not referenced in code.** Columns defined in `src/types/database.ts` (or wherever Supabase types live) that no TypeScript file reads or writes. Often indicates abandoned features (the snapshot model is the example from the previous audit).
- **Database tables not referenced.** Same as above for entire tables.
- **TypeScript types out of sync with database.** Last regeneration timestamp of `database.ts` vs last migration. If types are older than schema, they're stale.
- **Hardcoded SQL that doesn't match schema.** Raw SQL queries in code (if any) that reference columns or tables that don't exist or have been renamed.
- **Foreign keys without referential use.** Tables linked by foreign keys where one side of the relationship is never actually queried.

### Phase 5: Pattern consistency

What to look for:

- **Multiple ways to do the same thing.** Two different patterns for fetching data, two different patterns for error handling, two different patterns for component structure. Pick examples, don't enumerate every instance.
- **Naming inconsistency.** `camelCase` and `snake_case` mixed within the same context. `getThing` vs `fetchThing` vs `loadThing` for similar operations. File names mixing `kebab-case`, `camelCase`, and `PascalCase` without a clear convention.
- **Component structure drift.** React components written as functions vs as classes vs as exports of arrow functions, mixed without reason.
- **Import order chaos.** Some files alphabetize imports, others don't. Some group external vs internal, others don't. Not a bug, but signals the absence of a formatter.
- **Style/CSS approaches mixed.** Inline styles, CSS modules, Tailwind classes, styled-components all in use without clear separation.

Tooling: `prettier` for formatting, `eslint` with import-order rules.

### Phase 6: Security smells

What to look for:

- **Secrets in source.** API keys, passwords, tokens, or credentials hardcoded in files. Check both `.ts`/`.tsx` and any config files.
- **Environment variable leaks.** Variables prefixed `NEXT_PUBLIC_` that shouldn't be public (anything starting with `NEXT_PUBLIC_` is bundled and visible to the client).
- **Unauthenticated routes that should be protected.** API routes that perform sensitive operations (delete, modify, expensive compute) without checking authentication. The audit's UUID-access issue is an example of this category.
- **Unsanitized user input in queries.** Raw string interpolation into SQL queries rather than parameterized queries. (Less common with Supabase client; check any raw RPC calls.)
- **Unsanitized HTML rendering.** `dangerouslySetInnerHTML` in React without sanitization. `eval` or `Function()` constructor anywhere.
- **CORS configuration.** Overly permissive CORS headers on API routes (`Access-Control-Allow-Origin: *` on sensitive endpoints).
- **Rate limiting.** Public-facing routes without any rate limiting protection.

### Phase 7: Configuration and secrets management

What to look for:

- **`.env.local` correctly gitignored.** Verify `.gitignore` has the right patterns. Check `git ls-files` to confirm no `.env*` files are tracked.
- **Environment variables referenced but not documented.** Code uses `process.env.SOMETHING` but `SOMETHING` isn't in `.env.local.example` or any docs.
- **Magic numbers and strings.** Hardcoded values that should be config: timeout values, retry counts, file size limits, API endpoints, model names.
- **Inconsistent error messages.** Same error condition produces different user-facing messages in different parts of the codebase.

### Phase 8: Documentation-code drift

What to look for:

- **Stale code comments.** Comments describing what the code used to do, or describing intent that no longer matches behavior.
- **JSDoc/TSDoc out of sync.** Function signatures changed but the doc comment above still describes old parameters.
- **README claims that don't match.** README mentions commands, files, or features that don't exist or work as described.
- **Cross-file documentation references.** Comments referencing `// See foo.ts:123` where the line number has drifted.

### Phase 9: Build and tooling hygiene

What to look for:

- **Committed build artifacts.** `dist/`, `build/`, `.next/`, `out/` folders or contents committed to git.
- **OS-specific noise.** `.DS_Store` (macOS), `Thumbs.db` (Windows), `desktop.ini`, etc. committed.
- **Large binaries.** Files over 5MB in git history. Often accidentally committed images, video, or PDFs.
- **Editor configs missing or inconsistent.** No `.editorconfig`, `.prettierrc`, or similar. Or multiple configs disagreeing.
- **CI configuration drift.** Workflows referencing scripts or environments that no longer exist.

### Phase 10: Independent findings

Anything that doesn't fit the above categories but caught your attention while doing the audit. Be specific. This is the catch-all — use it for things that surprised you in the code.

---

## 4. Output format

Write findings to `CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md` in the repo root (e.g. `CODE_HYGIENE_FINDINGS_2026-05-29.md`). The date suffix lets multiple audits coexist for comparison over time.

Structure:

```
# Code Hygiene Findings — YYYY-MM-DD

**Auditor:** Claude Code
**Codebase commit:** [git rev-parse HEAD]
**Comparison to previous audit:** [if previous CODE_HYGIENE_FINDINGS_*.md exists, note key changes; otherwise "first run"]

## Summary
[3–5 sentence overview. Most important findings first.]

## Critical findings
Issues that affect security, data integrity, or actively break things.

### [Finding title]
**Category:** [Phase 1 / Phase 2 / etc.]
**Location:** [file path:line number, or git command to verify]
**What's wrong:** [Plain English]
**Impact:** [Why it matters]
**Suggested action:** [What a cleanup pass would do]

## Notable findings
Issues worth a cleanup pass, but not urgent.

[Same structure]

## Minor findings
Small cleanup items. Bundle together.

[Same structure]

## Tool output
Verbatim output from npm audit, tsc, eslint, depcheck, etc., for reference.

## Verified-as-clean
Brief list of dimensions checked that came up clean. Keep this short.
```

---

## 5. What good findings look like

**Good:**
> **Deprecated `legacyHttpClient` export still present.**
> Category: Phase 1 (dead code).
> Location: `src/lib/http.ts:14`, marked `@deprecated since v0.2`.
> What's wrong: Export still exists but `grep -r "legacyHttpClient" src/` shows zero imports.
> Impact: Adds maintenance burden, signals to readers that the pattern is supported.
> Suggested action: Delete the export. Verify with build that nothing breaks.

**Bad:**
> Some code might be unused. The codebase has some inconsistencies.

Each finding should have a path. Each finding should have an impact statement. Each finding should be actionable.

---

## 6. What NOT to do

- **Don't refactor.** This is a read-only audit. Findings only.
- **Don't surface stylistic preferences as findings.** Whether to use `function` declarations vs arrow functions is style, not hygiene, unless the codebase has a stated convention being violated.
- **Don't enumerate every instance of a pattern.** If there are 50 places using `any`, pick the 5 most impactful examples and note that "and ~45 others exist."
- **Don't audit dependencies you don't recognize.** If a package's purpose isn't clear from `package.json` and a quick search, flag it for human review rather than guessing.
- **Don't auto-upgrade dependencies even if `npm audit` recommends it.** Major version upgrades have breaking changes. Report; don't act.
- **Don't run the audit on test data, fixture files, or `legacy/` archives.** Scope to the active product surface (`src/`, root config files, etc.).

---

## 7. After the audit

Once `CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md` is written, Theo will review it with the external assistant. Outputs from that review may include:

- A cleanup PR that addresses critical and notable findings
- Updates to LIMITATIONS.md for issues that won't be fixed (e.g. security gaps deferred for productization)
- Updates to documentation for stale comments or README drift
- Confirmation that nothing needs to be done this cycle

Audits compare over time. A growing list of findings across successive audits is a signal that cleanup isn't keeping pace with new development. A shrinking list is a signal that hygiene is being maintained.

---

## 8. Honesty about the ceiling

This audit catches the categories listed above. It does not catch:

- Subtle logic bugs that aren't visible from code structure alone
- Performance issues that only surface under load
- Security issues that require threat-modeling rather than pattern-matching
- Architectural choices that don't scale (catchable in code review by a human engineer, not by pattern audit)
- Anything that requires understanding what the code *should* do versus what it does

For those, eventually you want a human engineer to review. This audit is the floor of code quality maintenance — it keeps the codebase from rotting under accumulated AI-generated changes. It is not a substitute for engineering judgment on the things that matter most.
