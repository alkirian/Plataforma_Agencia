/**
 * Sistema de logging centralizado para el backend
 * Evita console.log en producción y proporciona logging estructurado
 */

const isDevelopment = process.env.NODE_ENV !== "production";

const formatTimestamp = () => new Date().toISOString();

const formatMessage = (level, message, context = {}) => {
  const contextStr =
    Object.keys(context).length > 0
      ? ` | context=${JSON.stringify(context)}`
      : "";

  return `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

const log = (level, consoleMethod, message, context = {}, options = {}) => {
  const { devOnly = false } = options;
  if (devOnly && !isDevelopment) return;

  const method = console[consoleMethod] || console.log;
  method(formatMessage(level, message, context));
};

/**
 * Logger centralizado
 */
export const logger = {
  /**
   * Log de información (solo en desarrollo)
   */
  info: (message, context = {}) =>
    log("info", "log", message, context, { devOnly: true }),

  /**
   * Log de warnings (siempre se muestra)
   */
  warn: (message, context = {}) => log("warn", "warn", message, context),

  /**
   * Log de errores (siempre se muestra)
   */
  error: (message, error = null, context = {}) => {
    const errorContext = {
      ...context,
      ...(error && {
        error: error.message,
        stack: error.stack,
      }),
    };
    log("error", "error", message, errorContext);
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, context = {}) =>
    log("debug", "debug", message, context, { devOnly: true }),

  /**
   * Log de requests HTTP (solo en desarrollo)
   */
  request: (method, url, userId = null) => {
    const context = userId ? { userId } : {};
    log("request", "log", `${method} ${url}`, context, { devOnly: true });
  },

  /**
   * Log de inicio del servidor
   */
  server: (message, context = {}) => {
    log("server", "log", message, context);
  },
};

/**
 * Middleware de logging para Express
 */
export const requestLogger = (req, res, next) => {
  const userId = req.user?.id || null;
  logger.request(req.method, req.url, userId);
  next();
};
