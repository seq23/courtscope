import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const registry = JSON.parse(fs.readFileSync('data/governance/validation_registry.json', 'utf8'));
const profiles = JSON.parse(fs.readFileSync('data/governance/validation_profiles.json', 'utf8'));
const profileName = process.env.COURTSCOPE_VALIDATION_PROFILE || profiles.defaultProfile;
const selected = new Set(profiles.profiles[profileName]);
if (!profiles.profiles[profileName]) throw new Error(`Unknown validation profile: ${profileName}`);

const results = [];
for (const validator of registry.validators.filter((item) => selected.has(item.id))) {
  process.stdout.write(`\n[${validator.id}] ${validator.command}\n`);
  const result = spawnSync(validator.command, {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });
  results.push({ id: validator.id, status: result.status === 0 ? 'PASS' : 'BLOCK', exitCode: result.status ?? 1 });
  if (result.status !== 0 && validator.blocking) {
    writeReceipt('BLOCKED', results, profileName);
    process.exit(result.status ?? 1);
  }
}

const truth = spawnSync('node scripts/validate-repo-truth.mjs', { shell: true, stdio: 'inherit', env: process.env });
results.push({ id: 'repo-truth', status: truth.status === 0 ? 'PASS' : 'BLOCK', exitCode: truth.status ?? 1 });
if (truth.status !== 0) {
  writeReceipt('BLOCKED', results, profileName);
  process.exit(truth.status ?? 1);
}

writeReceipt('PASS', results, profileName);
console.log(`\nCourtScope validation PASS (${results.length} checks, profile: ${profileName}).`);

function writeReceipt(status, checks, profile) {
  const directory = path.join('artifacts', 'validation');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'validation-receipt.json'), `${JSON.stringify({ status, profile, checks }, null, 2)}\n`);
}
