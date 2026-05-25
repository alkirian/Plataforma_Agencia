-- Content assets linked to schedule items
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  created_by uuid null references public.profiles(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text null,
  size_bytes bigint null,
  asset_role text not null default 'final' check (asset_role in ('final', 'draft', 'thumbnail', 'carousel_slide', 'reference')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_assets_schedule_item on public.content_assets(schedule_item_id);
create index if not exists idx_content_assets_client on public.content_assets(client_id);

alter table public.content_assets enable row level security;

drop policy if exists "content_assets_select_by_agency" on public.content_assets;
create policy "content_assets_select_by_agency"
on public.content_assets
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = content_assets.agency_id
  )
);

drop policy if exists "content_assets_insert_by_agency" on public.content_assets;
create policy "content_assets_insert_by_agency"
on public.content_assets
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = content_assets.agency_id
  )
);

drop policy if exists "content_assets_update_by_agency" on public.content_assets;
create policy "content_assets_update_by_agency"
on public.content_assets
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = content_assets.agency_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = content_assets.agency_id
  )
);

drop policy if exists "content_assets_delete_by_agency" on public.content_assets;
create policy "content_assets_delete_by_agency"
on public.content_assets
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = content_assets.agency_id
  )
);

-- Storage bucket for publishable assets
insert into storage.buckets (id, name, public)
values ('content-assets', 'content-assets', false)
on conflict (id) do nothing;

-- Storage policies for authenticated users from same agency/client namespace
drop policy if exists "content_assets_bucket_select" on storage.objects;
create policy "content_assets_bucket_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'content-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "content_assets_bucket_insert" on storage.objects;
create policy "content_assets_bucket_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "content_assets_bucket_update" on storage.objects;
create policy "content_assets_bucket_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
)
with check (
  bucket_id = 'content-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "content_assets_bucket_delete" on storage.objects;
create policy "content_assets_bucket_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'content-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);
