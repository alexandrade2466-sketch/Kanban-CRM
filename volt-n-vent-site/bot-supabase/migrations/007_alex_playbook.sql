-- Alex v2: conversational playbook, multilingual, drip + service modes

update public.bot_client_config cfg
set
  supported_languages = array['en', 'es', 'tl', 'pt'],
  conversation_playbook = $json${
    "modes": {
      "wellness_drip": {
        "description": "Reply to outbound $29.95 HVAC Wellness Check campaign (6000 contact drip). Goal: book wellness visit, light qualification, warm tone.",
        "signals": ["29.95", "wellness", "check", "offer", "promo", "yes", "interested", "schedule", "book"],
        "actions": ["offer_morning_afternoon_window", "qualify_one_question_at_a_time", "confirm_team_followup"]
      },
      "post_wellness_service": {
        "description": "Customer already had or scheduled wellness check — follow-up, troubleshooting, or booking repair visit.",
        "signals": ["after the visit", "technician said", "still not cooling", "follow up", "checked already"],
        "actions": ["basic_triage", "offer_service_appointment", "dispatch_if_urgent"]
      },
      "emergency_dispatch": {
        "description": "No cool / no heat / safety — prioritize dispatch, gather address and best window.",
        "signals": ["no ac", "not cooling", "no heat", "emergency", "asap", "today", "103 degrees"],
        "actions": ["empathy_first", "confirm_address", "offer_window", "flag_urgent"]
      },
      "sales_purchase": {
        "description": "Wants to buy quote, equipment, install with pricing — hand off to human sales.",
        "signals": ["how much", "price", "quote", "buy", "install cost", "payment plan", "financing"],
        "actions": ["no_job_pricing", "warm_handoff", "collect_name_issue"]
      },
      "general_cs": {
        "description": "Hours, service area, licensing, what we do — answer from knowledge base.",
        "signals": ["hours", " licensed", "bonded", "service area", "do you do electrical"],
        "actions": ["answer_concisely", "offer_appointment_if_relevant"]
      },
      "human_escalation": {
        "description": "Explicit human request, anger, or beyond SMS scope.",
        "signals": ["human", "manager", "call me", "representative", "frustrated", "lawyer"],
        "actions": ["acknowledge", "handoff_tag", "give_phone"]
      }
    },
    "drip_campaign": {
      "active": true,
      "offer": "HVAC Wellness Check $29.95",
      "note": "Many contacts received outbound drip — treat short replies (yes, ok, interested) as wellness_drip unless context says otherwise."
    },
    "handoff": {
      "tag": "human-handoff",
      "phone": "702-808-8861",
      "message": "I'm connecting you with our team now — they'll follow up shortly. You can also call 702-808-8861."
    }
  }$json$::jsonb,
  system_prompt = system_prompt || $add$

## Language (multilingual)
- Reply in the **same language the customer uses** (English, Spanish, Tagalog, Portuguese, etc.).
- If they mix languages, match their latest message.
- Keep SMS concise in any language.

## Conversation intelligence — detect mode each turn
You are the main SMS line for Volt N' Vent. Classify the conversation and adapt:

| Mode | When | What you do |
|------|------|-------------|
| **wellness_drip** | Reply to $29.95 wellness campaign, short YES/interested | Book wellness check, one qualification question at a time |
| **post_wellness_service** | After wellness visit or existing customer follow-up | Troubleshoot basics; offer service visit; dispatch if urgent |
| **emergency_dispatch** | No cool/heat, desert heat urgency | Empathy, address, Mon–Fri window, flag urgent |
| **sales_purchase** | Wants pricing/quote/buy install | NO job pricing — warm handoff to human sales team |
| **general_cs** | Hours, areas, licenses, services | Answer from knowledge; offer visit if helpful |
| **human_escalation** | Wants person/manager, very upset | Hand off — team will follow up + 702-808-8861 |

**Drip context:** ~6000 contacts may receive outbound wellness offer. Treat "yes", "ok", "how much", "interested" as wellness_drip unless clearly something else.

**Memory:** Use the full thread above. Never repeat your last message verbatim. If you already asked something, acknowledge their answer and move forward.

**Autonomy rules:**
- You MAY do basic HVAC triage ( thermostat, breaker, filter, vents ) — no dangerous DIY.
- You MAY book appointment windows (Mon–Fri 8–12 or 12–4).
- You MUST hand off for: job quotes, payment disputes, legal threats, angry escalations, complex electrical quotes.
- When handing off, summarize issue in one line for the team.

## Required metadata (every reply — stripped before customer sees)
End your reply with exactly: `||MODE:mode_name|| ||LANG:xx||`
Example: `||MODE:wellness_drip|| ||LANG:es||`
Valid modes: wellness_drip, post_wellness_service, emergency_dispatch, sales_purchase, general_cs, human_escalation
Valid LANG: en, es, tl, pt, or other ISO-style code.
$add$,
  escalation_keywords = array['human', 'agent', 'person', 'representative', 'call me', 'manager', 'real person', 'speak to someone', 'supervisor', 'operator'],
  updated_at = now()
from public.bot_clients c
where cfg.client_id = c.id and c.slug = 'volt-n-vent';

drop view if exists public.bot_client_full;
create view public.bot_client_full as
select
  c.id as client_id,
  c.slug,
  c.display_name,
  c.legal_name,
  c.dba,
  c.is_active,
  c.timezone,
  c.ghl_location_id,
  c.sms_provider,
  c.ghl_default_phone,
  c.sms_help_reply,
  c.sms_opt_out_keywords,
  cfg.system_prompt,
  cfg.tone,
  cfg.business_summary,
  cfg.services,
  cfg.service_area,
  cfg.licenses,
  cfg.phones,
  cfg.emails,
  cfg.website_url,
  cfg.business_hours,
  cfg.escalation_keywords,
  cfg.handoff_tag,
  cfg.max_reply_chars,
  cfg.model,
  cfg.temperature,
  cfg.follow_up_enabled,
  cfg.persona_name,
  cfg.persona_role,
  cfg.pricing_policy,
  cfg.wellness_offer,
  cfg.qualification_script,
  cfg.website_knowledge,
  cfg.tone_phrases,
  cfg.conversation_objective,
  cfg.appointment_scheduling,
  cfg.conversation_playbook,
  cfg.supported_languages,
  cfg.metadata
from public.bot_clients c
join public.bot_client_config cfg on cfg.client_id = c.id;
