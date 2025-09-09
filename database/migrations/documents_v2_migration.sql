-- Migration: Enhanced Documents Schema v2
-- Adds versioning, soft delete, pinning, deduplication
-- Date: 2024-01-01

BEGIN;

-- 1. Add new columns
ALTER TABLE documents 
ADD COLUMN filename_sanitized TEXT,
ADD COLUMN extension TEXT,  
ADD COLUMN checksum TEXT,
ADD COLUMN duplicate_of UUID REFERENCES documents(id),
ADD COLUMN version_group TEXT,
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES profiles(id),
ADD COLUMN pinned_at TIMESTAMPTZ, 
ADD COLUMN pinned_by UUID REFERENCES profiles(id);

-- 2. Rename existing column
ALTER TABLE documents RENAME COLUMN user_id TO uploaded_by;

-- 3. Update existing data - populate new fields
UPDATE documents SET 
  filename_sanitized = regexp_replace(lower(file_name), '[^a-z0-9._-]', '_', 'g'),
  extension = COALESCE(
    substring(file_name from '\.([^.]+)$'), 
    'unknown'
  ),
  version_group = COALESCE(
    lower(substring(file_name from '^(.+)\.([^.]+)$')) || '.' || 
    substring(file_name from '\.([^.]+)$'),
    lower(file_name)
  );

-- 4. Set NOT NULL constraints after populating data  
ALTER TABLE documents 
ALTER COLUMN filename_sanitized SET NOT NULL,
ALTER COLUMN extension SET NOT NULL,
ALTER COLUMN version_group SET NOT NULL;

-- 5. Create indexes for performance
CREATE INDEX CONCURRENTLY idx_documents_main_query 
ON documents(agency_id, client_id, deleted_at, pinned_at DESC, created_at DESC);

CREATE INDEX CONCURRENTLY idx_documents_version_group 
ON documents(agency_id, client_id, version_group, created_at DESC);

CREATE INDEX CONCURRENTLY idx_documents_checksum 
ON documents(checksum) WHERE checksum IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_documents_filename_search 
ON documents USING GIN(lower(filename_sanitized) gin_trgm_ops);

-- 6. Update RLS policies to handle soft delete
DROP POLICY IF EXISTS documents_select ON documents;
CREATE POLICY documents_select ON documents FOR SELECT
USING (
  -- Owner can see all (including deleted)
  (uploaded_by = auth.uid()) OR 
  -- Agency members can see active documents
  (deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM (clients c JOIN profiles p ON (p.id = auth.uid()))
    WHERE c.id = documents.client_id 
    AND c.agency_id IS NOT NULL 
    AND p.agency_id = c.agency_id
  ))
);

-- 7. Create function to sanitize filename
CREATE OR REPLACE FUNCTION sanitize_filename(filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(lower(filename), '[^a-z0-9._-]', '_', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Create function to extract extension
CREATE OR REPLACE FUNCTION get_file_extension(filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    lower(substring(filename from '\.([^.]+)$')), 
    'unknown'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. Create function to generate version group
CREATE OR REPLACE FUNCTION get_version_group(filename TEXT)
RETURNS TEXT AS $$
DECLARE
  basename TEXT;
  ext TEXT;
BEGIN
  ext := get_file_extension(filename);
  basename := regexp_replace(filename, '\.[^.]+$', '');
  RETURN lower(basename) || '.' || ext;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Add constraints
ALTER TABLE documents ADD CONSTRAINT documents_extension_check 
CHECK (extension NOT IN ('exe', 'msi', 'dll', 'bat', 'cmd', 'sh', 'scr'));

-- 11. Create view for active documents (most common query)
CREATE VIEW active_documents AS
SELECT * FROM documents 
WHERE deleted_at IS NULL;

-- 12. Add comments for documentation
COMMENT ON COLUMN documents.version_group IS 'Logical grouping for file versions: basename.extension';
COMMENT ON COLUMN documents.duplicate_of IS 'Points to original file if this is a duplicate (same checksum)';
COMMENT ON COLUMN documents.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN documents.pinned_at IS 'Timestamp when pinned - NULL means not pinned';
COMMENT ON COLUMN documents.checksum IS 'SHA256 hash for deduplication';

COMMIT;