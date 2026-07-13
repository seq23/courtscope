import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCityPublication } from './lib/city-publication-validator.mjs';

function writeJson(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function createRoot(city) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'courtscope-city-publication-'));
  writeJson(root, 'data/cities/registry.json', { cities: [city] });
  writeJson(root, 'data/cities/completeness_contract.json', { policy: 'REJECT_INCOMPLETE_DATA' });
  return root;
}

function unpublishedCity(overrides = {}) {
  return {
    slug: 'memphis',
    published: false,
    downloadsAvailable: false,
    status: 'FIXTURE_PREVIEW',
    dataMode: 'fixture',
    ...overrides,
  };
}

{
  const root = createRoot(unpublishedCity());
  try {
    assert.doesNotThrow(() => validateCityPublication({ root }));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = createRoot(unpublishedCity());
  try {
    fs.mkdirSync(path.join(root, 'public/downloads/memphis'), { recursive: true });
    assert.throws(
      () => validateCityPublication({ root }),
      /unpublished city has a public download directory/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = createRoot(unpublishedCity({
    published: true,
    downloadsAvailable: true,
    status: 'PUBLISHED',
    dataMode: 'published',
  }));
  try {
    assert.throws(
      () => validateCityPublication({ root }),
      /missing published artifact/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log('City publication validator regression tests passed.');
