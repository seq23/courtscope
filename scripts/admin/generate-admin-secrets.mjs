import { pbkdf2Sync, randomBytes } from 'node:crypto';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '');
if (!password) {
  console.error('Pipe the intended admin password to stdin. The password is not written to disk.');
  process.exit(2);
}
const iterations = 310000;
const salt = randomBytes(16);
const digest = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const passwordHash = `pbkdf2_sha256$${iterations}$${salt.toString('hex')}$${digest.toString('hex')}`;
const sessionSecret = randomBytes(48).toString('base64url');
const pipelineSecret = randomBytes(48).toString('base64url');
console.log(JSON.stringify({
  ADMIN_PASSWORD_HASH: passwordHash,
  ADMIN_SESSION_SECRET: sessionSecret,
  CITY_PIPELINE_SHARED_SECRET: pipelineSecret,
}, null, 2));
