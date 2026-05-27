-- ============================================================================
-- SCRIPT DE OPTIMIZACIONES SQL PARA CADENCE
-- ============================================================================
-- Instrucciones:
--   1. Ve al panel de Supabase de tu proyecto.
--   2. Entra al editor SQL ("SQL Editor") en la barra lateral izquierda.
--   3. Crea una nueva consulta e introduce todo este código SQL.
--   4. Haz clic en "Run" (Ejecutar).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. OPTIMIZACIÓN DE RLS: FUNCIÓN CON PROPIEDAD STABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Al marcar la función como STABLE, PostgreSQL sabe que para un mismo usuario 
-- autenticado (auth.uid()), el resultado será idéntico durante la ejecución de 
-- la consulta. Esto permite a PostgreSQL almacenar en caché el resultado (agency_id) 
-- y evaluar la función una sola vez por query en lugar de una vez por cada fila 
-- escaneada. La latencia disminuye enormemente.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT agency_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. CREACIÓN DE ÍNDICES ADICIONALES PARA MÁXIMA VELOCIDAD EN JOINS Y RLS
-- ────────────────────────────────────────────────────────────────────────────

-- Índice en perfiles de usuario por agencia (Acelera joins y políticas RLS globales)
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);

-- Índice en clientes por agencia (Acelera la velocidad de carga inicial de clientes en el sidebar)
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);

-- Índice compuesto en cronograma por cliente y fecha (Acelera drásticamente FullCalendar filtrando por rangos mensuales)
CREATE INDEX IF NOT EXISTS idx_schedule_items_client_date ON public.schedule_items(client_id, scheduled_at);
