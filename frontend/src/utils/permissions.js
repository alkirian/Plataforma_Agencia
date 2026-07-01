export const ROLES = {
  ADMIN: 'admin',
  CUENTAS: 'cuentas',
  CREATIVO: 'creativo',
  DISENADOR: 'diseñador',
  CM: 'CM'
};

/**
 * Verifica si un rol tiene permisos para editar/escribir en el Cronograma (Schedule)
 */
export const canEditSchedule = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS, ROLES.CREATIVO].includes(r);
};

/**
 * Verifica si un rol tiene permisos para editar/escribir en el Estudio de Diseño
 */
export const canEditDesign = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS, ROLES.DISENADOR].includes(r);
};

/**
 * Verifica si un rol tiene permisos para editar/configurar Meta Ads (Conectar/Desconectar)
 */
export const canManageMetaSettings = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS].includes(r);
};

/**
 * Verifica si un rol tiene permisos para utilizar el CM Inteligente (Responder comentarios, auto-pilot)
 */
export const canUseSmartInbox = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS, ROLES.CM.toLowerCase()].includes(r);
};

/**
 * Verifica si un rol tiene permisos para editar Identidad de Marca (canvas, colores, voz)
 */
export const canEditIdentity = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS, ROLES.CREATIVO].includes(r);
};

/**
 * Verifica si un rol tiene permisos para subir o borrar documentos
 */
export const canEditDocuments = (role) => {
  const r = String(role || '').toLowerCase();
  return [ROLES.ADMIN, ROLES.CUENTAS, ROLES.CREATIVO].includes(r);
};
