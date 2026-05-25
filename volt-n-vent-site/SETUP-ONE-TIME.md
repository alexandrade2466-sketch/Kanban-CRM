# Volt N' Vent Alex SMS — simple setup

## You do NOT need a GHL workflow anymore

Alex checks GHL every 30 seconds for new inbound texts. **No webhook URL to paste in GHL.**

### In GHL (one time)

1. **Turn OFF** any SMS bot workflows (Customer Replied → webhook)
2. **Settings → Conversation AI** → turn off SMS auto-reply
3. **Private Integration token** — add scopes: `opportunities.readonly`, `opportunities.write`, `contacts.write` (for pipeline + notes)
4. Paste fresh token into `bot-supabase/.env.jnb-voltnvent.local` as `GHL_PRIVATE_INTEGRATION_TOKEN`

### Marketing Pipeline sync (Alex dispositions + notes)

After updating the GHL token, run:

```bash
cd volt-n-vent-site/bot-supabase
node scripts/setup-ghl-marketing-pipeline.mjs
node scripts/wire-n8n-autonomous.mjs
```

This connects Alex to your **Marketing Pipeline** — after each SMS he:
- Adds a **contact note** (customer message + Alex reply + disposition)
- Moves/creates the **opportunity** in the matching pipeline stage

### Test

Text your GHL business number. Reply within ~30–60 seconds. Check the contact in GHL for a new note and pipeline stage.

---

Details: `NO-GHL-WORKFLOW-NEEDED.md`

If something breaks, tell the assistant: **check alex sms**
