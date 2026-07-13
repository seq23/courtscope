import fs from 'node:fs';
import path from 'node:path';

const root = 'dist';
const server = path.join(root, 'server');
const client = path.join(root, 'client');

for (const required of [
  path.join(server, 'entry.mjs'),
  path.join(server, 'virtual_astro_middleware.mjs'),
  path.join(client, '_headers'),
  path.join(client, 'robots.txt'),
]) {
  if (!fs.existsSync(required)) throw new Error(`Missing required built artifact: ${required}`);
}

const files = walk(root).filter((file) => /\.(mjs|js|css|txt|json)$/.test(file));
const bundle = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

const routeTokens = [
  'src/pages/index@_@astro',
  'src/pages/cities@_@astro',
  'src/pages/add-cities@_@astro',
  'src/pages/data@_@astro',
  'src/pages/methodology@_@astro',
  'src/pages/[city]/index@_@astro',
  'src/pages/[city]/judges/index@_@astro',
  'src/pages/[city]/judges/[judge]@_@astro',
  'src/pages/[city]/compare@_@astro',
  'src/pages/[city]/cases/index@_@astro',
  'src/pages/[city]/cases/[caseId]@_@astro',
  'src/pages/[city]/data@_@astro',
  'src/pages/es/[city]/index@_@astro',
  'src/pages/es/[city]/judges/index@_@astro',
  'src/pages/es/[city]/compare@_@astro',
  'src/pages/es/[city]/cases/index@_@astro',
  'src/pages/es/[city]/data@_@astro',
  'src/pages/admin/login@_@astro',
  'src/pages/admin/index@_@astro',
];
for (const token of routeTokens) {
  if (!bundle.includes(token)) throw new Error(`Built route missing from server manifest: ${token}`);
}

const contentTokens = [
  'Disparity Score',
  'Smaller racial gaps',
  'Moderate racial gaps',
  'Bigger racial gaps',
  'Why this score?',
  'does not prove racism',
  'Choose a city',
  'Who to contact',
  'Incomplete datasets are rejected',
];
for (const token of contentTokens) {
  if (!bundle.includes(token)) throw new Error(`Required public content missing from compiled output: ${token}`);
}

for (const forbidden of ['Fairness Score', 'More Fair', 'Moderately Fair', 'Less Fair']) {
  if (bundle.includes(forbidden)) throw new Error(`Retired score language found in compiled output: ${forbidden}`);
}

const publicDownloads = fs.existsSync('public/downloads') ? walk('public/downloads').filter((file) => fs.statSync(file).isFile()) : [];
if (publicDownloads.length) throw new Error(`Unpublished public downloads were packaged: ${publicDownloads.join(', ')}`);

console.log(`Built output PASS (${files.length} compiled assets inspected; city routes, public language, and download gate present).`);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
