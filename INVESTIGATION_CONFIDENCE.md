# Investigation — `extraction_results.confidence`

**Date:** 2026-05-15
**Trigger:** `AUDIT_FINDINGS.md` § Uncertainties — "Whether `confidence` in `extraction_results` is ever populated."
**Source instructions:** `POST_AUDIT_INSTRUCTIONS.md` §2.1
**Outcome:** Column exists in schema, nothing writes to it, every trust score's `extractionConfidence` sub-score has been silently using the fallback `0.8` (rendered as 80) since the route shipped.

---

## SQL evidence

Schema, via `information_schema.columns` on the production Supabase (`chemjncvsjlhwtmexhge`):

| column | data_type | nullable | default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| run_id | uuid | NO | — |
| creative_id | uuid | NO | — |
| extracted_variables | jsonb | NO | `'{}'::jsonb` |
| **confidence** | **numeric** | **YES** | **(none)** |
| notes | text | YES | — |
| input_tokens | integer | NO | `0` |
| output_tokens | integer | NO | `0` |
| cost | numeric | NO | `0` |
| duration_ms | integer | YES | — |
| status | text | NO | `'pending'::text` |
| error_message | text | YES | — |
| created_at | timestamptz | NO | `now()` |

Population check:
```sql
SELECT
  COUNT(*) AS total_rows,
  COUNT(confidence) AS rows_with_confidence,
  AVG(confidence) AS avg_confidence,
  MIN(confidence), MAX(confidence),
  COUNT(DISTINCT confidence) AS distinct_values
FROM extraction_results;
```
Result:
```
total_rows: 0
rows_with_confidence: 0
avg_confidence: null
distinct_values: 0
```

The production database has zero extraction rows. The real backend has never been used with real data — every dashboard the operator has seen on the production app to date was empty-state. So the distribution check is uninformative on its own; the code path is the authoritative answer.

## Code evidence

`src/app/api/analysis/route.ts` is the only writer to `extraction_results`. Two insert paths:

**Successful extraction** — lines 298–307:
```ts
await supabase.from("extraction_results").insert({
  run_id: run.id,
  creative_id: creative.id,
  extracted_variables: result.extracted,
  input_tokens: result.inputTokens,
  output_tokens: result.outputTokens,
  cost,
  duration_ms: result.durationMs,
  status: "completed",
});
```

**Failed extraction** — lines 333–339:
```ts
await supabase.from("extraction_results").insert({
  run_id: run.id,
  creative_id: creative.id,
  extracted_variables: {},
  status: "failed",
  error_message: errorMsg,
});
```

Neither path sets `confidence`. The Claude Haiku tool_use response (returned from `analyseCreative()`, route.ts:139–144) returns `{ extracted, inputTokens, outputTokens, durationMs }` — no confidence value because tool_use responses don't include one. Anthropic's tool_use API doesn't surface model self-confidence; that's a feature of `extended_thinking` or of post-hoc scoring, neither of which this code uses.

## Downstream impact

`src/app/api/dashboard/route.ts:177` (per Agent B's audit pass) reads:
```ts
const avgConf = avg(extractions.map((e) => e.confidence ?? 0.8));
```

So:
- Every extraction row has `confidence = NULL`
- The fallback `0.8` kicks in for every row
- `avgExtractionConfidence` is always `0.8`
- The trust-score `extractionConfidence` sub-score is always `80` (after the `× 100` in `computeTrustScore`)
- Post-Fix 4, this contributes to `upperScore × 0.3` in the floor-gated composite. The sub-score's variability is dead — it doesn't measure anything.

## Severity

**Cosmetic / honesty issue, not a functional bug.** The dashboard's trust score still functions; the `extractionConfidence` sub-score just doesn't measure what its name implies. A reader inspecting the trust-bars sees "Extraction confidence: 80" and assumes the AI was reasonably confident in its extractions. They're looking at a fallback constant.

It matters more after Fix 4 than it did before. Before Fix 4, `extractionConfidence` was 1 of 6 weighted contributors at 0.15 — its constancy got smeared into the average. Post Fix 4, it's 1 of 3 contributors to `upperScore` weighted at 0.3, so it inflates `upperScore` more visibly.

## Recommendation

Two viable directions. **Not implementing either in this commit cycle** per the post-audit instructions — the investigation report is the deliverable for §2.1. Both options are documented for the operator to decide which to act on next.

### Option A — Remove the column and the fallback

The cleanest fix. Anthropic's tool_use API doesn't give a confidence score; there's nothing real to wire up. Better to be honest about the trust-score sub-score being five components, not six.

Steps (out of scope for this commit):
1. Migration: `ALTER TABLE extraction_results DROP COLUMN confidence;`
2. Migration: drop `notes` too if also unused.
3. Update `computeTrustScore` in `src/lib/analytics.ts` to take 5 sub-scores instead of 6. Re-weight `upperScore`: `volume × 0.5 + bucketBalance × 0.5` (or similar — drop extractionConfidence entirely).
4. Update `TrustScorePanel` to render 5 bars instead of 6.
5. Update `ANALYSIS_METHODOLOGY.md` §3.4.

### Option B — Wire up an actual confidence signal

Compute a proxy at extraction time. Candidates that *would* be real:
- **Per-extraction schema completeness ratio** — number of variables the model populated divided by number of variables the schema requested. Misses (null/empty/missing) drop the ratio.
- **Enum-fallback rate** — count of variables where the model picked the explicit `"other"` enum option (often a signal of low confidence). 1 − rate.
- **Reply-length proxy** — output_tokens against some baseline. Crude but real.

The schema-completeness ratio is the most defensible. Easy to implement: after the tool_use response, count how many of the declared variables have non-null values, divide by total declared. Set `confidence = ratio` on the insert.

Steps (out of scope for this commit):
1. In `analyseCreative()` (route.ts ~139), compute `const confidence = computeCompleteness(result.extracted, schema.variables)`.
2. Add to the insert: `confidence`.
3. Update the methodology paper §3.4 to describe what the new confidence sub-score actually measures.

### My recommendation

**Option A.** It matches the project's "honest about limitations" stance better than Option B's proxy. The proxy is real but is also slightly misleading — schema-completeness measures whether the model declined to answer, not whether the model is confident in its answers. A clean five-bar trust score is more transparent.

The operator should decide. Either way, do it as a follow-up after the current Phase 2 work lands. The fallback `0.8` is stable, harmless, and unblocked from shipping the rest of the post-audit work.

## Acceptance per the post-audit instructions

- [x] SQL query run against production
- [x] Code path examined for write sites
- [x] Decision recommended
- [x] `INVESTIGATION_CONFIDENCE.md` written
- [x] No code changes made in this commit cycle (per §2.1 "Do not act on the recommendation")
