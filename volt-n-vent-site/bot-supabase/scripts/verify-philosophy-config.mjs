import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(botRoot, '.env.jnb-voltnvent.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const ref = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
const cs = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-us-west-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();
const r = await client.query(`
  select
    conversation_playbook->'philosophy_of_advocacy'->>'summary' as summary,
    position('Philosophy of Advocacy' in system_prompt) > 0 as has_prompt
  from bot_client_config cfg
  join bot_clients c on c.id = cfg.client_id
  where c.slug = 'volt-n-vent'
`);
console.log(r.rows[0]);
await client.end();
