-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: INTEGRACIÓN DE META ADS
-- =========================================================================
-- Instrucciones:
--   1. Ve al panel de Supabase de tu proyecto (https://supabase.com).
--   2. En la barra lateral izquierda, entra a "SQL Editor".
--   3. Haz clic en "+ New query" para crear una nueva consulta.
--   4. Pega todo este código SQL y haz clic en el botón "Run" (Ejecutar).
-- =========================================================================

-- 1) Crear tabla de integraciones de Meta Ads
CREATE TABLE IF NOT EXISTS public.client_meta_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    meta_ad_account_id TEXT NOT NULL, -- Ej: 'act_1234567890'
    meta_page_id TEXT,               -- Ej: '10928374928' (Opcional, para publicar directamente)
    access_token TEXT NOT NULL,       -- Access Token de Larga Duración de la Graph API
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Habilitar Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.client_meta_integrations ENABLE ROW LEVEL SECURITY;

-- 3) Eliminar política si ya existiera para evitar colisiones
DROP POLICY IF EXISTS "meta_integrations_access_policy" ON public.client_meta_integrations;

-- 4) Crear política de aislamiento multi-tenant por Agencia
-- Usa la función de seguridad existente get_user_agency_id() que ya tienes en Supabase
CREATE POLICY "meta_integrations_access_policy" ON public.client_meta_integrations 
FOR ALL TO authenticated 
USING (agency_id = public.get_user_agency_id()) 
WITH CHECK (agency_id = public.get_user_agency_id());

-- 5) Crear índices para optimizar las consultas por cliente y agencia
CREATE INDEX IF NOT EXISTS idx_client_meta_integrations_client ON public.client_meta_integrations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_meta_integrations_agency ON public.client_meta_integrations (agency_id);

-- =========================================================================
-- MIGRACIÓN COMPLETADA. LA BASE DE DATOS YA PUEDE ALMACENAR CREDENCIALES DE META.
-- =========================================================================
