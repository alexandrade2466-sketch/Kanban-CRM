const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://voltnvent.com';

const SHARED_STYLES = `
    :root { --logo-parchment: #edbe87; }
    body { font-family: Outfit, system-ui, sans-serif; background-color: var(--logo-parchment);
      background-image: radial-gradient(ellipse 100% 70% at 50% -10%, rgba(247,198,0,.06), transparent 42%),
        linear-gradient(180deg, #eec48f 0%, var(--logo-parchment) 22%, #e7b67c 100%); }
    .font-display { font-family: Fredoka, system-ui, sans-serif; }
    .logo-figure { display:block; max-width:100%; height:auto; object-fit:contain; transform:scale(1.024); }
    .logo-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; border-radius:1.25rem; line-height:0; background:var(--logo-parchment); isolation:isolate; }
    .logo-wrap::after { content:''; position:absolute; inset:0; z-index:1; border-radius:inherit; pointer-events:none; box-shadow: inset 0 0 16px 12px var(--logo-parchment), inset 0 0 4px 2px rgba(237,190,135,.85); }
    .page-hero { background: radial-gradient(ellipse 80% 50% at 20% 0%, rgba(232,137,44,.15), transparent 50%), linear-gradient(160deg, #0f2844 0%, #153a5c 55%, #0f2844 100%); }
    .checklist li::before { content: '✓'; color: #16a34a; font-weight: 900; margin-right: .5rem; }
    details.faq-item { background: rgba(255,255,255,.5); border: 2px solid rgba(21,58,92,.12); border-radius: 1rem; padding: 1rem 1.25rem; margin-bottom: .75rem; }
    details.faq-item summary { font-weight: 700; cursor: pointer; color: #153a5c; }
    details.faq-item[open] summary { margin-bottom: .5rem; }
`;

const FOOTER = `  <footer class="bg-navy border-t-4 border-gold text-paper">
    <motion class="py-10 px-4 bg-paper flex justify-center"><motion class="logo-wrap"><img src="assets/volt-n-vent-logo.png" alt="Volt N' Vent" class="logo-figure h-24 w-auto" loading="lazy" /></motion></motion>
    <motion class="py-10 px-4 text-center">
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
      <p class="font-display font-bold text-gold">JNB Services LLC · DBA Volt N' Vent</p>
      <p class="mt-4">702-808-8861 | 702-902-3434 | VoltNVent@gmail.com</p>
      <nav class="mt-6 text-sm flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-4xl mx-auto leading-relaxed" aria-label="HVAC services">
        <a href="index.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Home</a><span class="text-paper/50">·</span>
        <a href="ac-repair-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Repair</a><span class="text-paper/50">·</span>
        <a href="ac-replacement-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">AC Replacement</a><span class="text-paper/50">·</span>
        <a href="mini-split-install-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Mini Split</a><span class="text-paper/50">·</span>
        <a href="meet-the-team.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Meet the Team</a><span class="text-paper/50">·</span>
        <a href="service-areas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Service Areas</a>
      </nav>
      <nav class="mt-4 text-sm flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-4xl mx-auto leading-relaxed" aria-label="Electrical services">
        <a href="electrician-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Electrician</a><span class="text-paper/50">·</span>
        <a href="electrical-panel-upgrade-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Panel Upgrade</a><span class="text-paper/50">·</span>
        <a href="ev-charger-installation-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">EV Charger</a><span class="text-paper/50">·</span>
        <a href="hot-tub-wiring-las-vegas.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Hot Tub Wiring</a>
      </nav>
      <p class="mt-6 text-sm">
        <a href="privacy-policy.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Privacy Policy</a><span class="text-paper/50 mx-1">·</span>
        <a href="terms-of-use.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Terms of Use</a><span class="text-paper/50 mx-1">·</span>
        <a href="sms-policy.html" class="text-gold hover:text-gold-hover underline underline-offset-4">SMS Policy</a>
      </p>
    </motion>
  </footer>
  <script src="assets/chat-widget.js" defer></script>`;

function footer() {
  return FOOTER.replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<div>'));
}

