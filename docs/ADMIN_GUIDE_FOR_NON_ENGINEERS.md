# Admin Guide for Non-Engineers

## Sign in

Open `/admin/login`. Authentication is verified on the server. The password and GitHub token are not stored in browser code.

## What the dashboard shows

- incoming batches;
- rejected batches;
- processed batches retained temporarily;
- published cities;
- packages eligible for cleanup;
- city publication and download state.

## What the buttons do

- **Process incoming city data:** dispatches the city pipeline workflow.
- **Refresh city status:** rebuilds the status manifest without publishing incomplete data.
- **Refresh cleanup queue:** recalculates retention eligibility.
- **Delete eligible processed batches:** destructive, confirmed cleanup of retention-eligible folders only.
- **Pause / resume automation:** changes the repository control state.
- **Emergency stop:** blocks non-read-only automation until cleared.

A successful dispatch response means GitHub accepted the request. It does not prove the workflow passed.
