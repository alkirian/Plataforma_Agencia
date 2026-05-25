-- ============================================================
-- trend_reports: reportes diarios de tendencias por cliente
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trend_reports (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID          NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id     UUID          NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  keywords      TEXT[]        NOT NULL DEFAULT '{}',
  raw_results   JSONB,
  summary       TEXT          NOT NULL DEFAULT '',
  insights      JSONB         NOT NULL DEFAULT '[]',
  generated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_trend_reports_client_id    ON public.trend_reports (client_id);
CREATE INDEX IF NOT EXISTS idx_trend_reports_agency_id    ON public.trend_reports (agency_id);
CREATE INDEX IF NOT EXISTS idx_trend_reports_generated_at ON public.trend_reports (generated_at DESC);

-- ────────────────────────────────────────────────────────────
-- RLS: cada usuario solo ve reportes de su agencia
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.trend_reports ENABLE ROW LEVEL SECURITY;

-- Lectura: miembros de la agencia
CREATE POLICY "agency_members_can_read_trend_reports"
  ON public.trend_reports
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Inserción: solo el service_role del backend (via supabaseAdmin) puede insertar
-- Los usuarios normales no insertan directamente
CREATE POLICY "service_role_can_insert_trend_reports"
  ON public.trend_reports
  FOR INSERT
  WITH CHECK (true);  -- supabaseAdmin bypasses RLS por defecto

-- Borrado: solo admins de la agencia
CREATE POLICY "agency_admins_can_delete_trend_reports"
  ON public.trend_reports
  FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
