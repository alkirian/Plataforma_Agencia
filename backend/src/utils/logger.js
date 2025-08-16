/**
 * Sistema de logging centralizado para el backend
 * Evita console.log en producción y proporciona logging estructurado
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Formatea un timestamp para logs
 */
const formatTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formatea el mensaje de log con contexto
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = formatTimestamp();
  const contextStr = Object.keys(context).length > 0 
    ? ` | Context: ${JSON.stringify(context)}` 
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * Logger centralizado
 */
export const logger = {
  /**
   * Log de información (solo en desarrollo)
   */
  info: (message, context = {}) => {
    if (isDevelopment) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Log de warnings (siempre se muestra)
   */
  warn: (message, context = {}) => {
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Log de errores (siempre se muestra)
   */
  error: (message, error = null, context = {}) => {
    const errorContext = {
      ...context,
      ...(error && {
        error: error.message,
        stack: error.stack
      })
    };
    console.error(formatMessage('error', message, errorContext));
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, context = {}) => {
    if (isDevelopment) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  /**
   * Log de requests HTTP (solo en desarrollo)
   */
  request: (method, url, userId = null) => {
    if (isDevelopment) {
      const context = userId ? { userId } : {};
      logger.info(`${method} ${url}`, context);
    }
  },

  /**
   * Log de inicio del servidor
   */
  server: (message, context = {}) => {
    console.log(formatMessage('server', message, context));
  }
};

/**
 * Middleware de logging para Express
 */
export const requestLogger = (req, res, next) => {
  const userId = req.user?.id || null;
  logger.request(req.method, req.url, userId);
  next();
};