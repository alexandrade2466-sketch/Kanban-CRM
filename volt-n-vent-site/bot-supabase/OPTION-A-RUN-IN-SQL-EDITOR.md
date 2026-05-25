# Option A — Run in Supabase SQL Editor (BOT project only)

Open Supabase project **JNB Services / Volt N' Vent** (`emrqlssbrntnvvdwwojs`).

## Steps

1. Supabase Dashboard → **your bot project** → **SQL Editor** → **New query**.

2. Open `migrations/001_sms_bot_schema.sql` in this folder, copy **all**, paste into SQL Editor → **Run**.

3. Open `migrations/002_seed_volt_n_vent.sql`:
   - Replace `YOUR_GHL_LOCATION_ID` with your GHL location ID (one line).
   - Copy **all**, paste into a **new** query → **Run**.

**Already ran 001 earlier?** Run `003_patch_appointment_windows.sql`, then re-run **002** (or 003 includes a partial update).

4. Verify:

```sql
select persona_name, conversation_objective
from bot_client_full
where slug = 'volt-n-vent';

select wellness_offer->>'price_display' as wellness_price
from bot_client_config cfg
join bot_clients c on c.id = cfg.client_id
where c.slug = 'volt-n-vent';
```

Expected: `persona_name` = **Alex**, wellness price **$29.95**.

```sql
select appointment_scheduling->'windows' as windows
from bot_client_full where slug = 'volt-n-vent';
```

Expected two windows: **8 AM–12 PM** and **12 PM–4 PM** (Mon–Fri).

## n8n Load Client Config

After seeding, point n8n at:

```
GET {SUPABASE_URL}/rest/v1/bot_client_full?slug=eq.volt-n-vent&limit=1
```

Headers: `apikey` + `Authorization: Bearer {SERVICE_ROLE_KEY}`

Use fields in your GPT node:

- `system_prompt`
- `persona_name`, `tone_phrases`, `wellness_offer`, `qualification_script`, `website_knowledge`, `pricing_policy`

## Re-run seed only

If tables already exist and you only updated Alex’s playbook, run **002** again (it uses `on conflict do update`).
