const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const electricalGrid = `      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="electrician-las-vegas.html" class="block rounded-3xl border-2 border-navy/15 bg-navy-deep text-paper p-8 shadow-lg hover:border-gold/50 transition-colors group">
          <h3 class="font-display text-2xl font-bold text-gold mb-3 group-hover:text-paper-lift transition-colors">Electrician Las Vegas</h3>
          <p class="text-paper/90 leading-relaxed">Licensed electrical contractor for panels, EV, spas, outlets, and HVAC electrical.</p>
          <p class="mt-4 font-display font-bold text-gold text-sm">View electrical services →</p>
        </a>
        <a href="electrical-panel-upgrade-las-vegas.html" class="block rounded-3xl border-2 border-navy/15 bg-navy text-paper p-8 shadow-lg hover:border-gold/50 transition-colors group">
          <h3 class="font-display text-2xl font-bold text-gold mb-3 group-hover:text-paper-lift transition-colors">Panel Upgrades</h3>
          <p class="text-paper/90 leading-relaxed">Main panel replacements, subpanels, breakers, and service upgrades.</p>
          <p class="mt-4 font-display font-bold text-gold text-sm">Panel upgrade info →</p>
        </a>
        <a href="hot-tub-wiring-las-vegas.html" class="block rounded-3xl border-2 border-navy/15 bg-navy text-paper p-8 shadow-lg hover:border-gold/50 transition-colors group">
          <h3 class="font-display text-2xl font-bold text-gold mb-3 group-hover:text-paper-lift transition-colors">Hot Tub Wiring</h3>
          <p class="text-paper/90 leading-relaxed">Dedicated spa circuits, GFCI, disconnects, and trenching.</p>
          <p class="mt-4 font-display font-bold text-gold text-sm">Hot tub wiring →</p>
        </a>
        <a href="ev-charger-installation-las-vegas.html" class="block rounded-3xl border-2 border-navy/15 bg-navy-deep text-paper p-8 shadow-lg hover:border-gold/50 transition-colors group">
          <h3 class="font-display text-2xl font-bold text-gold mb-3 group-hover:text-paper-lift transition-colors">EV Chargers</h3>
          <p class="text-paper/90 leading-relaxed">Level 2 installs for Tesla, Rivian, Ford, Chevy, and more.</p>
          <p class="mt-4 font-display font-bold text-gold text-sm">EV charger installation →</p>
        </a>
      </motion>`;

const electricalGridFixed = electricalGrid.replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<div>'));

let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const start = index.indexOf('<div class="grid md:grid-cols-3 gap-6">');
const end = index.indexOf('</section>', start);
if (start === -1) throw new Error('electrical grid not found');
const sectionEnd = index.indexOf('</div>\r\n    </div>\r\n  </section>', start);
const closeTag = sectionEnd !== -1 ? sectionEnd + '</div>\r\n    </div>\r\n  </section>'.length : end;
// find closing of grid: after EV chargers card
const marker = 'Level 2 EV charger installation for Tesla';
const m = index.indexOf(marker, start);
const gridClose = index.indexOf('      </div>', m);
const replaceEnd = index.indexOf('\r\n    </div>', gridClose) + '\r\n    </motion>'.length;
const actualEnd = index.indexOf('\n    </div>', gridClose);
const useEnd = index.includes('\r\n') ? index.indexOf('\r\n    </div>', gridClose) : actualEnd;
const sliceEnd = useEnd + (index.includes('\r\n') ? '\r\n    </div>'.length : '\n    </div>'.length);

index = index.slice(0, start) + electricalGridFixed + index.slice(sliceEnd);
fs.writeFileSync(path.join(ROOT, 'index.html'), index);

// Update footers on legacy pages
const footerOld = `      <nav class="mt-6 text-sm flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-3xl mx-auto leading-relaxed" aria-label="Site navigation">
        <a href="index.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Home</a>
        <span class="text-paper/50">·</span>
        <a href="ac-repair-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Repair</a>
        <span class="text-paper/50">·</span>
        <a href="ac-replacement-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Replacement</a>
        <span class="text-paper/50">·</span>
        <a href="mini-split-install-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Mini Split</a>
        <span class="text-paper/50">·</span>
        <a href="meet-the-team.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Meet the Team</a>
      </nav>`;

const footerNew = `      <nav class="mt-6 text-sm flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-4xl mx-auto leading-relaxed" aria-label="HVAC services">
        <a href="index.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Home</a>
        <span class="text-paper/50">·</span>
        <a href="ac-repair-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Repair</a>
        <span class="text-paper/50">·</span>
        <a href="ac-replacement-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Replacement</a>
        <span class="text-paper/50">·</span>
        <a href="mini-split-install-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Mini Split</a>
        <span class="text-paper/50">·</span>
        <a href="meet-the-team.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Meet the Team</a>
        <span class="text-paper/50">·</span>
        <a href="service-areas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Service Areas</a>
      </nav>
      <nav class="mt-4 text-sm flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-4xl mx-auto leading-relaxed" aria-label="Electrical services">
        <a href="electrician-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Electrician</a>
        <span class="text-paper/50">·</span>
        <a href="electrical-panel-upgrade-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Panel Upgrade</a>
        <span class="text-paper/50">·</span>
        <a href="ev-charger-installation-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">EV Charger</a>
        <span class="text-paper/50">·</span>
        <a href="hot-tub-wiring-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Hot Tub Wiring</a>
      </nav>`;

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const f of htmlFiles) {
  const fp = path.join(ROOT, f);
  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes(footerOld)) {
    c = c.replace(footerOld, footerNew);
    fs.writeFileSync(fp, c);
    console.log('footer:', f);
  }
}

// sitemap
const newUrls = [
  'electrician-las-vegas.html',
  'electrical-panel-upgrade-las-vegas.html',
  'ev-charger-installation-las-vegas.html',
  'hot-tub-wiring-las-vegas.html',
  'hvac-electrician-henderson-nv.html',
  'hvac-electrician-summerlin-nv.html',
  'hvac-electrician-north-las-vegas-nv.html',
  'service-areas.html',
];
let sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const u of newUrls) {
  if (!sm.includes(u)) {
    sm = sm.replace('</urlset>', `  <url>\n    <loc>https://voltnvent.com/${u}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>\n</urlset>`);
  }
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

console.log('index electrical grid patched');
