# Workflow Automation Map

Live workflows must declare:

- trigger
- purpose
- files read
- files written
- protected paths
- provider boundaries
- failure behavior
- receipt location
- rerun method

Automated low-risk data refreshes may write only to explicit allowlisted paths.



## Phase 4 official extract import

- Trigger: authorized manual import or future records-response workflow.
- Reads: private official CSV/JSON file.
- Writes: artifact manifest, normalized cases, provenance, quarantine and receipt.
- Protected: raw names and private identifiers never enter public paths.
- Failure: bad records quarantine; missing provenance or corrupt input blocks the run.
