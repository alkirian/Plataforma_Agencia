-- ============================================================================
-- SCRIPT DE MIGRACIÓN: SEGURIDAD DE ACCESO Y AISLAMIENTO MULTI-TENANT (RLS)
-- VERSION RESILIENTE / BULLETPROOF (Evita errores de compilación de tablas)
-- ============================================================================
-- Instrucciones:
--   1. Ve al panel de Supabase de tu proyecto.
--   2. Entra al editor SQL ("SQL Editor") en la barra lateral izquierda.
--   3. Crea una nueva consulta e introduce todo este código SQL.
--   4. Haz clic en "Run" (Ejecutar).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. FUNCIÓN AUXILIAR CON PRIVILEGIOS DE SUPERUSUARIO (SECURITY DEFINER)
-- ────────────────────────────────────────────────────────────────────────────
-- Evita la recursión infinita en PostgreSQL al consultar la tabla 'profiles'.
-- Retorna el ID de la agencia del usuario actualmente autenticado (auth.uid()).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT agency_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. BLOQUE DE EJECUCIÓN CONDICIONAL DINÁMICO (PL/pgSQL)
-- ────────────────────────────────────────────────────────────────────────────
-- Se ejecutan dinámicamente tanto 'ALTER TABLE' como 'DROP/CREATE POLICY'
-- mediante EXECUTE. Esto evita que el parser de PostgreSQL compile referencias
-- estáticas a tablas inexistentes, previniendo fallos en bases de datos vacías.
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN

    -- A. Tabla: agencies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
        EXECUTE 'ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agencies';
        EXECUTE 'DROP POLICY IF EXISTS "agencies_select_policy" ON public.agencies';
        EXECUTE 'DROP POLICY IF EXISTS "agencies_update_policy" ON public.agencies';
        
        EXECUTE 'CREATE POLICY "agencies_select_policy" ON public.agencies FOR SELECT TO authenticated USING (id = public.get_user_agency_id())';
        EXECUTE 'CREATE POLICY "agencies_update_policy" ON public.agencies FOR UPDATE TO authenticated USING (id = public.get_user_agency_id()) WITH CHECK (id = public.get_user_agency_id())';
    END IF;

    -- B. Tabla: profiles
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles';
        
        EXECUTE 'CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id())';
        EXECUTE 'CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
    END IF;

    -- C. Tabla: clients
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.clients';
        EXECUTE 'DROP POLICY IF EXISTS "clients_access_policy" ON public.clients';
        
        EXECUTE 'CREATE POLICY "clients_access_policy" ON public.clients FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- D. Tabla: schedule_items
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedule_items') THEN
        EXECUTE 'ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.schedule_items';
        EXECUTE 'DROP POLICY IF EXISTS "schedule_items_access_policy" ON public.schedule_items';
        
        EXECUTE 'CREATE POLICY "schedule_items_access_policy" ON public.schedule_items FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- E. Tabla: documents
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        EXECUTE 'ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.documents';
        EXECUTE 'DROP POLICY IF EXISTS "documents_access_policy" ON public.documents';
        
        EXECUTE 'CREATE POLICY "documents_access_policy" ON public.documents FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- F. Tabla: document_chunks
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chunks') THEN
        EXECUTE 'ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.document_chunks';
        EXECUTE 'DROP POLICY IF EXISTS "document_chunks_access_policy" ON public.document_chunks';
        
        EXECUTE 'CREATE POLICY "document_chunks_access_policy" ON public.document_chunks FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- G. Tabla: activity_logs
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
        EXECUTE 'ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.activity_logs';
        EXECUTE 'DROP POLICY IF EXISTS "activity_logs_access_policy" ON public.activity_logs';
        
        EXECUTE 'CREATE POLICY "activity_logs_access_policy" ON public.activity_logs FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- H. Tabla: agency_invitations
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invitations') THEN
        EXECUTE 'ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invitations';
        EXECUTE 'DROP POLICY IF EXISTS "agency_invitations_access_policy" ON public.agency_invitations';
        
        EXECUTE 'CREATE POLICY "agency_invitations_access_policy" ON public.agency_invitations FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- I. Tabla: agency_invite_links
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invite_links') THEN
        EXECUTE 'ALTER TABLE public.agency_invite_links ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invite_links';
        EXECUTE 'DROP POLICY IF EXISTS "agency_invite_links_access_policy" ON public.agency_invite_links';
        
        EXECUTE 'CREATE POLICY "agency_invite_links_access_policy" ON public.agency_invite_links FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- J. Tabla: content_assets
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_assets') THEN
        EXECUTE 'ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_select_by_agency" ON public.content_assets';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_insert_by_agency" ON public.content_assets';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_update_by_agency" ON public.content_assets';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_delete_by_agency" ON public.content_assets';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_access_policy" ON public.content_assets';
        
        EXECUTE 'CREATE POLICY "content_assets_access_policy" ON public.content_assets FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- K. Tabla: brand_assets
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_assets') THEN
        EXECUTE 'ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_select_by_agency" ON public.brand_assets';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_insert_by_agency" ON public.brand_assets';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_update_by_agency" ON public.brand_assets';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_delete_by_agency" ON public.brand_assets';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_access_policy" ON public.brand_assets';
        
        EXECUTE 'CREATE POLICY "brand_assets_access_policy" ON public.brand_assets FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- L. Tabla: client_approval_links
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_approval_links') THEN
        EXECUTE 'ALTER TABLE public.client_approval_links ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "agency_members_can_read_approval_links" ON public.client_approval_links';
        EXECUTE 'DROP POLICY IF EXISTS "agency_members_can_write_approval_links" ON public.client_approval_links';
        EXECUTE 'DROP POLICY IF EXISTS "client_approval_links_access_policy" ON public.client_approval_links';
        
        EXECUTE 'CREATE POLICY "client_approval_links_access_policy" ON public.client_approval_links FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id())';
    END IF;

    -- M. Tabla: trend_reports
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trend_reports') THEN
        EXECUTE 'ALTER TABLE public.trend_reports ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "agency_members_can_read_trend_reports" ON public.trend_reports';
        EXECUTE 'DROP POLICY IF EXISTS "service_role_can_insert_trend_reports" ON public.trend_reports';
        EXECUTE 'DROP POLICY IF EXISTS "agency_admins_can_delete_trend_reports" ON public.trend_reports';
        EXECUTE 'DROP POLICY IF EXISTS "trend_reports_select_policy" ON public.trend_reports';
        EXECUTE 'DROP POLICY IF EXISTS "trend_reports_delete_policy" ON public.trend_reports';
        
        EXECUTE 'CREATE POLICY "trend_reports_select_policy" ON public.trend_reports FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id())';
        EXECUTE 'CREATE POLICY "service_role_can_insert_trend_reports" ON public.trend_reports FOR INSERT WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "trend_reports_delete_policy" ON public.trend_reports FOR DELETE TO authenticated USING (agency_id = public.get_user_agency_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''owner'')))';
    END IF;

    -- N. Tabla: chat_messages (Acceso colaborativo seguro por agencia)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        EXECUTE 'ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.chat_messages';
        EXECUTE 'DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages';
        EXECUTE 'DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages';
        EXECUTE 'DROP POLICY IF EXISTS chat_messages_delete ON public.chat_messages';
        EXECUTE 'DROP POLICY IF EXISTS chat_messages_access_policy ON public.chat_messages';
        
        EXECUTE 'CREATE POLICY "chat_messages_access_policy" ON public.chat_messages FOR ALL TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id())) WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id()))';
    END IF;

    -- O. Tabla: chat_summaries (Acceso colaborativo seguro por agencia)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_summaries') THEN
        EXECUTE 'ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.chat_summaries';
        EXECUTE 'DROP POLICY IF EXISTS chat_summaries_rw ON public.chat_summaries';
        EXECUTE 'DROP POLICY IF EXISTS chat_summaries_access_policy ON public.chat_summaries';
        
        EXECUTE 'CREATE POLICY "chat_summaries_access_policy" ON public.chat_summaries FOR ALL TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id())) WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id()))';
    END IF;

    -- P. STORAGE OBJECTS POLICIES (Seguridad e integración de Buckets)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_bucket_select" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_bucket_insert" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_bucket_update" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "content_assets_bucket_delete" ON storage.objects';

        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_bucket_select" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_bucket_insert" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_bucket_update" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "brand_assets_bucket_delete" ON storage.objects';

        -- Bucket: content-assets
        IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'content-assets') THEN
            EXECUTE 'CREATE POLICY "content_assets_bucket_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''content-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "content_assets_bucket_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''content-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "content_assets_bucket_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''content-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text)) WITH CHECK (bucket_id = ''content-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "content_assets_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''content-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
        END IF;

        -- Bucket: brand-assets
        IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-assets') THEN
            EXECUTE 'CREATE POLICY "brand_assets_bucket_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''brand-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "brand_assets_bucket_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''brand-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "brand_assets_bucket_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''brand-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text)) WITH CHECK (bucket_id = ''brand-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
            EXECUTE 'CREATE POLICY "brand_assets_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''brand-assets'' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.agency_id = public.get_user_agency_id() AND split_part(storage.objects.name, ''/'', 1) = c.id::text))';
        END IF;
    END IF;

END $$;
