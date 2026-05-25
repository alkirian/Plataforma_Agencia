-- =========================================================================
-- SQL PARA CREAR LA TABLA DE INVITACIONES DE AGENCIA
-- =========================================================================
-- Instrucciones:
--   1. Ve al panel de Supabase de tu proyecto.
--   2. Entra a "SQL Editor".
--   3. Crea una nueva consulta e introduce todo este código SQL.
--   4. Haz clic en "Run" (Ejecutar).
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Previene duplicados de invitaciones activas para el mismo correo electrónico en la misma agencia
    UNIQUE (agency_id, email)
);

-- Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- Política de acceso total para usuarios autenticados (consistente con el resto del proyecto)
CREATE POLICY "Permitir todo a autenticados" 
ON public.agency_invitations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
