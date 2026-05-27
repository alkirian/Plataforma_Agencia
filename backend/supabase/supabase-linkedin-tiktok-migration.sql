-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: INTEGRACIONES DE LINKEDIN Y TIKTOK
-- =========================================================================

-- 1) Tabla de integraciones de LinkedIn
CREATE TABLE IF NOT EXISTS public.client_linkedin_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    linkedin_urn TEXT NOT NULL,       -- Ej: 'urn:li:person:12345' o 'urn:li:organization:67890'
    linkedin_name TEXT,              -- Nombre del perfil o empresa conectada
    access_token TEXT NOT NULL,       -- Access Token de OAuth2 de LinkedIn
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Tabla de integraciones de TikTok
CREATE TABLE IF NOT EXISTS public.client_tiktok_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    tiktok_open_id TEXT NOT NULL,     -- Open ID del usuario de TikTok
    tiktok_username TEXT,            -- Username del usuario en TikTok
    access_token TEXT NOT NULL,       -- Access Token de TikTok
    refresh_token TEXT,              -- Refresh Token para renovar el Access Token
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.client_linkedin_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tiktok_integrations ENABLE ROW LEVEL SECURITY;

-- 4) Eliminar políticas si existieran para evitar colisiones
DROP POLICY IF EXISTS "linkedin_integrations_access_policy" ON public.client_linkedin_integrations;
DROP POLICY IF EXISTS "tiktok_integrations_access_policy" ON public.client_tiktok_integrations;

-- 5) Crear políticas de aislamiento multi-tenant por Agencia
CREATE POLICY "linkedin_integrations_access_policy" ON public.client_linkedin_integrations 
FOR ALL TO authenticated 
USING (agency_id = public.get_user_agency_id()) 
WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "tiktok_integrations_access_policy" ON public.client_tiktok_integrations 
FOR ALL TO authenticated 
USING (agency_id = public.get_user_agency_id()) 
WITH CHECK (agency_id = public.get_user_agency_id());

-- 6) Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_client_linkedin_integrations_client ON public.client_linkedin_integrations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_linkedin_integrations_agency ON public.client_linkedin_integrations (agency_id);
CREATE INDEX IF NOT EXISTS idx_client_tiktok_integrations_client ON public.client_tiktok_integrations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_tiktok_integrations_agency ON public.client_tiktok_integrations (agency_id);
