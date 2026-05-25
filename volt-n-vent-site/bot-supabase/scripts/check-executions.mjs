import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.jnb-voltnvent.local');
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([^#=]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1].trim(), m[2].trim()])
);

const base = env.N8N_BASE_URL.replace(/\/$/, '');
const res = await fetch(`${base}/api/v1/executions?limit=10&includeData=true`, {
  headers: { 'X-N8N-API-KEY': env.N8N_API_KEY },
});
const json = await res.json();
for (const ex of json.data ?? []) {
  const err = ex.data?.resultData?.error;
  const msg = err ? err.message?.slice(0, 100) : 'ok';
  console.log(ex.id, ex.status, ex.startedAt, msg, 'last=' + (ex.data?.resultData?.lastNodeExecuted ?? '-'));
}
