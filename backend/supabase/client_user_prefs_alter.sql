-- Add pinned and favorite columns to user preferences
alter table if exists public.client_user_preferences
  add column if not exists pinned boolean not null default false,
  add column if not exists favorite boolean not null default false;

