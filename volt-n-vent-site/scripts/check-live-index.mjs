const t = await fetch('https://voltnvent.com/mini-split-install-las-vegas.html').then((r) => r.text());
console.log('css linked:', t.includes('vnv-readable.css'));
console.log('stat card:', t.includes('vnv-stat-card'));
const i = t.indexOf('Starting Price');
console.log(t.slice(i - 80, i + 200));
