import fs from 'node:fs';
import path from 'node:path';
const roots = ['README.md', 'src', 'docs', 'data'];
const files = [];
function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) for (const item of fs.readdirSync(target)) walk(path.join(target, item));
  else if (/\.(md|astro|ts|json)$/.test(target)) files.push(target);
}
for (const root of roots) if (fs.existsSync(root)) walk(root);
const forbidden = [
  /structural placeholders? in Phase 1/i,
  /scheduled for later phases/i,
  /adminAuth['"]?\s*:\s*['"]NOT_IMPLEMENTED/i,
  /mutations['"]?\s*:\s*['"]DISABLED/i,
  /100 means lower measured adjusted disparity/i,
  /0 means higher measured adjusted disparity/i,
];
const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(text)) hits.push(`${file}: ${pattern}`);
}
if (hits.length) throw new Error(`Repository truth contradictions:\n${hits.join('\n')}`);
console.log('Repository truth PASS.');
