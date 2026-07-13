# Admin Guide for Non-Engineers

## Sign in

Open `/admin/login`. Authentication is verified on the server. The plaintext password and GitHub token are never stored in browser code or the repository.

If the page says **Admin access is not configured**, the deployed Worker is missing `ADMIN_PASSWORD_HASH` or `ADMIN_SESSION_SECRET`. That is different from an incorrect password. See `docs/ADMIN_PASSWORD_AND_CITY_UPLOAD_SETUP.md`.

## Public city uploads

Open `/admin/submissions` to review files submitted from `/add-cities`.

Each submission shows:

- city, county, state, and date coverage;
- official source and submitter contact;
- private ZIP filename, size, receipt, and status;
- a protected private-download link;
- retention eligibility after a final outcome.

Available actions:

- **Mark under review** — D1 status only;
- **Approve and process** — dispatches the allowlisted GitHub workflow; it does not claim success or publication;
- **Reject** — moves the private R2 object to the rejected retention lane;
- **Purge eligible private uploads** — permanently deletes only objects whose 30-day retention date has passed.

## Repository pipeline dashboard

The command center also shows:

- incoming repo batches;
- rejected repo batches;
- processed batches retained temporarily;
- published cities;
- packages eligible for repository cleanup;
- city publication and download state.

## Existing workflow controls

- **Process incoming city data:** dispatches the repo city pipeline workflow.
- **Refresh city status:** rebuilds the status manifest without publishing incomplete data.
- **Refresh cleanup queue:** recalculates repository retention eligibility.
- **Delete eligible processed batches:** destructive, confirmed cleanup of retention-eligible repo folders only.
- **Pause / resume automation:** changes the repository control state.
- **Emergency stop:** blocks non-read-only automation until cleared.

A successful dispatch response means GitHub accepted the request. It does not prove the workflow passed.
