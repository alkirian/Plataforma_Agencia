// Constantes para estados de tareas del cronograma (Simplificado a 3 estados principales)
export const TASK_STATES = {
  // 🎨 En Diseño
  'en-diseño': {
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    name: 'En Diseño',
    description: 'Tarea en fase de diseño creativo y planificación',
    icon: '🎨',
  },

  // 🚀 En Producción
  'en-progreso': {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    name: 'En Producción',
    description: 'Tarea actualmente en producción/desarrollo y revisión',
    icon: '🚀',
  },

  // ✅ Aprobado
  aprobado: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    name: 'Aprobado',
    description: 'Tarea aprobada por el cliente y lista para publicar',
    icon: '✅',
  },
};

// =========================================================================
// ALIASES DE COMPATIBILIDAD
// Mapea de forma transparente estados legacy y variantes de capitalización
// a uno de los 3 estados principales, evitando crashes y garantizando consistencia
// =========================================================================
TASK_STATES['planificacion'] = TASK_STATES['en-diseño'];
TASK_STATES['pendiente'] = TASK_STATES['en-diseño'];
TASK_STATES['Pendiente'] = TASK_STATES['en-diseño'];
TASK_STATES['En Diseño'] = TASK_STATES['en-diseño'];
TASK_STATES['en-diseno'] = TASK_STATES['en-diseño'];
TASK_STATES['en-revision'] = TASK_STATES['en-progreso'];
TASK_STATES['En Progreso'] = TASK_STATES['en-progreso'];
TASK_STATES['esperando-aprobacion'] = TASK_STATES['en-progreso'];
TASK_STATES['requiere-cambios'] = TASK_STATES['en-diseño'];
TASK_STATES['listo-publicar'] = TASK_STATES['aprobado'];
TASK_STATES['publicado'] = TASK_STATES['aprobado'];
TASK_STATES['completado'] = TASK_STATES['aprobado'];
TASK_STATES['Aprobado'] = TASK_STATES['aprobado'];
TASK_STATES['Publicado'] = TASK_STATES['aprobado'];
TASK_STATES['pausado'] = TASK_STATES['en-progreso'];
TASK_STATES['cancelado'] = TASK_STATES['en-diseño'];
TASK_STATES['Cancelado'] = TASK_STATES['en-diseño'];

// Orden de estados para selectores e interfaz
export const STATE_ORDER = ['en-diseño', 'en-progreso', 'aprobado'];

// Grupos de estados para organización simplificada
export const STATE_GROUPS = {
  diseño: ['en-diseño'],
  produccion: ['en-progreso'],
  aprobacion: ['aprobado'],
};

// Utilidad para obtener estilo de un estado
export const getStateStyle = state => {
  return TASK_STATES[state] || TASK_STATES['en-diseño'];
};

// Utilidad para obtener siguientes estados posibles de forma fluida
export const getNextStates = currentState => {
  const normalized = (currentState || 'en-diseño').toLowerCase();

  if (normalized === 'en-diseño' || normalized === 'en-diseno') {
    return ['en-progreso', 'aprobado'];
  }
  if (normalized === 'en-progreso') {
    return ['en-diseño', 'aprobado'];
  }
  if (normalized === 'aprobado') {
    return ['en-diseño', 'en-progreso'];
  }

  // Por defecto, permitir transición a cualquiera de los otros
  return ['en-diseño', 'en-progreso', 'aprobado'];
};
