# Self-Audit Instructions for Claude Code

**Target:** Creative Media Analyzer codebase
**Purpose:** Find limitations that document-only review missed
**Output:** AUDIT_FINDINGS.md in this repo
**Reader of output:** Theo and the external review assistant (Claude in chat)

---

## 1. Context

External review of this project was conducted by Claude (chat assistant, not Claude Code) working only from three PDF documents: the methodology paper, the PRD, and the roadmap. That review produced:

- `REVIEW_FIXES.md` — six implementation specs for issues identified in review
- `METHODOLOGY_v2.md`, `PRD_v2.md`, `LIMITATIONS.md` — forward-looking specifications for post-fix state

During the review conversation, one significant miss was caught: the external reviewer assumed user-defined variables would need to be added in a future version and didn't realize the "Custom variables" section already exists in the setup wizard. The pattern this miss suggests — documentation-only review has blind spots that only code access can resolve — is what this audit exists to address.

You have full access to the codebase. The documents above are inputs, not authority. The code is ground truth. Your job is to find what document-only review couldn't catch.

---

## 2. Stance

- **Code wins over docs.** Where they disagree, document the disagreement and flag the doc as needing update.
- **You are encouraged to disagree with the proposed fixes.** If REVIEW_FIXES.md specifies something that won't work given the actual code structure, say so. If a better fix is obvious from the code, propose it.
- **Honesty about uncertainty.** If part of the code is unclear or you can't determine intent, write that. Don't guess.
- **Bias toward finding things.** The point of this audit isn't to confirm the docs. It's to find what was missed. Confirmations are less interesting than disagreements.

---

## 3. Audit phases

### Phase 1: Documentation-vs-code drift

For each claim in the existing docs (PDFs and v2 markdown), verify against the implementation. Specifically check:

- The 24 universal variables described in `METHODOLOGY_v2.md` section 2 — do all 24 exist in the variable_schemas defaults? Are the types and enums as described?
- The 10 category templates — do all 10 exist? Do they include the variables claimed?
- The six-method matching cascade — are all six methods implemented? Are they applied in the order claimed?
- The trust score formula (current and v2) — does the calculation in `src/lib/analytics.ts` match what's documented?
- The 100-creative threshold — is it actually hard-coded at line 237 of `src/app/api/dashboard/route.ts` as the v1 methodology claims?
- The streaming NDJSON extraction approach — confirm it's running on Node.js runtime, not Edge.
- The cost tracking — confirm Haiku 4.5 rates are used and per-image cost is computed.

Flag any drift between documentation and implementation. Drift in either direction matters.

### Phase 2: Fix feasibility verification

For each of the six fixes in REVIEW_FIXES.md, verify:

- **File paths exist.** The fix references `src/lib/analytics.ts`, `src/app/api/dashboard/route.ts`, etc. Confirm these files exist where claimed.
- **The "current behaviour" the fix is correcting is actually current behaviour.** For example, Fix 4 (trust score restructure) assumes the current composite is a weighted average. Verify that's true in the code.
- **The proposed implementation is compatible with the existing architecture.** For example, Fix 3 (pre-registration) assumes a JSONB column can be added to the projects table without breaking existing code. Check what relies on that table.
- **No existing feature does what the fix proposes to add.** This is the custom-variables-style check: does pre-registration already exist in some form? Does a model stability indicator already exist? Does any per-variable confidence display exist?

If a fix is misspecified or would conflict with existing code, document the issue and propose an amendment.

### Phase 3: v2 documentation accuracy

For each claim in `METHODOLOGY_v2.md`, `PRD_v2.md`, and `LIMITATIONS.md`, verify:

- Claims about current implementation (sections marked "unchanged from v1," for example) match the code.
- Claims about new behaviour (the v2 fixes) are achievable given the architecture — i.e., the docs aren't promising something the fixes can't deliver.
- Cross-references between docs are consistent.

### Phase 4: Custom-variables-style misses

This is the load-bearing phase. Look for the class of error the custom variables miss represents: features that exist in code but aren't well-documented, or features that documentation describes incorrectly because the reviewer couldn't see the implementation.

Specifically scan for:

