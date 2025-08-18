// src/api/clients.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleCreateClient, handleGetClients, handleGetClientById, handleGetActivityFeed } from '../controllers/clients.controller.js';
import { handleGetDocumentsForClient, handleUploadDocument, handleDeleteDocument } from '../controllers/documents.controller.js';
import { handleGenerateIdeas, handleChat, handleGetChatHistory } from '../controllers/ai.controller.js';
import { handleMoveDocument } from '../controllers/folders.controller.js';
import scheduleRoutes from './schedule.routes.js';
import folderRoutes from './folders.routes.js';

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

// Mover un documento a una carpeta
router.put('/:clientId/documents/:documentId/move', handleMoveDocument);

// Rutas de IA - deben ir ANTES de la ruta /:clientId genérica
router.post('/:clientId/generate-ideas', handleGenerateIdeas);
router.post('/:clientId/chat', handleChat);
router.get('/:clientId/chat/history', handleGetChatHistory);

// Ruta para el feed de actividad de un cliente
router.get('/:clientId/activity-feed', handleGetActivityFeed);

// Rutas anidadas para carpetas de documentos
router.use('/:clientId/folders', folderRoutes);

// Rutas anidadas para el calendario - ESTA LÍNEA FALTABA
router.use('/:clientId/schedule', scheduleRoutes);

// Ruta para un cliente específico - DEBE IR AL FINAL
router.route('/:clientId')
  .get(handleGetClientById);

export default router;