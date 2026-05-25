/**
 * Import and activate the Alex SMS poller workflow (no GHL automation required).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botRoot = path.join(__dirname, '..');
const envFile = path.join(botRoot, '.env.jnb-voltnvent.local');
const idsFile = path.join(botRoot, '.n8n-credential-ids.json');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function api(base, key, method, route, body) {
  const res = await fetch(`${base.replace(/\/$/, '')}/api/v1${route}`, {
    method,
    headers: {
      'X-N8N-API-KEY': key,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  const env = loadEnv();
  const base = env.N8N_BASE_URL;
  const key = env.N8N_API_KEY;
  const saved = fs.existsSync(idsFile) ? JSON.parse(fs.readFileSync(idsFile, 'utf8')) : {};
  const ghlCredName = 'VNV GoHighLevel';
  const ghlId = saved[ghlCredName];
  if (!ghlId) throw new Error('Missing GHL credential — run wire-n8n-autonomous.mjs first');

  const wfPath = path.join(botRoot, '..', 'n8n', 'volt-n-vent-alex-sms-poller.json');
  const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
  for (const node of wf.nodes) {
    if (node.name === 'GHL Recent Conversations') {
      node.credentials = { httpHeaderAuth: { id: ghlId, name: ghlCredName } };
    }
  }

  const list = await api(base, key, 'GET', '/workflows?limit=250');
  const existing = (list.data ?? list).find((w) => w.name?.includes('Alex SMS Poller'));

  if (existing) {
    console.log('Updating poller workflow', existing.id);
    await api(base, key, 'PUT', `/workflows/${existing.id}`, {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings ?? { executionOrder: 'v1' },
      staticData: wf.staticData,
    });
    try {
      await api(base, key, 'POST', `/workflows/${existing.id}/activate`);
    } catch {
      console.warn('Activate manually in n8n if needed');
    }
    console.log('DONE — Poller active:', existing.id);
  } else {
    console.log('Creating poller workflow...');
    const created = await api(base, key, 'POST', '/workflows', {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings ?? { executionOrder: 'v1' },
    });
    await api(base, key, 'POST', `/workflows/${created.id}/activate`);
    console.log('DONE — Poller created and activated:', created.id);
  }

  console.log('\nTurn OFF your GHL Customer Replied workflow to avoid duplicate replies.');
  console.log('Text your GHL number to test — Alex checks every 30 seconds.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
