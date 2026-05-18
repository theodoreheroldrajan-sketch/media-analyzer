---
name: Methodology review
about: Feedback or critique on the statistical methodology
title: ""
labels: methodology
assignees: ""
---

**Which part of the methodology does this concern?**
Reference the relevant section of `ANALYSIS_METHODOLOGY.md` (e.g. section 4.3, section 6.2, section 8 question 3).

**What is the issue or suggestion?**
Describe what you think is wrong, incomplete, or could be improved. Be specific about the statistical or analytical concern.

**What would you recommend instead?**
If you have a specific alternative approach, describe it here.

**Your background**
Optional, but helpful: what is your experience with the relevant statistical methods? This helps the maintainer calibrate how to respond.

**Open questions from the methodology document**
For reference, the open questions in `ANALYSIS_METHODOLOGY.md` section 8 are:

1. Is 100 creatives sufficient for OLS with ~25 predictors plus interactions?
2. Should the tool weight by impressions (WLS) in the group-by analysis as well?
3. Should the tool apply Bonferroni or FDR control to group-by delta rankings?
4. What regularisation approach for 60+ predictors after one-hot encoding?
5. Should the tool model time as a fixed effect or treat each upload as a separate cross-section?
6. Clustered standard errors or a mixed-effects model for campaign-nested creatives?
7. Polynomial terms or categorical treatment for integer variables?
8. What minimum effect size should be flagged as "actionable"?
