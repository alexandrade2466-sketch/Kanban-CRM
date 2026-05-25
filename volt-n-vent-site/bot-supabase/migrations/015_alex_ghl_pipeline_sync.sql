-- Alex v10: GHL Marketing Pipeline sync — notes + disposition stages

update public.bot_client_config cfg
set
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'ghl_crm_sync',
    coalesce(metadata->'ghl_crm_sync', '{}'::jsonb) || $json${
      "enabled": false,
      "pipeline_name": "Marketing Pipeline",
      "pipeline_id": "",
      "location_id": "81uoqXcdjO6CKRFIIuw6",
      "note_prefix": "Alex SMS",
      "dispositions": {
        "new_contact": {
          "label": "SMS — New Contact",
          "stage_names": ["new", "new lead", "lead", "inbound", "fresh"]
        },
        "engaged": {
          "label": "SMS — Engaged",
          "stage_names": ["engaged", "interested", "responded", "in conversation", "contacted", "working"]
        },
        "wellness_interested": {
          "label": "Wellness — Interested",
          "stage_names": ["wellness", "offer", "campaign", "promo"]
        },
        "appointment_set": {
          "label": "Appointment Set",
          "stage_names": ["booked", "scheduled", "appointment", "appointment set", "set"]
        },
        "urgent_service": {
          "label": "Urgent Service Need",
          "stage_names": ["urgent", "hot", "service", "emergency", "hot lead"]
        },
        "sales_handoff": {
          "label": "Sales / Quote Handoff",
          "stage_names": ["sales", "quote", "estimate", "proposal"]
        },
        "human_handoff": {
          "label": "Needs Human Follow-up",
          "stage_names": ["handoff", "human", "follow up", "callback", "needs follow up"]
        },
        "not_interested": {
          "label": "Not Interested",
          "stage_names": ["not interested", "dead", "lost", "unqualified", "no", "closed lost"]
        },
        "opt_out": {
          "label": "SMS Opt-Out",
          "stage_names": ["opt out", "dnc", "stop", "unsubscribed"]
        }
      },
      "stage_ids": {},
      "setup_note": "Run: node bot-supabase/scripts/setup-ghl-marketing-pipeline.mjs after refreshing GHL_PRIVATE_INTEGRATION_TOKEN with scopes opportunities.readonly, opportunities.write, contacts.write"
    }$json$::jsonb
  ),
  system_prompt = system_prompt || $add$

## GHL CRM sync (internal — after each SMS exchange)
When a conversation completes, the system logs a contact note and moves the Marketing Pipeline opportunity to match disposition. You do not mention pipeline stages to the customer.
$add$,
  updated_at = now()
from public.bot_clients c
where cfg.client_id = c.id and c.slug = 'volt-n-vent';
