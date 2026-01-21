import { z } from "zod";

// ========================================
// AUTHENTICATION & USER VALIDATION SCHEMAS
// ========================================

// Base email validation with comprehensive regex
const emailSchema = z
  .string()
  .min(1, "Email es requerido")
  .email("Formato de email inválido")
  .max(254, "Email demasiado largo")
  .toLowerCase()
  .trim();

// Strong password validation
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña no puede exceder 128 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número",
  );

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(1, "Nombre completo es requerido")
    .max(100, "Nombre completo no puede exceder 100 caracteres")
    .trim()
    .refine(
      (val) => val.split(" ").length >= 2,
      "Debe incluir nombre y apellido",
    ),
  agencyName: z
    .string()
    .min(1, "Nombre de la agencia es requerido")
    .max(100, "Nombre de la agencia no puede exceder 100 caracteres")
    .trim(),
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Contraseña es requerida")
    .max(128, "Contraseña demasiado larga"),
});

// Email check schema
export const emailCheckSchema = z.object({
  email: emailSchema,
});

// Complete profile schema
export const completeProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Nombre completo es requerido")
    .max(100, "Nombre completo no puede exceder 100 caracteres")
    .trim(),
  agencyName: z
    .string()
    .min(1, "Nombre de la agencia es requerido")
    .max(100, "Nombre de la agencia no puede exceder 100 caracteres")
    .trim(),
  role: z.string().max(50, "Rol no puede exceder 50 caracteres").optional(),
  website: z
    .string()
    .url("Website debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

// ========================================
// AI & CHAT VALIDATION SCHEMAS
// ========================================

// Chat message validation
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Mensaje es requerido")
    .max(4000, "Mensaje no puede exceder 4000 caracteres")
    .trim(),
  context: z.array(z.string()).optional(),
  temperature: z
    .number()
    .min(0, "Temperatura debe ser mayor o igual a 0")
    .max(2, "Temperatura debe ser menor o igual a 2")
    .optional()
    .default(0.7),
});

// Generate ideas validation - updated to match frontend data structure
export const generateIdeasSchema = z.object({
  userPrompt: z
    .string()
    .max(2000, "Prompt no puede exceder 2000 caracteres")
    .trim()
    .optional()
    .default(""),
  // Frontend compatibility fields
  sessionId: z.string().optional(),
  previousIdeas: z.array(z.any()).optional().default([]),
  includeContext: z.boolean().optional().default(true),
  // Backend specific fields
  count: z
    .number()
    .int("Número de ideas debe ser entero")
    .min(1, "Debe generar al menos 1 idea")
    .max(20, "No se pueden generar más de 20 ideas")
    .optional()
    .default(5),
  tone: z
    .string()
    .max(50, "Tono no puede exceder 50 caracteres")
    .optional()
    .default("Profesional"),
  preferWeekdays: z.boolean().optional().default(true),
  platforms: z.preprocess(
    (val) => {
      // Si es un objeto con keys numéricas, convertir a array
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const keys = Object.keys(val);
        if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
          return keys.map((k) => val[k]);
        }
      }
      return val;
    },
    z
      .array(z.string().max(20, "Plataforma no puede exceder 20 caracteres"))
      .optional()
      .default([]),
  ),
  monthContext: z.array(z.any()).optional().default([]),
  allowedWeekdays: z.array(z.number().min(1).max(7)).nullable().optional(),
  month: z.number().int().min(1).max(12).nullable().optional(),
  year: z.number().int().min(2020).max(2030).nullable().optional(),
});

// Idea feedback validation - updated to match frontend data structure
export const ideaFeedbackSchema = z.object({
  value: z.enum(["like", "dislike", "clear"]),
  notes: z
    .string()
    .max(500, "Notas no pueden exceder 500 caracteres")
    .optional(),
});

// ========================================
// CONTEXT SOURCES VALIDATION SCHEMAS
// ========================================

