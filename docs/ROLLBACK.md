# Rollback

## Code rollback

Restore the prior validated full baseline ZIP with the generic repo updater in snapshot mode.

## City publication rollback

1. Pause automation in `/admin`.
2. Revert the city release commit.
3. Confirm the city registry no longer marks the affected release published.
4. Confirm its public download directory is removed.
5. Run `npm run validate:all` and `npm run build`.
6. Resume only after the release receipt is clean.

## Emergency stop

Use the admin emergency-stop action when a workflow or publication boundary may be unsafe. It changes the control-state file but does not itself undo a published Git commit.
