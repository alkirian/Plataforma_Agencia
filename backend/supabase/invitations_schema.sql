-- Invitations table for agency member invites

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  inviter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_agency_idx ON public.invitations(agency_id);
CREATE INDEX IF NOT EXISTS invitations_status_idx ON public.invitations(status);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations(email);

-- Basic RLS (backend uses service role, but keep safety)
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins of an agency can see their invites (assuming profiles has role and agency_id)
DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = invitations.agency_id AND p.role = 'admin'
    )
  );

-- Admins can insert invites for their agency
DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = invitations.agency_id AND p.role = 'admin'
    )
  );

-- Admins can update invites for their agency
DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.agency_id = invitations.agency_id AND p.role = 'admin'
    )
  );

