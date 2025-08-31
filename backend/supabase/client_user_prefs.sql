-- User-specific client preferences (e.g., card color)
create table if not exists public.client_user_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  color text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

create index if not exists idx_client_user_prefs_user on public.client_user_preferences(user_id);
create index if not exists idx_client_user_prefs_client on public.client_user_preferences(client_id);

-- Optional RLS (backend uses service role; add for safety if direct access is ever used)
alter table public.client_user_preferences enable row level security;
drop policy if exists cup_self_rw on public.client_user_preferences;
create policy cup_self_rw on public.client_user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

