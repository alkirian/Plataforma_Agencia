/**
 * Utilidades para controladores HTTP
 */

/**
 * Error HTTP normalizado para usar con el manejador centralizado
 */
export class HttpError extends Error {
  constructor(statusCode, message, meta = {}) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.meta = meta;
  }
}

/**
 * Envuelve un controlador async para propagar errores al middleware
 */
export const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

/**
 * Respuesta exitosa con estructura consistente
 */
export const sendSuccess = (res, data = null, statusCode = 200, extra = {}) => {
  const payload = {
    success: true,
    ...extra,
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

export const sendCreated = (res, data) => sendSuccess(res, data, 201);

export const sendNoContent = (res) => res.status(204).send();

/**
 * Lanza error si faltan campos requeridos en el payload
 */
export const ensureFields = (
  payload,
  fields,
  messagePrefix = "Faltan campos requeridos",
) => {
  const missing = fields.filter((field) => {
    const value = payload?.[field];
    if (value === undefined || value === null) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  });

  if (missing.length > 0) {
    throw new HttpError(400, `${messagePrefix}: ${missing.join(", ")}`, {
      missing,
    });
  }
};
