-- Conversation engine: dedupe, session context, RPC helpers

create table if not exists public.bot_processed_inbound (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.bot_clients (id) on delete cascade,
  ghl_contact_id text not null,
  dedupe_key text not null,
  message_body text,
  created_at timestamptz not null default now(),
  unique (client_id, dedupe_key)
);

create index if not exists bot_processed_inbound_contact_idx
  on public.bot_processed_inbound (ghl_contact_id, created_at desc);

create unique index if not exists bot_contacts_client_ghl_uidx
  on public.bot_contacts (client_id, ghl_contact_id)
  where ghl_contact_id is not null;

alter table public.bot_interactions
  add column if not exists conversation_mode text default 'general',
  add column if not exists language text default 'en',
  add column if not exists needs_handoff boolean not null default false;

alter table public.bot_contacts
  add column if not exists context jsonb not null default '{}'::jsonb;

alter table public.bot_client_config
  add column if not exists conversation_playbook jsonb not null default '{}'::jsonb,
  add column if not exists supported_languages text[] not null default array['en', 'es'];

alter table public.bot_processed_inbound enable row level security;

create or replace function public.alex_sms_start(
  p_client_slug text,
  p_ghl_contact_id text,
  p_ghl_conversation_id text,
  p_dedupe_key text,
  p_message_body text,
  p_phone text default null,
  p_first_name text default null,
  p_last_name text default null
) returns jsonb
language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_contact_id uuid;
  v_interaction_id uuid;
  v_history jsonb := '[]'::jsonb;
begin
  select id into v_client_id from public.bot_clients where slug = p_client_slug and is_active;
  if v_client_id is null then
    raise exception 'Client not found or inactive: %', p_client_slug;
  end if;

  if exists (
    select 1 from public.bot_processed_inbound
    where client_id = v_client_id and dedupe_key = p_dedupe_key
  ) then
    return jsonb_build_object('skip', true, 'reason', 'duplicate');
  end if;

  update public.bot_contacts set
    first_name = coalesce(nullif(p_first_name, ''), first_name),
    last_name = coalesce(nullif(p_last_name, ''), last_name),
    phone = case when coalesce(p_phone, '') <> '' then p_phone else phone end,
    last_inbound_at = now(),
    updated_at = now()
  where client_id = v_client_id and ghl_contact_id = p_ghl_contact_id
  returning id into v_contact_id;

  if v_contact_id is null then
    insert into public.bot_contacts (client_id, phone, ghl_contact_id, first_name, last_name, last_inbound_at)
    values (
      v_client_id,
      coalesce(nullif(p_phone, ''), '+10000000000'),
      p_ghl_contact_id,
      nullif(p_first_name, ''),
      nullif(p_last_name, ''),
      now()
    )
    returning id into v_contact_id;
  end if;

  select id into v_interaction_id from public.bot_interactions
  where client_id = v_client_id and contact_id = v_contact_id and status = 'open'
  order by last_message_at desc limit 1;

  if v_interaction_id is null then
    insert into public.bot_interactions (client_id, contact_id, channel, ghl_conversation_id, status, last_message_at)
    values (v_client_id, v_contact_id, 'sms', p_ghl_conversation_id, 'open', now())
    returning id into v_interaction_id;
  else
    update public.bot_interactions set
      ghl_conversation_id = coalesce(p_ghl_conversation_id, ghl_conversation_id),
      last_message_at = now()
    where id = v_interaction_id;
  end if;

  insert into public.bot_messages (client_id, interaction_id, contact_id, direction, body, provider)
  values (v_client_id, v_interaction_id, v_contact_id, 'inbound', p_message_body, 'ghl');

  select coalesce(jsonb_agg(jsonb_build_object(
    'role', case when direction = 'inbound' then 'user' else 'assistant' end,
    'content', body
  ) order by created_at), '[]'::jsonb)
  into v_history
  from (
    select direction, body, created_at
    from public.bot_messages
    where interaction_id = v_interaction_id
    order by created_at asc
    limit 16
  ) sub;

  return jsonb_build_object(
    'skip', false,
    'client_id', v_client_id,
    'contact_id', v_contact_id,
    'interaction_id', v_interaction_id,
    'history', v_history
  );
end;
$$;

create or replace function public.alex_sms_complete(
  p_client_slug text,
  p_ghl_contact_id text,
  p_dedupe_key text,
  p_inbound_body text,
  p_outbound_body text,
  p_conversation_mode text default 'general',
  p_language text default 'en',
  p_needs_handoff boolean default false,
  p_interaction_id uuid default null
) returns jsonb
language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_contact_id uuid;
  v_interaction_id uuid;
begin
  select id into v_client_id from public.bot_clients where slug = p_client_slug;
  select id into v_contact_id from public.bot_contacts
  where client_id = v_client_id and ghl_contact_id = p_ghl_contact_id;

  v_interaction_id := p_interaction_id;
  if v_interaction_id is null then
    select id into v_interaction_id from public.bot_interactions
    where client_id = v_client_id and contact_id = v_contact_id and status = 'open'
    order by last_message_at desc limit 1;
  end if;

  insert into public.bot_processed_inbound (client_id, ghl_contact_id, dedupe_key, message_body)
  values (v_client_id, p_ghl_contact_id, p_dedupe_key, p_inbound_body)
  on conflict (client_id, dedupe_key) do nothing;

  if v_interaction_id is not null then
    insert into public.bot_messages (client_id, interaction_id, contact_id, direction, body, provider)
    values (v_client_id, v_interaction_id, v_contact_id, 'outbound', p_outbound_body, 'ghl');

    update public.bot_interactions set
      conversation_mode = p_conversation_mode,
      language = p_language,
      needs_handoff = p_needs_handoff,
      status = case when p_needs_handoff then 'handoff' else status end,
      last_message_at = now()
    where id = v_interaction_id;
  end if;

  update public.bot_contacts set last_outbound_at = now(), updated_at = now()
  where id = v_contact_id;

  return jsonb_build_object('ok', true);
end;
$$;
