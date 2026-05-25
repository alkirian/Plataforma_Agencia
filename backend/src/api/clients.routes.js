// src/api/clients.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleCreateClient,
  handleGetClients,
  handleGetClientById,
  handleGetActivityFeed,
  handleGetClientBrandProfile,
  handleUpdateClientCardColor,
  handleUpdateClientBrandProfile,
  handleUpdateClient,
  handleDeleteClient,
  handleGetClientApprovalLink,
  handleCreateClientApprovalLink,
} from '../controllers/clients.controller.js';
import { handleGetDocumentsForClient, handleUploadDocument, handleDeleteDocument } from '../controllers/documents.controller.js';
import { handleGenerateIdeas, handleChat, handleGetChatHistory, handleGenerateImage } from '../controllers/ai.controller.js';
import { handleGetBrandAssets, handleCreateBrandAsset, handleDeleteBrandAsset } from '../controllers/brandAssets.controller.js';
import { handleAutoFillBrandProfile, handleSearchCompanyBrandProfile } from '../controllers/brand.controller.js';
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
router.post('/:clientId/schedule/:itemId/generate-image', handleGenerateImage);


// Ruta para el feed de actividad de un cliente
router.get('/:clientId/activity-feed', handleGetActivityFeed);

// Ruta para identidad de marca del cliente
router.route('/:clientId/brand-profile')
  .get(handleGetClientBrandProfile)
  .put(handleUpdateClientBrandProfile);

router.post('/:clientId/brand-profile/auto-fill', handleAutoFillBrandProfile);
router.post('/:clientId/brand-profile/search-company', handleSearchCompanyBrandProfile);

router.put('/:clientId/card-color', handleUpdateClientCardColor);

router.route('/:clientId/brand-assets')
  .get(handleGetBrandAssets)
  .post(handleCreateBrandAsset);

router.delete('/:clientId/brand-assets/:assetId', handleDeleteBrandAsset);

// Ruta para el enlace de aprobación externo del cliente
router.route('/:clientId/approval-link')
  .get(handleGetClientApprovalLink)
  .post(handleCreateClientApprovalLink);

// Rutas anidadas para el calendario - ESTA LÍNEA FALTABA
router.use('/:clientId/schedule', scheduleRoutes);

// Ruta para un cliente específico - DEBE IR AL FINAL
router.route('/:clientId')
  .get(handleGetClientById)
  .put(handleUpdateClient)
  .delete(handleDeleteClient);

export default router;
