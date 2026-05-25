# Chat widget setup (LeadConnector / GoHighLevel)

The live site uses **LeadConnector** widget ID: `6a0ba8d851fd5b9cc7eca6c2`

Code on the website only **loads** the widget. Colors, greeting, business hours, and auto-replies are set in **GoHighLevel** (or LeadConnector).

## Match Volt N' Vent branding in GHL

In **Sites → Chat Widget** → open your widget → **Style**:

| Setting | Recommended value |
|---------|-------------------|
| Primary color | `#f7c600` (gold) |
| Secondary / header | `#153a5c` (navy) |
| Accent (optional) | `#e8892c` (rust) |
| Launcher | Bottom right |
| Theme | Choose closest to brand; upload logo if available |

**Chat window (static text):**

- **Title:** Volt N' Vent — Las Vegas HVAC & Electrical
- **Intro:** Need AC repair, a quote, or electrical help? Message us here. For urgent no-cool calls, call **702-808-8861**.
- **CTA button:** Start chat / Get help

**Messaging tab:**

- **Greeting (first visit):** Hi! Thanks for visiting Volt N' Vent. How can we help you today — HVAC, electrical, or a free estimate?
- **Return visitor:** Welcome back! Reply here or call 702-808-8861 if you need same-day help.
- **Acknowledgement:** We got your message. A team member will respond shortly.
- **Language:** English

**Business hours:** Set to real office hours so after-hours visitors get expectations (optional auto-reply).

**SMS/Email capture:** Enable if leads should flow into GHL pipeline (align with SMS policy on site).

## If you create a NEW widget in GHL

1. Copy the new **Widget ID** from the embed code in GHL.
2. Edit `assets/chat-widget.js` → change `WIDGET_ID` to the new id.
3. Redeploy the site (`npx vercel --prod` from `volt-n-vent-site`).

## What we improved in code

- Single file `assets/chat-widget.js` (easy to update ID)
- Widget loads after page is ready (faster first paint)
- Mobile: **Call** button on the left, **chat** bubble on the right (less overlap)

## Switching away from LeadConnector

If you move to another CRM chat (Tidio, HubSpot, etc.), replace the script in `assets/chat-widget.js` with their embed snippet and update `vercel.json` Content-Security-Policy allowlist.
