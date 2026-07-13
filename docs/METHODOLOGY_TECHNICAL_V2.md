# CourtScope Methodology 2.0 — Technical Summary

## Analysis unit

Qualifying criminal sentencing records grouped by verified sentencing judge within a shared city analysis window.

## Window

A rolling period of up to eight years ending on the city release's latest qualifying sentence date. The same window applies to every judge in the release.

## Outcomes

1. Binary incarceration-to-serve outcome.
2. Sentence length in months among custodial cases.

## Comparisons

Each supported racial group is compared separately with White defendants. No combined minority category is used.

## Adjustments

The additive categorical control model uses supported values for offense severity, prior record, plea/trial, age band, and gender. Missing or inconsistent required fields block city publication.

## Publication gates

- at least 50 qualifying cases per judge;
- at least 10 cases in the White reference group;
- at least 10 cases in at least one non-White comparison group;
- verified judge identity;
- valid sentence dates;
- sentence length for custodial cases;
- acceptable race-field completeness and uncertainty.

Unsupported small comparison groups are withheld rather than merged. A judge can publish only if at least one valid group comparison remains.

## Score construction

The incarceration component maps the absolute adjusted percentage-point gap to a 0–100 scale. The sentence-length component maps the absolute adjusted percentage difference to a 0–100 scale. The overall score is the maximum of the two components.

- `0–29`: Smaller racial gaps
- `30–59`: Moderate racial gaps
- `60–100`: Bigger racial gaps

Direction is preserved in the explanation even though the score magnitude is non-directional.

## Interpretation

The model identifies aggregate associations in the analyzed data. It does not establish racism, discrimination, intent, misconduct, causation, or the appropriateness of any individual sentence.
