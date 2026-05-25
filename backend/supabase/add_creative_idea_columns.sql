-- Migration: Add planning and creative columns to schedule_items
-- Run this in your Supabase SQL Editor

-- 1. Add new columns for advanced event planning
ALTER TABLE public.schedule_items 
ADD COLUMN IF NOT EXISTS creative_idea TEXT,
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS format TEXT,
ADD COLUMN IF NOT EXISTS platforms TEXT;

-- 2. Add comments to document the column purposes
COMMENT ON COLUMN public.schedule_items.creative_idea IS 'Concepto o idea creativa detrás del contenido';
COMMENT ON COLUMN public.schedule_items.goal IS 'Objetivo del post (e.g., interacción, conversión, etc.)';
COMMENT ON COLUMN public.schedule_items.format IS 'Formato de la publicación (e.g., Carrusel, Reels, Story, Entrevista)';
COMMENT ON COLUMN public.schedule_items.platforms IS 'Lista de plataformas seleccionadas separadas por comas (e.g., Instagram, TikTok)';
