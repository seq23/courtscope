import fs from 'node:fs';
import path from 'node:path';

const registry = JSON.parse(fs.readFileSync('data/cities/registry.json', 'utf8'));
const contract = JSON.parse(fs.readFileSync('data/cities/completeness_contract.json', 'utf8'));
if (contract.policy !== 'REJECT_INCOMPLETE_DATA') throw new Error('Completeness policy must reject incomplete data.');
for (const city of registry.cities) {
  const downloadDir = path.join('public/downloads', city.slug);
  if (!city.published) {
    if (city.downloadsAvailable) throw new Error(`${city.slug}: unpublished city claims downloads are available.`);
    if (fs.existsSync(downloadDir)) throw new Error(`${city.slug}: unpublished city has a public download directory.`);
    continue;
  }
  if (city.status !== 'PUBLISHED' || !city.downloadsAvailable || city.dataMode !== 'published') {
    throw new Error(`${city.slug}: published registry state is inconsistent.`);
  }
  for (const file of [
    `data/cities/published/${city.slug}/judges.json`,
    `data/cities/published/${city.slug}/cases.json`,
    `data/cities/published/${city.slug}/release.json`,
    `public/downloads/${city.slug}/cases.csv`,
    `public/downloads/${city.slug}/cases.json`,
    `public/downloads/${city.slug}/manifest.json`,
  ]) if (!fs.existsSync(file)) throw new Error(`${city.slug}: missing published artifact ${file}`);
}
for (const file of fs.readdirSync('public/downloads', { withFileTypes: true })) {
  if (!file.isDirectory()) throw new Error(`Root-level public download is forbidden: ${file.name}`);
  if (!registry.cities.some((city) => city.slug === file.name && city.published)) throw new Error(`Orphan public download directory: ${file.name}`);
}
console.log(`City publication PASS (${registry.cities.length} city record(s)).`);
