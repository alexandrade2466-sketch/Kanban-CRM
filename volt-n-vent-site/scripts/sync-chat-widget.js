const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPLACEMENT = '  <script src="assets/chat-widget.js" defer></script>\n';

const patterns = [
  /<script\s+src="https:\/\/widgets\.leadconnectorhq\.com\/loader\.js"[\s\S]*?<\/script>\s*/gi,
  /<script\s*\n\s*src="https:\/\/widgets\.leadconnectorhq\.com\/loader\.js"[\s\S]*?<\/script>\s*/gi,
];

const callOld = 'class="fixed bottom-5 right-5 z-50';
const callNew =
  'class="vnv-mobile-call fixed bottom-5 left-4 z-40 md:hidden';

let updated = 0;
for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith('.html')) continue;
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;
  for (const re of patterns) {
    if (re.test(html)) {
      html = html.replace(re, REPLACEMENT);
      changed = true;
    }
  }
  if (html.includes(callOld)) {
    html = html.split(callOld).join(callNew);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(fp, html);
    console.log('Updated', file);
    updated++;
  }
}

console.log('Done.', updated, 'files');
