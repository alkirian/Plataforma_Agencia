export const sqlSetupCode = `-- =========================================================================
-- SQL PARA CREAR LAS TABLAS DE INVITACIÓN EN SUPABASE
-- =========================================================================

-- 1) Tabla de Invitaciones Directas por Email
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'diseñador', 'creativo', 'CM', 'cuentas')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (agency_id, email)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invitations;
CREATE POLICY "Permitir todo a autenticados" ON public.agency_invitations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2) Tabla de Enlaces de Invitación Compartidos (Join Links)
CREATE TABLE IF NOT EXISTS public.agency_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'diseñador', 'creativo', 'CM', 'cuentas')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_invite_links_code ON public.agency_invite_links(code);
ALTER TABLE public.agency_invite_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invite_links;
CREATE POLICY "Permitir todo a autenticados" ON public.agency_invite_links FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

export const sqlAvatarSetup = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
