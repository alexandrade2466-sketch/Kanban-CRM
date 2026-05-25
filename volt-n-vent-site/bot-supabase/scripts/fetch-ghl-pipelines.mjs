import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const botRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(botRoot, '.env.jnb-voltnvent.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID || '81uoqXcdjO6CKRFIIuw6';
const headers = {
  Authorization: `Bearer ${token}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

const pipelinesRes = await fetch(
  `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`,
  { headers }
);
console.log('pipelines status', pipelinesRes.status);
const pipelines = await pipelinesRes.json();
console.log(JSON.stringify(pipelines, null, 2));
