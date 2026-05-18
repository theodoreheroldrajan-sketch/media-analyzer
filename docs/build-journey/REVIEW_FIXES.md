# Implementation Spec — Review-Identified Fixes

**Project:** Creative Media Analyzer
**Source:** Review conversation, May 2026
**Status:** Ready for implementation
**Intended reader:** Claude Code, or a developer working with one

---

## Purpose of this document

Six issues were identified during external review of the methodology paper, PRD, and roadmap. This document specifies the implementation of each fix at a level Claude Code can act on directly. It is not the definitive design — Theo should review each section and override any approach he disagrees with before implementation begins.

Each fix is self-contained. Point Claude Code at one section at a time rather than handing it the whole document — the fixes have different file footprints and acceptance criteria, and they're easier to land cleanly one at a time. The Coordination Notes section at the end flags the only ordering dependencies.

## Suggested order of implementation

1. **Fix 6** — Bootstrap CIs on Lite deltas (highest impact-per-effort, fully isolated)
2. **Fix 1** — Model stability indicator (isolated, becomes teaching surface)
3. **Fix 4** — Trust score gating restructure (isolated, single-file logic)
4. **Fix 3** — Pre-registration of hypothesis variables (schema change; upstream of Fix 5)
5. **Fix 5** — Lite "top findings" restructure (depends on Fix 3)
6. **Fix 2** — Pro UI plain-English translation (deferred pending user test)

Rationale: ship the three isolated fixes first to de-risk the schema-changing one. Defer Fix 2 because it depends on validating an assumption with a real user, not on writing code.

---

## Fix 1 — Model stability indicator

### Problem
The 100-creative threshold for Pro mode is below the methodology paper's own cited rule of 5–10 observations per predictor. With ~25 predictors after one-hot encoding (plus planned interactions), the actual statistical floor is 125–300, not 100.

### Approach
Keep 100 as the UX unlock trigger — changing it would invalidate design copy and confuse the unlock moment. Add a separate "model stability" indicator surfaced inside Pro mode, computed from the actual N/predictor ratio after the user finalizes their enabled variables.

### Files affected
- `src/lib/analytics.ts` — add the calculation
- The Pro dashboard component — render the indicator with a tooltip
- The variable schema builder — trigger recomputation when variables are enabled/disabled

### Logic
```typescript
function computeModelStability(creativeCount: number, predictorCount: number): 'green' | 'yellow' | 'red' {
  if (predictorCount === 0) return 'red';
  const ratio = creativeCount / predictorCount;
  if (ratio >= 10) return 'green';
  if (ratio >= 5) return 'yellow';
  return 'red';
}
```

### Predictor count calculation
Sum of:
- Enabled boolean variables (1 predictor each)
- Enabled enum variables × (number of levels − 1, dropping reference category)
- Enabled integer variables (1 predictor each)
- Interaction terms in scope (count separately)

Strings are excluded per existing schema rules.

### Acceptance criteria
- Indicator visible at the top of the Pro dashboard alongside the trust score
- Tooltip text: "Statistical reliability of the regression depends on observations per predictor. Green: 10+ observations per predictor. Yellow: 5–10 (regularization recommended). Red: under 5 (results not reliable)."
- Indicator updates reactively as the user enables/disables variables
- Indicator does **not** block Pro mode entry — that stays gated on the 100-creative threshold

---

## Fix 2 — Pro UI plain-English translation (deferred)

### Problem
The stated persona is non-technical ("comfortable in ad platforms but not Python or R") but the Pro insights panel references coefficients and p-values inline. Either the persona description is wrong or the Pro UI needs translation.

### Pre-implementation check (required before writing code)
Conduct one structured conversation with an actual high-spend operator (£100k+ monthly spend). Show them the current mocked Pro UI. If they read the coefficients comfortably and understand them, the persona description is wrong — update the PRD instead of translating the UI. If they don't, proceed with the translation approach below.

### Approach (if translation is needed)
Plain-English narration as the default Pro insights view, with a "show coefficients" toggle for analysts.

