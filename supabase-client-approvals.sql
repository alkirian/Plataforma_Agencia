-- ============================================================
-- 1. Agregar columna client_feedback a schedule_items
-- ============================================================
ALTER TABLE public.schedule_items 
ADD COLUMN IF NOT EXISTS client_feedback TEXT DEFAULT '';

-- ============================================================
-- 2. Crear tabla de enlaces de aprobación para clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_approval_links (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID          NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agency_id     UUID          NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    created_by    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice único parcial: solo un enlace activo a la vez por cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_approval_link 
ON public.client_approval_links (client_id) 
WHERE (is_active = true);

-- Habilitar RLS para la tabla de enlaces de aprobación
ALTER TABLE public.client_approval_links ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para client_approval_links
DROP POLICY IF EXISTS "agency_members_can_read_approval_links" ON public.client_approval_links;
CREATE POLICY "agency_members_can_read_approval_links"
  ON public.client_approval_links
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "agency_members_can_write_approval_links" ON public.client_approval_links;
CREATE POLICY "agency_members_can_write_approval_links"
  ON public.client_approval_links
  FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );
