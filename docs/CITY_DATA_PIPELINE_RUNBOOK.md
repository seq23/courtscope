# City Data Pipeline Runbook

## Public receiving lane

Users submit one complete, de-identified ZIP at `/add-cities`.

The Worker performs pre-storage checks for:

- same-origin request;
- 50 MB compressed limit and 75 MB declared expansion limit;
- safe ZIP paths and executable-file ban;
- one `manifest.json`;
- matching city, county, state, source, and coverage fields;
- every required completeness and privacy attestation;
- declared CSV/JSON data file and data dictionary;
- three-submission-per-connection daily limit.

Passing uploads enter private R2 at `city-submissions/pending/<submission-id>/` and D1 status `RECEIVED`. They do not enter GitHub and do not become public.

## Admin approval lane

1. Owner signs in at `/admin/submissions`.
2. Owner downloads and reviews the private ZIP.
3. Owner marks it under review, rejects it, or approves it.
4. Approval dispatches `.github/workflows/city-submission-intake.yml`.
5. The workflow retrieves the package through a shared-secret-protected internal endpoint.
6. The package is staged at `data/intake/incoming/<city-slug>/<batch-id>/`.

## Repository input contract

Each approved package must contain:

- `manifest.json`;
- one declared CSV or JSON data file;
- one declared data dictionary file.

## Repository process map

1. Read the completeness contract.
2. Validate manifest attestations.
3. Reject prohibited personal columns.
4. Validate required columns and row values.
5. Verify unique case IDs and judge identity state.
6. Verify declared date coverage and no unexplained empty years.
7. Run Methodology 2.0 publication gates.
8. If no judge clears publication gates, reject the batch.
9. If valid, generate city judges, public cases, release metadata, downloads, and registry state.
10. Move the source package to processed retention.
11. Refresh admin status and cleanup queue.
12. Send the final result back to D1 and move the private R2 ZIP to `processed` or `rejected` retention.

## Rejection behavior

A rejected repo batch moves to `data/intake/rejected/<city>/<batch>/` with `processing_receipt.json`. The corresponding private upload moves to `city-submissions/rejected/<submission-id>/` and receives a 30-day retention date.

## Cleanup behavior

Repository review: `python3 scripts/cities/cleanup_processed.py`

Repository execute: `python3 scripts/cities/cleanup_processed.py --execute --confirm DELETE_ELIGIBLE_PROCESSED_BATCHES`

Private R2 uploads are purged from `/admin/submissions` only after their retention date passes. No other confirmation path is accepted.
