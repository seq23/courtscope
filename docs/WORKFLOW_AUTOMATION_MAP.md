# Workflow Automation Map

| Workflow | Trigger | Job | Mutation boundary |
|---|---|---|---|
| `deploy-cloudflare.yml` | push to main / manual | validate, build, migrate, deploy, smoke test | Cloudflare provider, requires secrets |
| `city-data-pipeline.yml` | incoming data path / admin dispatch | validate batches, reject or publish, refresh status, commit derived outputs | city intake, city releases, downloads, admin status |
| `city-data-cleanup.yml` | manual/admin dispatch | refresh queue or confirmed retention cleanup | processed intake and admin queue |
| `admin-control.yml` | admin dispatch | pause, resume, or emergency-stop state | admin control state only |

Workflow files prove configuration. Completion requires GitHub run receipts.
