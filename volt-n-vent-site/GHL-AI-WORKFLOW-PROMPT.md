# Copy everything below into GHL’s AI workflow builder

Select all text inside the box, copy, paste into GHL when it asks what workflow you want.

---

```
Build a new workflow for Volt N' Vent HVAC (Las Vegas). Name it exactly: "Volt N Vent - Alex SMS Bot".

PURPOSE
When a customer sends an inbound SMS reply, POST their message to our external bot API. The bot (Alex) generates the reply and sends the SMS back through GHL API — do NOT add any "Send SMS" or "Send Message" action in this workflow or customers will get duplicate texts.

TRIGGER
- Trigger type: Customer Replied
- Channel: SMS only (not email, not Facebook, not Instagram, not live chat)
- Do NOT require any tag to enter the workflow

FILTERS (keep minimal so tests always fire)
- Reply channel equals SMS
- Optional only: contact does NOT have tag "human-handoff" (if you add this filter, note it in the workflow description)

DO NOT ADD
- No "Send SMS" step after the webhook
- No "Send Email" step
- No Conversation AI / AI Employee reply step
- No second webhook
- No delay longer than 5 seconds

OPTIONAL (nice to have)
- One "Wait" step for 3 seconds before the webhook (helps when someone sends two texts in a row)

MAIN ACTION — Custom Webhook (configure every field exactly)

Action name: Send inbound SMS to Alex bot

Event / type: CUSTOM (so I can send a JSON body)

HTTP Method: POST

URL (copy exactly, character for character):
https://voltnvent.com/api/ghl-sms-webhook

Authorization: None (no Bearer token, no API key, no Basic auth)

Headers: leave empty / none (Content-Type will be set below)

Query parameters: none

Content-Type: application/json

Request body format: Raw JSON (application/json)

JSON body — build this using the workflow variable picker for each value (do not leave literal placeholder text like {{contact.id}} typed by hand; use GHL's insert-variable UI so values resolve at runtime):

{
  "client_slug": "volt-n-vent",
  "contact_id": <INSERT: Contact → Id>,
  "message_body": <INSERT: Message → Body>,
  "message_type": "SMS",
  "location_id": <INSERT: Location → Id>,
  "phone": <INSERT: Contact → Phone>,
  "first_name": <INSERT: Contact → First Name>,
  "last_name": <INSERT: Contact → Last Name>,
  "conversation_id": <INSERT: Conversation → Id>
}

Required mappings (must not be empty at runtime):
- contact_id = Contact Id from the trigger
- message_body = the inbound SMS message body from the customer

If Conversation Id is not available in this trigger, omit conversation_id or send empty string — but contact_id and message_body are mandatory.

After the webhook step, end the workflow. Success = webhook returns HTTP 200.

PUBLISH
- Save and publish the workflow ON (active) for this location.
- Remind me in the summary to turn OFF Conversation AI auto-reply for SMS under Settings so it does not fight with Alex.

TEST PLAN (include in your summary)
1. Text the business SMS number from a real phone: "Hi my AC is not cooling"
2. Open workflow Execution Logs — webhook step should show success
3. Customer should receive an SMS reply from Alex within ~60 seconds

CRITICAL RULES
- Webhook URL must be HTTPS voltnvent.com URL above — NEVER use http://143.198.227.200:5678 or any raw IP n8n URL
- Never add outbound SMS in this workflow; the external bot sends the reply via API
- Workflow name must be exactly: Volt N Vent - Alex SMS Bot
```

---

## After the AI builds it

1. **Turn OFF** the old workflow **"GHL to n8n SMS Bot"** (avoid duplicate runs).
2. **Settings → Conversation AI** → disable auto-reply for **SMS**.
3. Text your GHL number to test.

## If the AI can’t map a variable

Tell it: *"Use only contact_id (Contact Id) and message_body (Message Body). Remove conversation_id if unavailable."*

Minimum JSON the bot accepts:

```json
{
  "contact_id": "<Contact Id from picker>",
  "message_body": "<Message Body from picker>"
}
```
