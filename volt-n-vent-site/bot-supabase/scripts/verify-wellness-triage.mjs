import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(botRoot, '.env.jnb-voltnvent.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}
const cs = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-1-us-west-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();
const r = await client.query(`
  select
    wellness_offer->'knowledge_usage'->'topics'->'what_is_wellness_check'->'fragments'->0 as first_fragment,
    conversation_playbook->'conversation_triage'->>'do_not_default_to_wellness' as triage,
    conversation_playbook ? 'internal_business_goals' as has_internal_goals,
    position('Not every conversation is wellness' in system_prompt) > 0 as has_triage_prompt
  from bot_client_config cfg join bot_clients c on c.id = cfg.client_id where c.slug = 'volt-n-vent'
`);
console.log(r.rows[0]);
await client.end();
