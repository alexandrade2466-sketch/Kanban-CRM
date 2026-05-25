/**
 * Injects NSCB license / Licensed-Bonded-Insured blocks across all HTML pages.
 * Run: node scripts/sync-credentials.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FOOTER_CREDENTIALS = `
      <div class="vnv-credentials max-w-3xl mx-auto mb-8 pb-8 border-b border-gold/25" aria-label="Nevada contractor licensing and insurance">
        <p class="font-display font-bold text-gold text-base sm:text-lg">Licensed · Bonded · Insured</p>
        <div class="flex flex-wrap justify-center gap-2 mt-3 text-xs sm:text-sm font-bold">
          <span class="rounded-lg border border-gold/50 bg-gold/10 text-paper px-3 py-1.5">Licensed</span>
          <span class="rounded-lg border border-gold/50 bg-gold/10 text-paper px-3 py-1.5">Bonded</span>
          <span class="rounded-lg border border-gold/50 bg-gold/10 text-paper px-3 py-1.5">Insured</span>
        </div>
        <ul class="mt-5 space-y-2 text-sm text-paper/90 text-center">
          <li><span class="text-paper/65">NSCB License Number –</span> <strong class="text-gold font-mono tracking-wide">C21-0095188</strong> <span class="text-paper/55 text-xs block sm:inline sm:ml-1">(C-21 Refrigeration &amp; A/C)</span></li>
          <li><span class="text-paper/65">NSCB License Number –</span> <strong class="text-gold font-mono tracking-wide">C2-0093769</strong> <span class="text-paper/55 text-xs block sm:inline sm:ml-1">(C-2 Electrical)</span></li>
        </ul>
        <p class="mt-4 text-sm font-semibold text-paper">Monetary Bid Limit: <span class="text-gold">$475,000</span></p>
      </div>
`;

const HERO_CREDENTIALS = `        <p class="vnv-hero-credentials mt-4 text-sm sm:text-base font-semibold text-gold tracking-wide">Licensed · Bonded · Insured · NSCB C21-0095188 · C2-0093769 · Bid limit $475,000</p>
`;

const FOOTER_DIV_PATTERNS = [
  '<div class="py-10 px-4 text-center">',
  '<div class="py-8 px-4 text-center text-sm">',
];

const LEGAL_FOOTER_MARKER =
  '<footer class="bg-navy border-t-4 border-gold text-paper py-8 px-4 text-center text-sm">';
const LEGAL_FOOTER_CREDENTIALS = `
    <div class="vnv-credentials max-w-3xl mx-auto mb-6 pb-6 border-b border-gold/25" aria-label="Nevada contractor licensing and insurance">
      <p class="font-display font-bold text-gold">Licensed · Bonded · Insured</p>
      <p class="mt-3 text-paper/85">NSCB License Number – <strong class="text-gold font-mono">C21-0095188</strong> · NSCB License Number – <strong class="text-gold font-mono">C2-0093769</strong></p>
      <p class="mt-2 text-paper/90">Monetary Bid Limit: <span class="text-gold font-semibold">$475,000</span></p>
    </div>
`;

const HERO_INSERT_BEFORE = '<div class="flex flex-wrap gap-4 mt-8">';

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!html.includes('vnv-credentials') && html.includes(LEGAL_FOOTER_MARKER)) {
    html = html.replace(
      LEGAL_FOOTER_MARKER,
      LEGAL_FOOTER_MARKER + LEGAL_FOOTER_CREDENTIALS
    );
    changed = true;
  }

  if (!html.includes('vnv-credentials')) {
    for (const div of FOOTER_DIV_PATTERNS) {
      const idx = html.indexOf(div);
      if (idx !== -1 && html.indexOf('vnv-credentials') === -1) {
        const footerStart = html.lastIndexOf('<footer', idx);
        if (footerStart !== -1 && footerStart < idx) {
          html = html.slice(0, idx + div.length) + FOOTER_CREDENTIALS + html.slice(idx + div.length);
          changed = true;
          break;
        }
      }
    }
  }

  if (!html.includes('vnv-hero-credentials') && html.includes(HERO_INSERT_BEFORE)) {
    html = html.replace(HERO_INSERT_BEFORE, HERO_CREDENTIALS + HERO_INSERT_BEFORE);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    return true;
  }
  return false;
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let count = 0;
for (const f of files) {
  if (patchFile(path.join(ROOT, f))) {
    console.log('Updated:', f);
    count++;
  }
}
console.log(`Done. ${count} file(s) patched.`);
