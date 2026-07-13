# Admin password and public city-upload setup

## What drifted

The repository never stores the plaintext admin password. The live Worker accepts the password represented by the deployed `ADMIN_PASSWORD_HASH` secret. Moving deployment ownership to Cloudflare Git integration does not recreate Worker secrets from repository files or old GitHub Actions secrets.

## Required Cloudflare Worker secrets

Configure these exact encrypted secret names on the deployed `courtscope` Worker:

- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `GITHUB_ADMIN_TOKEN`
- `CITY_PIPELINE_SHARED_SECRET`

`GITHUB_REPOSITORY` remains the non-secret Wrangler variable `seq23/courtscope`.

## Required GitHub Actions secret

Configure this repository Actions secret with the exact same value used by the Worker:

- `CITY_PIPELINE_SHARED_SECRET`

The private export endpoint will reject the workflow when the two values do not match.

## Generate a future password rotation locally

Run without placing the password in shell history:

1. `read -s COURTSCOPE_ADMIN_PASSWORD`
2. `printf %s "$COURTSCOPE_ADMIN_PASSWORD" | node scripts/admin/generate-admin-secrets.mjs`
3. `unset COURTSCOPE_ADMIN_PASSWORD`

Copy the three generated values into the secret stores. Never commit them.

## Public upload lifecycle

1. A user uploads one complete ZIP on `/add-cities`.
2. The Worker checks archive safety, manifest structure, dates, required declarations, and declared files.
3. The ZIP is stored privately in R2 at `city-submissions/pending/...`.
4. D1 records the submission in the admin queue.
5. The owner reviews it at `/admin/submissions`.
6. Approval dispatches `city-submission-intake.yml`.
7. The workflow retrieves the approved package through a shared-secret-protected endpoint.
8. Existing repo validators publish the city or move the batch to the rejected lane.
9. The Worker records the final status and moves the private R2 object to `processed` or `rejected`.

A receipt, upload, or workflow dispatch is never itself a publication claim.
