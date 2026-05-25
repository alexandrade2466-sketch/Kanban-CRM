import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(botRoot, '.env.jnb-voltnvent.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const cs = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-1-us-west-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('Running 015_alex_ghl_pipeline_sync.sql');
await client.query(fs.readFileSync(path.join(botRoot, 'migrations', '015_alex_ghl_pipeline_sync.sql'), 'utf8'));
console.log('OK');
await client.end();
