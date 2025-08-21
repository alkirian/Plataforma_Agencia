/**
 * Sistema unificado de mensajes de notificación
 * Todos los mensajes en español consistente y contextual
 */

export const NOTIFICATION_MESSAGES = {
  // === AUTENTICACIÓN ===
  auth: {
    loginSuccess: '¡Bienvenido de vuelta! 👋',
    loginError: 'Email o contraseña incorrectos',
    registerSuccess: '¡Cuenta creada exitosamente! 🎉',
    registerError: 'Error al crear la cuenta',
    googleAuthError: 'No se pudo iniciar sesión con Google',
    emailVerificationError: 'Error al verificar el email',
    logoutSuccess: 'Sesión cerrada correctamente'
  },

  // === GESTIÓN DE CLIENTES ===
  client: {
    creating: 'Creando cliente...',
    createSuccess: 'Cliente creado exitosamente ✅',
    createError: 'Error al crear el cliente',
    updating: 'Actualizando cliente...',
    updateSuccess: 'Cliente actualizado correctamente ✅',
    updateError: 'Error al actualizar el cliente',
    deleting: 'Eliminando cliente...',
    deleteSuccess: 'Cliente eliminado correctamente',
    deleteError: 'Error al eliminar el cliente',
    loadError: 'Error al cargar datos del cliente'
  },

  // === CALENDARIO Y TAREAS ===
  task: {
    creating: 'Creando evento...',
    createSuccess: 'Evento creado exitosamente ✅',
    createError: 'Error al crear la tarea',
    updating: 'Actualizando evento...',
    updateSuccess: 'Evento actualizado correctamente ✅',
    updateError: 'Error al actualizar el evento',
    deleting: 'Eliminando evento...',
    deleteSuccess: 'Evento eliminado correctamente ✅',
    deleteError: 'Error al eliminar el evento',
    
    // Quick tasks
    quickTaskSuccess: 'Tarea creada exitosamente ✅',
    quickTaskError: 'Error al crear la tarea',
    
    // Validaciones
    titleRequired: 'El título es obligatorio',
    dateRequired: 'La fecha es obligatoria',
    timeRequired: 'La hora es obligatoria',
    completeRequired: 'Completa título, fecha y hora',
    
    // Estados
    statusChanged: (status) => `Estado cambiado a ${status} ✅`,
    statusChangeError: 'Error al cambiar el estado'
  },

  // === IA Y GENERACIÓN ===
  ai: {
    // Chat
    chatError: 'Error del asistente. Intenta de nuevo',
    loadHistoryError: 'Error al cargar mensajes anteriores',
    
    // Ideas
    generating: 'Generando ideas creativas...',
    generationCancelled: 'Generación cancelada ⏹️',
    promptRequired: 'Ingresa un tema para generar ideas',
    selectIdeasRequired: 'Selecciona al menos una idea',
    
    ideasGenerated: (count) => `🎉 ${count} ideas generadas exitosamente`,
    ideasGenerationError: 'No se pudieron generar ideas. Intenta con un prompt diferente',
    ideasGenerationErrorGeneric: 'Error al generar ideas. Intenta de nuevo',
    
    ideasAdded: (count) => `✅ ${count} ideas agregadas al cronograma`,
    ideasAddError: (count) => `❌ ${count} ideas no se pudieron agregar`,
    ideasProcessError: 'Error procesando las ideas',
    
    ideaUpdated: 'Idea actualizada ✅',
    ideaUpdateError: 'Error al actualizar la idea'
  },

  // === RECORDATORIOS Y NOTIFICACIONES ===
  reminders: {
    taskOverdue: (taskTitle, clientName) => `"${taskTitle}" en ${clientName} está vencida ⚠️`,
    taskDueToday: (taskTitle, clientName) => `"${taskTitle}" en ${clientName} es para hoy 📅`,
    taskDueTomorrow: (taskTitle, clientName) => `"${taskTitle}" en ${clientName} es para mañana 🗓️`,
    taskUpcoming: (taskTitle, clientName, days) => `"${taskTitle}" en ${clientName} es en ${days} días`,
    
    // Resúmenes
    multipleTasks: (overdueCount, dueTodayCount) => {
      if (overdueCount > 0 && dueTodayCount > 0) {
        return `${overdueCount} tareas vencidas y ${dueTodayCount} para hoy 🔔`;
      } else if (overdueCount > 0) {
        return `${overdueCount} tarea${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''} ⚠️`;
      } else if (dueTodayCount > 0) {
        return `${dueTodayCount} tarea${dueTodayCount > 1 ? 's' : ''} para hoy 📅`;
      }
      return 'Tienes notificaciones pendientes 🔔';
    }
  },

  // === DOCUMENTOS ===
  document: {
    // Subida
    uploading: (fileName) => `Subiendo ${fileName}...`,
    uploadSuccess: (fileName, userName) => `📄 ${fileName} subido por ${userName}`,
    uploadSuccessSimple: (fileName) => `📄 ${fileName} subido exitosamente`,
    uploadError: (fileName) => `❌ Error al subir ${fileName}`,
    uploadErrorGeneric: 'Error al subir el archivo',
    
    // Eliminación
    deleting: 'Eliminando documento...',
    deleteSuccess: (fileName) => `📄 ${fileName} eliminado correctamente`,
    deleteError: (fileName) => `❌ Error al eliminar ${fileName}`,
    
    // Descarga
    downloading: 'Descargando documento...',
    downloadSuccess: (fileName) => `📄 ${fileName} descargado`,
    downloadError: (fileName) => `❌ Error al descargar ${fileName}`,
    
    // Validaciones
    fileTooLarge: (fileName, maxSize) => `${fileName} es muy grande. Máximo ${maxSize}MB`,
    fileTypeNotAllowed: (fileName) => `${fileName} no es un tipo de archivo permitido`,
    noFileSelected: 'Selecciona un archivo para subir',
    
    // Múltiples archivos
    multipleUploaded: (count, userName) => `📄 ${count} archivos subidos por ${userName}`,
    multipleUploadedSimple: (count) => `📄 ${count} archivos subidos exitosamente`,
    someUploadsFailed: (success, total) => `${success} de ${total} archivos subidos correctamente`,
    
    // Estados
    processingFiles: 'Procesando archivos...',
    validatingFiles: 'Validando archivos...'
  },

  // === SISTEMA ===
  system: {
    networkError: 'Error de conexión. Verifica tu internet',
    unexpectedError: 'Algo salió mal. Intenta de nuevo',
    loadingError: 'Error al cargar los datos',
    saveError: 'Error al guardar los cambios',
    
    // Confirmaciones
    confirmDelete: '¿Estás seguro de eliminar este elemento?',
    confirmDeleteAll: '¿Estás seguro de eliminar todas las notificaciones?',
    
    // Estados
    loading: 'Cargando...',
    saving: 'Guardando...',
    deleting: 'Eliminando...',
    processing: 'Procesando...'
  },

  // === ACCIONES CONTEXTUALES ===
  actions: {
    // Tareas
    viewTask: 'Ver tarea',
    editTask: 'Editar tarea',
    completeTask: 'Marcar completada',
    snoozeTask: 'Posponer 1 hora',
    
    // Navegación
    goToClient: 'Ir al cliente',
    openCalendar: 'Abrir calendario',
    configureClient: 'Configurar cliente',
    
    // Documentos
    viewDocument: 'Ver documento',
    downloadDocument: 'Descargar',
    viewAllDocuments: 'Ver todos los documentos',
    openDocuments: 'Abrir documentos',
    
    // Generales
    tryAgain: 'Intentar de nuevo',
    dismiss: 'Descartar',
    learnMore: 'Más información'
  }
};

/**
 * Helper para obtener mensajes con parámetros
 */
export const getMessage = (path, ...args) => {
  const keys = path.split('.');
  let message = NOTIFICATION_MESSAGES;
  
  for (const key of keys) {
    message = message[key];
    if (!message) {
      console.warn(`Message not found for path: ${path}`);
      return 'Mensaje no encontrado';
    }
  }
  
  if (typeof message === 'function') {
    return message(...args);
  }
  
  return message;
};

/**
 * Helper para mensajes de estado de tareas
 */
export const getTaskStatusMessage = (status) => {
  const statusMap = {
    'pendiente': 'Pendiente',
    'en-diseño': 'En Diseño',
    'en-progreso': 'En Progreso',
    'aprobado': 'Aprobado',
    'publicado': 'Publicado',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  };
  
  return statusMap[status] || status;
};