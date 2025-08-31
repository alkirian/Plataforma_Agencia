-- Extensions to clients schema: unique name per agency, website/social links, contacts table

-- 1) Add columns to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 2) Unique name per agency (case-insensitive)
DROP INDEX IF EXISTS clients_agency_name_lower_unique;
CREATE UNIQUE INDEX IF NOT EXISTS clients_agency_name_lower_unique
  ON public.clients (agency_id, lower(name));

-- 3) Contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_contacts_client_idx ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS client_contacts_agency_idx ON public.client_contacts(agency_id);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: Only users of same agency can operate
DROP POLICY IF EXISTS client_contacts_select ON public.client_contacts;
CREATE POLICY client_contacts_select ON public.client_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = client_contacts.agency_id
    )
  );

DROP POLICY IF EXISTS client_contacts_insert ON public.client_contacts;
CREATE POLICY client_contacts_insert ON public.client_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = client_contacts.agency_id
    )
  );

DROP POLICY IF EXISTS client_contacts_update ON public.client_contacts;
CREATE POLICY client_contacts_update ON public.client_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = client_contacts.agency_id
    )
  );

DROP POLICY IF EXISTS client_contacts_delete ON public.client_contacts;
CREATE POLICY client_contacts_delete ON public.client_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = client_contacts.agency_id
    )
  );