// Base context source schema
const baseContextSourceSchema = z.object({
  title: z
    .string()
    .max(200, "Título no puede exceder 200 caracteres")
    .optional(),
  description: z
    .string()
    .max(1000, "Descripción no puede exceder 1000 caracteres")
    .optional(),
  tags: z
    .array(z.string().max(30, "Tag no puede exceder 30 caracteres"))
    .max(10, "No se pueden tener más de 10 tags")
    .optional(),
  importance: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

// Document source validation
export const documentSourceSchema = baseContextSourceSchema.extend({
  file_name: z
    .string()
    .min(1, "Nombre de archivo es requerido")
    .max(255, "Nombre de archivo no puede exceder 255 caracteres"),
  storage_path: z.string().min(1, "Ruta de almacenamiento es requerida"),
  file_type: z
    .string()
    .min(1, "Tipo de archivo es requerido")
    .refine(
      (val) => ["pdf", "docx", "txt", "md", "doc"].includes(val.toLowerCase()),
      "Tipo de archivo no soportado",
    ),
  file_size: z
    .number()
    .positive("Tamaño de archivo debe ser positivo")
    .max(50 * 1024 * 1024, "Archivo no puede exceder 50MB"),
  metadata: z.record(z.any()).optional(),
});

// URL source validation
export const urlSourceSchema = baseContextSourceSchema.extend({
  url: z
    .string()
    .url("URL debe ser válida")
    .refine((val) => {
      try {
        const url = new URL(val);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    }, "URL debe usar protocolo HTTP o HTTPS"),
});

// Manual source validation
export const manualSourceSchema = baseContextSourceSchema.extend({
  content: z
    .string()
    .min(1, "Contenido es requerido")
    .max(10000, "Contenido no puede exceder 10,000 caracteres"),
  category: z
    .string()
    .max(50, "Categoría no puede exceder 50 caracteres")
    .optional(),
});

// Note source validation
export const noteSourceSchema = baseContextSourceSchema.extend({
  note: z
    .string()
    .min(1, "Nota es requerida")
    .max(5000, "Nota no puede exceder 5,000 caracteres"),
  note_type: z
    .enum(["general", "strategy", "brand", "campaign", "research"])
    .optional()
    .default("general"),
});

// Context search validation
export const contextSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Query de búsqueda es requerido")
    .max(500, "Query no puede exceder 500 caracteres")
    .trim(),
  source_types: z
    .array(z.enum(["document", "url", "manual", "note"]))
    .optional(),
  limit: z
    .number()
    .int("Límite debe ser entero")
    .min(1, "Límite debe ser al menos 1")
    .max(50, "Límite no puede exceder 50")
    .optional()
    .default(10),
});

// ========================================
// CLIENT MANAGEMENT VALIDATION SCHEMAS
// ========================================

// Enhanced client schema with more validation
export const clientCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Nombre del cliente es requerido")
    .max(100, "Nombre no puede exceder 100 caracteres")
    .trim(),
  email: z
    .string()
    .email("Email debe ser una dirección válida")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "Teléfono debe tener al menos 10 dígitos")
    .max(20, "Teléfono no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  industry: z
    .string()
    .max(50, "Industria no puede exceder 50 caracteres")
    .optional()
    .nullable(),
  website: z
    .string()
    .url("Website debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Descripción no puede exceder 1000 caracteres")
    .optional(),
});

// Client update schema (partial)
export const clientUpdateSchema = clientCreateSchema.partial();

