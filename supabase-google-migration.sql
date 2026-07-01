-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: INTEGRACIÓN DE GOOGLE ADS
-- =========================================================================

-- 1) Crear tabla de integraciones de Google Ads
CREATE TABLE IF NOT EXISTS public.client_google_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    google_customer_id TEXT, -- Ej: '123-456-7890'
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    google_account_name TEXT,
    auto_optimize_ads BOOLEAN DEFAULT false,
    max_cpa_usd NUMERIC DEFAULT null,
    min_roas NUMERIC DEFAULT null,
    optimize_action TEXT DEFAULT 'notify_only' CHECK (optimize_action IN ('notify_only', 'pause_and_notify')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Habilitar Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.client_google_integrations ENABLE ROW LEVEL SECURITY;

-- 3) Eliminar política si ya existiera para evitar colisiones
DROP POLICY IF EXISTS "google_integrations_access_policy" ON public.client_google_integrations;

-- 4) Crear política de aislamiento multi-tenant por Agencia
CREATE POLICY "google_integrations_access_policy" ON public.client_google_integrations 
FOR ALL TO authenticated 
USING (agency_id = public.get_user_agency_id()) 
WITH CHECK (agency_id = public.get_user_agency_id());

-- 5) Crear índices para optimizar las consultas por cliente y agencia
CREATE INDEX IF NOT EXISTS idx_client_google_integrations_client ON public.client_google_integrations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_google_integrations_agency ON public.client_google_integrations (agency_id);
