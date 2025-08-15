// src/api/clients.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleCreateClient, handleGetClients, handleGetClientById } from '../controllers/clients.controller.js';
import { handleGetDocumentsForClient, handleUploadDocument } from '../controllers/documents.controller.js';
import { handleGenerateIdeas } from '../controllers/ai.controller.js';
import scheduleRoutes from './schedule.routes.js';

const router = Router();

router.use(protect);

// Rutas base para /api/v1/clients
router.route('/')
  .get(handleGetClients)
  .post(handleCreateClient);

// Ruta para un cliente específico /api/v1/clients/:clientId
router.route('/:clientId')
  .get(handleGetClientById);

// Rutas anidadas para los documentos de un cliente: /api/v1/clients/:clientId/documents
router.route('/:clientId/documents')
  .get(handleGetDocumentsForClient)
  .post(handleUploadDocument);

// Ruta anidada para la IA: /api/v1/clients/:clientId/generate-ideas
router.post('/:clientId/generate-ideas', handleGenerateIdeas);

// Rutas anidadas para el calendario: /api/v1/clients/:clientId/schedule
router.use('/:clientId/schedule', scheduleRoutes);

export default router;