// Client metadata schema
export const clientMetaSchema = z.object({
  website: z
    .string()
    .url("Website debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  social_links: z
    .object({
      facebook: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      tiktok: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  name: z
    .string()
    .min(1, "Nombre es requerido")
    .max(100, "Nombre no puede exceder 100 caracteres")
    .optional(),
  industry: z
    .string()
    .max(50, "Industria no puede exceder 50 caracteres")
    .optional()
    .nullable(),
});

// Contact validation
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Nombre del contacto es requerido")
    .max(100, "Nombre no puede exceder 100 caracteres")
    .trim(),
  email: emailSchema.optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido")
    .max(20, "Teléfono no puede exceder 20 caracteres")
    .optional(),
  position: z
    .string()
    .max(100, "Posición no puede exceder 100 caracteres")
    .optional(),
  is_primary: z.boolean().optional().default(false),
  notes: z
    .string()
    .max(500, "Notas no pueden exceder 500 caracteres")
    .optional(),
});

// Batch contacts validation
export const contactsBatchSchema = z.object({
  contacts: z
    .array(contactSchema)
    .min(1, "Debe incluir al menos un contacto")
    .max(20, "No se pueden agregar más de 20 contactos a la vez"),
});

// User preferences validation
export const userPreferencesSchema = z.object({
  card_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color debe ser un código hex válido")
    .optional(),
  notification_settings: z
    .object({
      email_updates: z.boolean().optional(),
      push_notifications: z.boolean().optional(),
    })
    .optional(),
  dashboard_layout: z.enum(["grid", "list", "compact"]).optional(),
});

// Legacy schema - use clientCreateSchema for new implementations
export const clientSchema = clientCreateSchema;

export const scheduleItemSchema = z.object({
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(200, "El título no puede exceder 200 caracteres")
    .trim(),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .nullable(),
  copy: z
    .string()
    .max(2000, "El copy no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
  scheduled_at: z
    .string()
    .datetime("Fecha y hora deben estar en formato ISO 8601"),
  status: z
    .enum(["pending", "in-design", "approved", "cancelled", "published"])
    .default("pending"),
  priority: z
    .enum([
      "baja",
      "media",
      "alta",
      "urgente",
      "low",
      "medium",
      "high",
      "Baja",
      "Media",
      "Alta",
      "Urgente",
    ])
    .optional(),
  channel: z
    .string()
    .max(50, "El canal no puede exceder 50 caracteres")
    .optional()
    .nullable(),
  client_id: z.string().uuid("client_id debe ser un UUID válido").optional(), // Será añadido por el controller
  
  // New Social Media Fields
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'youtube', 'other']).optional(),
  post_type: z.enum(['post', 'reel', 'story', 'carousel', 'video', 'other']).optional(),
  media_urls: z.array(
    z.object({
      url: z.string().url(),
      type: z.enum(['image', 'video']),
      order: z.number().optional()
    })
  ).optional().default([]),
  caption: z.string().max(2200, "El caption no puede exceder 2200 caracteres").optional().nullable(),
  hashtags: z.preprocess(
    (val) => {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        return Object.values(val);
      }
      return Array.isArray(val) ? val : [];
    },
    z.array(z.string()).optional().default([])
  ),
  location: z.string().max(100).optional().nullable(),
  collaborators: z.array(z.string()).optional().default([]),
  is_published: z.boolean().optional().default(false)
});

export const scheduleItemUpdateSchema = scheduleItemSchema
  .partial()
  .omit({ client_id: true });

export const documentUploadSchema = z.object({
  filename: z.string().min(1, "El nombre del archivo es requerido"),
  mimetype: z.string().min(1, "El tipo de archivo es requerido"),
  size: z
    .number()
    .positive("El tamaño del archivo debe ser positivo")
    .max(10 * 1024 * 1024, "El archivo no puede exceder 10MB"),
});

export const activityLogSchema = z.object({
  agency_id: z.string().uuid("agency_id debe ser un UUID válido"),
  client_id: z.string().uuid("client_id debe ser un UUID válido"),
  user_id: z.string().uuid("user_id debe ser un UUID válido"),
  action_type: z.enum([
    "CLIENT_CREATED",
    "CLIENT_UPDATED",
    "CLIENT_DELETED",
    "SCHEDULE_ITEM_CREATED",
    "SCHEDULE_ITEM_UPDATED",
    "SCHEDULE_ITEM_DELETED",
    "DOCUMENT_UPLOADED",
    "DOCUMENT_DELETED",
  ]),
  details: z.record(z.any()).optional(),
});

