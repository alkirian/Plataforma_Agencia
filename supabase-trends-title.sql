-- ============================================================
-- 1. Añadir columna 'title' a la tabla trend_reports
-- ============================================================
ALTER TABLE public.trend_reports 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
