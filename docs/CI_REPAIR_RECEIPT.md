# CourtScope CI Repair Receipt

**Scope:** GitHub Actions validator and deployment-ownership repair only  
**Status:** STRUCTURALLY CHECKED — LOCAL VALIDATION REQUIRED

## Implemented in this repair

- Missing `public/downloads/` is treated as a valid empty prelaunch state when no city is published.
- Published cities still hard-fail unless every required city artifact and download exists.
- Regression tests cover the missing-directory state, forbidden unpublished downloads, and incomplete published artifacts.
- The general push workflow is validation-only. Cloudflare Git integration owns deployment.
- The city-data workflow runs the complete browserless `npm run verify` gate after processing.

## Not implemented in this repair

- No scoring, methodology, route, copy, admin, or city-data behavior changes.
- No official city dataset.
- No direct Cloudflare deployment or D1 migration from GitHub Actions.

## Remaining operational proof

- Apply the full baseline ZIP locally.
- Confirm the GitHub validation workflow passes on the resulting push.
- Confirm Cloudflare Git integration creates the deployment independently.

## Validation completed for this repair

- `node scripts/test-city-publication-validator.mjs` — PASS
- `COURTSCOPE_VALIDATION_PROFILE=release npm run validate:all` — PASS, 12 checks
- Astro diagnostics — PASS, 111 files, 0 errors, 0 warnings, 0 hints
- `npm run build` — PASS
- `npm run validate:dist` — PASS, 97 compiled assets inspected

The offline Cloudflare metadata lookup warning remained nonblocking and did not prevent compilation. Live GitHub Actions and Cloudflare Git deployment are validated only after the local updater pushes this baseline.