// Schemas para parámetros de URL
export const uuidParamSchema = z.object({
  id: z.string().uuid("ID debe ser un UUID válido"),
});

export const clientIdParamSchema = z.object({
  clientId: z.string().uuid("Client ID debe ser un UUID válido"),
});

export const scheduleParamsSchema = z.object({
  clientId: z.string().uuid("Client ID debe ser un UUID válido"),
  itemId: z.string().uuid("Item ID debe ser un UUID válido").optional(),
});

// Schemas para query parameters
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, "La página debe ser mayor a 0")
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .refine(
      (val) => val > 0 && val <= 100,
      "El límite debe estar entre 1 y 100",
    )
    .default("10"),
});

// ========================================
// DOCUMENT & FILE VALIDATION SCHEMAS
// ========================================

// Enhanced document upload validation
export const documentUploadEnhancedSchema = z.object({
  filename: z
    .string()
    .min(1, "Nombre de archivo es requerido")
    .max(255, "Nombre de archivo no puede exceder 255 caracteres")
    .refine(
      (val) => !val.includes(".."),
      'Nombre de archivo no puede contener ".."',
    )
    .refine(
      (val) => !/[<>:"/\\|?*]/.test(val),
      "Nombre de archivo contiene caracteres no permitidos",
    ),
  mimetype: z
    .string()
    .min(1, "Tipo de archivo es requerido")
    .refine(
      (val) =>
        [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "text/plain",
          "text/markdown",
          "application/rtf",
        ].includes(val),
      "Tipo de archivo no permitido",
    ),
  size: z
    .number()
    .positive("Tamaño de archivo debe ser positivo")
    .max(50 * 1024 * 1024, "Archivo no puede exceder 50MB"),
  checksum: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "Checksum SHA-256 inválido")
    .optional(),
});

// ========================================
// SECURITY & SANITIZATION HELPERS
// ========================================

