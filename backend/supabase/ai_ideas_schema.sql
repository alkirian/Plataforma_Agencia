-- AI Ideas schema: tables and basic policies
-- NOTE: Review your existing Supabase schema before applying. Adjust RLS to your tenant model.

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Table: ai_ideas
create table if not exists public.ai_ideas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  agency_id uuid null,
  session_id uuid not null,
  seq smallint not null default 0,
  tone text null,
  prompt text null,
  title text not null,
  copy text null,
  hashtags text[] null,
  cta text null,
  media_type text null,
  media_description text null,
  platforms text[] null,
  suggested_date date null,
  status text not null default 'generated',
  like_count integer not null default 0,
  dislike_count integer not null default 0,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists ai_ideas_client_idx on public.ai_ideas(client_id);
create index if not exists ai_ideas_session_idx on public.ai_ideas(session_id);

comment on table public.ai_ideas is 'AI generated content ideas per client/session.';

-- Table: ai_idea_feedback
create table if not exists public.ai_idea_feedback (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ai_ideas(id) on delete cascade,
  user_id uuid not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create index if not exists ai_idea_feedback_idea_idx on public.ai_idea_feedback(idea_id);

-- Optional: basic RLS (adjust to your auth model)
alter table public.ai_ideas enable row level security;
alter table public.ai_idea_feedback enable row level security;

-- Example policies (placeholder). Replace to match your tenant rules.
-- Allows authenticated users to see/insert for clients they can access.
-- You likely have a way to check membership via clients.agency_id and agency_members table.

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ai_ideas' and policyname='ai_ideas_select'
  ) then
    create policy ai_ideas_select on public.ai_ideas
      for select
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ai_ideas' and policyname='ai_ideas_insert'
  ) then
    create policy ai_ideas_insert on public.ai_ideas
      for insert
      with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ai_idea_feedback' and policyname='ai_feedback_select'
  ) then
    create policy ai_feedback_select on public.ai_idea_feedback
      for select
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ai_idea_feedback' and policyname='ai_feedback_upsert'
  ) then
    create policy ai_feedback_upsert on public.ai_idea_feedback
      for all
      using (true)
      with check (true);
  end if;
end $$;

-- IMPORTANT: Replace the above permissive policies with your tenant-aware checks.

