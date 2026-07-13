# Environment and Secrets Guide

## Never commit real secrets

Real values belong in local `.dev.vars`, Cloudflare secrets, GitHub Actions secrets when required, or an approved encrypted operator vault.

Expected future secrets include:

- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `GITHUB_ADMIN_TOKEN`
- `GITHUB_REPOSITORY`
- `SENTRY_DSN`

Rotate a secret immediately after suspected exposure. Remove it from current code, revoke it at the provider, replace it, and record the incident without copying the secret into logs.