### Files affected
- New file: `src/lib/insights-narration.ts` — translates regression output to operator-facing language
- Pro insights panel component — default to narration view, toggle for raw coefficients

### Narration patterns (examples)
- Strong positive: "X is the strongest positive signal we've seen for {metric} in this dataset. On a sample this size the real effect could be meaningfully smaller, but the direction is clear."
- Weak/uncertain: "X shows a pattern in this dataset but the signal is weak. Treat as a hypothesis to test on more data."
- Negative: "X is associated with worse {metric} in this dataset. The direction is clear though the size is uncertain."

### Acceptance criteria
Held until the pre-implementation check is complete. Spec preserved here so the fix can be picked up when the persona question is resolved.

---

## Fix 3 — Pre-registration of hypothesis variables

### Problem
The current setup treats all variables as equally exploratory, which (1) exposes the user to multiple-comparisons noise on every dashboard run and (2) prevents principled application of FDR correction.

### Approach
During project setup, ask the user to flag 3–5 variables they have a specific hypothesis about. Store as a project attribute. Use this distinction to (a) order dashboard output and (b) apply Benjamini-Hochberg FDR correction only to the exploratory rest in Pro mode.

### Files affected
- Database schema: add `pre_registered_variables` JSONB column to the `projects` table, default `[]`
- Database types regenerated
- Setup wizard: add an optional step (or extend the existing variable selection step) — "Which 3–5 variables are you specifically testing? Optional — leave empty if exploring."
- `src/lib/analytics.ts` — read pre-registered list, partition variables into registered/exploratory
- Pro analytics path — apply BH-FDR correction to p-values of exploratory variables only

### BH-FDR procedure
```
sortedExploratory = exploratoryPValues.sort((a, b) => a.p - b.p)
adjusted = sortedExploratory.map((entry, i) =>
  Math.min(1, entry.p * sortedExploratory.length / (i + 1))
)
significantAtFDR = adjusted.filter(p => p < 0.05)
```

Display both raw and BH-adjusted p-values in the Pro coefficient table. Use the adjusted value for the significance flag.

### Acceptance criteria
- Setup wizard has a clear, optional "hypothesis variables" field
- Schema migration applied cleanly; existing projects default to empty
- Pro mode shows pre-registered variables in a separate section above exploratory
- Exploratory p-values display both raw and BH-adjusted values
- Significance flag uses the adjusted value, not the raw one

---

## Fix 4 — Trust score gating restructure

### Problem
The composite trust score is a weighted average of six sub-scores. This means a dataset with 40% mapping quality can still score "Good" if other sub-scores are strong. Mapping quality, data completeness, and creative count are floor conditions — they should gate the score, not contribute to it.

### Approach
Restructure as: `composite = min(creative_count, mapping_quality, data_completeness) × weighted_average(volume, extraction_confidence, bucket_balance)`. Keep all six sub-score bars prominent in the UI.

### Files affected
- `src/lib/analytics.ts` — modify the trust score calculation
- Trust score component in the dashboard — sub-score bars stay visible regardless of composite

### Calculation
```typescript
const floorScore = Math.min(
  creativeCountScore,
  mappingQuality,
  dataCompleteness
); // each 0-100

const upperScore =
  volume * 0.4 +
  extractionConfidence * 0.3 +
  bucketBalance * 0.3; // re-normalized weights summing to 1

const composite = Math.round(floorScore * (upperScore / 100));
```

### Acceptance criteria
- A dataset with mapping quality of 40 cannot produce a composite score above 40
- All six sub-score bars remain visible in the UI regardless of composite value
- Tooltip explains: "Trust score is gated by mapping quality, data completeness, and creative count. If any of these is low, the overall score reflects that. Other factors contribute proportionally."

---

## Fix 5 — Lite "top findings" restructure

### Problem
The current Lite dashboard surfaces "top findings by absolute delta" across 60–80 implicit comparisons (24+ variables × multiple enum values × 5 metrics). This is statistical data dredging in practice. Several "top findings" are noise.

