// src/api/clients.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleCreateClient, handleGetClients, handleGetClientById, handleGetActivityFeed, handleDeleteClient } from '../controllers/clients.controller.js';
import { handleUpdateClientMeta, handleListContacts, handleUpsertContacts, handleDeleteContact, handleGetClientUserPreferences, handleUpsertClientUserPreference, handleDeleteClientUserPreference } from '../controllers/clientsExtra.controller.js';
import { getDocumentsForClient as handleGetDocumentsForClient, uploadDocumentLegacy as handleUploadDocument, deleteDocument as handleDeleteDocument } from '../controllers/documents.controller.js';
import { handleGenerateIdeas, handleChat, handleGetChatHistory, handleIdeaFeedback, handleListIdeas } from '../controllers/ai.controller.js';
import scheduleRoutes from './schedule.routes.js';

const router = Router();

router.use(protect);

// Middleware de debugging temporal
router.use((req, res, next) => {
  console.log(`🔍 Cliente route: ${req.method} ${req.path}`);
  next();
});

// Rutas base para /api/v1/clients
router.route('/')
  .get(handleGetClients)
  .post(handleCreateClient);

// IMPORTANTE: Las rutas específicas deben ir ANTES que las paramétricas
// Rutas anidadas para los documentos de un cliente
router.route('/:clientId/documents')
  .get(handleGetDocumentsForClient)
  .post(handleUploadDocument);

// Eliminar un documento específico de un cliente
router.delete('/:clientId/documents/:documentId', handleDeleteDocument);

// Rutas de IA - deben ir ANTES de la ruta /:clientId genérica
router.post('/:clientId/generate-ideas', handleGenerateIdeas);
router.post('/:clientId/chat', handleChat);
router.get('/:clientId/chat/history', handleGetChatHistory);
router.get('/:clientId/ideas', handleListIdeas);
router.post('/:clientId/ideas/:ideaId/feedback', handleIdeaFeedback);

// Ruta para el feed de actividad de un cliente
router.get('/:clientId/activity-feed', handleGetActivityFeed);

// Preferencias de usuario por cliente (p.ej. color de tarjeta) - deben ir ANTES de rutas paramétricas
router.get('/preferences', handleGetClientUserPreferences);

// Rutas anidadas para el calendario - ESTA LÍNEA FALTABA
router.use('/:clientId/schedule', scheduleRoutes);

// Ruta para un cliente específico - DEBE IR AL FINAL
router.route('/:clientId')
  .get(handleGetClientById)
  .delete(handleDeleteClient);

// Actualizar metadatos del cliente (website, social_links, name, industry)
router.patch('/:clientId', handleUpdateClientMeta);

// Contactos del cliente
router.get('/:clientId/contacts', handleListContacts);
router.post('/:clientId/contacts', handleUpsertContacts); // admite crear varios
router.delete('/:clientId/contacts/:contactId', handleDeleteContact);

// Preferencias de usuario por cliente (p.ej. color de tarjeta)
router.put('/:clientId/preferences', handleUpsertClientUserPreference);
// Eliminar preferencia de cliente para el usuario (reset a default)
router.delete('/:clientId/preferences', handleDeleteClientUserPreference);

export default router;
