/**
 * Discover Marketing Pipeline stages in GHL and save IDs to Supabase metadata.ghl_crm_sync
 *
 * Requires GHL_PRIVATE_INTEGRATION_TOKEN with scopes:
 *   opportunities.readonly, opportunities.write, contacts.write
 *
 * Usage: node bot-supabase/scripts/setup-ghl-marketing-pipeline.mjs
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(botRoot, '.env.jnb-voltnvent.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID || '81uoqXcdjO6CKRFIIuw6';
const pipelineNameWanted = (process.env.GHL_MARKETING_PIPELINE_NAME || 'marketing pipeline').toLowerCase();

if (!token) throw new Error('Missing GHL_PRIVATE_INTEGRATION_TOKEN in .env.jnb-voltnvent.local');

const headers = {
  Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

const res = await fetch(
  `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`,
  { headers }
);
const body = await res.json();
if (!res.ok) {
  console.error('GHL pipelines error', res.status, body);
  process.exit(1);
}

const pipelines = body.pipelines || body.data || [];
console.log('Found pipelines:', pipelines.map((p) => p.name).join(', '));

const pipeline = pipelines.find((p) => String(p.name || '').toLowerCase().includes(pipelineNameWanted));
if (!pipeline) {
  console.error(`Could not find pipeline matching "${pipelineNameWanted}". Set GHL_MARKETING_PIPELINE_NAME in env.`);
  process.exit(1);
}

const stages = pipeline.stages || [];
console.log('\nStages in', pipeline.name + ':');
for (const s of stages) console.log(`  - ${s.name}: ${s.id}`);

const defaultDispositions = {
  new_contact: { label: 'SMS — New Contact', stage_names: ['new', 'new lead', 'lead', 'inbound', 'fresh'] },
  engaged: { label: 'SMS — Engaged', stage_names: ['engaged', 'interested', 'responded', 'in conversation', 'contacted', 'working'] },
  wellness_interested: { label: 'Wellness — Interested', stage_names: ['wellness', 'offer', 'campaign', 'promo'] },
  appointment_set: { label: 'Appointment Set', stage_names: ['booked', 'scheduled', 'appointment', 'appointment set', 'set'] },
  urgent_service: { label: 'Urgent Service Need', stage_names: ['urgent', 'hot', 'service', 'emergency', 'hot lead'] },
  sales_handoff: { label: 'Sales / Quote Handoff', stage_names: ['sales', 'quote', 'estimate', 'proposal'] },
  human_handoff: { label: 'Needs Human Follow-up', stage_names: ['handoff', 'human', 'follow up', 'callback', 'needs follow up'] },
  not_interested: { label: 'Not Interested', stage_names: ['not interested', 'dead', 'lost', 'unqualified', 'no', 'closed lost'] },
  opt_out: { label: 'SMS Opt-Out', stage_names: ['opt out', 'dnc', 'stop', 'unsubscribed'] },
};

function matchStage(names) {
  const norm = (s) => String(s || '').toLowerCase().trim();
  for (const s of stages) {
    const sn = norm(s.name);
    for (const hint of names) {
      if (sn === norm(hint)) return s.id;
    }
  }
  for (const hint of names) {
    if (norm(hint).length < 4) continue;
    const hit = stages.find((s) => norm(s.name).includes(norm(hint)));
    if (hit) return hit.id;
  }
  return null;
}

const stageByName = Object.fromEntries(stages.map((s) => [String(s.name || '').toLowerCase().trim(), s.id]));
const manualOverrides = {
  new_contact: stageByName['new lead'],
  engaged: stageByName['contacted'],
  wellness_interested: stageByName['contacted'] || stageByName['follow up'],
  appointment_set: stageByName['appointment booked'],
  urgent_service: stageByName['follow up'] || stageByName['contacted'],
  sales_handoff: stageByName['follow up'] || stageByName['contacted'],
  human_handoff: stageByName['follow up'],
  not_interested: stageByName['not interested'],
  opt_out: stageByName['dnd'] || stageByName['not interested'],
};

const stage_ids = {};
for (const [key, disp] of Object.entries(defaultDispositions)) {
  stage_ids[key] = manualOverrides[key] || matchStage(disp.stage_names);
}

// Fallback: map unmapped keys to first stage
const firstStageId = stages[0]?.id || null;
for (const key of Object.keys(defaultDispositions)) {
  if (!stage_ids[key]) stage_ids[key] = firstStageId;
}

console.log('\nAuto-mapped stage_ids:');
for (const [k, v] of Object.entries(stage_ids)) {
  const stageName = stages.find((s) => s.id === v)?.name || '?';
  console.log(`  ${k} → ${stageName} (${v})`);
}

const ghl_crm_sync = {
  enabled: true,
  pipeline_name: pipeline.name,
  pipeline_id: pipeline.id,
  location_id: locationId,
  note_prefix: 'Alex SMS',
  dispositions: defaultDispositions,
  stage_ids,
  stages: stages.map((s) => ({ id: s.id, name: s.name })),
  configured_at: new Date().toISOString(),
};

const cs = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-1-us-west-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(
  `update public.bot_client_config cfg
   set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('ghl_crm_sync', $1::jsonb),
       updated_at = now()
   from public.bot_clients c
   where cfg.client_id = c.id and c.slug = 'volt-n-vent'`,
  [JSON.stringify(ghl_crm_sync)]
);

console.log('\nSaved to Supabase. CRM sync enabled for pipeline:', pipeline.name);
await client.end();
