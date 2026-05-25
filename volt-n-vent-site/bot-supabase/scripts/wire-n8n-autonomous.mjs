/**
 * Autonomous n8n wiring for Volt N' Vent Alex SMS bot.
 * Reads bot-supabase/.env.jnb-voltnvent.local and configures credentials + workflow via n8n API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botRoot = path.join(__dirname, '..');
const envFile = path.join(botRoot, '.env.jnb-voltnvent.local');

function loadEnv() {
  if (!fs.existsSync(envFile)) throw new Error('Missing .env.jnb-voltnvent.local');
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
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${route} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function findWorkingBase(urls, apiKey) {
  for (const base of urls) {
    try {
      await n8nFetch(base, apiKey, 'GET', '/workflows?limit=1');
      return base;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function createHeaderCred(base, apiKey, name, headerName, headerValue) {
  try {
    const created = await n8nFetch(base, apiKey, 'POST', '/credentials', {
      name,
      type: 'httpHeaderAuth',
      data: {
        name: headerName,
        value: headerValue,
      },
    });
    return created.id;
  } catch (e) {
    if (String(e.message).includes('already exists') || String(e.message).includes('409')) {
      throw new Error(`Credential "${name}" may already exist — delete it in n8n UI once, then re-run.`);
    }
    throw e;
  }
}

async function getOrCreateHeaderCred(base, apiKey, name, headerName, headerValue, saved) {
  if (saved[name]) return saved[name];
  const id = await createHeaderCred(base, apiKey, name, headerName, headerValue);
  saved[name] = id;
  return id;
}

const MAIN_WF_NAME = "Volt N Vent - Alex SMS Bot (GHL + Supabase)";

function ensureHeader(params, name, value) {
  const row = params.find((p) => p.name === name);
  if (row) row.value = value;
  else params.push({ name, value });
}

function patchWorkflowNodes(workflow, credIds) {
  for (const node of workflow.nodes) {
    const url = String(node.parameters?.url || '');

    if (url.includes('supabase.co')) {
      node.credentials = {
        httpHeaderAuth: { id: credIds.supabase, name: 'VNV Supabase Service Role' },
      };
      node.parameters.headerParameters = node.parameters.headerParameters || { parameters: [] };
      const params = node.parameters.headerParameters.parameters;
      ensureHeader(params, 'Accept', 'application/json');
      ensureHeader(params, 'Authorization', `Bearer ${credIds.supabaseServiceKey}`);
    }

    if (url.includes('api.openai.com')) {
      node.credentials = {
        httpHeaderAuth: { id: credIds.openai, name: 'VNV OpenAI' },
      };
    }

    if (url.includes('leadconnectorhq.com')) {
      node.credentials = {
        httpHeaderAuth: { id: credIds.ghl, name: 'VNV GoHighLevel' },
      };
    }

    const cred = node.credentials?.httpHeaderAuth;
    if (cred?.id?.startsWith('REPLACE_')) {
      if (cred.id.includes('SUPABASE')) {
        node.credentials.httpHeaderAuth = { id: credIds.supabase, name: 'VNV Supabase Service Role' };
      } else if (cred.id.includes('OPENAI')) {
        node.credentials.httpHeaderAuth = { id: credIds.openai, name: 'VNV OpenAI' };
      } else if (cred.id.includes('GHL')) {
        node.credentials.httpHeaderAuth = { id: credIds.ghl, name: 'VNV GoHighLevel' };
      }
    }
  }
  return workflow;
}

function pickMainWorkflow(workflows, savedIds) {
  if (savedIds.mainWorkflowId) {
    const hit = workflows.find((w) => w.id === savedIds.mainWorkflowId);
    if (hit) return hit;
  }
  const canonical = workflows.find((w) => w.id === 'n80HOBrgc3f0HYWY');
  if (canonical) return canonical;
  return workflows.find((w) => w.name === MAIN_WF_NAME);
}

async function main() {
  const env = loadEnv();
  const apiKey = env.N8N_API_KEY;
  if (!apiKey) throw new Error('N8N_API_KEY missing');

  const candidates = [
    env.N8N_BASE_URL,
    'http://143.198.227.200:5678',
    'https://143.198.227.200:5678',
    'http://143.198.227.200',
    'https://143.198.227.200',
    'http://localhost:5678',
    'http://127.0.0.1:5678',
  ].filter(Boolean);

  console.log('Finding n8n instance...');
  const base = await findWorkingBase([...new Set(candidates)], apiKey);
  if (!base) {
    console.error('Could not reach n8n. Add correct N8N_BASE_URL to .env.jnb-voltnvent.local');
    console.error('Tried:', candidates.join(', '));
    process.exit(1);
  }
  console.log('n8n base:', base);

  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = env.OPENAI_API_KEY;
  const ghlToken = env.GHL_PRIVATE_INTEGRATION_TOKEN;
  if (!supabaseKey || !openaiKey || !ghlToken) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, or GHL_PRIVATE_INTEGRATION_TOKEN');
  }

  console.log('Creating credentials...');
  const idsFile = path.join(botRoot, '.n8n-credential-ids.json');
  const saved = fs.existsSync(idsFile) ? JSON.parse(fs.readFileSync(idsFile, 'utf8')) : {};

  const credSupabase = await getOrCreateHeaderCred(
    base,
    apiKey,
    'VNV Supabase Service Role',
    'apikey',
    supabaseKey,
    saved
  );
  const credOpenai = await getOrCreateHeaderCred(
    base,
    apiKey,
    'VNV OpenAI',
    'Authorization',
    `Bearer ${openaiKey}`,
    saved
  );
  const credGhl = await getOrCreateHeaderCred(
    base,
    apiKey,
    'VNV GoHighLevel',
    'Authorization',
    `Bearer ${ghlToken}`,
    saved
  );
  fs.writeFileSync(idsFile, JSON.stringify(saved, null, 2));
  console.log('Credentials OK');

  const wfList = await n8nFetch(base, apiKey, 'GET', '/workflows?limit=250');
  const workflows = wfList.data ?? wfList;
  const wfIdsFile = path.join(botRoot, '.n8n-workflow-ids.json');
  const wfIds = fs.existsSync(wfIdsFile) ? JSON.parse(fs.readFileSync(wfIdsFile, 'utf8')) : {};
  const wfSummary = pickMainWorkflow(workflows, wfIds);
  if (!wfSummary) {
    throw new Error('Workflow not found — import volt-n-vent-alex-sms-ghl.json first');
  }
  console.log('Main workflow:', wfSummary.id, wfSummary.name);

  for (const w of workflows) {
    if (w.name === MAIN_WF_NAME && w.id !== wfSummary.id && w.active) {
      try {
        await n8nFetch(base, apiKey, 'POST', `/workflows/${w.id}/deactivate`);
        console.log('Deactivated duplicate workflow:', w.id);
      } catch (e) {
        console.warn('Could not deactivate', w.id, e.message);
      }
    }
  }

  const wfPath = path.join(botRoot, '..', 'n8n', 'volt-n-vent-alex-sms-ghl.json');
  const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
  patchWorkflowNodes(wf, {
    supabase: credSupabase,
    openai: credOpenai,
    ghl: credGhl,
    supabaseServiceKey: supabaseKey,
  });

  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings ?? { executionOrder: 'v1' },
    staticData: wf.staticData ?? null,
  };

  console.log('Updating workflow...');
  await n8nFetch(base, apiKey, 'PUT', `/workflows/${wfSummary.id}`, payload);

  wfIds.mainWorkflowId = wfSummary.id;
  fs.writeFileSync(wfIdsFile, JSON.stringify(wfIds, null, 2));

  console.log('Activating workflow...');
  try {
    await n8nFetch(base, apiKey, 'POST', `/workflows/${wfSummary.id}/activate`);
  } catch (e) {
    console.warn('Activate via API failed (enable manually in UI):', e.message);
  }

  const webhookUrl = 'https://voltnvent.com/api/ghl-sms-webhook';
  const outPath = path.join(botRoot, '..', 'n8n', 'WEBHOOK-URL-FOR-GHL.txt');
  fs.writeFileSync(
    outPath,
    `Paste this URL in GHL → GHL to n8n SMS Bot → webhook step:\n\n${webhookUrl}\n\n(Do NOT use the raw n8n HTTP URL — GHL requires HTTPS.)\n`
  );

  console.log('\n=== DONE ===');
  console.log('Webhook URL for GHL (also saved to n8n/WEBHOOK-URL-FOR-GHL.txt):');
  console.log(webhookUrl);
  console.log('\nSee SIMPLE-GHL-SETUP.md — paste URL, 2-field JSON body, publish workflow ON.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
