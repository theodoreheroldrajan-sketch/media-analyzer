# Creative Media Analyser: Analysis Methodology

Author: Theo Rajan
Date: 2026-05

## Document purpose

This document explains the statistical and analytical methodology behind the Creative Media Analyser. The project is open source (MIT) and built in public, so this document is also the methodology under public review. It is intended to be read by anyone with a background in regression modelling, data analysis, applied statistics, or econometrics who wants to review, critique, or improve the approach. The questions in section 8 are genuine open questions; informed pushback is welcome via GitHub issues or discussions.

## 1. What the tool does

The Creative Media Analyser takes two inputs:

- Creative images: the actual ad creative files (PNG/JPG) used in paid campaigns.
- Performance data: a CSV export from an ad platform (Meta Ads, Google Ads) containing metrics like impressions, clicks, spend, conversions, and revenue per creative.

The tool then:

1. Matches each creative image to its performance row using filename/ID matching.
2. Extracts structured variables from each image using AI vision (Claude Haiku 4.5). Example: "Is a human present? Yes. Is there a CTA? Yes. What is the colour palette? Warm. What is the message angle? Benefit."
3. Analyses how each variable value correlates with a chosen performance metric (CTR, CPC, CPA, CVR, or ROAS).

End goal: tell a performance marketer which creative patterns ("warm colours", "human face visible", "urgency cue present") are associated with better ad performance, so they can make informed creative decisions.

## 2. Variables extracted

For each creative image, the AI extracts 24 universal variables plus 4 to 6 category-specific variables (depending on industry). Variable types:

| Type | Example variables | Cardinality |
|---|---|---|
| Boolean | `human_present`, `cta_present`, `logo_visible`, `urgency_cue`, `social_proof` | 2 values (true/false) |
| Enum | `colour_palette` (warm, cool, neutral, vibrant, muted, dark, light), `message_angle` (benefit, feature, problem_solution, testimonial, lifestyle, comparison, emotional, other) | 3 to 8 values |
| Integer | `number_of_people` | Continuous-ish, low cardinality in practice (0 to 5) |
| String | `primary_hook`, `cta_text`, `primary_visual_subject` | Free text, high cardinality |

All variables are converted to strings for grouping. Boolean variables become the strings `"true"` and `"false"`. Integer variables are stringified.

## 3. Performance metrics

Five metrics are available for analysis. All are computed as aggregates across the creatives in each group:

| Metric | Formula | Direction |
|---|---|---|
| CTR | `(sum_clicks / sum_impressions) * 100` | Higher is better |
| CPC | `sum_spend / sum_clicks` | Lower is better |
| CPA | `sum_spend / sum_conversions` | Lower is better |
| CVR | `(sum_conversions / sum_clicks) * 100` | Higher is better |
| ROAS | `sum_revenue / sum_spend` | Higher is better |

Note: metrics are computed from summed raw values within each group, not as an average of per-creative metrics. For example, if a group has two creatives, one with 10,000 impressions and 200 clicks, another with 500 impressions and 50 clicks, the group CTR is `(250 / 10,500) * 100 = 2.38%`, not the average of the two individual CTRs. This is intentional: it weights by volume, so a creative with 10x more impressions contributes 10x more to the group metric.

## 4. Current analysis method: group-by comparison

### 4.1 How it works

For each variable, the system:

1. Groups all creatives by their extracted value for that variable.
2. Computes the chosen metric (e.g. CTR) for each group using summed raw values.
3. Computes the same metric across all creatives (the overall average).
4. Calculates a percentage delta for each group vs the overall:

```
delta = ((group_metric - overall_metric) / overall_metric) * 100
```

Example: if overall CTR is 2.0% and creatives with `human_present = true` have a CTR of 2.6%, the delta is +30%, meaning "creatives with a visible human have 30% higher CTR than the average."

Results are sorted by absolute delta (largest impact first), giving the marketer a ranked list of which variable values matter most.

### 4.2 Confidence assignment

Confidence is assigned based purely on sample size (number of creatives in the group):

