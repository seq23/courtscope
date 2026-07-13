# Validation and Handoff

## Canonical commands

- `npm run validate:all` — safe repair, compile checks, methodology, data pipeline, routes, admin security, and governance.
- `npm run build` — Astro/Cloudflare server build.
- `npm run validate:dist` — compiled-route, compiled-language, and unpublished-download checks.
- `npm run verify` — runs all three release gates in order.
- `npm audit --audit-level=high` — dependency vulnerability check.

## Release proof in this artifact

The delivery receipt records source checks, model tests, pipeline tests, Astro checks, build status, compiled-output validation, dependency audit, ZIP integrity, reopened-root verification, and packaged file presence.

## Explicit proof boundary

This artifact does not prove live GitHub workflow execution, live Cloudflare deployment, production secrets, official-record completeness, qualified-counsel clearance, or real judge findings.

## Expected local success

Validation ends with `CourtScope validation PASS`. Build ends with Astro's successful build output. Compiled-output validation ends with `Built output PASS`. Any nonzero result stops the local updater before commit and push.

The offline Cloudflare adapter may warn that it cannot fetch `Request.cf` metadata. That network warning is nonblocking only when Astro type checks and the server build still complete successfully.
