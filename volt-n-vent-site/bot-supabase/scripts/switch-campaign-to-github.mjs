/**
 * Switch summer campaign scheduler from n8n → GitHub Actions.
 * - Deactivates n8n poller (stops droplet timer dependency)
 * - GitHub workflow .github/workflows/vnv-campaign-outbound.yml must be on main
 *
 *   node bot-supabase/scripts/switch-campaign-to-github.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(botRoot, '.env.jnb-voltnvent.local');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function n8nFetch(base, apiKey, method, route, body) {
  const url = `${base.replace(/\/$/, '')}/api/v1${route}`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

const env = loadEnv();
const apiKey = env.N8N_API_KEY;
const base = env.N8N_BASE_URL || 'http://143.198.227.200:5678';
if (!apiKey) throw new Error('Missing N8N_API_KEY');

const WF_NAME = 'VNV - TradeFlow Twilio Campaign Poller';
const list = await n8nFetch(base, apiKey, 'GET', '/workflows?limit=250');
const workflows = list.data ?? list;
const wf = workflows.find((w) => w.name === WF_NAME);

if (wf?.active) {
  await n8nFetch(base, apiKey, 'POST', `/workflows/${wf.id}/deactivate`);
  console.log('Deactivated n8n poller:', wf.id);
} else {
  console.log('n8n poller already off');
}

const check = await fetch('https://tradeflow-ivory-ten.vercel.app/api/campaign/outbound');
const json = await check.json();
console.log('TradeFlow outbound check:', JSON.stringify(json));

console.log(`
Scheduler is now: GitHub Actions (.github/workflows/vnv-campaign-outbound.yml)
Push that file to main on GitHub — then GitHub pings TradeFlow every 10 min (free).

You never need to open n8n for outbound again.
June 17 launch_at guard still blocks sends until 9 AM Pacific.
`);