| Sample size (n) | Confidence label | Interpretation |
|---|---|---|
| n < 3 | Insufficient | Excluded from charts; shown with placeholder values ("—") in the variable performance table for transparency |
| n = 3 to 4 | Low | Treat as hypothesis only |
| n = 5 to 9 | Medium | Directionally useful |
| n >= 10 | High | More reliable for decision-making |

### 4.3 Limitations of the current approach

This is a descriptive analysis. It reports observed differences but does not establish statistical significance or causation. Specific limitations:

1. **No hypothesis testing.** No t-tests, chi-square tests, or p-value calculations. The tool reports that Group A has a higher CTR than Group B but does not test whether this difference could have arisen by chance.
2. **No confidence intervals on the group metric itself** (though bootstrap CIs on deltas were added in Fix 6). A group with n=5 and a group with n=50 are otherwise treated with the same precision in the point estimate.
3. **No effect size standardisation.** Raw percentage delta is used, not Cohen's d or similar. This makes it hard to compare the magnitude of effects across variables with different scales.
4. **No multiple comparison correction in Lite.** With 24+ variables, each with multiple values, the tool makes dozens of implicit comparisons. Without a Bonferroni correction or FDR control, some apparent "top findings" are likely noise. Pro mode applies BH-FDR to the regression output; Lite stays uncorrected by design.
5. **No interaction effects in Lite.** Variables are analysed independently. Pairs like "warm colours + urgency cue" cannot be distinguished from the sum of their individual effects.
6. **No volume weighting in the confidence label.** A group with 3 creatives that each have 100,000 impressions is labelled "low confidence" (n=3), while a group with 10 creatives at 100 impressions each is "high confidence" (n=10). The former arguably has more statistical power.
7. **No temporal dimension.** All data is treated as a single cross-section. Seasonality, fatigue, and platform algorithm changes are unmodelled.
8. **No missing data handling.** Creatives with null values for a variable are silently excluded from that variable's analysis. If missingness is non-random (e.g. the AI cannot extract `cta_text` when there is no CTA), this biases the groups.

## 5. Trust score

The dashboard displays a "Dataset Trust Score" (0 to 100) as a composite quality indicator. It is not a statistical measure; it is a heuristic to help the user understand how much they should trust the results.

### 5.1 Sub-scores

| Sub-score | Formula | Interpretation |
|---|---|---|
| Creative count | `min(100, (n_creatives / 50) * 100)` | Linear scale: 50 creatives = perfect score |
| Impression volume | `min(100, (log10(total_impressions) / 6) * 100)` | Log scale: 1M impressions = perfect score |
| Mapping quality | `(confirmed_mappings / total_creatives) * 100` | % of creatives successfully linked to performance data |
| Data completeness | `(creatives_with_impressions_and_spend / total_creatives) * 100` | % of creatives with non-zero core metrics |
| Bucket balance | `((total_groups - groups_with_n_lt_3) / total_groups) * 100` | % of variable-value groups with sufficient sample size |

### 5.2 Overall score

The composite is floor-gated and uses five sub-scores. The first three (creative count, mapping quality, data completeness) are floor conditions: the composite cannot exceed the worst of them. The remaining two (volume, bucket balance) contribute proportionally on top of that floor.

```
floor_score = min(creative_count, mapping_quality, data_completeness)
upper_score = volume_score * 0.5 + bucket_balance * 0.5
trust_score = round(floor_score * (upper_score / 100))
```

A dataset with mapping quality of 40 cannot score above 40 regardless of how strong the other components look. This closes the previous failure mode where a low mapping rate could be averaged away to "Good."

All five sub-scores remain visible in the trust panel UI regardless of the composite. The floor-gating only affects the headline number.

Removed sub-score (extraction_confidence): an earlier revision had a sixth sub-score derived from `extraction_results.confidence`. The Anthropic tool_use API does not return a self-confidence score, so that column was never populated and the sub-score was effectively a constant 80. The column and the sub-score were both removed on 2026-05-15. See the appendix in `docs/build-journey/POST_AUDIT_COMPLETION.md` for the investigation that led to the change.

### 5.3 Trust levels

