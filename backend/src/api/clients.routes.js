// src/api/clients.routes.js
import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { logger } from "../utils/logger.js";
import {
  handleCreateClient,
  handleGetClients,
  handleGetClientById,
  handleGetActivityFeed,
  handleDeleteClient,
  handleGetClientStats,
  handleUploadClientAvatar,
} from "../controllers/clients.controller.js";
import {
  handleUpdateClientMeta,
  handleListContacts,
  handleUpsertContacts,
  handleDeleteContact,
  handleGetClientUserPreferences,
  handleUpsertClientUserPreference,
  handleDeleteClientUserPreference,
} from "../controllers/clientsExtra.controller.js";
import {
  getDocumentsForClient as handleGetDocumentsForClient,
  uploadDocumentLegacy as handleUploadDocument,
  deleteDocument as handleDeleteDocument,
} from "../controllers/documents.controller.js";
import {
  handleGenerateIdeas,
  handleChat,
  handleGetChatHistory,
  handleIdeaFeedback,
  handleListIdeas,
} from "../controllers/ai.controller.js";
import scheduleRoutes from "./schedule.routes.js";
import {
  validate,
  validateMultiple,
  sanitizeInput,
  clientCreateSchema,
  clientUpdateSchema,
  clientMetaSchema,
  clientIdParamSchema,
  uuidParamSchema,
  contactsBatchSchema,
  userPreferencesSchema,
  generateIdeasSchema,
  chatMessageSchema,
  ideaFeedbackSchema,
  paginationSchema,
  documentUploadEnhancedSchema,
} from "../schemas/validation.js";

const router = Router();

router.use(protect);
router.use(sanitizeInput());

// Middleware de debugging temporal
router.use((req, res, next) => {
  logger.debug("Cliente route", { method: req.method, path: req.path });
  next();
});

// Rutas base para /api/v1/clients
router
  .route("/")
  .get(
    validate(paginationSchema, "query", { logFailures: false }),
    handleGetClients,
  )
  .post(
    validate(clientCreateSchema, "body", {
      logAttempts: true,
      logSuccess: true,
    }),
    handleCreateClient,
  );

// IMPORTANTE: Las rutas específicas deben ir ANTES que las paramétricas
// Rutas anidadas para los documentos de un cliente
router
  .route("/:clientId/documents")
  .get(validate(clientIdParamSchema, "params"), handleGetDocumentsForClient)
  .post(
    validateMultiple(
      { schema: clientIdParamSchema, source: "params" },
      {
        schema: documentUploadEnhancedSchema,
        source: "body",
        options: { logAttempts: true },
      },
    ),
    handleUploadDocument,
  );

// Eliminar un documento específico de un cliente
router.delete(
  "/:clientId/documents/:documentId",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    {
      schema: uuidParamSchema.extend({ documentId: uuidParamSchema.shape.id }),
      source: "params",
    },
  ),
  handleDeleteDocument,
);

// Rutas de IA - deben ir ANTES de la ruta /:clientId genérica
router.post(
  "/:clientId/generate-ideas",
  (req, res, next) => {
    console.log("🔍 RAW REQUEST BODY:", {
      body: req.body,
      platforms: req.body.platforms,
      platformsType: typeof req.body.platforms,
      platformsIsArray: Array.isArray(req.body.platforms),
      platformsKeys:
        typeof req.body.platforms === "object"
          ? Object.keys(req.body.platforms)
          : null,
    });
    next();
  },
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    {
      schema: generateIdeasSchema,
      source: "body",
      options: { logAttempts: true },
    },
  ),
  handleGenerateIdeas,
);

router.post(
  "/:clientId/chat",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    {
      schema: chatMessageSchema,
      source: "body",
      options: { logAttempts: true },
    },
  ),
  handleChat,
);

router.get(
  "/:clientId/chat/history",
  validate(clientIdParamSchema, "params"),
  handleGetChatHistory,
);

router.get(
  "/:clientId/ideas",
  validate(clientIdParamSchema, "params"),
  handleListIdeas,
);

router.post(
  "/:clientId/ideas/:ideaId/feedback",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    { schema: ideaFeedbackSchema, source: "body" },
  ),
  handleIdeaFeedback,
);

// Ruta para el feed de actividad de un cliente
router.get(
  "/:clientId/activity-feed",
  validate(clientIdParamSchema, "params"),
  handleGetActivityFeed,
);

// Preferencias de usuario por cliente (p.ej. color de tarjeta) - deben ir ANTES de rutas paramétricas
router.get("/preferences", handleGetClientUserPreferences);

// Rutas anidadas para el calendario - ESTA LÍNEA FALTABA
router.use("/:clientId/schedule", scheduleRoutes);

// Estadísticas de cliente - ANTES de la ruta genérica
router.get(
  "/:clientId/stats",
  validate(clientIdParamSchema, "params"),
  handleGetClientStats,
);

// Upload de avatar de cliente - ANTES de la ruta genérica
router.post(
  "/:clientId/avatar",
  validate(clientIdParamSchema, "params"),
  handleUploadClientAvatar,
);

// Ruta para un cliente específico - DEBE IR AL FINAL
router
  .route("/:clientId")
  .get(validate(clientIdParamSchema, "params"), handleGetClientById)
  .delete(
    validate(clientIdParamSchema, "params", { logAttempts: true }),
    handleDeleteClient,
  );

// Actualizar metadatos del cliente (website, social_links, name, industry)
router.patch(
  "/:clientId",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    { schema: clientMetaSchema, source: "body", options: { logSuccess: true } },
  ),
  handleUpdateClientMeta,
);

// Contactos del cliente
router.get(
  "/:clientId/contacts",
  validate(clientIdParamSchema, "params"),
  handleListContacts,
);

router.post(
  "/:clientId/contacts",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    {
      schema: contactsBatchSchema,
      source: "body",
      options: { logSuccess: true },
    },
  ),
  handleUpsertContacts,
); // admite crear varios

router.delete(
  "/:clientId/contacts/:contactId",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    {
      schema: uuidParamSchema.extend({ contactId: uuidParamSchema.shape.id }),
      source: "params",
    },
  ),
  handleDeleteContact,
);

// Preferencias de usuario por cliente (p.ej. color de tarjeta)
router.put(
  "/:clientId/preferences",
  validateMultiple(
    { schema: clientIdParamSchema, source: "params" },
    { schema: userPreferencesSchema, source: "body" },
  ),
  handleUpsertClientUserPreference,
);

// Eliminar preferencia de cliente para el usuario (reset a default)
router.delete(
  "/:clientId/preferences",
  validate(clientIdParamSchema, "params"),
  handleDeleteClientUserPreference,
);

export default router;
