/**
 * Sistema de logging profesional y escalable
 * Reemplaza console.log con logging estructurado y controlado por entorno
 */

// Niveles de logging con colores para desarrollo
const LOG_LEVELS = {
  ERROR: { level: 0, color: '\x1b[31m', name: 'ERROR' }, // Rojo
  WARN: { level: 1, color: '\x1b[33m', name: 'WARN' },   // Amarillo
  INFO: { level: 2, color: '\x1b[36m', name: 'INFO' },   // Cyan
  DEBUG: { level: 3, color: '\x1b[35m', name: 'DEBUG' }, // Magenta
  TRACE: { level: 4, color: '\x1b[37m', name: 'TRACE' }  // Blanco
};

// Configuración del logger
const config = {
  // En producción solo errores y warnings críticos
  level: import.meta.env.PROD ? LOG_LEVELS.WARN.level : LOG_LEVELS.TRACE.level,
  
  // Prefijo para identificar logs de la aplicación
  prefix: '[PLATAFORMA]',
  
  // Timestamp en desarrollo
  timestamp: !import.meta.env.PROD,
  
  // Colores en desarrollo
  colors: !import.meta.env.PROD,
  
  // Contexto adicional (componente, usuario, etc.)
  includeContext: true
};

/**
 * Formatea el mensaje de log con timestamp, nivel y contexto
 */
const formatMessage = (level, message, context = {}) => {
  const levelInfo = LOG_LEVELS[level];
  const timestamp = config.timestamp ? new Date().toISOString().slice(11, 23) : '';
  const colorStart = config.colors ? levelInfo.color : '';
  const colorEnd = config.colors ? '\x1b[0m' : '';
  
  let formattedMessage = `${colorStart}${config.prefix} [${levelInfo.name}]${colorEnd}`;
  
  if (timestamp) {
    formattedMessage += ` ${timestamp}`;
  }
  
  formattedMessage += ` ${message}`;
  
  return { formattedMessage, context };
};

/**
 * Determina si debe loggear según el nivel configurado
 */
const shouldLog = (level) => {
  return LOG_LEVELS[level].level <= config.level;
};

/**
 * Logger principal - Sistema escalable y profesional
 */
export const logger = {
  /**
   * Errores críticos - Siempre se loggean
   * Para errores que requieren atención inmediata
   */
  error: (message, context = {}) => {
    if (!shouldLog('ERROR')) return;
    
    const { formattedMessage } = formatMessage('ERROR', message, context);
    console.error(formattedMessage, context);
    
    // En producción, podrías enviar a servicio de monitoreo
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('event', 'exception', {
        description: message,
        fatal: false
      });
    }
  },

  /**
   * Advertencias importantes - Se loggean en desarrollo y producción
   * Para situaciones que no son errores pero requieren atención
   */
  warn: (message, context = {}) => {
    if (!shouldLog('WARN')) return;
    
    const { formattedMessage } = formatMessage('WARN', message, context);
    console.warn(formattedMessage, context);
  },

  /**
   * Información general - Solo en desarrollo
   * Para flujo normal de la aplicación
   */
  info: (message, context = {}) => {
    if (!shouldLog('INFO')) return;
    
    const { formattedMessage } = formatMessage('INFO', message, context);
    console.info(formattedMessage, context);
  },

  /**
   * Debug detallado - Solo en desarrollo
   * Para debugging y desarrollo
   */
  debug: (message, context = {}) => {
    if (!shouldLog('DEBUG')) return;
    
    const { formattedMessage } = formatMessage('DEBUG', message, context);
    console.log(formattedMessage, context);
  },

  /**
   * Trace muy detallado - Solo en desarrollo
   * Para debugging avanzado y seguimiento de flujos complejos
   */
  trace: (message, context = {}) => {
    if (!shouldLog('TRACE')) return;
    
    const { formattedMessage } = formatMessage('TRACE', message, context);
    console.log(formattedMessage, context);
  },

  /**
   * Grupos de logs para organizar información relacionada
   */
  group: (label, callback) => {
    if (!import.meta.env.PROD) {
      console.group(`${config.prefix} ${label}`);
      callback();
      console.groupEnd();
    } else {
      // En producción ejecuta sin agrupar
      callback();
    }
  },

  /**
   * Timing para medir performance
   */
  time: (label) => {
    if (!import.meta.env.PROD) {
      console.time(`${config.prefix} ${label}`);
    }
  },

  timeEnd: (label) => {
    if (!import.meta.env.PROD) {
      console.timeEnd(`${config.prefix} ${label}`);
    }
  },

  /**
   * Logging de tabla para datos estructurados
   */
  table: (data, columns) => {
    if (!import.meta.env.PROD) {
      console.table(data, columns);
    }
  }
};

/**
 * Helper para logging condicional por componente
 */
export const createComponentLogger = (componentName) => ({
  error: (message, context) => logger.error(`[${componentName}] ${message}`, context),
  warn: (message, context) => logger.warn(`[${componentName}] ${message}`, context),
  info: (message, context) => logger.info(`[${componentName}] ${message}`, context),
  debug: (message, context) => logger.debug(`[${componentName}] ${message}`, context),
  trace: (message, context) => logger.trace(`[${componentName}] ${message}`, context)
});

/**
 * Helper para logging de APIs
 */
export const apiLogger = {
  request: (method, url, data) => {
    logger.debug(`API ${method.toUpperCase()} ${url}`, { data });
  },
  
  response: (method, url, status, data) => {
    if (status >= 400) {
      logger.error(`API ${method.toUpperCase()} ${url} failed`, { status, data });
    } else {
      logger.debug(`API ${method.toUpperCase()} ${url} success`, { status, data });
    }
  },
  
  error: (method, url, error) => {
    logger.error(`API ${method.toUpperCase()} ${url} error`, { error: error.message });
  }
};

/**
 * Helper para logging de autenticación
 */
export const authLogger = createComponentLogger('Auth');

/**
 * Helper para logging de documentos
 */
export const documentsLogger = createComponentLogger('Documents');

/**
 * Helper para logging del calendario
 */
export const calendarLogger = createComponentLogger('Calendar');

export default logger;