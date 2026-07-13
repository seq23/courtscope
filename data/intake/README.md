# City data intake

## What may enter this folder

Only a **complete, privacy-reviewed, de-identified structured export** may be committed to the repo intake lane. Raw source files containing defendant names, addresses, Social Security numbers, phone numbers, email addresses, or other prohibited personal fields must stay in approved private evidence storage and must never enter Git history.

## Intake location

Place each delivery at:

`data/intake/incoming/<city-slug>/<batch-id>/`

Each batch must contain:

- `manifest.json`;
- the CSV or JSON file named by the manifest;
- the data dictionary named by the manifest.

## What the workflow does

1. Validates every completeness attestation and required field.
2. Rejects prohibited personal fields, missing years, identity gaps, duplicate case IDs, missing sentence fields, or datasets that cannot support at least one score.
3. Moves rejected batches to `data/intake/rejected/` with a receipt.
4. Generates city cases, judges, release metadata, and public downloads only after all gates pass.
5. Updates `data/cities/registry.json` and the admin pipeline status.
6. Moves the accepted de-identified batch to `data/intake/processed/`.
7. Adds processed batches to the admin cleanup queue after the 30-day retention period.

A city is not made public because a folder exists. Publication occurs only through the validated pipeline.
