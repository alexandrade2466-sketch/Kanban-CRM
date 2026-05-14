# Volt N' Vent — static site

Single-page marketing site (HTML + Tailwind CDN). Works on GitHub Pages, Netlify, Vercel static hosting, or any web server.

## Logo

Your mascot logo is saved as `assets/volt-n-vent-logo.png`. The site’s **paper** background is **`#EDBE87`**, sampled from the **outer edge** of that PNG so the frame blends in. For a pixel-perfect edge on every monitor, use a **transparent PNG** export and replace the file.

## Demo locally

```bash
cd volt-n-vent-site
npm run demo
```

Open **http://localhost:3333** in your browser.

## Put on GitHub

1. Create a **new** empty repository on GitHub (e.g. `volt-n-vent`).
2. Copy **only** the contents of this `volt-n-vent-site` folder into that repo (or push this folder as the repo root).
3. Optional: replace `assets/volt-n-vent-logo.svg` with your real `volt-n-vent-logo.jpeg` and update `index.html` image `src` paths to match.

## Production logo / hero

- Meta tags still reference `https://VoltNVent.com/assets/volt-n-vent-logo.jpeg` for SEO/social; update those URLs when your live assets match.
- Hero background expects `assets/volt-n-vent-hero-bg.jpg`. Add that file for a custom photo background, or edit `index.html` `.hero-bg` to use another image or a flat color.
