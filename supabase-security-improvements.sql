-- ============================================================================
-- SCRIPT DE MIGRACIÓN: MEJORAS DE SEGURIDAD Y AISLAMIENTO MULTI-TENANT (CADENCE)
-- ============================================================================
-- Instrucciones:
--   1. Ve al panel de tu proyecto en Supabase.
--   2. Entra al editor SQL ("SQL Editor") en la barra lateral izquierda.
--   3. Crea una nueva consulta e introduce todo este código SQL.
--   4. Haz clic en "Run" (Ejecutar).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. REDEFINIR RPC MATCH_DOCUMENT_CHUNKS CON CONTROL DE ACCESO MULTI-TENANT
-- ────────────────────────────────────────────────────────────────────────────
-- Parchea la fuga crítica (V-01) validando la pertenencia del cliente a la 
-- organización del usuario autenticado (auth.uid()) antes de procesar el RAG.

CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(1536),
    match_client_id UUID,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT
) AS $$
DECLARE
    caller_agency_id UUID;
BEGIN
    -- 1. Obtener la agencia del usuario autenticado que realiza la llamada (auth.uid())
    SELECT agency_id INTO caller_agency_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid();

    -- 2. Si el usuario no está autenticado o no tiene agencia, lanzar una excepción segura
    IF caller_agency_id IS NULL THEN
        RAISE EXCEPTION 'Acceso Denegado: Usuario no autenticado o sin organización vinculada.';
    END IF;

    -- 3. Validar de manera estricta que el cliente solicitado pertenece a la agencia del llamador
    IF NOT EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = match_client_id AND clients.agency_id = caller_agency_id
    ) THEN
        RAISE EXCEPTION 'Acceso Denegado: El cliente especificado no pertenece a tu organización.';
    END IF;

    -- 4. Ejecutar la búsqueda semántica vectorizada
    RETURN QUERY
    SELECT
        dc.id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE dc.client_id = match_client_id
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. FORTALECER POLÍTICAS RLS (ROW LEVEL SECURITY) TRANSITIVAS DE TENENCIA
-- ────────────────────────────────────────────────────────────────────────────
-- Parchea el aislamiento "superficial" (V-03) asegurando que no se puedan inyectar
-- registros cruzados (agency_id propio con client_id ajeno).

-- A) Tabla: documents
DROP POLICY IF EXISTS "documents_access_policy" ON public.documents;
CREATE POLICY "documents_access_policy" ON public.documents 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- B) Tabla: document_chunks
DROP POLICY IF EXISTS "document_chunks_access_policy" ON public.document_chunks;
CREATE POLICY "document_chunks_access_policy" ON public.document_chunks 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- C) Tabla: schedule_items
DROP POLICY IF EXISTS "schedule_items_access_policy" ON public.schedule_items;
CREATE POLICY "schedule_items_access_policy" ON public.schedule_items 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- D) Tabla: content_assets
DROP POLICY IF EXISTS "content_assets_access_policy" ON public.content_assets;
CREATE POLICY "content_assets_access_policy" ON public.content_assets 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- E) Tabla: brand_assets
DROP POLICY IF EXISTS "brand_assets_access_policy" ON public.brand_assets;
CREATE POLICY "brand_assets_access_policy" ON public.brand_assets 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- F) Tabla: client_approval_links
DROP POLICY IF EXISTS "client_approval_links_access_policy" ON public.client_approval_links;
CREATE POLICY "client_approval_links_access_policy" ON public.client_approval_links 
FOR ALL TO authenticated 
USING (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
) 
WITH CHECK (
    agency_id = public.get_user_agency_id() 
    AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id AND c.agency_id = public.get_user_agency_id()
    )
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. AJUSTAR POLÍTICA DE INSERCIÓN PARA TREND_REPORTS (RESTRICCIÓN DE ROL)
-- ────────────────────────────────────────────────────────────────────────────
-- Parchea la inserción permisiva (V-04) limitando los inserts al service_role.

DROP POLICY IF EXISTS "service_role_can_insert_trend_reports" ON public.trend_reports;
CREATE POLICY "service_role_can_insert_trend_reports" ON public.trend_reports 
FOR INSERT TO service_role WITH CHECK (true);
