/**
 * Add vnv-readable.css and fix light-background gold pricing across service pages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_LINK = '  <link rel="stylesheet" href="assets/vnv-readable.css" />\n';

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const file of htmlFiles) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!html.includes('vnv-readable.css')) {
    html = html.replace(
      /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n/,
      `<script src="https://cdn.tailwindcss.com"></script>\n${CSS_LINK}`
    );
  }

  // Package card headers: gradient tan → navy head
  html = html.replace(
    /<div class="bg-gradient-to-br from-navy-deep\/10 to-paper p-6 border-b border-navy\/10">/g,
    '<div class="vnv-package-head">'
  );

  // Mini split starting price tile
  html = html.replace(
    /<div class="rounded-2xl border-4 border-gold bg-paper-lift\/80 p-6 text-center shadow-lg"><p class="text-xs font-bold uppercase text-navy\/60">Starting Price<\/p><p class="font-display text-3xl font-bold text-gold mt-1">\$2,495\+<\/p><\/div>/,
    '<div class="vnv-stat-card rounded-2xl p-6 text-center shadow-lg"><p class="vnv-stat-label">Starting Price</p><p class="vnv-stat-price">$2,495+</p></div>'
  );

  // Side stat tiles — navy text
  html = html.replace(
    /<div class="rounded-2xl border-2 border-navy\/12 bg-paper-lift\/60 p-6 text-center">/g,
    '<div class="vnv-tan-stat rounded-2xl p-6 text-center">'
  );

  // AC replacement hero sidebar — better contrast on dark panel
  html = html.replace(
    /<div class="flex justify-between items-center border-2 border-gold rounded-xl p-3 bg-gold\/10"><span class="font-bold text-gold">Better ★ Popular<\/span><span class="font-display text-2xl font-bold text-gold">\$15,000\+<\/span><\/div>/,
    '<div class="flex justify-between items-center border-2 border-gold rounded-xl p-3 bg-white/10"><span class="font-bold text-paper">Better ★ Popular</span><span class="font-display text-2xl font-bold text-gold">$15,000+</span></div>'
  );

  // Ductwork featured IAQ card
  html = html.replace(
    /<article class="rounded-3xl border-4 border-gold bg-paper-lift\/50 p-8 text-center shadow-lg">\s*<h3 class="font-display text-2xl font-bold text-navy mb-2">Indoor Air Quality Package<\/h3>\s*<p class="font-display text-5xl font-bold text-gold my-4">\$1,500\+<\/p>/,
    `<article class="vnv-stat-card rounded-3xl p-8 text-center shadow-lg">
            <h3 class="font-display text-2xl font-bold mb-2">Indoor Air Quality Package</h3>
            <p class="font-display text-5xl font-bold vnv-stat-price my-4">$1,500+</p>`
  );

  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('patched', file);
}

console.log('Done.');
