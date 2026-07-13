# Full Intended System

CourtScope is a multi-city public sentencing-pattern accountability system.

## Public experience

The national homepage explains what CourtScope is, what the Disparity Score measures, how to use the site, the methodology summary, and the limits of interpretation. A city chooser routes visitors to city-scoped dashboards.

Each city dashboard provides judge cards, short score explanations, same-court comparisons, privacy-limited case lookup, city data status, and public downloads only after publication.

## Methodology

CourtScope measures two adjusted outcomes:

1. incarceration-to-serve probability;
2. incarceration sentence length among custodial cases.

The model uses a shared rolling window of up to eight years for each city release. It requires at least 50 qualifying cases per judge, adequate reference and comparison groups, verified judge identity, supported control fields, and acceptable uncertainty. Each racial group is compared separately with White defendants. The overall Disparity Score is the larger outcome component.

## City data system

A complete de-identified batch enters `data/intake/incoming/<city>/<batch>/`. The pipeline validates completeness, privacy, provenance, coverage, judge identity, and model publishability. Passing data generates a city release and downloads. Failing data moves to `data/intake/rejected` with a receipt. Accepted input packages move to `data/intake/processed` and later become eligible for confirmed admin cleanup.

## Admin system

The password-gated `/admin` surface shows incoming, rejected, processed, published, and cleanup state. Buttons dispatch allowlisted GitHub workflows through a server-side token. Dispatch is not represented as workflow completion.

## Governance

One lean validation orchestrator classifies deterministic repair, isolated skip, warning, and true blocker behavior. Safe repair is limited to derived manifests, publication/download consistency, admin status, and removal of public download residue for unpublished cities.