function buildPage(p) {
  const url = `${SITE}/${p.file}`;
  const faqSchema = p.faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
  const businessType = p.businessType || 'Electrician';
  const schemaGraph = [
    {
      '@type': businessType,
      '@id': `${SITE}/#business`,
      name: "Volt N' Vent by JNB Services LLC",
      url: `${SITE}/`,
      telephone: '+1-702-808-8861',
      email: 'VoltNVent@gmail.com',
      areaServed: p.areaServed || ['Las Vegas NV', 'Henderson NV', 'Summerlin NV', 'North Las Vegas NV'],
    },
    {
      '@type': 'Service',
      serviceType: p.serviceType,
      provider: { '@id': `${SITE}/#business` },
    },
    { '@type': 'FAQPage', mainEntity: faqSchema },
  ];

  const navLinks = p.navLinks || [
    ['index.html', 'Home', ''],
    ['electrician-las-vegas.html', 'Electrician', 'electrician'],
    ['electrical-panel-upgrade-las-vegas.html', 'Panel', 'panel'],
    ['ev-charger-installation-las-vegas.html', 'EV', 'ev'],
    ['hot-tub-wiring-las-vegas.html', 'Hot Tub', 'hottub'],
    ['#services', 'Services', 'services'],
    ['#faq', 'FAQ', 'faq'],
    ['index.html#contact', 'Contact', 'contact'],
  ];

  const navHtml = navLinks
    .map(([href, label, key]) => {
      const cls = key === p.navActive ? 'text-rust font-bold' : 'hover:text-rust';
      return `<a href="${href}" class="${cls}">${label}</a>`;
    })
    .join('\n        ');

  const faqHtml = p.faqs
    .map((f) => `<details class="faq-item"><summary>${f.q}</summary><p class="text-navy/85 mt-2">${f.a}</p></details>`)
    .join('\n        ');

  const servicesHtml = p.services
    .map(
      (s) =>
        `<article class="rounded-2xl border-2 border-navy/10 bg-paper-lift/35 p-6"><h3 class="font-display font-bold text-navy mb-2">${s.title}</h3><p class="text-sm text-navy/75 leading-relaxed">${s.body}</p></article>`
    )
    .join('\n          ');

  const checklistHtml = p.checklist.map((item) => `<li>${item}</li>`).join('');
  const badgesHtml = (p.badges || ['Las Vegas Local', 'Family Owned', 'HVAC + Electrical', 'Free Estimates'])
    .map((b) => `<span class="text-center text-sm font-bold bg-white/10 border border-white/15 rounded-xl py-3 px-2">${b}</span>`)
    .join('\n          ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${p.title}</title>
  <meta name="description" content="${p.description}" />
  <meta name="keywords" content="${p.keywords}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${p.ogTitle}" />
  <meta property="og:description" content="${p.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/volt-n-vent-logo.png" />
  <meta property="og:site_name" content="Volt N' Vent" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${p.ogTitle}" />
  <meta name="twitter:description" content="${p.description}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://widgets.leadconnectorhq.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { paper: '#EDBE87', 'paper-soft': '#e8b878', 'paper-lift': '#f2d4aa', navy: '#153a5c', 'navy-deep': '#0f2844', gold: '#f7c600', 'gold-hover': '#e6b400', rust: '#e8892c', skybrand: '#7eb8d6' }, fontFamily: { display: ['Fredoka', 'system-ui', 'sans-serif'], body: ['Outfit', 'system-ui', 'sans-serif'] } } } }
  </script>
  <style>${SHARED_STYLES}</style>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: p.breadcrumb, item: url }] })}</script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': schemaGraph })}</script>
