-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: META CONVERSION API (CAPI)
-- =========================================================================

ALTER TABLE public.client_meta_integrations 
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT DEFAULT null,
ADD COLUMN IF NOT EXISTS meta_capi_token TEXT DEFAULT null;
