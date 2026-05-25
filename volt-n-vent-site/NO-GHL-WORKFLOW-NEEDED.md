# Alex SMS — no GHL workflow needed

You do **not** need a GHL automation with "Customer Replied" or a Custom Webhook action.

Alex now uses an **n8n poller** that checks GHL every 30 seconds for any new inbound SMS and replies automatically.

## What to do in GHL

1. **Turn OFF** (or delete) these workflows:
   - GHL to n8n SMS Bot
   - Volt N Vent - Alex SMS Bot
   - Any other SMS auto-reply workflow

2. **Settings → Conversation AI** → turn **off** auto-reply for SMS

3. **Nothing else** — no webhook URL to paste in GHL

## How it works

```
Someone texts your GHL number
    → GHL stores the message in Conversations
    → n8n checks every 30s for new inbound SMS
    → Alex generates a reply
    → Reply sent back through GHL API
```

## Test

Text your business number: `Hi, my AC is not cooling`

You should get a reply within ~30–60 seconds.

## If you still want a GHL workflow

GHL's **"Inbound Webhook" trigger** is the wrong direction (that receives data *into* GHL, not out to Alex).

The only GHL-native outbound option is **Customer Replied → Custom Webhook**, which often sends empty fields. The poller avoids that entirely.
