# Repository Identity

- **Name:** CourtScope
- **Repository:** `seq23/courtscope`
- **Domain:** `courtscope.org`
- **Framework:** Astro 6 with the Cloudflare adapter
- **Version:** `2.0.0-prelaunch`
- **Repo type:** Public civic data application, sensitive-claims research tool, city publishing pipeline, and authenticated admin command center
- **Source of truth for this upgrade:** latest uploaded full source ZIP
- **Public data state:** fixture preview only; no official city dataset is published

## Product job

CourtScope helps the public inspect racial patterns in criminal sentencing across many similar cases. It measures adjusted gaps in incarceration and sentence length while preserving data-strength and interpretation limits.

## Route architecture

- `/` — national explainer
- `/cities` — city chooser
- `/<city-slug>/` — city dashboard
- `/<city-slug>/judges/...` — city judge surfaces
- `/<city-slug>/compare` — same-court comparison
- `/<city-slug>/cases/...` — city case search and limited public projection
- `/data` — national data hub
- `/<city-slug>/data` — city release status and downloads
- `/admin` — authenticated owner command center