| Score range | Label |
|---|---|
| 80 to 100 | Excellent |
| 60 to 79 | Good |
| 40 to 59 | Fair |
| 0 to 39 | Poor |

## 6. Proposal: regression analysis at 100+ creatives

The current group-by approach is appropriate for small datasets (20 to 50 creatives) where there are not enough data points to fit a regression model. At 100+ creatives, the proposal is to add multiple linear regression. The Pro UI in the demo shows what this would look like; the production backend is gated on the first real 100+ creative dataset arriving.

### 6.1 Why 100 creatives?

For a regression model with roughly 25 independent variables:

- Rule of thumb: 5 to 10 observations per predictor for stable estimates.
- 25 variables × 4 observations minimum = 100 data points.
- This is conservative for OLS but provides a reasonable starting point for exploratory analysis.
- With dummy encoding of enum variables, effective predictor count may be higher, so 100 is a floor, not an ideal.

### 6.2 Proposed model: multiple linear regression (OLS)

**Dependent variable (Y):** the chosen performance metric (CTR, CPC, CPA, CVR, or ROAS), computed per creative.

**Independent variables (X):** the extracted creative variables, encoded as follows:

| Variable type | Encoding | Example |
|---|---|---|
| Boolean | Binary dummy (0/1) | `human_present` becomes 0 or 1 |
| Enum | One-hot encoding with reference category dropped | `colour_palette` with 7 values becomes 6 dummy variables, one chosen as baseline |
| Integer | Used as-is (continuous) | `number_of_people` as 0, 1, 2, ... |
| String | Excluded from regression (too high cardinality) or grouped into categories if feasible | `primary_hook` excluded; `cta_text` potentially categorised |

Model form:

```
Y_i = beta_0 + beta_1 * X_1i + beta_2 * X_2i + ... + beta_k * X_ki + epsilon_i
```

Where:

- `Y_i` = metric for creative i
- `X_ji` = value of predictor j for creative i
- `beta_j` = coefficient (effect of predictor j on Y, holding all others constant)
- `epsilon_i` = error term

### 6.3 Dummy variable considerations

Boolean variables (e.g. `human_present`, `cta_present`) are dummy variables: they take values 0 or 1. A regression coefficient for a boolean tells you "on average, creatives with this feature have `beta_j` higher/lower metric than creatives without, controlling for other variables."

However, boolean variables on their own have limited explanatory power in regression when they need a continuous variable to interact with for meaningful visualisation. A scatterplot of a boolean vs CTR is just two vertical clusters of points. The coefficient is interpretable but the relationship cannot be visualised as a line. This is why interaction terms matter (see 6.4).

### 6.4 Interaction terms

Key interactions to test:

1. **Boolean × Boolean:** e.g. `human_present × urgency_cue`. Does having both a human face AND urgency language perform differently than either alone?
2. **Boolean × Enum:** e.g. `cta_present × message_angle`. Does having a CTA interact with the messaging approach?
3. **Boolean × Continuous:** e.g. `human_present × number_of_people`. Does the presence of a human matter differently depending on how many people are shown?

Model form with interactions:

```
Y_i = beta_0 + beta_1 * human_present_i + beta_2 * urgency_cue_i
      + beta_3 * (human_present_i * urgency_cue_i) + ... + epsilon_i
```

Where `beta_3` captures whether the combined effect of human presence + urgency is different from the sum of their individual effects.

**Feature selection:** with 25+ main effects and potentially hundreds of interactions, the tool needs a selection strategy:

- Start with main effects only.
- Add interactions between the top 5 to 10 most significant main effects.
- Use adjusted R-squared or AIC/BIC to evaluate model fit vs complexity.
- Consider stepwise selection or LASSO regularisation for high-dimensional cases.

### 6.5 Interpretation outputs

For the user (a performance marketer, not necessarily a statistician), the tool would present:

