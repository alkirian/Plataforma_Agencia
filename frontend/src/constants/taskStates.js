// Constantes para estados de tareas del cronograma
export const TASK_STATES = {
  // 📋 Planeación
  planificacion: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    name: 'Planificación',
    description: 'Tarea en fase de planificación inicial',
    icon: '📋',
  },
  pendiente: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    name: 'Pendiente',
    description: 'Tarea programada, esperando inicio',
    icon: '⏳',
  },

  // 🚀 Ejecución
  'en-progreso': {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    name: 'En Progreso',
    description: 'Tarea actualmente en desarrollo',
    icon: '🚀',
  },
  'en-diseño': {
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    name: 'En Diseño',
    description: 'Tarea en fase de diseño creativo',
    icon: '🎨',
  },
  'en-revision': {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    name: 'En Revisión',
    description: 'Tarea completada, esperando revisión',
    icon: '👀',
  },

  // ✅ Aprobación
  'esperando-aprobacion': {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    name: 'Esperando Aprobación',
    description: 'Tarea revisada, esperando aprobación del cliente',
    icon: '⏰',
  },
  aprobado: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    name: 'Aprobado',
    description: 'Tarea aprobada por el cliente',
    icon: '✅',
  },
  'requiere-cambios': {
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.1)',
    name: 'Requiere Cambios',
    description: 'Tarea necesita modificaciones',
    icon: '🔄',
  },

  // 🚀 Finalización
  'listo-publicar': {
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
    name: 'Listo para Publicar',
    description: 'Tarea lista para publicación',
    icon: '📤',
  },
  publicado: {
    color: '#047857',
    bg: 'rgba(4, 120, 87, 0.1)',
    name: 'Publicado',
    description: 'Tarea publicada exitosamente',
    icon: '📢',
  },
  completado: {
    color: '#065f46',
    bg: 'rgba(6, 95, 70, 0.1)',
    name: 'Completado',
    description: 'Tarea completada totalmente',
    icon: '🎉',
  },

  // ⚠️ Estados especiales
  pausado: {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    name: 'Pausado',
    description: 'Tarea temporalmente pausada',
    icon: '⏸️',
  },
  cancelado: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    name: 'Cancelado',
    description: 'Tarea cancelada',
    icon: '❌',
  },
};

// Orden de estados para selectores
export const STATE_ORDER = [
  'planificacion',
  'pendiente',
  'en-progreso',
  'en-diseño',
  'en-revision',
  'esperando-aprobacion',
  'requiere-cambios',
  'aprobado',
  'listo-publicar',
  'publicado',
  'completado',
  'pausado',
  'cancelado',
];

// Grupos de estados para organización
export const STATE_GROUPS = {
  planeacion: ['planificacion', 'pendiente'],
  ejecucion: ['en-progreso', 'en-diseño', 'en-revision'],
  aprobacion: ['esperando-aprobacion', 'aprobado', 'requiere-cambios'],
  finalizacion: ['listo-publicar', 'publicado', 'completado'],
  especiales: ['pausado', 'cancelado'],
};

// Utilidad para obtener estilo de un estado
export const getStateStyle = state => {
  return TASK_STATES[state] || TASK_STATES.pendiente;
};

// Utilidad para obtener siguientes estados posibles
export const getNextStates = currentState => {
  const transitions = {
    planificacion: ['pendiente', 'cancelado'],
    pendiente: ['en-progreso', 'pausado', 'cancelado'],
    'en-progreso': ['en-diseño', 'en-revision', 'pausado'],
    'en-diseño': ['en-revision', 'requiere-cambios'],
    'en-revision': ['esperando-aprobacion', 'requiere-cambios'],
    'esperando-aprobacion': ['aprobado', 'requiere-cambios'],
    'requiere-cambios': ['en-diseño', 'en-progreso'],
    aprobado: ['listo-publicar'],
    'listo-publicar': ['publicado'],
    publicado: ['completado'],
    pausado: ['en-progreso', 'cancelado'],
    cancelado: ['planificacion'],
    completado: [],
  };

  return transitions[currentState] || [];
};
