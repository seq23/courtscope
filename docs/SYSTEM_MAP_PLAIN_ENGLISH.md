# System Map in Plain English

- `src/pages` builds national, city, legal, Spanish, and admin routes.
- `src/components` holds the score card, explanation accordion, onboarding tour, and shared UI.
- `model` calculates the two outcome components and publication gates.
- `data/intake/incoming` receives complete de-identified city packages.
- `data/intake/rejected` holds failed packages and receipts.
- `data/intake/processed` temporarily retains accepted input packages.
- `data/cities/published` holds generated city releases.
- `public/downloads/<city>` exists only for published cities.
- `data/admin` feeds the command-center status and cleanup queue.
- `scripts/validate-all.mjs` governs release validation.
- `.github/workflows` runs provider-backed pipeline, cleanup, control, and deployment jobs.
