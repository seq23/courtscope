# Implementation Status

## Structurally implemented

- National homepage, city chooser, Memphis fixture dashboard, and reusable `/<city-slug>/` routing
- City-scoped judge, comparison, case, and data routes with English/Spanish parity
- Disparity Score card system and short “Why this score?” accordion
- Methodology 2.0 model: shared eight-year window, incarceration, sentence length, separate group comparisons, withholding gates
- Complete city-data intake, rejection, publication, retention, and admin cleanup architecture
- Published-city-only download enforcement
- Authenticated admin command center, protected admin API, allowlisted workflow dispatch, and proof boundaries
- Corrections/reporting surface, legal-language guardrails, onboarding dialog, and lean validation control plane

## Proven locally without a browser

- Astro type/compile checks with zero errors, warnings, or hints
- deterministic statistical-model tests
- city pipeline integration tests, including rejection and publication
- route/source, public-language, publication/download, and admin-security checks
- Cloudflare server build and compiled-output inspection
- dependency audit with zero reported vulnerabilities
- ZIP integrity and reopened-artifact structural checks when recorded in the delivery receipt

## Not proven in this repository state

- real judge findings or official-record completeness;
- live GitHub workflow dispatch and completion;
- live Cloudflare deployment, runtime secrets, and persistent D1 correction storage;
- browser-rendered visual journeys;
- qualified-counsel clearance for publication of real judge-level findings.