- **Setup wizard features** the external review didn't reference. The wizard has 9 steps; the review treated several as black boxes.
- **Database schema features** that aren't in the docs. Columns, tables, indexes, constraints, triggers — anything that affects what the product can do.
- **Existing user-facing features** not mentioned in the PRD's feature list.
- **AI extraction details** beyond what the methodology covers — confidence thresholds, retry logic, error handling, schema validation paths.
- **Configuration and feature flags** that affect product behaviour.
- **Helper utilities** in `src/lib/` that suggest capabilities not surfaced in the UI.
- **Comments in the code marked TODO, FIXME, HACK, XXX** — these are usually known limitations the developer flagged but didn't necessarily document elsewhere.

Each finding here is most valuable when it could change a proposed fix or reveal a limitation the team didn't know they had.

### Phase 5: Independent limitation discovery

Without referencing existing documentation, examine the codebase and identify limitations on your own. Categories to consider:

- **Error handling gaps.** What happens when the Anthropic API fails mid-batch? What happens when a CSV is malformed? What happens if Supabase storage is at quota?
- **Edge cases.** What happens with 0 creatives, 1 creative, 1000 creatives? With CSVs that have all-zero rows? With images that fail extraction?
- **Performance ceilings beyond Vercel Hobby limits.** Where does the dashboard rendering start to slow? Where does the bootstrap CI computation become noticeable (relevant for Fix 6)?
- **Security and privacy concerns.** Are there places where user data leaks across projects? Where service role keys are exposed? Where unauthenticated paths can hit expensive operations?
- **Accessibility.** Is the dashboard usable with screen readers? Keyboard-only?
- **Data integrity.** Can a partial extraction leave the database in an inconsistent state? What happens if a project is deleted mid-extraction?
- **Concurrency.** What happens if two extractions run simultaneously on the same project?

These are independent of the documentation. Whatever you find, write it.

---

## 4. Output format

Write findings to a new file: `AUDIT_FINDINGS.md` in the repository root.

Use this structure:

```
# Audit Findings — Code-Level Review

**Auditor:** Claude Code
**Date:** [today's date]
**Codebase commit:** [git rev-parse HEAD]
**Documents reviewed:** [list]

## Summary
[2–3 sentence overview of the most important findings]

## Critical findings
Findings that affect whether a proposed fix can ship as specified.

### [Finding title]
**Claim or assumption:** [What the docs / fixes claimed]
**Code reality:** [What the code actually does]
**Why this matters:** [Consequence]
**Suggested action:** [Amendment, new fix, doc update, etc.]

## Notable findings
Findings worth amending fixes or docs for, but not blockers.

[Same structure]

## Minor findings
Small drift, comment-level TODOs, doc cleanup suggestions.

[Same structure]

## Custom-variables-style misses
Features that exist in code but were missed or mis-described by document-only review.

[Same structure]

## Independent limitations
Limitations discovered without reference to existing docs.

[Same structure]

## Uncertainties
Places where the code is unclear and you weren't able to determine intent.

## Verified-as-claimed
Brief list of things the docs got right. Keep this section short — it's the least interesting part of the audit.
```

---

## 5. What good findings look like

Specific, code-grounded, actionable. Reference file paths and line numbers where relevant. Quote short snippets where useful.

**Good finding example:**
> Fix 3 (pre-registration) proposes adding a `pre_registered_variables` JSONB column to `projects`. The projects table currently has [column list]. Adding the column is straightforward, but the setup wizard's step 2 (`src/app/setup/page.tsx`) doesn't currently have a step for variable hypothesis declaration — Fix 3 will need to add this as a wizard step or extend step 6 (Variables). The fix description is ambiguous on which approach to take; recommend wizard step at position 2.5 because the user needs to declare hypotheses before they see the AI-extracted variables.

**Bad finding example:**
> The trust score might have issues.

---

## 6. What NOT to do

- Don't audit the code style or refactoring opportunities. This audit is about limitations, not engineering hygiene.
- Don't propose entirely new features unprompted. If a missing feature is implied by an existing limitation, flag it as such.
- Don't fix anything. This is a read-only audit. Recommendations are written, not implemented.
- Don't pad the report. Empty sections are fine — write "No findings in this phase" if that's accurate.

---

## 7. After running

Once `AUDIT_FINDINGS.md` is written, Theo and the external reviewer will study it together. Findings may produce:

- Amendments to `REVIEW_FIXES.md` for fixes that need to be respecified
- New fixes (Fix 7, Fix 8, etc.) for limitations the document-only review missed
- Updates to the v2 documents to reflect actual code state
- Net-new limitations to add to `LIMITATIONS.md`
- Confidence that some proposed fixes can ship as specified

The audit output is a working document for that conversation, not a final deliverable. Be thorough rather than polished.
