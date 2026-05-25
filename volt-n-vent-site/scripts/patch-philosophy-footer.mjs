import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const needle =
  '<a href="meet-the-team.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Meet the Team</a>';
const insert = `<a href="our-philosophy-of-advocacy.html" class="text-gold hover:text-gold-hover underline underline-offset-4">Our Philosophy</a>
        <span class="text-paper/50">·</span>
        ${needle}`;

let n = 0;
for (const f of fs.readdirSync(root).filter((x) => x.endsWith('.html'))) {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('our-philosophy-of-advocacy.html')) continue;
  if (!s.includes(needle)) continue;
  fs.writeFileSync(p, s.replaceAll(needle, insert));
  n++;
  console.log('patched', f);
}
console.log('done', n);
