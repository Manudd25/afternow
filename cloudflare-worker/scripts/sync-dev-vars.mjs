/**
 * Syncs Cloudflare credentials from root .env into cloudflare-worker/.dev.vars
 * so the Worker runtime can call Workers AI via REST API during local dev.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dirname, '../../.env');
const devVars = resolve(__dirname, '../.dev.vars');

if (!existsSync(rootEnv)) {
  console.warn('[sync-dev-vars] No ../.env found — Worker will use AI binding only.');
  process.exit(0);
}

const vars = {};
for (const line of readFileSync(rootEnv, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const accountId = vars.CLOUDFLARE_ACCOUNT_ID ?? vars.CLOUDFARE_ACCOUNT_ID;
const apiToken = vars.CLOUDFLARE_API_TOKEN ?? vars.CLOUDFARE_API_TOKEN;

if (!accountId || !apiToken) {
  console.warn(
    '[sync-dev-vars] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env'
  );
  process.exit(0);
}

writeFileSync(devVars, `CF_ACCOUNT_ID=${accountId}\nCF_API_TOKEN=${apiToken}\n`, 'utf8');
console.log('[sync-dev-vars] Wrote .dev.vars for local Workers AI REST API');
