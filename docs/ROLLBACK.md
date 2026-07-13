# Rollback Guide

Rollback types must stay separate:

- code rollback: revert a commit or release
- methodology rollback: restore the last verified methodology release
- dataset rollback: restore the last verified snapshot
- source-adapter rollback: disable or revert a broken adapter
- score suppression: temporarily hide a score with a public explanation
- public-page rollback: restore the last verified built output

Emergency Stop pauses mutation and publishing but must not delete evidence, ledgers, or secrets.

