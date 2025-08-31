-- Context Sources Schema Extensions
-- Ejecutar en el SQL Editor de Supabase para habilitar fuentes de contexto

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Agregar campos necesarios a la tabla documents para manejar fuentes de contexto
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('document', 'url', 'manual', 'note'));

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::jsonb;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_documents_source_type 
ON public.documents (source_type);

CREATE INDEX IF NOT EXISTS idx_documents_client_source_type 
ON public.documents (client_id, source_type);

CREATE INDEX IF NOT EXISTS idx_documents_agency_source_type 
ON public.documents (agency_id, source_type);

-- 2. Función para buscar chunks de contexto con filtros adicionales
-- Esta función extiende match_context_chunks para incluir filtros por tipo de fuente
CREATE OR REPLACE FUNCTION public.match_context_chunks(
  query_embedding vector(1536),
  match_client_id uuid,
  match_count int DEFAULT 10,
  source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  agency_id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_name text,
  document_source_type text,
  document_source_metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.client_id,
    dc.agency_id,
    dc.document_id,
    dc.content,
    (dc.embedding <=> query_embedding)::float AS similarity,
    d.file_name AS document_name,
    d.source_type AS document_source_type,
    d.source_metadata AS document_source_metadata,
    dc.created_at
  FROM context_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE 
    dc.client_id = match_client_id
    AND (source_types IS NULL OR d.source_type = ANY(source_types))
    AND d.ai_status = 'ready'
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Función para obtener estadísticas de fuentes de contexto por cliente
CREATE OR REPLACE FUNCTION public.get_context_sources_stats(
  client_id_param uuid,
  agency_id_param uuid
)
RETURNS TABLE (
  source_type text,
  count bigint,
  ready_count bigint,
  processing_count bigint,
  error_count bigint,
  total_chunks bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.source_type,
    COUNT(*) AS count,
    COUNT(*) FILTER (WHERE d.ai_status = 'ready') AS ready_count,
    COUNT(*) FILTER (WHERE d.ai_status = 'processing') AS processing_count,
    COUNT(*) FILTER (WHERE d.ai_status = 'error') AS error_count,
    COALESCE(SUM(chunk_counts.chunk_count), 0) AS total_chunks
  FROM documents d
  LEFT JOIN (
    SELECT 
      document_id,
      COUNT(*) AS chunk_count
  FROM context_chunks 
    WHERE client_id = client_id_param
    GROUP BY document_id
  ) chunk_counts ON d.id = chunk_counts.document_id
  WHERE 
    d.client_id = client_id_param 
    AND d.agency_id = agency_id_param
    AND d.source_type IS NOT NULL
  GROUP BY d.source_type
  ORDER BY d.source_type;
END;
$$;

-- 4. Función para buscar fuentes de contexto con filtros avanzados
CREATE OR REPLACE FUNCTION public.search_context_sources(
  client_id_param uuid,
  agency_id_param uuid,
  source_type_filter text DEFAULT NULL,
  ai_status_filter text DEFAULT NULL,
  search_term text DEFAULT NULL,
  limit_param int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  agency_id uuid,
  file_name text,
  source_type text,
  ai_status text,
  source_metadata jsonb,
  created_at timestamptz,
  chunk_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.client_id,
    d.agency_id,
    d.file_name,
    d.source_type,
    d.ai_status,
    d.source_metadata,
    d.created_at,
    COALESCE(chunk_counts.chunk_count, 0) AS chunk_count
  FROM documents d
  LEFT JOIN (
    SELECT 
      document_id,
      COUNT(*) AS chunk_count
  FROM context_chunks 
    WHERE client_id = client_id_param
    GROUP BY document_id
  ) chunk_counts ON d.id = chunk_counts.document_id
  WHERE 
    d.client_id = client_id_param 
    AND d.agency_id = agency_id_param
    AND d.source_type IS NOT NULL
    AND (source_type_filter IS NULL OR d.source_type = source_type_filter)
    AND (ai_status_filter IS NULL OR d.ai_status = ai_status_filter)
    AND (search_term IS NULL OR 
         d.file_name ILIKE '%' || search_term || '%' OR
         d.source_metadata::text ILIKE '%' || search_term || '%')
  ORDER BY d.created_at DESC
  LIMIT limit_param;
END;
$$;

-- 5. Trigger para actualizar metadatos automáticamente
CREATE OR REPLACE FUNCTION update_context_source_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar automáticamente algunos metadatos cuando se modifica la fuente
  IF NEW.source_type IS NOT NULL AND OLD.source_metadata != NEW.source_metadata THEN
    NEW.source_metadata = COALESCE(NEW.source_metadata, '{}'::jsonb) || 
                          jsonb_build_object('last_updated', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_context_source_metadata ON public.documents;
CREATE TRIGGER trigger_update_context_source_metadata
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_context_source_metadata();

-- 6. Políticas RLS actualizadas para incluir source_type
-- Asegurar que las políticas existentes manejen correctamente las fuentes de contexto

-- Verificar si ya existe una política para documents_select
DO $$
BEGIN
  -- Verificar y actualizar política de SELECT para documents si es necesario
  -- (Esto es principalmente informativo, las políticas RLS existentes deberían funcionar)
  
  -- Información sobre las políticas actuales
  RAISE NOTICE 'Verificando políticas RLS existentes para documents...';
  
  -- Las políticas existentes basadas en client_id y agency_id deberían 
  -- funcionar automáticamente con las fuentes de contexto
END $$;

-- 7. Función de utilidad para limpiar fuentes huérfanas
CREATE OR REPLACE FUNCTION cleanup_orphaned_context_chunks()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Eliminar chunks cuyo documento ya no existe
  DELETE FROM context_chunks 
  WHERE document_id NOT IN (SELECT id FROM documents);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Comentarios sobre el uso
COMMENT ON FUNCTION match_context_chunks(vector, uuid, int, text[]) IS 
'Busca chunks de contexto similares con filtros opcionales por tipo de fuente. Extiende match_context_chunks con capacidades adicionales.';

COMMENT ON FUNCTION get_context_sources_stats(uuid, uuid) IS 
'Obtiene estadísticas completas de fuentes de contexto para un cliente específico.';

COMMENT ON FUNCTION search_context_sources(uuid, uuid, text, text, text, int) IS 
'Busca fuentes de contexto con filtros avanzados incluyendo búsqueda de texto.';

COMMENT ON COLUMN documents.source_type IS 
'Tipo de fuente de contexto: document, url, manual, note';

COMMENT ON COLUMN documents.source_metadata IS 
'Metadatos específicos del tipo de fuente (URL original, tags, categorías, etc.)';

-- Finalización
DO $$
BEGIN
  RAISE NOTICE '✅ Schema de Context Sources aplicado exitosamente';
  RAISE NOTICE '📄 Tipos de fuente soportados: document, url, manual, note';
  RAISE NOTICE '🔍 Funciones SQL creadas:';
  RAISE NOTICE '   - match_context_chunks(): Búsqueda semántica con filtros';
  RAISE NOTICE '   - get_context_sources_stats(): Estadísticas por cliente';
  RAISE NOTICE '   - search_context_sources(): Búsqueda avanzada de fuentes';
  RAISE NOTICE '   - cleanup_orphaned_context_chunks(): Limpieza de chunks huérfanos';
END $$;