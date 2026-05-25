-- SMS Bot Platform (multi-tenant) — for n8n inbound handler + GHL
-- JNB Services / Volt N' Vent Supabase (emrqlssbrntnvvdwwojs).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Clients (one row per business, e.g. volt-n-vent)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  legal_name text,
  dba text,
  is_active boolean not null default true,
  timezone text not null default 'America/Los_Angeles',
  -- GHL
  ghl_location_id text,
  ghl_private_integration_set boolean not null default false,
  -- Telephony (replies should go through GHL API when using GHL A2P)
  sms_provider text not null default 'ghl' check (sms_provider in ('ghl', 'twilio')),
  ghl_default_phone text,
  twilio_messaging_service_sid text,
  -- Compliance / marketing
  sms_help_reply text,
  sms_opt_out_keywords text[] not null default array['stop', 'unsubscribe', 'cancel', 'end', 'quit'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Per-client AI + business config (1:1 with bot_clients)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_client_config (
  client_id uuid primary key references public.bot_clients (id) on delete cascade,
  system_prompt text not null,
  tone text default 'professional, friendly, concise',
  business_summary text,
  services jsonb not null default '[]'::jsonb,
  service_area text[] not null default array['Las Vegas', 'Henderson', 'Summerlin', 'North Las Vegas'],
  licenses jsonb not null default '[]'::jsonb,
  phones jsonb not null default '[]'::jsonb,
  emails jsonb not null default '[]'::jsonb,
  website_url text,
  business_hours jsonb,
  escalation_keywords text[] not null default array['human', 'agent', 'person', 'representative', 'call me', 'manager'],
  handoff_tag text not null default 'human-handoff',
  max_reply_chars int not null default 480,
  model text not null default 'gpt-4.1-mini',
  temperature numeric(3,2) not null default 0.4,
  follow_up_enabled boolean not null default false,
  follow_up_delay_hours int default 24,
  -- Persona & playbook (n8n reads via bot_client_full)
  persona_name text,
  persona_role text,
  pricing_policy text,
  wellness_offer jsonb,
  qualification_script jsonb,
  website_knowledge jsonb,
  tone_phrases jsonb,
  conversation_objective text,
  appointment_scheduling jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contacts (Supabase mirror; GHL is source of truth for CRM UI)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bot_clients (id) on delete cascade,
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  ghl_contact_id text,
  first_name text,
  last_name text,
  email text,
  tags text[] not null default '{}',
  opted_out_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, phone_normalized)
);

create index if not exists bot_contacts_client_ghl_idx
  on public.bot_contacts (client_id, ghl_contact_id);

-- ---------------------------------------------------------------------------
-- Conversation sessions
-- ---------------------------------------------------------------------------
create table if not exists public.bot_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bot_clients (id) on delete cascade,
  contact_id uuid not null references public.bot_contacts (id) on delete cascade,
  channel text not null default 'sms' check (channel in ('sms', 'webchat', 'other')),
  ghl_conversation_id text,
  status text not null default 'open' check (status in ('open', 'handoff', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bot_interactions_contact_idx
  on public.bot_interactions (contact_id, last_message_at desc);

-- ---------------------------------------------------------------------------
-- Message log (inbound + outbound)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bot_clients (id) on delete cascade,
  interaction_id uuid not null references public.bot_interactions (id) on delete cascade,
  contact_id uuid not null references public.bot_contacts (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider text not null default 'ghl',
  provider_message_id text,
  model text,
  tokens_in int,
  tokens_out int,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bot_messages_interaction_idx
  on public.bot_messages (interaction_id, created_at);

-- ---------------------------------------------------------------------------
-- Daily metrics (Refresh Client Metrics node)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_client_metrics (
  client_id uuid not null references public.bot_clients (id) on delete cascade,
  metric_date date not null default (current_date),
  inbound_count int not null default 0,
  outbound_count int not null default 0,
  handoff_count int not null default 0,
  opt_out_count int not null default 0,
  primary key (client_id, metric_date)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bot_clients_updated_at on public.bot_clients;
create trigger bot_clients_updated_at
  before update on public.bot_clients
  for each row execute function public.set_updated_at();

drop trigger if exists bot_contacts_updated_at on public.bot_contacts;
create trigger bot_contacts_updated_at
  before update on public.bot_contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: n8n uses service_role — deny anon/authenticated by default
-- ---------------------------------------------------------------------------
alter table public.bot_clients enable row level security;
alter table public.bot_client_config enable row level security;
alter table public.bot_contacts enable row level security;
alter table public.bot_interactions enable row level security;
alter table public.bot_messages enable row level security;
alter table public.bot_client_metrics enable row level security;

-- Optional: allow service role only (Supabase bypasses RLS with service_role key)

-- ---------------------------------------------------------------------------
-- Helper view for n8n "Load Client Config"
-- ---------------------------------------------------------------------------
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
