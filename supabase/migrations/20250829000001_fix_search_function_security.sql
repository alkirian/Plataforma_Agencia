-- Migration: Fix search_path security vulnerability for search functions
-- Created: 2025-08-29
-- Purpose: Secure search functions with fixed search_path to prevent SQL injection

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure context_chunks table exists with proper structure
CREATE TABLE IF NOT EXISTS context_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  agency_id UUID NOT NULL,
  document_id UUID,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on context_chunks if not already enabled
ALTER TABLE context_chunks ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for context_chunks
DROP POLICY IF EXISTS "Users can view chunks from their agency" ON context_chunks;
CREATE POLICY "Users can view chunks from their agency" ON context_chunks
  FOR SELECT
  USING (agency_id = (auth.jwt() ->> 'agency_id')::UUID);

DROP POLICY IF EXISTS "Service role can manage all chunks" ON context_chunks;
CREATE POLICY "Service role can manage all chunks" ON context_chunks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_context_chunks_agency_client ON context_chunks(agency_id, client_id);
CREATE INDEX IF NOT EXISTS idx_context_chunks_document ON context_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_context_chunks_embedding_cosine ON context_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Drop existing functions if they exist (to recreate with security fixes)
DROP FUNCTION IF EXISTS search_context_chunks(vector, uuid, integer, float);
DROP FUNCTION IF EXISTS match_context_chunks(vector, uuid, integer, float);

-- Create secure search_context_chunks function
-- SECURITY: Fixed search_path prevents schema poisoning attacks
CREATE OR REPLACE FUNCTION search_context_chunks(
  query_embedding vector(1536),
  match_client_id uuid,
  match_count integer DEFAULT 5,
  match_threshold float DEFAULT 0.78
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public  -- FIXED: Prevents search_path manipulation attacks
SECURITY DEFINER  -- Runs with function owner permissions for RLS bypass when needed
AS $$
BEGIN
  -- Input validation to prevent abuse
  IF match_count IS NULL OR match_count < 1 OR match_count > 50 THEN
    RAISE EXCEPTION 'match_count must be between 1 and 50';
  END IF;
  
  IF match_threshold IS NULL OR match_threshold < 0 OR match_threshold > 1 THEN
    RAISE EXCEPTION 'match_threshold must be between 0 and 1';
  END IF;
  
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'query_embedding cannot be null';
  END IF;

  IF match_client_id IS NULL THEN
    RAISE EXCEPTION 'match_client_id cannot be null';
  END IF;

  -- Return matching chunks ordered by similarity
  -- Note: Using 1 - cosine distance for similarity score
  RETURN QUERY
  SELECT 
    dc.id,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  FROM context_chunks dc
  WHERE 
    dc.client_id = match_client_id
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create alias function for backward compatibility with existing code
-- This matches the function name used in ai.service.js
CREATE OR REPLACE FUNCTION match_context_chunks(
  query_embedding vector(1536),
  match_client_id uuid,
  match_count integer DEFAULT 5,
  match_threshold float DEFAULT 0.78
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public  -- FIXED: Prevents search_path manipulation attacks
SECURITY DEFINER
AS $$
BEGIN
  -- Delegate to the main search function for consistency
  RETURN QUERY
  SELECT * FROM search_context_chunks(
    query_embedding, 
    match_client_id, 
    match_count, 
    match_threshold
  );
END;
$$;

-- Grant necessary permissions
-- Service role needs execute permission for backend operations
GRANT EXECUTE ON FUNCTION search_context_chunks TO service_role;
GRANT EXECUTE ON FUNCTION match_context_chunks TO service_role;

-- Regular authenticated users should not need direct access to these functions
-- as they should go through the application layer with proper token validation
-- REVOKE EXECUTE ON FUNCTION search_context_chunks FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION match_context_chunks FROM authenticated;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_context_chunks_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_context_chunks_timestamp ON context_chunks;
CREATE TRIGGER trigger_update_context_chunks_timestamp
  BEFORE UPDATE ON context_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_context_chunks_timestamp();

-- Add helpful comments for maintenance
COMMENT ON FUNCTION search_context_chunks IS 
'Secure semantic search function for context chunks. Uses fixed search_path to prevent SQL injection.';

COMMENT ON FUNCTION match_context_chunks IS 
'Backward-compatible alias for search_context_chunks. Matches existing codebase usage.';

COMMENT ON TABLE context_chunks IS 
'Stores text chunks from processed documents with their embeddings for semantic search.';