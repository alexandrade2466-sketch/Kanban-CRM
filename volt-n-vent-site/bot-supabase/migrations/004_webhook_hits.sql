-- Log GHL webhook hits (for debugging)
create table if not exists public.webhook_hits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'ghl',
  payload_keys text[],
  contact_id text,
  status text
);

alter table public.webhook_hits enable row level security;

create policy "service role all on webhook_hits"
  on public.webhook_hits for all
  using (true) with check (true);
