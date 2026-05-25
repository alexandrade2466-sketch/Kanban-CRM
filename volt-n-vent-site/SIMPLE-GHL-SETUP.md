# Alex SMS — GHL setup (2 minutes)

GHL **cannot** call your n8n server directly (HTTP). Use this **HTTPS** URL instead:

```
https://voltnvent.com/api/ghl-sms-webhook
```

---

## Step 1 — Webhook action in GHL

Workflow: **GHL to n8n SMS Bot** (trigger: Customer Replied → SMS)

| Field | Value |
|-------|--------|
| Method | POST |
| URL | `https://voltnvent.com/api/ghl-sms-webhook` |
| Content-Type | application/json |

---

## Step 2 — Body (copy exactly, then use { } picker)

Only **2 fields** are required. Use GHL's **{ }** button to insert each value — do not type the curly braces yourself.

```json
{
  "contact_id": "PICK: Contact → Id",
  "message_body": "PICK: Message → Body"
}
```

Optional (recommended):

```json
{
  "contact_id": "PICK: Contact → Id",
  "message_body": "PICK: Message → Body",
  "location_id": "PICK: Location → Id"
}
```

---

## Step 3 — Turn it ON

1. **Save** the webhook action  
2. **Publish** the workflow (toggle ON)  
3. **Settings → Conversation AI** → turn **off** auto-reply for SMS  

---

## Test

Text your GHL number: `Hi, my AC is not cooling`

You should get a reply from Alex within ~30 seconds.

---

## If no reply

### Check 1 — Did GHL run the workflow?

1. GHL → **Automation** → **GHL to n8n SMS Bot**
2. Open **Execution Logs** (clock/history icon)
3. Text your number, refresh logs

| What you see | Meaning |
|--------------|---------|
| **No new log** | Trigger not firing — see Check 2 |
| **Log shows webhook FAILED** | URL or body wrong — see Check 3 |
| **Log shows webhook SUCCESS** | Bot issue — tell assistant: **check alex sms** |

### Check 2 — Trigger not firing

- Workflow toggle is **ON** (published)
- You texted the **GHL business SMS number** (real phone SMS, not GHL in-app chat)
- Contact does **not** have tag `human-handoff` (remove that tag on your test contact)
- **Conversation AI** auto-reply is **OFF** for SMS

### Check 3 — Webhook URL and body

- URL is exactly: `https://voltnvent.com/api/ghl-sms-webhook` (not the `http://143.198...` URL)
- Authorization: **None**
- Body uses **{ }** picker for Contact Id and Message Body (not typed `{{contact.id}}`)

Do **not** use `http://143.198.227.200:5678/...` in GHL — that URL will not work from GHL.
