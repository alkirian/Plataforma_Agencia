-- Function to get storage statistics for an agency
-- Returns aggregated data about document storage usage

CREATE OR REPLACE FUNCTION get_storage_stats(p_agency_id UUID)
RETURNS TABLE (
  total_size BIGINT,
  total_count INTEGER,
  active_count INTEGER,
  deleted_count INTEGER,
  pinned_count INTEGER,
  by_type JSONB,
  by_client JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: ensure user has access to the agency
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND agency_id = p_agency_id
  ) THEN
    RAISE EXCEPTION 'Acceso denegado a la agencia especificada';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT 
      COALESCE(SUM(size_bytes), 0) as total_size,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
      COUNT(*) FILTER (WHERE pinned_at IS NOT NULL AND deleted_at IS NULL) as pinned_count
    FROM documents 
    WHERE agency_id = p_agency_id
  ),
  type_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(
        CASE 
          WHEN mime_type LIKE 'image/%' THEN 'image'
          WHEN mime_type LIKE 'video/%' THEN 'video'
          WHEN mime_type = 'application/pdf' THEN 'pdf'
          WHEN mime_type LIKE 'text/%' THEN 'text'
          WHEN mime_type IN ('application/zip', 'application/x-rar-compressed') THEN 'compressed'
          ELSE 'other'
        END,
        'unknown'
      ),
      json_build_object(
        'count', type_count,
        'size', type_size
      )
    ) as by_type
    FROM (
      SELECT 
        CASE 
          WHEN mime_type LIKE 'image/%' THEN 'image'
          WHEN mime_type LIKE 'video/%' THEN 'video'
          WHEN mime_type = 'application/pdf' THEN 'pdf'
          WHEN mime_type LIKE 'text/%' THEN 'text'
          WHEN mime_type IN ('application/zip', 'application/x-rar-compressed') THEN 'compressed'
          ELSE 'other'
        END as file_type,
        COUNT(*) as type_count,
        COALESCE(SUM(size_bytes), 0) as type_size
      FROM documents 
      WHERE agency_id = p_agency_id 
      AND deleted_at IS NULL
      GROUP BY 1
    ) t
  ),
  client_stats AS (
    SELECT jsonb_object_agg(
      client_id::text,
      json_build_object(
        'count', client_count,
        'size', client_size,
        'pinned', client_pinned
      )
    ) as by_client
    FROM (
      SELECT 
        client_id,
        COUNT(*) as client_count,
        COALESCE(SUM(size_bytes), 0) as client_size,
        COUNT(*) FILTER (WHERE pinned_at IS NOT NULL) as client_pinned
      FROM documents 
      WHERE agency_id = p_agency_id 
      AND deleted_at IS NULL
      GROUP BY client_id
    ) c
  )
  SELECT 
    s.total_size,
    s.total_count::INTEGER,
    s.active_count::INTEGER,
    s.deleted_count::INTEGER,
    s.pinned_count::INTEGER,
    COALESCE(ts.by_type, '{}'::jsonb),
    COALESCE(cs.by_client, '{}'::jsonb)
  FROM stats s
  CROSS JOIN type_stats ts
  CROSS JOIN client_stats cs;
END;
$$;