</head>
<body class="text-navy-deep antialiased">
  <div class="bg-navy-deep text-paper text-center text-sm py-2 px-4">${p.banner}</motion>
  <a href="tel:7028088861" class="vnv-mobile-call fixed bottom-5 left-4 z-40 md:hidden bg-gold text-navy-deep font-display font-bold text-lg px-6 py-4 rounded-2xl shadow-lg md:hidden hover:bg-gold-hover">Call Now</a>
  <nav class="sticky top-0 z-40 border-b-4 border-navy-deep bg-paper shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
      <a href="index.html" class="flex items-center gap-3 min-w-0 shrink-0">
        <div class="logo-wrap shrink-0"><img src="assets/volt-n-vent-logo.png" alt="Volt N' Vent" class="logo-figure h-16 sm:h-20 w-auto" /></div>
        <div class="min-w-0"><p class="font-display text-xl font-bold text-navy-deep truncate">VOLT N' VENT</p><p class="text-navy text-xs font-semibold">By JNB Services LLC</p></div>
      </a>
      <motion class="hidden lg:flex gap-4 font-semibold text-navy text-sm flex-wrap justify-end">${navHtml}</motion>
      <a href="tel:7028088861" class="hidden md:inline-flex bg-navy-deep text-gold px-5 py-2.5 rounded-xl font-display font-bold hover:bg-navy shrink-0">702-808-8861</a>
    </div>
  </nav>
  <header class="page-hero text-paper px-4 sm:px-6 py-14 sm:py-20">
    <motion class="max-w-7xl mx-auto">
      <p class="text-sm text-paper/70 mb-4"><a href="index.html" class="underline hover:text-gold">Home</a> / ${p.breadcrumb}</p>
      <span class="inline-block text-xs font-bold uppercase tracking-wide text-gold border border-gold/40 bg-white/10 px-3 py-1 rounded-full mb-4">${p.badge}</span>
      <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gold leading-tight mb-5 max-w-4xl">${p.h1}</h1>
      <p class="text-lg text-paper/90 leading-relaxed max-w-3xl">${p.heroLead}</p>
      ${p.heroSub ? `<p class="text-paper/80 mt-4 max-w-3xl">${p.heroSub}</p>` : ''}
      <p class="vnv-hero-credentials mt-4 text-sm sm:text-base font-semibold text-gold tracking-wide">Licensed · Bonded · Insured · NSCB C21-0095188 · C2-0093769 · Bid limit $475,000</p>
      <motion class="flex flex-wrap gap-3 mt-8">
        <a href="tel:7028088861" class="bg-gold text-navy-deep font-display font-bold px-8 py-4 rounded-2xl hover:bg-gold-hover">${p.ctaPrimary}</a>
        <a href="#services" class="border-2 border-paper/40 font-display font-bold px-8 py-4 rounded-2xl hover:bg-white/10">${p.ctaSecondary || 'View Services'}</a>
      </motion>
      <motion class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-3xl">${badgesHtml}</motion>
    </motion>
  </header>
  <main>
    <section id="services" class="py-16 px-4 sm:px-6">
      <motion class="max-w-7xl mx-auto">
        <h2 class="font-display text-3xl font-bold text-navy text-center mb-3">${p.servicesTitle}</h2>
        <p class="text-center text-navy/80 max-w-2xl mx-auto mb-10">${p.servicesIntro}</p>
        <motion class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${servicesHtml}</motion>
      </motion>
    </section>
    <section class="py-16 px-4 sm:px-6 bg-paper-soft/50 border-y border-navy/10">
      <motion class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
        <motion>
          <h2 class="font-display text-3xl font-bold text-navy mb-4">${p.whyTitle}</h2>
          <p class="text-navy/85 leading-relaxed mb-4">${p.whyP1}</p>
          <p class="text-navy/85 leading-relaxed">${p.whyP2}</p>
        </motion>
        <motion class="rounded-3xl border-2 border-navy/12 bg-paper-lift/40 p-8">
          <h3 class="font-display text-xl font-bold text-navy mb-4">${p.checklistTitle}</h3>
          <ul class="checklist space-y-2 text-navy/80 list-none pl-0">${checklistHtml}</ul>
        </motion>
      </motion>
    </section>
    ${p.extraSection || ''}
    <section class="py-16 px-4 sm:px-6 bg-navy-deep text-paper border-y-4 border-gold">
      <motion class="max-w-5xl mx-auto text-center">
        <h2 class="font-display text-3xl font-bold text-gold mb-4">${p.ctaTitle}</h2>
        <p class="text-paper/90 mb-8">${p.ctaBody}</p>
        <a href="tel:7028088861" class="inline-flex bg-gold text-navy-deep font-display font-bold text-lg px-10 py-4 rounded-2xl hover:bg-gold-hover">Call 702-808-8861</a>
        <p class="text-sm text-paper/70 mt-4">Also: <a href="tel:7029023434" class="text-gold underline">702-902-3434</a> · <a href="mailto:VoltNVent@gmail.com" class="text-skybrand underline">VoltNVent@gmail.com</a></p>
      </motion>
    </section>
    <section id="faq" class="py-16 px-4 sm:px-6 bg-paper-soft/30">
      <motion class="max-w-3xl mx-auto">
        <h2 class="font-display text-3xl font-bold text-navy text-center mb-10">Frequently Asked Questions</h2>
        ${faqHtml}
      </motion>
    </section>
    <section class="py-16 px-4 sm:px-6">
      <motion class="max-w-7xl mx-auto text-center">
        <h2 class="font-display text-2xl font-bold text-navy mb-4">Related Services</h2>
        <p class="text-navy/80 mb-6">Explore more HVAC and electrical services from Volt N' Vent.</p>
        <motion class="flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <a href="ac-repair-las-vegas.html" class="bg-paper-lift/60 border-2 border-navy/12 text-navy px-4 py-2 rounded-full hover:border-rust">AC Repair</a>
          <a href="ac-replacement-las-vegas.html" class="bg-paper-lift/60 border-2 border-navy/12 text-navy px-4 py-2 rounded-full hover:border-rust">AC Replacement</a>
          <a href="mini-split-install-las-vegas.html" class="bg-paper-lift/60 border-2 border-navy/12 text-navy px-4 py-2 rounded-full hover:border-rust">Mini Split</a>
          <a href="electrician-las-vegas.html" class="bg-paper-lift/60 border-2 border-navy/12 text-navy px-4 py-2 rounded-full hover:border-rust">Electrician</a>
          <a href="service-areas.html" class="bg-paper-lift/60 border-2 border-navy/12 text-navy px-4 py-2 rounded-full hover:border-rust">Service Areas</a>
        </motion>
      </motion>
    </section>
  </main>
  <section class="py-10 px-4 sm:px-6 border-t border-navy/10 bg-paper-soft/30">
    <motion class="max-w-3xl mx-auto text-center text-sm text-navy/90">
      <p class="font-display font-bold text-navy-deep mb-2">SMS disclosure</p>
      <p><strong>JNB Services LLC</strong>, DBA <strong>Volt N' Vent</strong>. Reply <strong>STOP</strong> to opt out. <a href="sms-policy.html" class="underline font-semibold hover:text-rust">SMS Policy</a> · <a href="privacy-policy.html" class="underline font-semibold hover:text-rust">Privacy</a> · <a href="terms-of-use.html" class="underline font-semibold hover:text-rust">Terms</a></p>
    </motion>
  </section>
