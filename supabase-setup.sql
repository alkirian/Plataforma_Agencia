-- =========================================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETO DE SUPABASE PARA CADENCE
-- =========================================================================
-- Instrucciones:
--   1. Ve al panel de Supabase de tu nuevo proyecto.
--   2. En la barra lateral izquierda, entra a "SQL Editor".
--   3. Crea una nueva consulta ("New query") haciendo clic en "+ New query".
--   4. Pega todo este código SQL y haz clic en el botón "Run" (Ejecutar).
-- =========================================================================

-- 0) Activar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 1) Tabla de Agencias
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Se vincula al auth.users(id)
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    brand_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Tabla del Cronograma de Contenidos (Schedule Items)
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    copy TEXT,
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Diseño', 'En Progreso', 'Aprobado', 'Publicado', 'Cancelado')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgente', 'baja', 'media', 'alta', 'Baja', 'Media', 'Alta', 'Urgente')),
    channel VARCHAR(50),
    creative_idea TEXT,
    goal TEXT,
    format TEXT,
    platforms TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Tabla de Documentos Subidos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    size_bytes BIGINT,
    ai_status TEXT DEFAULT 'ready' CHECK (ai_status IN ('ready', 'processing', 'error')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Tabla de Fragmentos para IA/RAG (Document Chunks)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- Usado por OpenAI text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7) Tabla de Registro de Actividad (Activity Logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8) Tabla de Mensajes de Chat de la IA (Chat Messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) Tabla de Resúmenes de Conversación (Chat Summaries)
CREATE TABLE IF NOT EXISTS public.chat_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    up_to TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- CONFIGURACIÓN DE SEGURIDAD (RLS) Y POLÍTICAS
-- =========================================================================

-- 1) Función Auxiliar de Seguridad de Agencia (Previene Recursión Infinita)
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT agency_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar RLS en todas las tablas públicas
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso seguro y aislado por agencia (multi-tenant)
CREATE POLICY "agencies_select_policy" ON public.agencies FOR SELECT TO authenticated USING (id = public.get_user_agency_id());
CREATE POLICY "agencies_update_policy" ON public.agencies FOR UPDATE TO authenticated USING (id = public.get_user_agency_id()) WITH CHECK (id = public.get_user_agency_id());

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "clients_access_policy" ON public.clients FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "schedule_items_access_policy" ON public.schedule_items FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "documents_access_policy" ON public.documents FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "document_chunks_access_policy" ON public.document_chunks FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "activity_logs_access_policy" ON public.activity_logs FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "chat_messages_access_policy" ON public.chat_messages FOR ALL TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id())) WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id()));
CREATE POLICY "chat_summaries_access_policy" ON public.chat_summaries FOR ALL TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id())) WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE agency_id = public.get_user_agency_id()));

-- Indices para optimización de consultas
CREATE INDEX IF NOT EXISTS chat_messages_client_created_idx ON public.chat_messages (client_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS schedule_items_client_idx ON public.schedule_items (client_id);
CREATE INDEX IF NOT EXISTS documents_client_idx ON public.documents (client_id);
CREATE INDEX IF NOT EXISTS document_chunks_doc_idx ON public.document_chunks (document_id);

-- =========================================================================
-- FUNCIONES Y PROCEDIMIENTOS ALMACENADOS (RPC)
-- =========================================================================

-- 1) RPC: Crear Nueva Agencia y Usuario Admin
CREATE OR REPLACE FUNCTION public.create_new_agency_and_admin(
    user_id UUID,
    agency_name TEXT,
    user_full_name TEXT
)
RETURNS UUID AS $$
DECLARE
    new_agency_id UUID;
BEGIN
    -- Crear agencia
    INSERT INTO public.agencies (name)
    VALUES (agency_name)
    RETURNING id INTO new_agency_id;

    -- Crear perfil enlazado a la agencia
    INSERT INTO public.profiles (id, agency_id, full_name, role)
    VALUES (user_id, new_agency_id, user_full_name, 'admin');

    RETURN new_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) RPC: Crear Nuevo Cliente (enlazado automáticamente a la agencia del usuario)
CREATE OR REPLACE FUNCTION public.create_new_client(
    client_name TEXT,
    client_industry TEXT
)
RETURNS UUID AS $$
DECLARE
    user_agency_id UUID;
    new_client_id UUID;
BEGIN
    -- Obtener la agencia del usuario que llama al RPC
    SELECT agency_id INTO user_agency_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF user_agency_id IS NULL THEN
        RAISE EXCEPTION 'El usuario no tiene una agencia asignada.';
    END IF;

    -- Insertar cliente enlazado a la agencia
    INSERT INTO public.clients (name, industry, agency_id)
    VALUES (client_name, client_industry, user_agency_id)
    RETURNING id INTO new_client_id;

    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) RPC: Búsqueda Semántica de Fragmentos de Documentos (RAG IA)
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
BEGIN
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

-- 10) Tabla de Invitaciones de Agencia
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (agency_id, email)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency_invitations_access_policy" ON public.agency_invitations FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());

-- 11) Tabla de Enlaces de Invitación Compartidos de Agencia
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

CREATE INDEX IF NOT EXISTS idx_agency_invite_links_code ON public.agency_invite_links(code);
ALTER TABLE public.agency_invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency_invite_links_access_policy" ON public.agency_invite_links FOR ALL TO authenticated USING (agency_id = public.get_user_agency_id()) WITH CHECK (agency_id = public.get_user_agency_id());


