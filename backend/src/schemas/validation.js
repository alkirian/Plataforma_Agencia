import { z } from 'zod';

// Esquemas para validación de datos
export const clientSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  industry: z.string()
    .max(50, 'La industria no puede exceder 50 caracteres')
    .optional()
    .nullable()
    .default(null)
});

export const scheduleItemSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  description: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
  copy: z.string()
    .max(2000, 'El copy no puede exceder 2000 caracteres')
    .optional()
    .nullable(),
  scheduled_at: z.string()
    .datetime('Fecha y hora deben estar en formato ISO 8601'),
  status: z.enum(['pendiente', 'en-diseño', 'en-progreso', 'aprobado', 'publicado', 'cancelado', 'Pendiente', 'En Diseño', 'En Progreso', 'Aprobado', 'Publicado', 'Cancelado'])
    .default('pendiente'),
  priority: z.enum(['baja', 'media', 'alta', 'urgente', 'low', 'medium', 'high', 'Baja', 'Media', 'Alta', 'Urgente'])
    .optional(),
  channel: z.string()
    .max(50, 'El canal no puede exceder 50 caracteres')
    .optional()
    .nullable(),
  client_id: z.string()
    .uuid('client_id debe ser un UUID válido')
    .optional() // Será añadido por el controller
});

export const scheduleItemUpdateSchema = scheduleItemSchema.partial().omit({ client_id: true });

export const documentUploadSchema = z.object({
  filename: z.string()
    .min(1, 'El nombre del archivo es requerido'),
  mimetype: z.string()
    .min(1, 'El tipo de archivo es requerido'),
  size: z.number()
    .positive('El tamaño del archivo debe ser positivo')
    .max(10 * 1024 * 1024, 'El archivo no puede exceder 10MB')
});

export const activityLogSchema = z.object({
  agency_id: z.string()
    .uuid('agency_id debe ser un UUID válido'),
  client_id: z.string()
    .uuid('client_id debe ser un UUID válido'),
  user_id: z.string()
    .uuid('user_id debe ser un UUID válido'),
  action_type: z.enum([
    'CLIENT_CREATED',
    'CLIENT_UPDATED', 
    'CLIENT_DELETED',
    'SCHEDULE_ITEM_CREATED',
    'SCHEDULE_ITEM_UPDATED',
    'SCHEDULE_ITEM_DELETED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_DELETED'
  ]),
  details: z.record(z.any()).optional()
});

// Schemas para parámetros de URL
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido')
});

export const clientIdParamSchema = z.object({
  clientId: z.string().uuid('Client ID debe ser un UUID válido')
});

export const scheduleParamsSchema = z.object({
  clientId: z.string().uuid('Client ID debe ser un UUID válido'),
  itemId: z.string().uuid('Item ID debe ser un UUID válido').optional()
});

// Schemas para query parameters
export const paginationSchema = z.object({
  page: z.string()
    .transform(val => parseInt(val))
    .refine(val => val > 0, 'La página debe ser mayor a 0')
    .default('1'),
  limit: z.string()
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, 'El límite debe estar entre 1 y 100')
    .default('10')
});

// Helper function para validar datos
export const validateData = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors?.map(err => ({
        path: err.path?.join('.') || 'unknown',
        message: err.message
      })) || [{ path: 'unknown', message: error.message || 'Error de validación' }]
    };
  }
};

// Middleware para validación automática
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'params' ? req.params : 
                          source === 'query' ? req.query : 
                          req.body;

    const result = validateData(schema, dataToValidate);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: result.errors
      });
    }

    // Almacenar los datos validados
    if (source === 'params') {
      req.validatedParams = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.validatedBody = result.data;
    }

    next();
  };
};