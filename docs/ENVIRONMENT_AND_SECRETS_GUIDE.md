# Environment and Secrets Guide

## Required production secrets

- `ADMIN_PASSWORD_HASH` — PBKDF2-SHA256 formatted password hash;
- `ADMIN_SESSION_SECRET` — strong session signing secret;
- `COURTSCOPE_GITHUB_ADMIN_TOKEN` — fine-grained single-repository token for approved workflow dispatch;
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — deployment workflow only.

## Non-secret production configuration

- `GITHUB_REPOSITORY` must identify `owner/repository` for admin dispatch.

## Rules

Never commit secrets, `.dev.vars`, environment files, temporary worker-secret files, or provider tokens. The validator scans common token patterns. Local ignored secret state is not itself a failure; tracked, staged, or packaged secret exposure is.
