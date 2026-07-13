# Day-0 VA Operator Guide

## Your job

Keep CourtScope accurate, privacy-safe, and honest about what has and has not been proven.

## What you may do

- review city and batch status in `/admin`;
- place an approved complete de-identified batch in the documented incoming folder;
- run `npm run validate:all` and `npm run build`;
- review rejection and processing receipts;
- refresh the cleanup queue;
- report exact validator failures.

## What you may not do

- publish an incomplete city;
- make fixture data look official;
- add defendant names or prohibited personal fields;
- change score thresholds or methodology without owner approval;
- describe a judge as racist, discriminatory, corrupt, or personally unfair;
- bypass admin confirmation or publication gates;
- claim a workflow completed merely because it was dispatched.

## When validation fails

1. Read the first blocking validator.
2. Fix only the material failure it identifies.
3. Rerun `npm run validate:all`.
4. Do not downgrade the failure to a warning manually.
5. Escalate secrets, legal uncertainty, official-source disputes, or destructive changes.

## What self-heals

Only deterministic derived drift: route manifests, admin status, download flags, and public download residue for an unpublished city.
