import fs from 'node:fs';
import path from 'node:path';

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

export function validateCityPublication({ root = process.cwd() } = {}) {
  const registry = readJson(root, 'data/cities/registry.json');
  const contract = readJson(root, 'data/cities/completeness_contract.json');
  const downloadsRoot = path.join(root, 'public/downloads');

  if (contract.policy !== 'REJECT_INCOMPLETE_DATA') {
    throw new Error('Completeness policy must reject incomplete data.');
  }

  for (const city of registry.cities) {
    const downloadDir = `public/downloads/${city.slug}`;

    if (!city.published) {
      if (city.downloadsAvailable) {
        throw new Error(`${city.slug}: unpublished city claims downloads are available.`);
      }
      if (exists(root, downloadDir)) {
        throw new Error(`${city.slug}: unpublished city has a public download directory.`);
      }
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
    ]) {
      if (!exists(root, file)) {
        throw new Error(`${city.slug}: missing published artifact ${file}`);
      }
    }
  }

  // No city is published yet in a clean prelaunch repository, so the downloads
  // root may legitimately be absent. Treat that as an empty directory rather
  // than a validation failure.
  const downloadEntries = fs.existsSync(downloadsRoot)
    ? fs.readdirSync(downloadsRoot, { withFileTypes: true })
    : [];

  for (const file of downloadEntries) {
    if (!file.isDirectory()) {
      throw new Error(`Root-level public download is forbidden: ${file.name}`);
    }
    if (!registry.cities.some((city) => city.slug === file.name && city.published)) {
      throw new Error(`Orphan public download directory: ${file.name}`);
    }
  }

  return { cityCount: registry.cities.length };
}
