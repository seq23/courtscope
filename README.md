# CourtScope

CourtScope is an open-source civic research application for examining measured racial gaps in criminal sentencing outcomes.

The public product is organized by city. The national homepage explains the project; each `/<city-slug>/` dashboard owns that jurisdiction's judges, comparisons, case search, data status, and release files.

## What the Disparity Score measures

The model evaluates two adjusted outcomes:

1. whether a qualifying sentence includes incarceration that must be served;
2. the length of the incarceration sentence among custodial cases.

A lower score means smaller measured racial gaps. A higher score means bigger measured racial gaps. The overall score uses the larger of the two outcome components so a material signal is not averaged away.

A score describes aggregate patterns in the analyzed data. It does not prove racism, discrimination, intent, misconduct, causation, or whether any individual sentence was appropriate.

## Current public-data status

Memphis is present as a clearly labeled synthetic fixture preview. It is not a published official-data city, and no Memphis court-data download is available. Official city results remain blocked until a complete, authorized, de-identified dataset passes every publication gate.

## Local commands

- `npm ci`
- `npm run validate:all`
- `npm run build`
- `npm run verify`
- `npm run test:model`
- `npm run test:city-pipeline`
- `printf %s "$PASSWORD" | node scripts/admin/generate-admin-secrets.mjs`

Validation is browserless by design in this delivery. Live Cloudflare, GitHub workflow, official-record, and production-deployment proof remain separate.

Start with [`docs/START_HERE_NEW_PERSON.md`](docs/START_HERE_NEW_PERSON.md).


## Public city-data intake

`/add-cities` accepts a complete de-identified ZIP into private R2 storage. `/admin/submissions` provides the protected review queue. Approved packages enter `.github/workflows/city-submission-intake.yml` and then the existing publish-or-reject repository pipeline.
