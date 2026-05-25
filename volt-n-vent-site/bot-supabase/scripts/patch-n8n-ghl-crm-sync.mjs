import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const wfPath = path.join(root, 'n8n', 'volt-n-vent-alex-sms-ghl.json');
const codePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ghl-crm-sync.js');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const node = {
  parameters: { jsCode: fs.readFileSync(codePath, 'utf8') },
  id: 'a1000001-0001-4000-8000-0000000020',
  name: 'GHL CRM Sync',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1760, 300],
  credentials: {
    httpHeaderAuth: {
      id: 'REPLACE_GHL_CREDENTIAL_ID',
      name: 'VNV GoHighLevel',
    },
  },
  continueOnFail: true,
};

const existing = wf.nodes.findIndex((n) => n.name === 'GHL CRM Sync');
if (existing >= 0) wf.nodes[existing] = node;
else wf.nodes.push(node);

// Send SMS -> GHL CRM Sync -> Complete Session
wf.connections['Send SMS via GHL'] = {
  main: [[{ node: 'GHL CRM Sync', type: 'main', index: 0 }]],
};
wf.connections['GHL CRM Sync'] = {
  main: [[{ node: 'Complete Session', type: 'main', index: 0 }]],
};

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2) + '\n');
console.log('Patched GHL CRM Sync node into workflow');
