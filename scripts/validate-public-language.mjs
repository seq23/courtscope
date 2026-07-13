import fs from 'node:fs';
import path from 'node:path';

const roots = ['src/pages', 'src/components', 'src/layouts', 'data/fixtures/judges.json'];
const files = [];
function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) walk(path.join(target, entry));
  } else if (/\.(astro|json|md)$/.test(target)) files.push(target);
}
for (const root of roots) walk(root);

const banned = [
  { label: 'retired Fairness Score name', pattern: /Fairness Score/i },
  { label: 'retired fair score band', pattern: /\bMore Fair\b|\bModerately Fair\b|\bLess (?:than )?Fair\b/i },
  { label: 'direct racism accusation', pattern: /\b(?:this|the) judge (?:is|was) racist\b/i },
  { label: 'direct discrimination finding', pattern: /\b(?:this|the) judge discriminat(?:es|ed) against\b/i },
  { label: 'direct misconduct finding', pattern: /\b(?:this|the) judge committed misconduct\b/i },
  { label: 'personal unfairness declaration', pattern: /\b(?:this|the) judge (?:is|was) unfair\b/i },
];
const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of banned) if (rule.pattern.test(text)) hits.push(`${file}: ${rule.label}`);
}
if (hits.length) {
  console.error(`Public-language blockers:\n${hits.join('\n')}`);
  process.exit(1);
}

const requiredCautions = [
  ['src/components/ScoreExplanation.astro', /does not prove racism, discrimination, intent, misconduct/i],
  ['src/pages/methodology.astro', /does not prove racism, discrimination, intent, misconduct/i],
  ['src/pages/index.astro', /does not prove racism, discrimination, intent, misconduct/i],
];
for (const [file, pattern] of requiredCautions) {
  const text = fs.readFileSync(file, 'utf8');
  if (!pattern.test(text)) {
    console.error(`${file} is missing the required interpretation limitation.`);
    process.exit(1);
  }
}
console.log(`Public language PASS (${files.length} public-facing files scanned).`);
