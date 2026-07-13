import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const repairs = [];
const registryPath = path.join(root, 'data/cities/registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
let registryChanged = false;

for (const city of registry.cities) {
  const shouldDownload = city.status === 'PUBLISHED' && city.published === true;
  if (city.downloadsAvailable !== shouldDownload) {
    city.downloadsAvailable = shouldDownload;
    registryChanged = true;
    repairs.push(`Synced download flag for ${city.slug}.`);
  }
  const downloadDir = path.join(root, 'public/downloads', city.slug);
  if (!shouldDownload && fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
    repairs.push(`Removed public download residue for unpublished city ${city.slug}.`);
  }
}
if (registryChanged) fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const routeManifest = {
  version: '2.0.0',
  status: 'ACTIVE_CITY_ARCHITECTURE',
  nationalRoutes: ['/', '/cities', '/data', '/methodology', '/add-cities'],
  cityPattern: '/<city-slug>/',
  cityRoutes: ['/<city-slug>/', '/<city-slug>/judges', '/<city-slug>/judges/<judge-slug>', '/<city-slug>/compare', '/<city-slug>/cases', '/<city-slug>/cases/<case-id>', '/<city-slug>/data'],
  legacyRedirects: ['/judges', '/compare', '/cases', '/judges/<judge-slug>', '/cases/<case-id>'],
  adminRoutes: ['/admin', '/admin/cities', '/admin/add-cities', '/admin/corrections'],
  spanishPrefix: '/es',
  caseRoutesNoindex: true,
};
const routePath = path.join(root, 'data/governance/route_manifest.json');
const currentRoute = fs.existsSync(routePath) ? JSON.parse(fs.readFileSync(routePath, 'utf8')) : null;
if (JSON.stringify(currentRoute) !== JSON.stringify(routeManifest)) {
  fs.writeFileSync(routePath, `${JSON.stringify(routeManifest, null, 2)}\n`);
  repairs.push('Regenerated the derived route manifest.');
}

const sync = spawnSync('python3', ['scripts/cities/sync_admin_status.py'], { cwd: root, encoding: 'utf8' });
if (sync.status !== 0) {
  console.error(sync.stdout);
  console.error(sync.stderr);
  process.exit(sync.status ?? 1);
}

fs.mkdirSync(path.join(root, 'artifacts/validation'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'artifacts/validation/safe-repair.json'),
  `${JSON.stringify({ status: 'PASS', repairs, protectedRepairsAttempted: false }, null, 2)}\n`,
);
console.log(repairs.length ? `Safe repair applied ${repairs.length} deterministic repair(s).` : 'Safe repair found no deterministic drift.');