${footer()}
</body>
</html>`.replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</motion>' : '<motion>')).replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<div>'));
}

const electricalPages = [
  {
    file: 'electrician-las-vegas.html',
    navActive: 'electrician',
    breadcrumb: 'Electrician Las Vegas',
    badge: 'Las Vegas Electrician',
    title: "Electrician Las Vegas | Licensed Electrical Contractor | Volt N' Vent",
    ogTitle: "Electrician Las Vegas | Volt N' Vent",
    description: "Licensed electrician in Las Vegas for panel upgrades, EV chargers, hot tub wiring, outlets, lighting, and HVAC electrical. Volt N' Vent — 702-808-8861.",
    keywords: 'electrician Las Vegas, electrical contractor Las Vegas, licensed electrician Henderson, Summerlin electrician',
    serviceType: 'Electrician Las Vegas',
    banner: 'Las Vegas electrician — panel upgrades, EV chargers, hot tubs &amp; more. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'Licensed Electrician in Las Vegas for Homes &amp; Light Commercial',
    heroLead: "Volt N' Vent by JNB Services LLC provides professional electrical services throughout the Las Vegas Valley — panel upgrades, EV chargers, hot tub circuits, and HVAC-related electrical work.",
    heroSub: 'One team for both HVAC and electrical means fewer delays and clearer communication on combined projects.',
    ctaPrimary: 'Call for Electrical Service',
    servicesTitle: 'Electrical Services We Provide',
    servicesIntro: 'Safe, code-conscious electrical work for Las Vegas homeowners and property managers.',
    services: [
      { title: 'Electrical Panel Upgrades', body: 'Main panel replacements, subpanels, breaker upgrades, and service capacity improvements.' },
      { title: 'EV Charger Installation', body: 'Level 2 home charging for Tesla, Rivian, Ford, Chevy, and other EVs.' },
      { title: 'Hot Tub & Spa Wiring', body: 'Dedicated circuits, GFCI protection, disconnects, and trenching.' },
      { title: 'Outlets & Lighting', body: 'New circuits, GFCI outlets, outdoor lighting, ceiling fans, and troubleshooting.' },
      { title: 'HVAC Electrical', body: 'Disconnects, whips, and breakers for AC replacement and mini split installs.' },
      { title: 'Safety Reviews', body: 'Visual panel, grounding, and bonding reviews before major upgrades.' },
    ],
    whyTitle: "Why choose Volt N' Vent for electrical work?",
    whyP1: 'Las Vegas homes often need electrical upgrades when adding AC, EV chargers, pools, or spas. We explain options in plain language.',
    whyP2: 'Family-owned JNB Services LLC focuses on clean workmanship and respectful service.',
    checklistTitle: 'Common electrical projects',
    checklist: ['Outdated panel brands', 'Garage and ADU circuits', 'Tripping breakers', 'EV and spa loads', 'Kitchen and bath GFCI', 'HVAC disconnect issues'],
    ctaTitle: 'Need a Las Vegas electrician?',
    ctaBody: 'Call for a free estimate on panel work, EV charging, hot tub wiring, or repairs.',
    faqs: [
      { q: 'Do you serve Henderson and Summerlin?', a: 'Yes — Las Vegas, Henderson, Summerlin, North Las Vegas, and surrounding areas.' },
      { q: 'Can you handle HVAC electrical too?', a: 'Yes. We install and service AC equipment and the electrical connections it requires.' },
      { q: 'How do I schedule service?', a: 'Call 702-808-8861 or email VoltNVent@gmail.com.' },
      { q: 'Do you offer free estimates?', a: 'Yes. Describe your project and we will schedule a review.' },
    ],
  },
  {
    file: 'electrical-panel-upgrade-las-vegas.html',
    navActive: 'panel',
    breadcrumb: 'Panel Upgrade Las Vegas',
    badge: 'Panel Upgrade',
    title: "Electrical Panel Upgrade Las Vegas | Main Panel Replacement | Volt N' Vent",
    ogTitle: 'Panel Upgrade Las Vegas',
    description: "Electrical panel upgrades in Las Vegas. Main panel replacement, subpanels, breakers, and service upgrades. Volt N' Vent — 702-808-8861.",
    keywords: 'electrical panel upgrade Las Vegas, main panel replacement, breaker panel upgrade Las Vegas',
    serviceType: 'Electrical Panel Upgrade Las Vegas',
    banner: 'Panel upgrades in Las Vegas. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'Electrical Panel Upgrades in Las Vegas',
    heroLead: 'Upgrade outdated or overloaded panels for safer power when adding AC, EV chargers, or spa equipment.',
    ctaPrimary: 'Call for Panel Quote',
    servicesTitle: 'Panel upgrade services',
    servicesIntro: 'Targeted breaker work to full main panel replacements.',
    services: [
      { title: 'Main Panel Replacement', body: 'Modern panels with appropriate capacity and labeling.' },
      { title: 'Subpanel Installation', body: 'Garages, ADUs, workshops, and backyard loads.' },
      { title: 'Breaker Upgrades', body: 'Right-size circuits for new equipment.' },
      { title: 'Service Coordination', body: 'Utility service size review when more amperage is needed.' },
      { title: 'Grounding & Bonding', body: 'Safety basics during panel projects.' },
      { title: 'Future Load Planning', body: 'Capacity for EV chargers and hot tubs.' },
    ],
    whyTitle: 'When should you upgrade your panel?',
    whyP1: 'Consider an upgrade if breakers trip often, you have an obsolete panel, or you are adding major loads.',
    whyP2: 'Proper upgrades reduce fire risk and support modern equipment.',
    checklistTitle: 'Signs your panel needs attention',
    checklist: ['Buzzing or burning smell', 'Flickering when AC starts', 'Adding EV or spa', 'Renovation circuits', 'Inspection flags', 'Unknown panel brand'],
    ctaTitle: 'Schedule a panel review',
    ctaBody: 'We explain upgrade options without pressure.',
    faqs: [
      { q: 'How long does a panel upgrade take?', a: 'Many projects finish in a day; permits and utility work affect timing.' },
      { q: 'Will power be off?', a: 'Yes during the changeover — we coordinate timing with you.' },
      { q: 'Do you pull permits?', a: 'We review code and permit needs for your city and scope.' },
      { q: 'Can you add an EV circuit too?', a: 'Yes — panel upgrades often include new dedicated circuits.' },
    ],
  },
  {
    file: 'ev-charger-installation-las-vegas.html',
    navActive: 'ev',
    breadcrumb: 'EV Charger Installation',
    badge: 'EV Charger Install',
    title: "EV Charger Installation Las Vegas | Level 2 Home Charging | Volt N' Vent",
    ogTitle: 'EV Charger Installation Las Vegas',
    description: "Level 2 EV charger installation in Las Vegas. Tesla, Rivian, NEMA 14-50, dedicated circuits. Volt N' Vent — 702-808-8861.",
    keywords: 'EV charger installation Las Vegas, Tesla charger install, Level 2 EV charger electrician',
    serviceType: 'EV Charger Installation Las Vegas',
    banner: 'EV charger installs in Las Vegas. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'Level 2 EV Charger Installation in Las Vegas',
    heroLead: 'Charge faster at home with a properly sized dedicated circuit and safe installation.',
    heroSub: 'Tesla, Rivian, Ford, Chevy, and universal Level 2 chargers supported.',
    ctaPrimary: 'Get EV Charger Quote',
    servicesTitle: 'EV charging options',
    servicesIntro: 'Hardwired wall connectors and NEMA 14-50 outlets.',
    services: [
      { title: 'Tesla Wall Connector', body: 'Hardwired installs with correct breaker sizing.' },
      { title: 'Universal Level 2', body: 'ChargePoint, Grizzl-E, Emporia, and similar units.' },
      { title: 'NEMA 14-50', body: 'Outlets for portable EVSE equipment.' },
      { title: 'Panel Review', body: 'Verify capacity or plan an upgrade.' },
      { title: 'Garage Routing', body: 'Clean conduit paths to the charger location.' },
      { title: 'Load Planning', body: 'Amperage settings and future second-EV needs.' },
    ],
    whyTitle: 'Professional installs matter',
    whyP1: 'Undersized wire or wrong breakers create safety risks — common in DIY installs.',
    whyP2: "Volt N' Vent sizes circuits to manufacturer specs and local code.",
    checklistTitle: 'Pre-install review',
    checklist: ['Panel age and spaces', 'Wire run distance', 'Indoor vs outdoor rating', 'Hardwire vs outlet', 'Second EV plans', 'Garage access'],
    ctaTitle: 'Ready for home EV charging?',
    ctaBody: 'Share your vehicle, charger model, and garage layout.',
    faqs: [
      { q: 'Do I need a panel upgrade?', a: 'Not always — we review load first.' },
      { q: 'NEMA vs hardwired?', a: 'Outlets suit portable EVSE; wall connectors are often hardwired.' },
      { q: 'Outdoor installs?', a: 'Yes, with weather-rated equipment.' },
      { q: 'Long wire runs?', a: 'We measure the path and size wire accordingly.' },
    ],
  },
  {
    file: 'hot-tub-wiring-las-vegas.html',
    navActive: 'hottub',
    breadcrumb: 'Hot Tub Wiring Las Vegas',
    badge: 'Hot Tub Wiring',
    title: "Hot Tub Wiring Las Vegas | Spa Electrician | Volt N' Vent",
    ogTitle: 'Hot Tub Wiring Las Vegas',
    description: "Hot tub and spa electrical wiring in Las Vegas. Dedicated circuits, GFCI, disconnects, trenching. Call 702-808-8861.",
    keywords: 'hot tub wiring Las Vegas, spa electrician Las Vegas, hot tub circuit GFCI',
    serviceType: 'Hot Tub Wiring Las Vegas',
    banner: 'Hot tub wiring in Las Vegas. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'Hot Tub &amp; Spa Electrical Wiring in Las Vegas',
    heroLead: 'Dedicated 240V circuits, GFCI protection, disconnects, and trenching installed to code.',
    ctaPrimary: 'Call for Spa Wiring',
    servicesTitle: 'Spa electrical services',
    servicesIntro: 'Power from panel to tub — ready before delivery day.',
    services: [
      { title: 'Dedicated Circuits', body: 'Sized for your spa load and breaker pairing.' },
      { title: 'GFCI Protection', body: 'Required wet-location safety devices.' },
      { title: 'Disconnects', body: 'Accessible shutoff where code requires.' },
      { title: 'Trenching', body: 'Underground routing to the pad.' },
      { title: 'Pre-Delivery Wiring', body: 'Electrical ready before the tub arrives.' },
      { title: 'Trip Troubleshooting', body: 'Fix nuisance GFCI trips and loose connections.' },
    ],
    whyTitle: 'Spa wiring requires a specialist',
    whyP1: 'High load near water demands correct wire, GFCI, and bonding.',
    whyP2: 'We follow your dealer spec sheet so fill-up day goes smoothly.',
    checklistTitle: 'Before scheduling',
    checklist: ['Spa spec label', 'Pad location', 'Trenching needed', 'Delivery date', 'Permit city', 'Distance from panel'],
    ctaTitle: 'Installing a backyard spa?',
    ctaBody: 'Send your spec label photo for a faster quote.',
    faqs: [
      { q: 'What voltage?', a: 'Most home spas use 240V — we verify amperage from the label.' },
      { q: 'GFCI required?', a: 'Yes for spa circuits in wet locations.' },
      { q: 'Wire before delivery?', a: 'Yes — recommended for a smooth install day.' },
      { q: 'Henderson & Summerlin?', a: 'Yes, throughout the valley.' },
    ],
  },
];

const cityPages = [
  {
    file: 'hvac-electrician-henderson-nv.html',
    navActive: 'city',
    navLinks: [
      ['index.html', 'Home', ''],
      ['service-areas.html', 'Areas', 'city'],
      ['ac-repair-las-vegas.html', 'AC Repair', ''],
      ['electrician-las-vegas.html', 'Electrician', ''],
      ['#services', 'Services', 'services'],
      ['index.html#contact', 'Contact', 'contact'],
    ],
    businessType: ['LocalBusiness', 'HVACBusiness', 'Electrician'],
    areaServed: ['Henderson NV', 'Green Valley NV', 'Anthem NV', 'Inspirada NV'],
    breadcrumb: 'Henderson NV',
    badge: 'Henderson HVAC & Electrical',
    title: "HVAC & Electrician Henderson NV | AC Repair & Electrical | Volt N' Vent",
    ogTitle: 'HVAC & Electrician Henderson NV',
    description: "HVAC and electrical services in Henderson, NV. AC repair, replacement, mini splits, panel upgrades, EV chargers. Volt N' Vent — 702-808-8861.",
    keywords: 'HVAC Henderson NV, AC repair Henderson, electrician Henderson NV, Green Valley HVAC',
    serviceType: 'HVAC and Electrical Services Henderson NV',
    banner: 'Henderson HVAC &amp; electrical. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'HVAC &amp; Electrical Services in Henderson, Nevada',
    heroLead: "Volt N' Vent serves Henderson homeowners in Green Valley, Anthem, Inspirada, and surrounding neighborhoods with AC repair, replacement, mini splits, and electrical work.",
    ctaPrimary: 'Call Henderson Service',
    servicesTitle: 'Services in Henderson',
    servicesIntro: 'Same trusted team as our Las Vegas headquarters — desert heat specialists.',
    services: [
      { title: 'AC Repair Henderson', body: 'Capacitors, motors, refrigerant, no-cool calls, and drain lines.' },
      { title: 'AC Replacement', body: 'Good, Better, Best packages starting at $12,000.' },
      { title: 'Mini Split Installation', body: 'Ductless comfort from $2,495 for garages and additions.' },
      { title: 'Electrician Henderson', body: 'Panels, EV chargers, hot tubs, outlets, and lighting.' },
      { title: 'Panel Upgrades', body: 'Safer power for older Henderson tract homes.' },
      { title: 'Rental & Landlord Service', body: 'Property managers welcome for HVAC and electrical.' },
    ],
    whyTitle: 'Henderson desert comfort experts',
    whyP1: 'Henderson sees the same extreme summer heat as Las Vegas — aging systems fail when you need them most.',
    whyP2: 'We offer transparent pricing and one team for HVAC plus electrical.',
    checklistTitle: 'Henderson neighborhoods we serve',
    checklist: ['Green Valley', 'Anthem', 'Inspirada', 'Seven Hills', 'MacDonald Ranch', 'Lake Las Vegas area', 'St Rose area', 'Black Mountain'],
    ctaTitle: 'Henderson homeowner?',
    ctaBody: 'Call for same-day availability when scheduling allows.',
    faqs: [
      { q: 'Do you charge extra for Henderson?', a: 'We serve Henderson regularly — ask for drive-time details when booking.' },
      { q: 'Can you replace AC in Green Valley?', a: 'Yes. AC replacement and repair throughout Henderson.' },
      { q: 'EV chargers in Henderson?', a: 'Yes — Level 2 installs with panel review.' },
      { q: 'How fast can you come out?', a: 'Availability varies by season — call early for fastest scheduling.' },
    ],
    extraSection: `<section class="py-12 px-4 sm:px-6"><div class="max-w-4xl mx-auto text-center rounded-3xl border-2 border-navy/12 bg-paper-lift/40 p-8"><p class="text-navy/80">Also serving central Las Vegas — <a href="index.html" class="text-rust font-bold underline">view all services</a> or browse <a href="service-areas.html" class="text-rust font-bold underline">service areas</a>.</p></motion></section>`.replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<motion>')).replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<div>')),
  },
  {
    file: 'hvac-electrician-summerlin-nv.html',
    navActive: 'city',
    navLinks: [
      ['index.html', 'Home', ''],
      ['service-areas.html', 'Areas', 'city'],
      ['ac-repair-las-vegas.html', 'AC Repair', ''],
      ['electrician-las-vegas.html', 'Electrician', ''],
      ['#services', 'Services', 'services'],
      ['index.html#contact', 'Contact', 'contact'],
    ],
    businessType: ['LocalBusiness', 'HVACBusiness', 'Electrician'],
    areaServed: ['Summerlin NV', 'The Lakes NV', 'Centennial Hills NV'],
    breadcrumb: 'Summerlin NV',
    badge: 'Summerlin HVAC & Electrical',
    title: "HVAC & Electrician Summerlin NV | Volt N' Vent",
    ogTitle: 'HVAC Summerlin NV',
    description: "AC repair, replacement, mini splits, and electrical services in Summerlin and west Las Vegas. Volt N' Vent — 702-808-8861.",
    keywords: 'HVAC Summerlin, AC repair Summerlin NV, electrician Summerlin, Centennial Hills HVAC',
    serviceType: 'HVAC and Electrical Summerlin NV',
    banner: 'Summerlin &amp; west valley HVAC. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'HVAC &amp; Electrical Services in Summerlin',
    heroLead: 'West Las Vegas and Summerlin homes trust Volt N\' Vent for cooling, heating, and electrical upgrades.',
    ctaPrimary: 'Call Summerlin Service',
    servicesTitle: 'Summerlin area services',
    servicesIntro: 'From The Lakes to Centennial Hills and Skye Canyon.',
    services: [
      { title: 'AC Repair', body: 'Fast diagnostics for west valley homes.' },
      { title: 'AC Replacement', body: 'High-efficiency options for large desert homes.' },
      { title: 'Mini Splits', body: 'Bonus rooms, casitas, and three-car garages.' },
      { title: 'Panel Upgrades', body: 'Support for pools, spas, and EV charging.' },
      { title: 'EV Chargers', body: 'Garage and carport Level 2 installs.' },
      { title: 'Hot Tub Wiring', body: 'Backyard spa circuits and trenching.' },
    ],
    whyTitle: 'Built for west valley homes',
    whyP1: 'Summerlin properties often have larger footprints, dual systems, and higher electrical demand.',
    whyP2: 'We size equipment and circuits for real-world desert performance.',
    checklistTitle: 'Summerlin communities',
    checklist: ['The Lakes', 'Centennial Hills', 'Skye Canyon', 'Rhodes Ranch', 'Providence', 'Sun City Summerlin', 'Red Rock area'],
    ctaTitle: 'Summerlin service call',
    ctaBody: 'Request a free estimate for HVAC or electrical work.',
    faqs: [
      { q: 'Do you serve Skye Canyon?', a: 'Yes — west Las Vegas and Summerlin areas.' },
      { q: 'Large home AC replacement?', a: 'We review sizing and offer Good, Better, Best options.' },
      { q: 'Pool and spa electrical?', a: 'Yes — hot tub and related circuits.' },
      { q: 'Same company for AC and panel?', a: 'Yes — one of our key advantages.' },
    ],
  },
  {
    file: 'hvac-electrician-north-las-vegas-nv.html',
    navActive: 'city',
    navLinks: [
      ['index.html', 'Home', ''],
      ['service-areas.html', 'Areas', 'city'],
      ['ac-repair-las-vegas.html', 'AC Repair', ''],
      ['electrician-las-vegas.html', 'Electrician', ''],
      ['#services', 'Services', 'services'],
      ['index.html#contact', 'Contact', 'contact'],
    ],
    businessType: ['LocalBusiness', 'HVACBusiness', 'Electrician'],
    areaServed: ['North Las Vegas NV', 'Aliante NV', 'Centennial Hills NV'],
    breadcrumb: 'North Las Vegas NV',
    badge: 'North Las Vegas',
    title: "HVAC & Electrician North Las Vegas NV | Volt N' Vent",
    ogTitle: 'HVAC North Las Vegas',
    description: "AC repair, HVAC replacement, and electrical service in North Las Vegas and Aliante. Volt N' Vent — 702-808-8861.",
    keywords: 'HVAC North Las Vegas, AC repair North Las Vegas, electrician Aliante, HVAC Aliante NV',
    serviceType: 'HVAC and Electrical North Las Vegas NV',
    banner: 'North Las Vegas &amp; Aliante HVAC. Call <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>.',
    h1: 'HVAC &amp; Electrical in North Las Vegas',
    heroLead: 'Aliante, Centennial area, and North Las Vegas neighborhoods — AC and electrical from one local team.',
    ctaPrimary: 'Call North LV Service',
    servicesTitle: 'North Las Vegas services',
    servicesIntro: 'Repair, replacement, and electrical for north valley homes.',
    services: [
      { title: 'AC Repair', body: 'No-cool, weak airflow, and electrical HVAC issues.' },
      { title: 'AC Replacement', body: 'Starting at $12,000 with clear Good, Better, Best tiers.' },
      { title: 'Mini Splits', body: 'Garages and additions from $2,495.' },
      { title: 'Electrician', body: 'Panels, outlets, lighting, and troubleshooting.' },
      { title: 'EV Chargers', body: 'Home Level 2 charging installs.' },
      { title: 'Rental Properties', body: 'Landlords and tenants supported.' },
    ],
    whyTitle: 'North valley coverage',
    whyP1: 'We regularly serve North Las Vegas and Aliante — not just the Strip corridor.',
    whyP2: 'Call for honest recommendations on repair vs replacement.',
    checklistTitle: 'Areas in North LV',
    checklist: ['Aliante', 'Centennial Hills', 'Tropical Parkway corridor', 'Craig Ranch', 'Eldorado area', 'North Las Vegas proper'],
    ctaTitle: 'North Las Vegas homeowner?',
    ctaBody: '702-808-8861 for HVAC and electrical scheduling.',
    faqs: [
      { q: 'Aliante AC repair?', a: 'Yes — regular service area.' },
      { q: 'Panel upgrades in North LV?', a: 'Yes — main panels and subpanels.' },
      { q: 'Mini splits for garages?', a: 'Yes — ductless from $2,495.' },
      { q: 'Weekend service?', a: 'Call for current availability.' },
    ],
  },
];

function buildServiceAreasPage() {
  const cities = [
    { name: 'Las Vegas', href: 'index.html', note: 'Primary service hub — AC, HVAC, and full electrical.' },
    { name: 'Henderson', href: 'hvac-electrician-henderson-nv.html', note: 'Green Valley, Anthem, Inspirada, and east valley.' },
    { name: 'Summerlin', href: 'hvac-electrician-summerlin-nv.html', note: 'West valley, The Lakes, Centennial Hills, Skye Canyon.' },
    { name: 'North Las Vegas', href: 'hvac-electrician-north-las-vegas-nv.html', note: 'Aliante, Craig Ranch, and north valley corridors.' },
  ];
  const neighborhoods = [
    'Spring Valley', 'Paradise', 'Enterprise', 'Green Valley', 'Silverado Ranch',
    'Mountains Edge', 'Southern Highlands', 'Whitney', 'Winchester', 'Rhodes Ranch',
  ];
  const cityCards = cities
    .map(
      (c) =>
        `<a href="${c.href}" class="block rounded-3xl border-2 border-navy/12 bg-paper-lift/40 p-8 hover:border-gold transition-colors group"><h2 class="font-display text-2xl font-bold text-navy group-hover:text-rust">${c.name}</h2><p class="text-navy/75 mt-2">${c.note}</p><p class="mt-4 font-display font-bold text-rust text-sm">View ${c.name} services →</p></a>`
    )
    .join('\n        ');
  const chips = neighborhoods
    .map((n) => `<span class="bg-paper-lift/60 border-2 border-navy/12 text-navy font-bold px-4 py-2 rounded-full text-sm">${n}</span>`)
    .join('');

  const p = {
    file: 'service-areas.html',
    navActive: 'areas',
    navLinks: [
      ['index.html', 'Home', ''],
      ['service-areas.html', 'Areas', 'areas'],
      ['ac-repair-las-vegas.html', 'AC Repair', ''],
      ['electrician-las-vegas.html', 'Electrician', ''],
      ['index.html#contact', 'Contact', 'contact'],
    ],
    businessType: 'LocalBusiness',
    breadcrumb: 'Service Areas',
    badge: 'Las Vegas Valley',
    title: "Service Areas | HVAC & Electrical | Las Vegas, Henderson, Summerlin | Volt N' Vent",
    ogTitle: "Volt N' Vent Service Areas",
    description: "Volt N' Vent serves Las Vegas, Henderson, Summerlin, North Las Vegas, and surrounding communities with HVAC and electrical services.",
    keywords: 'HVAC service area Las Vegas, electrician service area Henderson, Summerlin AC repair',
    serviceType: 'HVAC and Electrical Las Vegas Valley',
    banner: 'Serving the entire Las Vegas Valley. <a href="tel:7028088861" class="text-gold font-bold hover:underline">702-808-8861</a>',
    h1: 'HVAC &amp; Electrical Service Areas',
    heroLead: 'Volt N\' Vent by JNB Services LLC provides air conditioning, heating, and electrical services across the Las Vegas metropolitan area.',
    ctaPrimary: 'Call for Service',
    servicesTitle: 'Cities we serve',
    servicesIntro: 'Click your city for localized HVAC and electrical information.',
    services: cities.map((c) => ({ title: c.name, body: c.note })),
    whyTitle: 'One team for the whole valley',
    whyP1: 'Whether you are in Henderson, Summerlin, or North Las Vegas, you get the same family-owned service and transparent pricing.',
    whyP2: 'We also handle many neighborhoods in central Las Vegas, Spring Valley, and Paradise daily.',
    checklistTitle: 'Popular neighborhoods',
    checklist: neighborhoods,
    ctaTitle: 'Not sure if we cover your address?',
    ctaBody: 'Call with your zip code — we will confirm scheduling.',
    faqs: [
      { q: 'Is there a trip charge?', a: 'Ask when booking — we serve the valley regularly from our Las Vegas base.' },
      { q: 'Do you do commercial work?', a: 'Light commercial and residential — describe your project when calling.' },
      { q: 'Emergency AC repair?', a: 'Call 702-808-8861 for current availability during heat waves.' },
      { q: 'Electrical in all listed areas?', a: 'Yes — panel, EV, spa, and general electrical throughout our service area.' },
    ],
    extraSection: `<section class="py-12 px-4 sm:px-6"><div class="max-w-7xl mx-auto"><h2 class="font-display text-2xl font-bold text-navy text-center mb-8">City pages</h2><div class="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">${cityCards}</div><h2 class="font-display text-2xl font-bold text-navy text-center mt-14 mb-6">Additional neighborhoods</h2><motion class="flex flex-wrap justify-center gap-3">${chips}</motion></div></section>`.replace(/<\/?motion>/g, (t) => (t.startsWith('</') ? '</div>' : '<div>')),
  };

  return buildPage(p);
}

const all = [...electricalPages, ...cityPages];
for (const p of all) {
  fs.writeFileSync(path.join(ROOT, p.file), buildPage(p), 'utf8');
}
fs.writeFileSync(path.join(ROOT, 'service-areas.html'), buildServiceAreasPage(), 'utf8');
console.log('Generated', all.length + 1, 'pages');
