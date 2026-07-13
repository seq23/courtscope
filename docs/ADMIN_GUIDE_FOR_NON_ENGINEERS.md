# Admin Guide for Non-Engineers

## Sign in

Open `/admin/login`. The password is checked on the server against `ADMIN_PASSWORD_HASH`. A signed, secure session cookie is created with `ADMIN_SESSION_SECRET`.

## What works when configured

Admin buttons dispatch allowlisted GitHub Actions through the server. The browser never receives the GitHub token. Missing credentials return a configuration error and do not pretend success.

## Add data or a city

Open `/admin/add-cities`.

1. Choose the court and jurisdiction.
2. Mark which required fields the court can provide.
3. Download the records request package.
4. Track calls, emails, fees, request number, and delivery date.
5. Upload CSV, JSON, XLSX, PDF, ZIP, codebooks, and correspondence.
6. Review detected columns and map them to CourtScope fields.
7. Read the readiness report.
8. Download the onboarding project for the ingestion pipeline.

Nothing uploads to the public site from the wizard. Publication still requires ingestion, privacy, identity, methodology, and release gates.

## Dangerous actions

Emergency stop, rollback, score recalculation, pause, and resume require confirmation. Never override a failed privacy, provenance, identity, or model gate.
