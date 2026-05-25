import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botRoot = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(botRoot, '.env.jnb-voltnvent.local');
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();
const ref = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!ref || !password) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD in .env.jnb-voltnvent.local');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-us-west-1.pooler.supabase.com:5432/postgres`;

const files = [
  path.join(botRoot, 'migrations', '001_sms_bot_schema.sql'),
  path.join(botRoot, 'migrations', '002_seed_volt_n_vent.sql'),
];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const file of files) {
  console.log('Running', path.basename(file), '...');
  const sql = fs.readFileSync(file, 'utf8');
  await client.query(sql);
  console.log('  OK');
}

const verify = await client.query(
  `select persona_name, slug, wellness_offer->>'price_display' as wellness_price
   from bot_client_full where slug = 'volt-n-vent'`
);
console.log('Verify:', verify.rows[0]);
await client.end();
