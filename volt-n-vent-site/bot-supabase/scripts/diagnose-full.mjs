/**
 * Full pipeline diagnostic for Volt N' Vent Alex SMS bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '..', '.env.jnb-voltnvent.local');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const base = env.N8N_BASE_URL.replace(/\/$/, '');
const apiKey = env.N8N_API_KEY;

async function getExecutions() {
  const res = await fetch(`${base}/api/v1/executions?limit=5&includeData=true`, {
    headers: { 'X-N8N-API-KEY': apiKey },
  });
  return (await res.json()).data ?? [];
}

async function getConfig() {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bot_client_full?slug=eq.volt-n-vent&limit=1`,
    {
      headers: {
        }
  );
  const rows = await res.json();
  return rows[0];
}

async function testGhlSend(contactId) {
  const body = { type: 'SMS', contactId, message: 'Alex test — ignore this message.' };
  const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_PRIVATE_INTEGRATION_TOKEN}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 500) };
}

async function testGhlSendWithLocation(contactId, locationId) {
  const body = { type: 'SMS', contactId, message: 'Alex test 2 — ignore.' };
  const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_PRIVATE_INTEGRATION_TOKEN}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      ...(locationId ? { locationId } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 500) };
}

async function fetchExecution(id) {
  const res = await fetch(`${base}/api/v1/executions/${id}?includeData=true`, {
    headers: { 'X-N8N-API-KEY': apiKey },
  });
  return res.json();
}

console.log('=== DIAGNOSTIC ===\n');

console.log('1) Recent n8n executions:');
const execs = await getExecutions();
if (!execs.length) console.log('   NONE');
for (const ex of execs) {
  console.log(`   #${ex.id} ${ex.status} @ ${ex.startedAt} last=${ex.data?.resultData?.lastNodeExecuted}`);
}

console.log('\n2) Supabase bot config:');
try {
  const cfg = await getConfig();
  console.log('   slug:', cfg?.slug, 'active:', cfg?.is_active, 'ghl_location:', cfg?.ghl_location_id);
} catch (e) {
  console.log('   FAIL:', e.message);
}

console.log('\n3) Execution #27 GHL send error detail:');
try {
  const ex = await fetchExecution(27);
  const run = ex.data?.resultData?.runData?.['Send SMS via GHL']?.[0];
  if (run?.error) console.log('   error:', run.error.message);
  if (run?.data?.main?.[0]?.[0]?.json) {
    console.log('   response:', JSON.stringify(run.data.main[0][0].json).slice(0, 400));
  }
  const prep = ex.data?.resultData?.runData?.['Prepare Reply']?.[0]?.data?.main?.[0]?.[0]?.json;
  if (prep) console.log('   contact_id sent:', prep.ghl_contact_id, 'reply_len:', prep.reply_text?.length);
} catch (e) {
  console.log('   skip:', e.message);
}

const contactId = process.argv[2];
if (contactId) {
  console.log('\n4) GHL send test with contact', contactId);
  const cfg = await getConfig();
  const loc = cfg?.ghl_location_id;
  if (loc && loc !== 'YOUR_GHL_LOCATION_ID') {
    console.log('   with locationId header:', loc);
    console.log(await testGhlSendWithLocation(contactId, loc));
  }
  console.log('   without locationId:');
  console.log(await testGhlSend(contactId));
}

console.log('\n5) Webhook URL (GHL must reach this):');
console.log('  ', `${base}/webhook/volt-n-vent-inbound-sms`);
console.log('   NOTE: GHL typically requires HTTPS — HTTP IP URLs often fail silently.');
