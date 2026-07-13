import fs from 'node:fs';

const actions = fs.readFileSync('src/lib/admin/actions.ts', 'utf8');
const api = fs.readFileSync('src/pages/api/admin/actions.ts', 'utf8');
const middleware = fs.readFileSync('src/middleware.ts', 'utf8');
const admin = fs.readFileSync('src/pages/admin/index.astro', 'utf8');
const allowlist = JSON.parse(fs.readFileSync('data/admin/action_allowlist.json', 'utf8'));
const expectedActions = [
  'process_city_data',
  'refresh_city_status',
  'refresh_cleanup_queue',
  'cleanup_processed_data',
  'pause_automation',
  'resume_automation',
  'emergency_stop',
];

for (const action of expectedActions) {
  if (!actions.includes(action) || !admin.includes(action)) throw new Error(`Admin action is not wired end to end: ${action}`);
  const registryAction = allowlist.actions.find((item) => item.id === action);
  if (!registryAction) throw new Error(`Admin action is missing from the governance allowlist: ${action}`);
  if (!Array.isArray(registryAction.allowedPaths) || !Array.isArray(registryAction.forbiddenPaths)) {
    throw new Error(`Admin action lacks path boundaries: ${action}`);
  }
}
if (allowlist.actions.length !== expectedActions.length) throw new Error('Admin action registry contains an unimplemented or duplicate action.');

for (const workflow of ['city-data-pipeline.yml', 'city-data-cleanup.yml', 'admin-control.yml']) {
  if (!fs.existsSync(`.github/workflows/${workflow}`) || !actions.includes(workflow)) throw new Error(`Missing workflow mapping: ${workflow}`);
}
if (!middleware.includes("path.startsWith('/api/admin')")) throw new Error('Admin API paths are not protected by session middleware.');
if (!api.includes('sameOrigin(request)') || !api.includes('isActionId(action)')) throw new Error('Admin API origin or allowlist enforcement is missing.');
if (!api.includes('No success was recorded') || !api.includes('Completion is not claimed')) throw new Error('Admin dispatch proof boundary is missing.');
const cleanupWorkflow = fs.readFileSync('.github/workflows/city-data-cleanup.yml', 'utf8');
if (!cleanupWorkflow.includes('DELETE_ELIGIBLE_PROCESSED_BATCHES')) throw new Error('Cleanup workflow lacks exact destructive confirmation.');
console.log('Admin pipeline PASS (authentication, origin control, allowlist parity, workflows, and proof boundary).');
