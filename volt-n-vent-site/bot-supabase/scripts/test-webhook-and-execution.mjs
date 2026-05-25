/**
 * POST test SMS to n8n webhook and report latest execution status.
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

async function main() {
  const env = loadEnv();
  const base = env.N8N_BASE_URL.replace(/\/$/, '');
  const apiKey = env.N8N_API_KEY;
  const webhook = `${base}/webhook/volt-n-vent-inbound-sms`;

  const body = {
    client_slug: 'volt-n-vent',
    contact_id: process.argv[2] || 'test-contact-123',
    conversation_id: 'test-conv-456',
    message_body: process.argv[3] || 'Hi, my AC is not cooling. Can someone come out?',
    message_type: 'SMS',
    phone: '+17025551234',
    first_name: 'Test',
    last_name: 'User',
  };

  console.log('POST', webhook);
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('Webhook status:', res.status, await res.text());

  await new Promise((r) => setTimeout(r, 4000));

  const execRes = await fetch(`${base}/api/v1/executions?limit=3&includeData=true`, {
    headers: { 'X-N8N-API-KEY': apiKey },
  });
  const execJson = await execRes.json();
  const items = execJson.data ?? execJson;
  const latest = items[0];
  if (!latest) {
    console.log('No executions found');
    return;
  }
  console.log('\nLatest execution:', latest.id, 'status:', latest.status, 'finished:', latest.finished);
  if (latest.status === 'error' && latest.data?.resultData?.error) {
    console.log('Error:', latest.data.resultData.error.message);
    const lastNode = latest.data.resultData.lastNodeExecuted;
    console.log('Failed at node:', lastNode);
  } else if (latest.status === 'success') {
    console.log('SUCCESS — workflow completed');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
