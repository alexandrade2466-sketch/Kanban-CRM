-- Alex v5: casual inbound replies, claim dedupe at start, fix stuck poller retries

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
  v_prior_assistant int := 0;
  v_claim_id uuid;
begin
  select id into v_client_id from public.bot_clients where slug = p_client_slug and is_active;
  if v_client_id is null then
    raise exception 'Client not found or inactive: %', p_client_slug;
  end if;

  insert into public.bot_processed_inbound (client_id, ghl_contact_id, dedupe_key, message_body)
  values (v_client_id, p_ghl_contact_id, p_dedupe_key, p_message_body)
  on conflict (client_id, dedupe_key) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
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

  select count(*)::int into v_prior_assistant
  from public.bot_messages
  where interaction_id = v_interaction_id and direction = 'outbound';

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
    'prior_assistant_count', v_prior_assistant,
    'history', v_history
  );
end;
$$;

update public.bot_client_config cfg
set
  system_prompt = system_prompt || $add$

## Inbound vs outbound (critical)
- **Outbound first touch** (we texted them first on a campaign): brief intro of who we are + why we're reaching out — then one simple question.
- **Inbound** (they texted us, or this is already an ongoing thread): **do NOT** introduce the company, list services, or say "HVAC and electrical in Las Vegas." Just talk like a normal person.
  - Good first inbound reply: "Sure, I can help ya — what's going on?"
  - Good follow-up: "Got it — when did it stop cooling?" / "Yeah we can do that — what day works?"
- Only explain who Volt N' Vent is when they ask (who is this, what company, etc.) or on the very first outbound message we sent.

## Length
- Most replies: 1 short sentence, maybe 2. Under ~120 characters when possible.
$add$,
  updated_at = now()
from public.bot_clients c
where cfg.client_id = c.id and c.slug = 'volt-n-vent';
