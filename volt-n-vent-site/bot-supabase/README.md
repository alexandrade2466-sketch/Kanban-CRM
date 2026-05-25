# JNB Services / Volt N' Vent — Supabase SMS bot

**Project:** `emrqlssbrntnvvdwwojs` (JNB Services / Volt N' Vent in Supabase)

**Credentials file:** `bot-supabase/.env.jnb-voltnvent.local` (see `CREDENTIALS.txt`)

Use the **same Supabase project** your n8n **Load Client Config** node calls.

## Run migrations

### Option A — Supabase Dashboard (easiest)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your bot project.
2. **SQL Editor** → New query.
3. Paste and run `migrations/001_sms_bot_schema.sql`.
4. Open `migrations/002_seed_volt_n_vent.sql`, replace `YOUR_GHL_LOCATION_ID`, run it.

### Option B — Supabase CLI

```bash
cd volt-n-vent-site/bot-supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
# Or paste SQL files manually if migrations folder is not linked
```

## Volt N' Vent bot persona (Alex)

Seeded in `002_seed_volt_n_vent.sql`:

- **Persona:** Alex from Volt N' Vent — customer service + appointment setting
- **Pricing:** No job quotes in SMS; website for transparency; **only** $29.95 HVAC Wellness Check
- **Tone:** Serving, persistent, calm; key phrases in `tone_phrases`
- **Qualification:** Home/system age, warranty, past HVAC cos, units, roof/ground, last check/replacement
- **Website:** All voltnvent.com service pages in `website_knowledge` + `services`

See **`OPTION-A-RUN-IN-SQL-EDITOR.md`** for paste-and-run steps.

## After seeding

| Check | Query |
|-------|--------|
| Client exists | `select slug, ghl_location_id, sms_provider from bot_clients where slug = 'volt-n-vent';` |
| Alex persona | `select persona_name, pricing_policy from bot_client_config cfg join bot_clients c on c.id = cfg.client_id where slug = 'volt-n-vent';` |
| n8n load test | `select * from bot_client_full where slug = 'volt-n-vent';` |

## n8n credentials

Store in n8n only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (never in website repo)
- `GHL_PRIVATE_INTEGRATION_TOKEN` (Volt N' Vent location)

## Tables

| Table | Purpose |
|-------|---------|
| `bot_clients` | One row per business (`volt-n-vent`) |
| `bot_client_config` | Prompt, services, hours, compliance |
| `bot_contacts` | Phone + `ghl_contact_id` |
| `bot_interactions` | Conversation session |
| `bot_messages` | Inbound/outbound log for GPT context |
| `bot_client_metrics` | Daily counters |
| `bot_client_full` | View for n8n Load Client Config |

## RLS

Tables use RLS with no public policies — n8n should use the **service_role** key.
