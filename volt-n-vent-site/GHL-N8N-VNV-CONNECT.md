# Connect Volt N' Vent GHL → your n8n Inbound Handler

Your n8n flow (screenshot) is the right architecture:

`Webhook → Normalize → Load Client Config (Supabase) → CRM steps → Guardrails → GPT → Log outbound → Send SMS → Metrics`

This doc maps **GHL SMS** into that flow for **slug `volt-n-vent`**.

---

## Important: send SMS through GHL (not parallel Twilio)

Your last node is **Send SMS via Twilio**. For Volt N' Vent, A2P SMS runs through **GHL + Twilio**. If n8n sends on a **different** Twilio sender, customers may see a different number than your GHL campaign.

**Recommendation for Volt N' Vent:**

1. Set `bot_clients.sms_provider = 'ghl'` in Supabase (seed file does this).
2. Replace (or branch) the Twilio node with **HTTP Request → GHL**:

| Field | Value |
|-------|--------|
| POST | `https://services.leadconnectorhq.com/conversations/messages` |
| Authorization | `Bearer {{GHL_PRIVATE_INTEGRATION_TOKEN}}` |
| Version | `2021-07-28` |
| Body | `{ "type": "SMS", "contactId": "{{ ghl_contact_id }}", "message": "{{ agent_reply }}" }` |

Keep Twilio node only for other clients that do not use GHL.

---

## Step 1 — n8n Webhook (production URL)

1. Open workflow **Inbound Handler** (or your named bot).
2. Click **Webhook** node → **Production** tab.
3. Copy URL, e.g. `https://143.198.227.200/webhook/xxxx` or your cloud URL.
4. Workflow must be **Active**.

Optional security: require header `X-Webhook-Secret: your-long-secret` and match in GHL Custom Webhook headers.

---

## Step 2 — GHL workflow (you already started this)

Workflow: **GHL to n8n SMS Bot**

### Trigger (you have this)

- **Customer Replied** → Customer SMS Reply
- Filter: Reply channel = **SMS**
- Filter: Doesn't have tag **human-handoff**

### Action: Send SMS Reply Data to n8n Webhook

| Setting | Value |
|---------|--------|
| Method | POST |
| URL | Paste n8n **Production** webhook URL |
| Content-Type | application/json |

**Body (Custom / Raw JSON):**

```json
{
  "client_slug": "volt-n-vent",
  "location_id": "YOUR_GHL_LOCATION_ID",
  "contact_id": "{{contact.id}}",
  "conversation_id": "{{conversation.id}}",
  "message_body": "{{message.body}}",
  "message_type": "SMS",
  "phone": "{{contact.phone}}",
  "first_name": "{{contact.first_name}}",
  "last_name": "{{contact.last_name}}"
}
```

Use GHL’s **{ }** picker for variables — do not type `{{contact.id}}` manually if picker inserts a different format.

**Optional header:**

| Header | Value |
|--------|--------|
| X-Client-Slug | volt-n-vent |

### Do not add

- A second **Send SMS** action in GHL after the webhook (duplicate texts).
- Conversation AI auto-reply on SMS (Settings → turn off for this number).

### Publish

Toggle **Draft → Publish**.

---

## Step 3 — n8n **Normalize Input** (Code node)

Your Normalize node should output fields your downstream nodes expect. Example:

```javascript
const raw = $input.first().json;
const body = raw.body ?? raw;

return [{
  json: {
    client_slug: body.client_slug || 'volt-n-vent',
    location_id: body.location_id,
    ghl_contact_id: body.contact_id,
    ghl_conversation_id: body.conversation_id,
    phone: body.phone,
    first_name: body.first_name,
    last_name: body.last_name,
    message_body: (body.message_body || '').trim(),
    message_type: body.message_type || 'SMS',
    channel: 'sms',
  },
}];
```

---

## Step 4 — **Load Client Config** (Supabase HTTP)

Point at the **view** from migrations (same Supabase project as today):

```
GET {{SUPABASE_URL}}/rest/v1/bot_client_full?slug=eq.{{ $json.client_slug }}&limit=1
```

Headers:

| Header | Value |
|--------|--------|
| apikey | service_role key |
| Authorization | Bearer service_role key |

**Check Client Status** should verify `is_active === true`.

---

## Step 5 — CRM nodes (Supabase, not GHL API)

Your nodes **Get/Create Contact**, **Interaction**, **Insert Inbound/Outbound Message** should use `bot_contacts`, `bot_interactions`, `bot_messages` tables.

Map keys:

| n8n field | Supabase column |
|-----------|-----------------|
| `client_slug` → resolve `client_id` | `bot_clients.slug` |
| `phone` | `bot_contacts.phone` |
| `ghl_contact_id` | `bot_contacts.ghl_contact_id` |
| `ghl_conversation_id` | `bot_interactions.ghl_conversation_id` |
| `message_body` inbound | `bot_messages` direction `inbound` |
| GPT reply outbound | `bot_messages` direction `outbound` |

Upsert contact example (REST):

```
POST /rest/v1/bot_contacts
Prefer: resolution=merge-duplicates
Body: { "client_id": "...", "phone": "...", "ghl_contact_id": "...", "first_name": "..." }
```

Conflict target: `(client_id, phone_normalized)` — use unique constraint via upsert on `phone` after normalization in code.

---

## Step 6 — **Rules/Guardrails**

Before GPT:

| Check | Action |
|-------|--------|
| `message_body` matches STOP keywords from config | Tag opt-out in Supabase, **skip GPT**, optional GHL tag `sms-opt-out` |
| `message_body` is HELP | Send `sms_help_reply` from config via GHL API, stop |
| Escalation keywords | Set interaction `status = handoff`, add GHL tag `human-handoff`, send handoff SMS |

---

## Step 7 — **GPT Reasoning**

Include in prompt context from `bot_client_full`:

- `system_prompt`
- `business_summary`
- Last N messages from `bot_messages` for this `interaction_id`
- Customer first name, service area

---

## Step 8 — Send reply

If `sms_provider === 'ghl'` → GHL messages API (see top).  
Else → existing Twilio node.

---

## Step 9 — **Refresh Client Metrics**

Increment `bot_client_metrics` for today:

- `inbound_count` on inbound insert
- `outbound_count` on successful send
- `handoff_count` / `opt_out_count` when applicable

---

## Step 10 — Test end-to-end

1. n8n: listen for webhook / workflow active.
2. GHL: publish workflow.
3. Text your GHL number from your mobile.
4. Verify:
   - GHL workflow execution green on webhook step
   - n8n execution success through all nodes
   - Row in `bot_messages` (inbound + outbound)
   - One SMS reply on the same GHL number thread

---

## Supabase setup (next step)

Run in SQL Editor on the Supabase project n8n already uses:

1. `bot-supabase/migrations/001_sms_bot_schema.sql`
2. Edit `YOUR_GHL_LOCATION_ID` in `002_seed_volt_n_vent.sql`, then run it.

See `bot-supabase/README.md` for CLI instructions.

---

## What I need from you to finalize

1. **n8n Production webhook URL** (redact middle if you want)
2. **GHL Location ID** (Settings → Business Profile)
3. Confirm Supabase project URL matches n8n (starts with `fuhwzhrydwba` in your screenshot?)
4. Export **Normalize Input** + **Load Client Config** node settings (screenshot OK) so field names match exactly

After that, we can adjust seed prompt or SQL to match your live nodes 1:1.
