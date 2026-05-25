# Import Volt N' Vent Alex SMS bot into n8n

## Can the assistant log into my n8n?

**No** — not like a person in the browser. You **import** the workflow file below and connect 3 credentials (5 minutes).

File to import: **`volt-n-vent-alex-sms-ghl.json`**

---

## Before import — have these ready

| Credential | Where to get it |
|------------|-----------------|
| **Supabase Service Role** | Supabase → Project Settings → **API Keys** → `service_role` (secret) |
| **GoHighLevel Private Integration** | GHL → Settings → Private Integrations → token with conversation write |
| **OpenAI API Key** | platform.openai.com → API keys |

Supabase project: `emrqlssbrntnvvdwwojs`  
URL: `https://emrqlssbrntnvvdwwojs.supabase.co`

---

## Create 3 credentials in n8n (Header Auth type)

### 1) `Supabase Service Role`
- Type: **Header Auth**
- Header **Name:** `apikey` → Value: your `service_role` key  
- Add second header in node OR use custom: many users add in node manually:
  - Also set header `Authorization` = `Bearer YOUR_SERVICE_ROLE_KEY`

(Supabase needs both `apikey` and `Authorization` — add `Authorization` in each Supabase HTTP node if your credential only has `apikey`.)

### 2) `GoHighLevel API`
- Type: **Header Auth**
- Header **Name:** `Authorization` → Value: `Bearer YOUR_GHL_PRIVATE_INTEGRATION_TOKEN`

### 3) `OpenAI API Bearer`
- Type: **Header Auth**
- Header **Name:** `Authorization` → Value: `Bearer sk-...`

---

## Import steps

1. Open **n8n** → **Workflows** → **⋯** menu → **Import from file** (or drag JSON).
2. Select `volt-n-vent-site/n8n/volt-n-vent-alex-sms-ghl.json`.
3. n8n opens the workflow **Volt N Vent - Alex SMS Bot (GHL + Supabase)**.
4. Open each node with a **red warning** → assign credentials:
   - **Supabase Service Role** → **Load Alex Config**
   - **GoHighLevel API** → **Send SMS via GHL**
   - **OpenAI API Bearer** → **OpenAI - Alex Reply**
5. Click **Webhook GHL SMS** → **Production** tab → **copy URL**.
6. In **GHL** workflow *GHL to n8n SMS Bot* → paste URL in Custom Webhook step (see `GHL-N8N-VNV-CONNECT.md`).
7. Toggle workflow **Active** (published) in n8n.
8. Send a test SMS to your GHL number.

---

## What the workflow does

```
GHL SMS → Webhook → Normalize → Load Alex from Supabase (bot_client_full)
  → Guardrails (STOP / HELP / human / AI)
  → STOP: short ack, no AI
  → HELP: sms_help_reply from database
  → Handoff: team message + tag note
  → AI: OpenAI with full system_prompt + reply → Send SMS via GHL API → Log messages in Supabase
  → Respond 200 to GHL
```

Alex personality, qualifying questions, pricing rules, wellness $29.95, and appointment windows all come from **`system_prompt`** and related fields in Supabase (already seeded).

---

## GHL webhook body (paste in GHL)

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

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Import fails | n8n version 1.0+; update n8n if very old |
| Supabase 401 | Wrong service_role key on credential |
| GHL SMS not sent | Private Integration scopes; `contactId` from webhook |
| Double replies | Turn off GHL Conversation AI on SMS |
| OpenAI error | Billing + model name in Load Config (`gpt-4.1-mini`) |

---

## Optional: merge with your old workflow

You can import this as a **new** workflow and retire the old Twilio-send path, or copy nodes from this file into your existing inbound handler.

---

## Security

- Rotate DB password if it was shared in chat.
- Never commit service_role or GHL token to git.
