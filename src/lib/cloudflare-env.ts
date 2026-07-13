import { env } from 'cloudflare:workers';

export type CourtScopeEnv = {
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  GITHUB_ADMIN_TOKEN?: string;
  DB?: D1Database;
  EVIDENCE_BUCKET?: R2Bucket;
  SESSION?: KVNamespace;
};

export function getCloudflareEnv(): CourtScopeEnv {
  return env as unknown as CourtScopeEnv;
}
