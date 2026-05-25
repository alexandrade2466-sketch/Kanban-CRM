-- Set real GHL location ID for Volt N' Vent
update public.bot_clients
set ghl_location_id = '81uoqXcdjO6CKRFIIuw6', updated_at = now()
where slug = 'volt-n-vent';

alter table public.webhook_hits add column if not exists message_body text;