// Sanitized string schema for user inputs
const sanitizedStringSchema = (minLength = 0, maxLength = 1000) =>
  z
    .string()
    .min(minLength)
    .max(maxLength)
    .transform((val) => val.trim())
    .refine(
      (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
      "Contenido contiene scripts no permitidos",
    )
    .refine(
      (val) => !/javascript:|data:|vbscript:|on\w+\s*=/gi.test(val),
      "Contenido contiene código potencialmente malicioso",
    );

// Rate limiting validation for sensitive endpoints
export const rateLimitBypassSchema = z.object({
  bypass_token: z
    .string()
    .uuid("Token de bypass debe ser UUID válido")
    .optional(),
});

// ========================================
// ENHANCED MIDDLEWARE VALIDATION
// ========================================

// Helper function para validar datos with enhanced error reporting
export const validateData = (schema, data, options = {}) => {
  try {
    const result = schema.parse(data);

    // Log successful validation in development
    if (process.env.NODE_ENV === "development" && options.logSuccess) {
      console.log(`✅ Validation passed for ${options.context || "unknown"}`);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Enhanced error logging
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ Validation failed for ${options.context || "unknown"}:`,
        error.errors,
      );
    }

    return {
      success: false,
      errors: error.errors?.map((err) => ({
        path: err.path?.join(".") || "unknown",
        message: err.message,
        code: err.code || "validation_error",
        ...(process.env.NODE_ENV === "development" && {
          received: err.received,
        }),
      })) || [
        {
          path: "unknown",
          message: error.message || "Error de validación",
          code: "unknown_error",
        },
      ],
    };
  }
};

// Enhanced middleware para validación automática with security features
export const validate = (schema, source = "body", options = {}) => {
  return (req, res, next) => {
    const dataToValidate =
      source === "params"
        ? req.params
        : source === "query"
          ? req.query
          : req.body;

    // Log validation attempt for sensitive endpoints
    if (options.logAttempts) {
      console.log(`🔍 Validating ${source} for ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent")?.substring(0, 100),
      });
    }

    let validationResult;
    try {
      // Debug: log para depurar el error de platforms
      if (dataToValidate?.platforms) {
        console.log("🔍 DEBUG platforms:", {
          platforms: dataToValidate.platforms,
          isArray: Array.isArray(dataToValidate.platforms),
          type: typeof dataToValidate.platforms,
          keys:
            typeof dataToValidate.platforms === "object"
              ? Object.keys(dataToValidate.platforms)
              : null,
        });
      }

      const validatedData = schema.parse(dataToValidate);
      validationResult = { success: true, data: validatedData };
    } catch (error) {
      // Log validation failures for security monitoring
      if (options.logFailures !== false) {
        console.warn(`🚨 Validation failed for ${req.method} ${req.path}`, {
          ip: req.ip,
          errorMessage: error.message,
          data:
            typeof dataToValidate === "object"
              ? Object.keys(dataToValidate)
              : "non-object",
        });
      }

      // Zod 4.x: errors are in error.message as JSON string
      let errors;
      try {
        const parsed = JSON.parse(error.message);
        errors = Array.isArray(parsed)
          ? parsed.map((err) => ({
              path: Array.isArray(err.path)
                ? err.path.join(".")
                : err.path || "unknown",
              message: err.message || "Error de validación",
              code: err.code || "validation_error",
            }))
          : [
              {
                path: "unknown",
                message: error.message,
                code: "validation_error",
              },
            ];
      } catch {
        // Fallback si no es JSON
        errors = [
          {
            path: "unknown",
            message: error.message || "Error de validación",
            code: "unknown_error",
          },
        ];
      }

      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            source,
            receivedKeys:
              typeof dataToValidate === "object"
                ? Object.keys(dataToValidate)
                : [],
            zodError: error.message,
          },
        }),
      });
    }

    if (!validationResult.success) {
      return;
    }

    // Store validated data with security metadata
    const validationMeta = {
      validatedAt: new Date(),
      schema: schema.constructor?.name || "ZodSchema",
      source,
    };

    if (source === "params") {
      req.validatedParams = validationResult.data;
      req.validationMeta = { ...req.validationMeta, params: validationMeta };
    } else if (source === "query") {
      req.validatedQuery = validationResult.data;
      req.validationMeta = { ...req.validationMeta, query: validationMeta };
    } else {
      req.validatedBody = validationResult.data;
      req.validationMeta = { ...req.validationMeta, body: validationMeta };
    }

    next();
  };
};

// Multiple validation middleware for endpoints that need body, params, and query validation
export const validateMultiple = (...validations) => {
  return (req, res, next) => {
    req.validationMeta = {};

    const runValidation = (index) => {
      if (index >= validations.length) {
        return next();
      }

      const { schema, source, options } = validations[index];
      const middleware = validate(schema, source, options);

      middleware(req, res, (err) => {
        if (err) return next(err);
        runValidation(index + 1);
      });
    };

    runValidation(0);
  };
};

// Sanitization middleware for critical security
export const sanitizeInput = (options = {}) => {
  return (req, res, next) => {
    const sanitizeObject = (obj) => {
      if (typeof obj !== "object" || obj === null) return obj;

      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          // Remove potential XSS vectors
          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/data:/gi, "")
            .replace(/vbscript:/gi, "")
            .replace(/on\w+\s*=/gi, "");
        } else if (typeof value === "object") {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    if (options.body !== false) {
      req.body = sanitizeObject(req.body);
    }

    if (options.query !== false) {
      req.query = sanitizeObject(req.query);
    }

    next();
  };
};