1. **Coefficient table:** each variable, its coefficient, standard error, t-statistic, and p-value. Translated into plain language: "Having a visible human face is associated with +0.3% higher CTR (p = 0.02), holding all other variables constant."
2. **Variable importance ranking:** variables sorted by absolute t-statistic or standardised coefficient.
3. **Interaction insights:** "Creatives with BOTH a human face and urgency language have 1.2% higher CTR, more than the sum of each effect individually."
4. **Model diagnostics:**
   - R-squared: what % of performance variation is explained by creative variables.
   - Residual plots: are there patterns the model is missing.
   - VIF (Variance Inflation Factor): are variables too correlated with each other.

### 6.6 Statistical rigour improvements over current approach

| Current (group-by) | Proposed (regression) |
|---|---|
| No significance testing | p-values per coefficient |
| No confidence intervals on point estimate | 95% CI per coefficient |
| Variables analysed independently | All variables controlled for simultaneously |
| No interaction effects | Interaction terms modelled explicitly |
| No effect size standardisation | Standardised coefficients available |
| No multiple comparison correction in Lite | Model-level F-test; individual p-values with BH-FDR correction |
| Volume not accounted for in confidence | Can weight observations by impression volume (WLS) |

### 6.7 Weighted least squares (WLS) consideration

Not all creatives have equal statistical reliability. A creative with 100,000 impressions gives a more precise CTR estimate than one with 500 impressions. WLS with weights proportional to impression count (or square root of impressions) would give more influence to higher-volume creatives.

```
Minimise: sum_i( w_i * (Y_i - X_i * beta)^2 )
where w_i = impressions_i (or sqrt(impressions_i))
```

### 6.8 Beyond OLS: potential future extensions

- Logistic regression if the dependent variable is binary (e.g. "did this creative beat the median CTR?").
- Ridge/LASSO regression for regularisation when predictors exceed ~50 (after one-hot encoding).
- Random forests or gradient boosting for non-linear relationships and automatic interaction detection.
- Bayesian regression for small-sample uncertainty quantification.
- Mixed effects models if creatives are nested within campaigns or time periods.

## 7. Data flow diagram

```
[Creative Images]                              [Performance CSV]
       |                                              |
       v                                              v
 AI Vision Extraction                          Column Mapping
 (Claude Haiku 4.5)                            (auto-detect headers)
       |                                              |
       v                                              v
 Extracted Variables                           Performance Rows
 (24+ variables per                            (impressions, clicks,
  creative)                                     spend, conversions,
       |                                        revenue per creative)
       |                                              |
       +---------> Matching <----------+
                   (6 methods)
                       |
                       v
            Matched Creative Data
            (variables + metrics per creative)
                       |
                +------+------+
                |             |
                v             v
           Group-by      Regression
           Analysis      (100+ creatives)
           (current)     (proposed)
                |             |
                v             v
           Dashboard     Dashboard
           (deltas,      (coefficients,
            rankings)     p-values, CI)
```

## 8. Open questions for review

These are the genuine methodological uncertainties. Answers will shape the production OLS backend when real data arrives. If you have informed opinions on any of these, open a GitHub discussion on the repo or file an issue.

1. **Sample size threshold.** Is 100 creatives sufficient for OLS with ~25 predictors plus interactions? Should the threshold increase, or should regularisation kick in earlier?
2. **Weighting.** Should the tool weight by impressions (WLS) in the group-by analysis as well, not just regression? Currently all creatives are treated equally in Lite.
3. **Multiple comparisons.** For the current group-by approach, should the tool apply a Bonferroni correction or FDR control to the delta rankings, even without formal p-values?
4. **Variable selection.** With 24 universal + 4 to 6 category variables, plus one-hot encoding, the model could have 60+ predictors. What regularisation approach makes most sense?
5. **Temporal effects.** If the operator uploads a new CSV each month, should the tool model time as a fixed effect or treat each upload as a separate cross-section?
6. **Clustering.** Creatives within the same campaign or ad set may share characteristics. Clustered standard errors or a mixed-effects model?
7. **Non-linear effects.** For integer variables like `number_of_people`, should the tool include polynomial terms or treat them as categorical?
8. **Practical significance.** What minimum effect size (in the metric's units, e.g. +0.2% CTR) should the tool flag as "actionable" vs "statistically significant but negligible"?
