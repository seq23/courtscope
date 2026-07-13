import fs from 'node:fs';

const requiredFiles = [
  'migrations/0004_city_submissions.sql',
  'src/lib/city-submissions.ts',
  'src/pages/api/city-submissions/index.ts',
  'src/pages/api/internal/city-submissions/export.ts',
  'src/pages/api/internal/city-submissions/status.ts',
  'src/pages/api/admin/submissions.ts',
  'src/pages/api/admin/submission-download.ts',
  'src/lib/admin/submission-actions.ts',
  'data/admin/submission_action_allowlist.json',
  'src/pages/admin/submissions.astro',
  'src/pages/add-cities.astro',
  'src/pages/es/add-cities.astro',
  '.github/workflows/city-submission-intake.yml',
  'public/city-intake/manifest-template.json',
  'public/city-intake/data-dictionary-template.csv',
  'scripts/admin/generate-admin-secrets.mjs',
  'docs/ADMIN_PASSWORD_AND_CITY_UPLOAD_SETUP.md',
];
for (const file of requiredFiles) if (!fs.existsSync(file)) throw new Error(`Missing city-submission artifact: ${file}`);

const publicPage = fs.readFileSync('src/pages/add-cities.astro', 'utf8');
for (const phrase of [
  'id="city-submission-form"',
  'name="data_bundle"',
  'Upload for private review',
  'manifest-template.json',
  'data-dictionary-template.csv',
  'Do not upload names or direct identifiers',
]) if (!publicPage.includes(phrase)) throw new Error(`Public city upload page is missing: ${phrase}`);

const intake = fs.readFileSync('src/pages/api/city-submissions/index.ts', 'utf8');
for (const phrase of [
  'EVIDENCE_BUCKET.put',
  'ensureCitySubmissionSchema',
  'validateCitySubmissionZip',
  "status: 'RECEIVED'",
  'MAX_CITY_SUBMISSION_BYTES',
  'sameOrigin(request)',
  'request_fingerprint',
  'daily city-submission limit',
]) if (!intake.includes(phrase)) throw new Error(`Public intake endpoint is missing: ${phrase}`);
if (/api\.github\.com/.test(intake)) throw new Error('Public upload endpoint must not dispatch directly to GitHub.');

const admin = fs.readFileSync('src/pages/admin/submissions.astro', 'utf8');
const adminApi = fs.readFileSync('src/pages/api/admin/submissions.ts', 'utf8');
for (const phrase of ['mark_under_review', 'reject', 'dispatch', 'purge_eligible']) {
  if (!admin.includes(phrase) || !adminApi.includes(phrase)) throw new Error(`Admin submission action is not wired: ${phrase}`);
}
if (!adminApi.includes('city-submission-intake.yml')) throw new Error('Admin approval does not dispatch the public-submission workflow.');
if (!adminApi.includes('CITY_PIPELINE_SHARED_SECRET')) throw new Error('Admin approval does not check the pipeline shared secret.');
if (!admin.includes('Download private ZIP') || !admin.includes('purge_eligible')) throw new Error('Admin review lacks private download or retention cleanup controls.');
const downloadApi = fs.readFileSync('src/pages/api/admin/submission-download.ts', 'utf8');
if (!downloadApi.includes('EVIDENCE_BUCKET.get') || !downloadApi.includes('no-store, private')) throw new Error('Protected private ZIP download is missing.');
const actionCode = fs.readFileSync('src/lib/admin/submission-actions.ts', 'utf8');
const actionRegistry = JSON.parse(fs.readFileSync('data/admin/submission_action_allowlist.json', 'utf8'));
for (const id of ['mark_under_review','reject','dispatch','purge_eligible']) {
  if (!actionCode.includes(id) || !actionRegistry.actions.some((item) => item.id === id)) throw new Error(`Submission action registry drift: ${id}`);
}

const exportApi = fs.readFileSync('src/pages/api/internal/city-submissions/export.ts', 'utf8');
const statusApi = fs.readFileSync('src/pages/api/internal/city-submissions/status.ts', 'utf8');
for (const [file, text] of [['export endpoint', exportApi], ['status endpoint', statusApi]]) {
  if (!text.includes('CITY_PIPELINE_SHARED_SECRET') || !text.includes('authorization')) throw new Error(`${file} is missing shared-secret authentication.`);
}

const workflow = fs.readFileSync('.github/workflows/city-submission-intake.yml', 'utf8');
for (const phrase of [
  'CITY_PIPELINE_SHARED_SECRET',
  '/api/internal/city-submissions/export',
  'process_city_batch.py',
  'npm run verify',
  '/api/internal/city-submissions/status',
  'git push',
  'CITY_PIPELINE_SHARED_SECRET',
]) if (!workflow.includes(phrase)) throw new Error(`Public-submission workflow is missing: ${phrase}`);

const login = fs.readFileSync('src/pages/admin/login.astro', 'utf8');
const loginApi = fs.readFileSync('src/pages/api/admin/login.ts', 'utf8');
if (!login.includes('Admin access is not configured in this deployment') || !loginApi.includes('setup=missing')) {
  throw new Error('Admin login does not distinguish missing secrets from a wrong password.');
}

const repoText = requiredFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
if (repoText.includes('Ihaveadream.')) throw new Error('Plaintext admin password must not be committed.');
console.log('City submission PASS (public upload, private intake, admin review, workflow handoff, and credential diagnostics).');
