-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: OPTIMIZADOR DE META ADS (espor.ai style)
-- =========================================================================

-- 1) Agregar columnas de configuración de optimización a client_meta_integrations
ALTER TABLE public.client_meta_integrations 
ADD COLUMN IF NOT EXISTS auto_optimize_ads BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_cpa_usd NUMERIC DEFAULT null,
ADD COLUMN IF NOT EXISTS min_roas NUMERIC DEFAULT null,
ADD COLUMN IF NOT EXISTS optimize_action TEXT DEFAULT 'notify_only' CHECK (optimize_action IN ('notify_only', 'pause_and_notify'));

-- 2) Crear tabla de auditoría para guardar las acciones de optimización
CREATE TABLE IF NOT EXISTS public.client_ad_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    action_taken TEXT NOT NULL, -- 'paused' | 'reduced_budget_20%' | 'notified'
    reason TEXT,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Habilitar Seguridad a Nivel de Fila (RLS) para la tabla de auditoría
ALTER TABLE public.client_ad_optimizations ENABLE ROW LEVEL SECURITY;

-- 4) Eliminar política si ya existiera para evitar colisiones
DROP POLICY IF EXISTS "ad_optimizations_access_policy" ON public.client_ad_optimizations;

-- 5) Crear política de aislamiento multi-tenant por Agencia
CREATE POLICY "ad_optimizations_access_policy" ON public.client_ad_optimizations 
FOR ALL TO authenticated 
USING (agency_id = public.get_user_agency_id()) 
WITH CHECK (agency_id = public.get_user_agency_id());

-- 6) Índices para optimizar consultas por cliente y agencia
CREATE INDEX IF NOT EXISTS idx_client_ad_optimizations_client ON public.client_ad_optimizations (client_id);
CREATE INDEX IF NOT EXISTS idx_client_ad_optimizations_agency ON public.client_ad_optimizations (agency_id);
