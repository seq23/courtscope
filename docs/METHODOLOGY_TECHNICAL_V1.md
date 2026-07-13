# CourtScope Methodology v1.0.0

Status: implemented and tested with synthetic records; not validated on official Shelby County data.

## Estimand

CourtScope estimates judge-level adjusted racial disparity in the probability of a sentence including incarceration to serve. It does not classify individual cases as fair or unfair.

## Adjustment

Records are stratified by offense class, prior-record category, plea/trial status, age band, and gender. Within comparable strata, CourtScope estimates a pooled log odds ratio comparing supported racial groups with the reference group. The public score is a bounded monotonic transformation of absolute adjusted disparity.

## Publication gates

A score is withheld when sample size, subgroup support, missingness, judge identity, or uncertainty fail the versioned thresholds. Withheld results display Not Enough Data.

## Sensitivity

The reproducibility package reports coarsened-exact-matching retention and comparable-strata coverage. Phase 5 code is complete, but official-data validation remains blocked by the pending Phase 4 extract.
