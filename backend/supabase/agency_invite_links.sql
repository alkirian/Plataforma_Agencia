-- =========================================================================
-- SQL PARA CREAR LA TABLA DE ENLACES DE INVITACIÓN DE AGENCIA
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.agency_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS idx_agency_invite_links_code ON public.agency_invite_links(code);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.agency_invite_links ENABLE ROW LEVEL SECURITY;

-- Política de acceso total para usuarios autenticados
CREATE POLICY "Permitir todo a autenticados" 
ON public.agency_invite_links 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
