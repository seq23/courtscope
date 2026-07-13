/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Env = {
  DB: D1Database;
  EVIDENCE_BUCKET: R2Bucket;
  SESSION?: KVNamespace;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  GITHUB_ADMIN_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
};

declare namespace App {
  interface Locals {
    runtime?: { env: Env; cf?: unknown };
  }
}
