# Lean Validation Governance

## One control plane

`scripts/validate-all.mjs` is the canonical orchestrator. Validator membership and profiles live in `data/governance/validation_registry.json` and `validation_profiles.json`.

## Finding resolution

- **Self-heal:** deterministic derived drift only.
- **Skip:** an isolated rejected batch while other batches continue.
- **Warn:** non-material environment noise such as unavailable local Cloudflare metadata.
- **Block:** compile, security, data-publication, legal-language, required-journey, methodology, workflow, or internal validation failures.

Warnings must not exit nonzero. True blockers must not be downgraded for convenience.

## Safe repair limits

Safe repair may synchronize route manifests, city download flags, admin status, cleanup status, and remove public download residue for unpublished cities. It may not repair secrets, fabricate evidence, change methodology, publish incomplete data, alter protected ownership, or perform provider mutation.
