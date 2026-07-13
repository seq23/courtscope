import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md', 'package.json', 'package-lock.json', 'astro.config.mjs', 'wrangler.toml',
  'docs/START_HERE_NEW_PERSON.md', 'docs/DAY_0_VA_OPERATOR_GUIDE.md', 'docs/ADMIN_GUIDE_FOR_NON_ENGINEERS.md',
  'docs/ENVIRONMENT_AND_SECRETS_GUIDE.md', 'docs/ROLLBACK.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/FULL_INTENDED_SYSTEM.md', 'docs/CITY_DATA_PIPELINE_RUNBOOK.md', 'docs/METHODOLOGY_TECHNICAL_V2.md',
  'data/governance/route_manifest.json', 'data/governance/validation_registry.json', 'data/governance/validation_profiles.json',
  'data/cities/registry.json', 'data/cities/completeness_contract.json', 'data/admin/city_pipeline_status.json',
  'src/pages/index.astro', 'src/pages/cities.astro', 'src/pages/data.astro', 'src/pages/methodology.astro',
  'src/pages/add-cities.astro', 'src/pages/[city]/index.astro', 'src/pages/[city]/judges/[judge].astro',
  'src/pages/[city]/cases/index.astro', 'src/pages/[city]/data.astro', 'src/pages/admin/index.astro',
  'scripts/cities/process_incoming.py', 'scripts/cities/test_city_pipeline.py', 'model/test_engine.py',
  '.github/workflows/city-data-pipeline.yml', '.github/workflows/city-data-cleanup.yml',
  '.github/workflows/city-submission-intake.yml', 'src/pages/admin/submissions.astro',
  'src/pages/api/city-submissions/index.ts', 'src/pages/api/admin/submission-download.ts',
  'data/admin/submission_action_allowlist.json', 'migrations/0004_city_submissions.sql'
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join('\n')}`);
  process.exit(1);
}

const forbiddenPatterns = [
  /ghp_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /ADMIN_PASSWORD\s*=\s*[^\s#]+/g,
];
const scanExtensions = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.astro', '.toml', '.py', '.txt', '.yml', '.yaml']);
const hits = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.astro', '.wrangler', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (scanExtensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      for (const pattern of forbiddenPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) hits.push(path.relative(root, full));
      }
    }
  }
}
walk(root);
if (hits.length) {
  console.error(`Potential secret patterns found in: ${[...new Set(hits)].join(', ')}`);
  process.exit(1);
}
console.log(`Structure PASS (${required.length} required artifacts; no secret-pattern hits).`);
