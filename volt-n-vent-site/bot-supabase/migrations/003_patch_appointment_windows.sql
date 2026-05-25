-- Patch: appointment windows (run if you already ran 001 before appointment_scheduling existed)
-- Safe to run on bot Supabase project. Updates volt-n-vent only.

alter table public.bot_client_config
  add column if not exists appointment_scheduling jsonb;

drop view if exists public.bot_client_full;

create or replace view public.bot_client_full as
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
  cfg.metadata
from public.bot_clients c
join public.bot_client_config cfg on cfg.client_id = c.id;

-- Next: re-run 002_seed_volt_n_vent.sql (full Alex prompt + appointment windows).
