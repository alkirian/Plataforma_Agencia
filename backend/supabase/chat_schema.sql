-- Chat persistence schema (apply in Supabase SQL editor)
-- Nota: CREATE POLICY no soporta IF NOT EXISTS, usar DROP + CREATE
--       Materialized views tampoco soportan IF NOT EXISTS consistentemente

-- Extensión para gen_random_uuid() si no existe
create extension if not exists pgcrypto;

-- 1) chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for pagination and filtering
create index if not exists chat_messages_client_created_idx on public.chat_messages (client_id, created_at desc, id desc);
create index if not exists chat_messages_user_idx on public.chat_messages (user_id);

-- 2) Basic RLS: a user can see their own messages for clients they can access
alter table public.chat_messages enable row level security;

-- You likely already enforce client visibility via clients table. Keep this simple per user_id.
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
for select
using (auth.uid() = user_id);

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
for insert
with check (auth.uid() = user_id);

-- Optional: allow deleting own messages
drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages
for delete
using (auth.uid() = user_id);

-- 3) Optional summaries table (for future optimization)
create table if not exists public.chat_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  up_to timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.chat_summaries enable row level security;
drop policy if exists chat_summaries_rw on public.chat_summaries;
create policy chat_summaries_rw on public.chat_summaries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4) Optional materialized view for stats (no NOW() in index predicates)
drop materialized view if exists public.chat_stats;
create materialized view public.chat_stats as
select client_id, user_id, count(*) as message_count, max(created_at) as last_message_at
from public.chat_messages
group by client_id, user_id;

create index if not exists chat_stats_last_msg_idx on public.chat_stats (client_id, user_id, last_message_at desc);
