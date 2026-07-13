# Public City Upload and Admin Credential Repair Receipt

## Implemented

- Public upload form on English and Spanish Add a City pages.
- Complete ZIP templates and clear package instructions.
- Private R2 pending, processed, and rejected lanes.
- D1 submission queue with self-healing schema creation.
- Owner-only submission review, download, reject, dispatch, and retention purge controls.
- Shared-secret-protected workflow export and status callback endpoints.
- GitHub workflow that stages one approved package and runs the existing publish-or-reject pipeline.
- Login diagnostics that distinguish missing secrets from a wrong password.
- Local secret generator and exact setup documentation.
- Upload size, expansion, archive-path, file-type, origin, attestation, and rate-limit controls.

## Not implemented

- Raw personally identifying record upload through the automated form.
- Files larger than 50 MB through the browser form.
- Live GitHub workflow dispatch proof using production provider credentials.
- Live Cloudflare secret installation; provider account access is external.
- Official city data or real judge publication.

## Validation boundary

Local Cloudflare runtime validation proved the intended password, public upload, private D1/R2 receipt, authenticated admin queue, byte-identical private download, rejection lane, retention date, and eligibility-safe purge behavior. Production provider configuration remains required.
