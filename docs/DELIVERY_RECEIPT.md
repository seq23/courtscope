# CourtScope Full Baseline Delivery Receipt

**Source of truth:** `courtscope-main(1).zip`  
**Source SHA256:** `dfd76ef79baaf71bfc2fc24e5188f24f8ec965ad294b50cc94051f4f20d926f3`  
**Repo:** `seq23/courtscope`  
**Version:** `2.0.0-prelaunch`  
**Artifact status:** STRUCTURALLY CHECKED — LOCAL VALIDATION REQUIRED

## Implemented in this baseline

- Phases 1–4: public explainer, Methodology 2.0, judge-detail UX, and interactive onboarding
- Disparity Score with smaller/moderate/bigger racial-gap bands and short card accordions
- National homepage plus reusable city-scoped dashboards, judge, comparison, case, and data routes
- Complete-data rejection, city intake/publication/retention/cleanup pipeline, and published-only downloads
- Authenticated admin command center, protected admin API, allowlisted workflow dispatch, status receipts, and emergency controls
- National add-city records guide, sample request emails, corrections intake, Spanish parity, legal-language gates, and lean validation governance

## Validation completed without a browser

- `npm run validate:all` — PASS, 11 checks
- Astro diagnostics — PASS, 109 files, 0 errors, 0 warnings, 0 hints
- Methodology 2.0 deterministic test — PASS
- City pipeline integration test — PASS
- Phase 4 import/privacy preservation test — PASS
- `npm run build` — PASS, Cloudflare server output generated
- `npm run validate:dist` — PASS, 97 compiled assets inspected
- `npm audit --audit-level=high` — PASS, 0 vulnerabilities reported

## Known nonblocking environment warning

The offline build could not fetch Cloudflare's remote `Request.cf` metadata and used the adapter's placeholder. Astro diagnostics and the Cloudflare server build still completed successfully. This is recorded as environment/network noise, not deployment proof.

## Explicitly not proven

- official city-record completeness or real judge findings
- live GitHub workflow execution
- live Cloudflare deployment, D1 persistence, runtime secrets, or provider receipts
- browser-rendered visual journeys
- qualified-counsel clearance for real judge-level publication

## Local validation command

Run the repository updater in snapshot mode. The updater must run the repo's own `npm run verify` gate before commit and push.
