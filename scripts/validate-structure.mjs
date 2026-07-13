import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md','package.json','astro.config.mjs','wrangler.toml','Dockerfile',
  'docs/START_HERE_NEW_PERSON.md','docs/DAY_0_VA_OPERATOR_GUIDE.md','docs/ADMIN_GUIDE_FOR_NON_ENGINEERS.md',
  'docs/ENVIRONMENT_AND_SECRETS_GUIDE.md','docs/ROLLBACK.md','docs/IMPLEMENTATION_STATUS.md','docs/FULL_INTENDED_SYSTEM.md',
  'data/governance/route_manifest.json','data/governance/data_classification.json','data/admin/action_allowlist.schema.json',
  'src/pages/index.astro','src/pages/judges.astro','src/pages/cases.astro','src/pages/methodology.astro','src/pages/data.astro',
  'src/pages/add-cities.astro','src/pages/es/index.astro','src/pages/admin/index.astro'
];

const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join('\n')}`);
  process.exit(1);
}

const forbidden = [
  /ghp_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /ADMIN_PASSWORD\s*=\s*[^\s#]+/g
];
const scanExt = new Set(['.md','.json','.mjs','.js','.ts','.astro','.toml','.example','.py','.txt']);
const hits = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','dist'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (scanExt.has(path.extname(ent.name)) || ent.name.endsWith('.example')) {
      const text = fs.readFileSync(full, 'utf8');
      for (const re of forbidden) {
        re.lastIndex = 0;
        if (re.test(text)) hits.push(path.relative(root, full));
      }
    }
  }
}

walk(root);
if (hits.length) {
  console.error(`Potential secret patterns found in: ${[...new Set(hits)].join(', ')}`);
  process.exit(1);
}

console.log(`CourtScope structural validation passed (${required.length} required artifacts checked).`);
