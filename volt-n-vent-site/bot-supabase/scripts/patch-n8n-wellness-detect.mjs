import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const wfPath = path.join(root, 'n8n', 'volt-n-vent-alex-sms-ghl.json');
const codePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-openai-request.js');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const node = wf.nodes.find((n) => n.name === 'Build OpenAI Request');
if (!node) throw new Error('Build OpenAI Request node not found');
node.parameters.jsCode = fs.readFileSync(codePath, 'utf8');
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2) + '\n');
console.log('Patched Build OpenAI Request in', wfPath);
