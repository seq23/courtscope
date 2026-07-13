# City Data Pipeline Runbook

## Input contract

Place one complete de-identified package at:

`data/intake/incoming/<city-slug>/<batch-id>/`

Required files:

- `manifest.json`;
- one declared CSV or JSON data file;
- one declared data dictionary file.

## Process map

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

## Rejection behavior

A rejected batch moves to `data/intake/rejected/<city>/<batch>/` with `processing_receipt.json`. Rejection of one batch is isolated; other valid batches continue.

## Cleanup behavior

Review: `python3 scripts/cities/cleanup_processed.py`

Execute: `python3 scripts/cities/cleanup_processed.py --execute --confirm DELETE_ELIGIBLE_PROCESSED_BATCHES`

No other confirmation phrase is accepted.
