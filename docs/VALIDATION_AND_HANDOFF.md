# Validation and Handoff

Run `npm ci`, then `npm run validate:all`, then `npm run build`.

A green local build proves code and artifact consistency. It does not prove official data quality, live Cloudflare resources, GitHub workflow permissions, email delivery, backups, or public launch readiness.

The release ZIP must be reopened and checked from the true repo root. No real secret may appear in source or docs.
