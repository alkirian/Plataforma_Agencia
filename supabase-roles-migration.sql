-- ============================================================================
-- SCRIPT DE MIGRACIÓN: ACTUALIZACIÓN DE ROLES EN CADENCE
-- ============================================================================

-- 1) Eliminar las antiguas restricciones CHECK
ALTER TABLE public.agency_invitations DROP CONSTRAINT IF EXISTS agency_invitations_role_check;
ALTER TABLE public.agency_invite_links DROP CONSTRAINT IF EXISTS agency_invite_links_role_check;

-- 2) Crear las nuevas restricciones CHECK de roles ampliados
ALTER TABLE public.agency_invitations 
  ADD CONSTRAINT agency_invitations_role_check 
  CHECK (role IN ('admin', 'member', 'diseñador', 'creativo', 'CM', 'cuentas'));

ALTER TABLE public.agency_invite_links 
  ADD CONSTRAINT agency_invite_links_role_check 
  CHECK (role IN ('admin', 'member', 'diseñador', 'creativo', 'CM', 'cuentas'));
