# Environment and Secrets Guide

## Required production Worker secrets

Configure these exact encrypted secret names on the deployed `courtscope` Worker:

- `ADMIN_PASSWORD_HASH` — PBKDF2-SHA256 formatted verifier for the owner password;
- `ADMIN_SESSION_SECRET` — strong session-signing secret;
- `GITHUB_ADMIN_TOKEN` — fine-grained, single-repository token for approved workflow dispatch;
- `CITY_PIPELINE_SHARED_SECRET` — shared secret used only by the protected city-submission export and status endpoints.

The previous GitHub Actions deployment used a source secret named `COURTSCOPE_GITHUB_ADMIN_TOKEN` and remapped it at deploy time. Cloudflare Git integration does not perform that remapping. The live Worker secret must therefore be named exactly `GITHUB_ADMIN_TOKEN`.

## Required GitHub Actions secret

- `CITY_PIPELINE_SHARED_SECRET` — must exactly match the Worker secret of the same name.

## Non-secret production configuration

- `GITHUB_REPOSITORY` identifies `seq23/courtscope` and is stored in `wrangler.toml`;
- `DB`, `EVIDENCE_BUCKET`, and `SESSION` are provider bindings, not plaintext secrets.

## Password recovery and rotation

See `docs/ADMIN_PASSWORD_AND_CITY_UPLOAD_SETUP.md` and use `scripts/admin/generate-admin-secrets.mjs`. Never commit plaintext passwords, generated hashes, session secrets, shared secrets, provider tokens, `.dev.vars`, or environment files.

## Deployment rule

Cloudflare Git integration builds and deploys repository code, but runtime secret values remain separately configured provider state. A successful Git push does not prove that required Worker secrets exist.