### Approach
Restructure into two sections. (1) Pre-registered variables (from Fix 3) shown first with their actual deltas and confidence intervals. (2) "Patterns to Investigate" — exploratory findings explicitly labelled as hypothesis-generating, ranked by noise-adjusted effect size.

### Files affected
- `src/lib/analytics.ts` — add noise-adjusted ranking function
- Lite dashboard component — restructure into two sections
- Insights panel — adjust copy to reflect the new framing

### Noise-adjusted ranking
Use `|delta| × sqrt(n)` as the primary sort key for exploratory findings. This penalizes small-N findings even when their absolute delta is large. A 30% delta from n=3 ranks below a 15% delta from n=20.

### Acceptance criteria
- Pre-registered variables section appears first, labelled "Hypotheses tested"
- Exploratory section labelled "Patterns to investigate — hypothesis-generating only"
- Exploratory ranking uses noise-adjusted effect size, not raw delta
- Both sections show delta, n, and confidence label per existing format
- The current "Top Findings" copy is replaced; the framing of Lite outputs as inferential is removed throughout

---

## Fix 6 — Bootstrap confidence intervals on Lite deltas

### Problem
Lite shows point estimates with no error bars. Small-N users see "Group A has 22% higher CTR" with no sense of how uncertain that estimate is. The path where statistical noise dominates is the path hiding noise from the user.

### Approach
Compute bootstrap confidence intervals on every delta in Lite. 1000 iterations per delta. Display as visual error bars on the variable explorer chart and as numeric ranges in the performance table.

### Files affected
- `src/lib/analytics.ts` — add the bootstrap function
- Variable explorer chart component — render error bars on the bar chart
- Variable performance table component — add CI columns

### Bootstrap procedure
```typescript
function bootstrapDeltaCI(
  groupCreatives: Creative[],
  overallCreatives: Creative[],
  metric: Metric,
  iterations = 1000
): { delta: number; lower95: number; upper95: number } {
  const deltas: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const groupSample = resampleWithReplacement(groupCreatives, groupCreatives.length);
    const overallSample = resampleWithReplacement(overallCreatives, overallCreatives.length);
    const groupMetric = computeVolumeWeightedMetric(groupSample, metric);
    const overallMetric = computeVolumeWeightedMetric(overallSample, metric);
    deltas.push(((groupMetric - overallMetric) / overallMetric) * 100);
  }

  deltas.sort((a, b) => a - b);
  return {
    delta: deltas[Math.floor(deltas.length / 2)],
    lower95: deltas[Math.floor(deltas.length * 0.025)],
    upper95: deltas[Math.floor(deltas.length * 0.975)],
  };
}
```

Use the existing volume-weighted aggregation (sum-of-raws, not mean-of-rates) inside the bootstrap. Don't re-derive it.

### Acceptance criteria
- Every delta shown in Lite has an accompanying 95% CI
- Visual error bars on the variable explorer chart
- Numeric CI columns in the performance table (display as "+22% [+8%, +35%]")
- Performance acceptable on datasets up to ~150 creatives (per Vercel Hobby constraints — benchmark before shipping)
- The methodology paper's "No confidence intervals on Lite deltas" limitation can be removed after this ships

---

## Coordination notes

- **Fix 3 is upstream of Fix 5.** Implement Fix 3 first so Fix 5 has the pre-registration data to read.
- **Fix 6 closes a stated limitation.** Update the methodology paper after it ships.
- **Fix 2 requires user testing.** Don't block other fixes on it.
- **The methodology paper is a release artifact.** When fixes land in code, update the paper in the same commit. The two should never drift.

## Out of scope for this document

- Tree-based methods or non-OLS modelling — flagged in the original review but not pursued here. OLS is what the methodology paper commits to; revisit when a real 100+ dataset arrives.
- Causal identification — the tool is correlational by design.
- Real-time platform integration — explicitly out of v1 scope per the PRD.
