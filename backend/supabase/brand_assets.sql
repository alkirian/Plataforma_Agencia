-- Brand identity reference assets (screenshots/docs/logos/etc.)
create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  created_by uuid null references public.profiles(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text null,
  size_bytes bigint null,
  asset_type text not null default 'reference'
    check (asset_type in ('screenshot', 'logo', 'product', 'website', 'reference', 'document')),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_brand_assets_client on public.brand_assets(client_id);
create index if not exists idx_brand_assets_agency on public.brand_assets(agency_id);

alter table public.brand_assets enable row level security;

drop policy if exists "brand_assets_select_by_agency" on public.brand_assets;
create policy "brand_assets_select_by_agency"
on public.brand_assets
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = brand_assets.agency_id
  )
);

drop policy if exists "brand_assets_insert_by_agency" on public.brand_assets;
create policy "brand_assets_insert_by_agency"
on public.brand_assets
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = brand_assets.agency_id
  )
);

drop policy if exists "brand_assets_update_by_agency" on public.brand_assets;
create policy "brand_assets_update_by_agency"
on public.brand_assets
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = brand_assets.agency_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = brand_assets.agency_id
  )
);

drop policy if exists "brand_assets_delete_by_agency" on public.brand_assets;
create policy "brand_assets_delete_by_agency"
on public.brand_assets
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.agency_id = brand_assets.agency_id
  )
);

-- Storage bucket for brand reference assets
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

drop policy if exists "brand_assets_bucket_select" on storage.objects;
create policy "brand_assets_bucket_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'brand-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "brand_assets_bucket_insert" on storage.objects;
create policy "brand_assets_bucket_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brand-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "brand_assets_bucket_update" on storage.objects;
create policy "brand_assets_bucket_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brand-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
)
with check (
  bucket_id = 'brand-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);

drop policy if exists "brand_assets_bucket_delete" on storage.objects;
create policy "brand_assets_bucket_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brand-assets'
  and exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = c.id::text
  )
);
