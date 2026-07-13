# Public Language and Legal Guardrails

## Purpose

This is a product-language and release-control document, not legal advice. CourtScope reports measured patterns in public sentencing records. It does not publish moral grades or findings about a judge's character, intent, or legal liability.

## Required framing

Use:

- “measured racial gaps”;
- “aggregate sentencing patterns”;
- “the analyzed records”;
- “higher/lower adjusted incarceration rate”;
- “longer/shorter adjusted sentence length”;
- “may raise questions or warrant examination.”

Every numerical statement must be traceable to a disclosed dataset, model version, analysis window, comparison group, and publication receipt.

## Prohibited framing

Do not publish statements that a judge:

- is racist;
- discriminated against a group;
- is personally unfair;
- committed misconduct;
- intended a racial result;
- violated the law.

Do not present the Disparity Score as a moral grade, voting instruction, legal conclusion, or finding about an individual case. Do not use “in our opinion” as a wrapper for an accusation or unsupported factual implication.

## Required limitation

Every score explanation and methodology surface must make clear that measured patterns do not prove racism, discrimination, intent, misconduct, causation, or whether an individual sentence was appropriate.

## Legal-review basis

The release posture is deliberately narrower than the maximum speech protection that might be available:

- *New York Times Co. v. Sullivan*, 376 U.S. 254 (1964), addresses criticism of public officials and the “actual malice” standard for defamatory falsehoods about official conduct.
- *Milkovich v. Lorain Journal Co.*, 497 U.S. 1 (1990), makes clear that merely labeling a statement “opinion” does not remove a provably false factual implication.

CourtScope therefore uses disclosed measurements, avoids imputing motives or wrongdoing, distinguishes association from causation, preserves source provenance, provides correction handling, and withholds scores when publication gates fail.

These controls reduce avoidable risk. They do not make the product “defamation-proof” and do not replace review by qualified counsel before real judge-level publication in a new jurisdiction.

## Automated gate

`scripts/validate-public-language.mjs` blocks retired “Fairness Score” wording and direct accusatory findings on public surfaces. `scripts/validate-built-output.mjs` repeats the public-language check against compiled output. Automation reduces avoidable wording drift; it is not a substitute for qualified legal review before real judge-level publication.
