# Phase 4 Operator Runbook

1. Submit `docs/PUBLIC_RECORDS_REQUEST_PACKAGE.md` through the official Clerk process.
2. Save correspondence and the custodian reference outside the public repo if it contains personal contact information.
3. Place the received file in a private working directory.
4. Archive it: `python3 scripts/phase4/archive_source.py FILE --source-id shelby-criminal-prr --request-reference REFERENCE`.
5. Import it: `python3 scripts/phase4/import_official_extract.py FILE --source-id shelby-criminal-prr --request-reference REFERENCE`.
6. Review `quarantine.json`; never force unresolved records into model eligibility.
7. Run `python3 scripts/phase4/validate_public_projection.py` against every proposed public JSON export.
8. Run `npm run validate:all`.
9. Update `docs/PHASE4_DATA_READINESS_REPORT.md` with measured field coverage.

Do not place raw official records in `public/`, commit private source files, or publish defendant names.
