-- ============================================================================
-- SCRIPT DE MIGRACIÓN: SEGURIDAD DE CLIENTES, PAPELERA Y SOPORTE DE LOGOS
-- ============================================================================

-- 1) Agregar columnas si no existen
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- 2) Eliminar la política de acceso general antigua
DROP POLICY IF EXISTS "clients_access_policy" ON public.clients;

-- 3) Crear las nuevas políticas granulares (excluyendo registros eliminados lógicamente)
CREATE POLICY "clients_select_policy" ON public.clients 
    FOR SELECT TO authenticated 
    USING (agency_id = public.get_user_agency_id() AND deleted_at IS NULL);

CREATE POLICY "clients_insert_policy" ON public.clients 
    FOR INSERT TO authenticated 
    WITH CHECK (agency_id = public.get_user_agency_id() AND deleted_at IS NULL);

CREATE POLICY "clients_update_policy" ON public.clients 
    FOR UPDATE TO authenticated 
    USING (agency_id = public.get_user_agency_id() AND deleted_at IS NULL)
    WITH CHECK (agency_id = public.get_user_agency_id() AND deleted_at IS NULL);
