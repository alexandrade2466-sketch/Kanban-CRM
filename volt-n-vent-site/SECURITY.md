# Security — Volt N' Vent static site

This site is **static HTML** hosted on Vercel. There is no WordPress, database, or server-side PHP on this project.

## What is already low-risk

- No `wp-admin`, plugins, or SQL database to attack
- No user login on the website itself
- No API keys in the published HTML (only public phone/email)
- HTTPS enforced via Vercel + HSTS header

## Headers (vercel.json)

Production responses include:

- **HSTS** — browsers only use HTTPS
- **X-Content-Type-Options** — reduces MIME sniffing attacks
- **X-Frame-Options** — reduces clickjacking
- **Content-Security-Policy** — limits which scripts/styles can run (Tailwind CDN + LeadConnector chat widget are allowlisted)
- **Referrer-Policy** / **Permissions-Policy** — limits accidental data leakage and browser feature abuse

## Third-party scripts (review periodically)

| Service | Purpose | Risk if compromised |
|---------|---------|---------------------|
| `cdn.tailwindcss.com` | Styling | Could inject malicious CSS/JS |
| `widgets.leadconnectorhq.com` | Chat widget | Could inject scripts (required for chat) |
| Google Fonts | Typography | Lower risk |

Only add new third-party scripts when the client needs them. Fewer scripts = smaller attack surface.

## Account security (most important for agencies)

Hacks often happen via **accounts**, not HTML files:

1. **Vercel** — strong password + 2FA; limit team access
2. **Domain registrar** — 2FA; lock domain transfer
3. **Google Business / email** — 2FA on VoltNVent@gmail.com or workspace
4. **LeadConnector / CRM** — separate strong password; don't share in chat logs

## Do not commit secrets

Never put in git or paste into AI chats:

- API keys, SMTP passwords, `.env` files
- Vercel tokens, DNS API keys
- Client CRM admin passwords

`.env` and `.vercel` are in `.gitignore`.

## If you move to WordPress later

WordPress needs **ongoing** updates (core, themes, plugins), security plugin, login rate limits, and backups. A well-maintained static site is often **easier to keep secure** than an neglected WordPress install.

## Check security headers after deploy

1. Visit https://securityheaders.com/?q=https://voltnvent.com
2. Confirm grade improves after header deploy (A or B is realistic with required third-party widgets)

## Report issues

Contact the site owner: VoltNVent@gmail.com | 702-808-8861
