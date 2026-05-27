-- =========================================================================
-- CADENCE - MIGRACIÓN DEL SISTEMA DE LOGIN PREMIUM: TIPO DE ORGANIZACIÓN
-- =========================================================================
-- Instrucciones:
--   1. Ve al panel de tu proyecto de Supabase.
--   2. Entra a "SQL Editor" -> "+ New query".
--   3. Pega este código y presiona "Run" (Ejecutar).
-- =========================================================================

-- 1) Agregar columna agency_type a la tabla agencies si no existe
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS agency_type TEXT DEFAULT 'agency' CHECK (agency_type IN ('agency', 'own_business'));

-- 2) Reemplazar la función RPC para soportar la creación de agencias con tipo
CREATE OR REPLACE FUNCTION public.create_new_agency_and_admin(
    user_id UUID,
    agency_name TEXT,
    user_full_name TEXT,
    agency_type TEXT DEFAULT 'agency'
)
RETURNS UUID AS $$
DECLARE
    new_agency_id UUID;
BEGIN
    -- Crear la agencia con su tipo
    INSERT INTO public.agencies (name, agency_type)
    VALUES (agency_name, agency_type)
    RETURNING id INTO new_agency_id;

    -- Crear perfil enlazado a la agencia como administrador
    INSERT INTO public.profiles (id, agency_id, full_name, role)
    VALUES (user_id, new_agency_id, user_full_name, 'admin');

    RETURN new_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
