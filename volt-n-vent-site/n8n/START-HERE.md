# Volt N' Vent SMS bot — start here (simple)

You already finished **Supabase** (Alex is in the database).  
Now you only do **3 things** in n8n + **1 paste** in GHL.

---

## Thing 1 — Import the bot file into n8n

1. Open **n8n** in your browser.
2. Click **Workflows** (left side).
3. Click the **three dots** or **Add workflow** → **Import from file**.
4. Choose this file on your computer:

   `volt-n-vent-site\n8n\volt-n-vent-alex-sms-ghl.json`

5. You should see a workflow named **Volt N Vent - Alex SMS Bot**.

That’s it for import.

---

## Thing 2 — Paste 3 passwords/keys into n8n

n8n will show some nodes in **red** until you connect keys. You only need **3 keys**.

### Key A — Supabase (so Alex loads from your database)

1. In n8n left menu → **Credentials** → **Add credential**.
2. Search **Header Auth** → create it.
3. Name it: `Supabase Volt N Vent`
4. Add header:
   - Name: `apikey`  
   - Value: paste your **service_role** key from Supabase  
     (Supabase → gear **Project Settings** → **API Keys** → **service_role** → reveal & copy)
5. Save.

6. Open workflow → click node **Load Alex Config** → choose credential **Supabase Volt N Vent**.
7. In that same node, under **Headers**, add one more row if it’s not there:
   - Name: `Authorization`  
   - Value: `Bearer ` then paste the **same** service_role key again.

### Key B — GoHighLevel (so texts send back to customers)

1. **Credentials** → **Add** → **Header Auth**.
2. Name: `GHL Volt N Vent`
3. Header:
   - Name: `Authorization`  
   - Value: `Bearer ` + your GHL **Private Integration** token  
     (GHL → Settings → Private Integrations)
4. Save.
5. Click node **Send SMS via GHL** → pick **GHL Volt N Vent**.

### Key C — OpenAI (so Alex can reply)

1. **Credentials** → **Add** → **Header Auth**.
2. Name: `OpenAI Volt N Vent`
3. Header:
   - Name: `Authorization`  
   - Value: `Bearer sk-` + your OpenAI API key
4. Save.
5. Click node **OpenAI - Alex Reply** → pick **OpenAI Volt N Vent**.

When no nodes are red, you’re done with keys.

---

## Thing 3 — Turn the bot ON and copy 1 link

1. Open the workflow **Volt N Vent - Alex SMS Bot**.
2. Top right: switch **Inactive** → **Active** (ON).
3. Click node **Webhook GHL SMS**.
4. Open tab **Production** (not Test).
5. **Copy** the full URL (starts with `https://` and has `volt-n-vent-inbound-sms` in it).

Keep that URL — you paste it in GHL next.

---

## Thing 4 — Paste that link in GoHighLevel (one place)

1. Open **GHL** → **Automation** → your workflow **GHL to n8n SMS Bot**.
2. Click step **Send SMS Reply Data to n8n Webhook**.
3. Paste the URL you copied into the **URL** box.
4. Save. Turn workflow **ON**.

---

## Test

Text your **GHL business phone number** from your cell.  
You should get a reply as **Alex** within a minute.

If nothing happens: check n8n **Executions** — green = ran, red = click to see error.

---

## What you do NOT need

- Anon key  
- Publishable key  
- Kanban CRM project  
- To paste SQL by hand (already done)

---

## Still stuck?

Tell me which step number (1, 2, 3, or 4) and send a screenshot of that screen.

Detailed backup doc (only if needed): `IMPORT-WORKFLOW.md`
