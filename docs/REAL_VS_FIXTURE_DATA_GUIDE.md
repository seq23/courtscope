# Real vs Fixture Data Guide

## Fixture data

Synthetic records exist to test score direction, withholding, UI states, routes, exports, and validation. Fixture judges and cases use explicit fixture labels and `FX-` case numbers.

Fixture data may not support any claim about a real judge, court, defendant, or jurisdiction.

## Official city data

A city becomes official only after a complete authorized dataset passes the completeness, privacy, provenance, identity, model, and release gates. Registry status becomes `PUBLISHED`, `dataMode` becomes `published`, and city-scoped downloads are generated.

## Public download rule

No city-specific public download directory may exist for an unpublished city.
