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
  handleGetTrashClients,
  handleRestoreClient,
} from '../controllers/clients.controller.js';
import { handleGetDocumentsForClient, handleUploadDocument, handleDeleteDocument, handleDownloadLink } from '../controllers/documents.controller.js';
import { handleGenerateIdeas, handleChat, handleGetChatHistory, handleGenerateImage, handleGenerateCopyFromTrend, handleGetDashboardBriefing, handleGetProactiveProposals } from '../controllers/ai.controller.js';
import { handleTransformProductImage, handleOutpaintImage, handleAdaptFormats } from '../controllers/design.controller.js';
import { handleGetBrandAssets, handleCreateBrandAsset, handleDeleteBrandAsset } from '../controllers/brandAssets.controller.js';
import { handleAutoFillBrandProfile, handleSearchCompanyBrandProfile, handleAnalyzeBrandConsistency, handleChatUpdateBrandProfile, handleGetBrandDnaChatHistory } from '../controllers/brand.controller.js';
import { validate, clientSchema, clientBrandProfileSchema, clientCardColorSchema } from '../schemas/validation.js';
import scheduleRoutes from './schedule.routes.js';
import metaIntegrationRoutes from './metaAds.routes.js';
import linkedinRoutes from './linkedin.routes.js';
import tiktokRoutes from './tiktok.routes.js';
import googleAdsRoutes from './googleAds.routes.js';

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
  .post(validate(clientSchema), handleCreateClient);

// IMPORTANTE: Las rutas específicas deben ir ANTES que las paramétricas
// Rutas anidadas para los documentos de un cliente
router.route('/:clientId/documents')
  .get(handleGetDocumentsForClient)
  .post(handleUploadDocument);

router.post('/:clientId/documents/download-link', handleDownloadLink);

// Eliminar un documento específico de un cliente
router.delete('/:clientId/documents/:documentId', handleDeleteDocument);

// Rutas de IA - deben ir ANTES de la ruta /:clientId genérica
router.post('/:clientId/generate-ideas', handleGenerateIdeas);
router.post('/:clientId/generate-copy', handleGenerateCopyFromTrend);
router.post('/:clientId/chat', handleChat);
router.get('/:clientId/chat/history', handleGetChatHistory);
router.get('/:clientId/dashboard-briefing', handleGetDashboardBriefing);
router.get('/:clientId/proactive-proposals', handleGetProactiveProposals);
router.post('/:clientId/schedule/:itemId/generate-image', handleGenerateImage);

// Rutas de Estudio de Diseño con IA
router.post('/:clientId/design/transform-product', handleTransformProductImage);
router.post('/:clientId/design/outpaint', handleOutpaintImage);
router.post('/:clientId/design/adapt-formats', handleAdaptFormats);


// Ruta para el feed de actividad de un cliente
router.get('/:clientId/activity-feed', handleGetActivityFeed);

// Ruta para identidad de marca del cliente
router.route('/:clientId/brand-profile')
  .get(handleGetClientBrandProfile)
  .put(validate(clientBrandProfileSchema), handleUpdateClientBrandProfile);

router.post('/:clientId/brand-profile/auto-fill', handleAutoFillBrandProfile);
router.post('/:clientId/brand-profile/search-company', handleSearchCompanyBrandProfile);
router.post('/:clientId/brand-profile/analyze-consistency', handleAnalyzeBrandConsistency);
router.get('/:clientId/brand-profile/chat-history', handleGetBrandDnaChatHistory);
router.post('/:clientId/brand-profile/chat-update', handleChatUpdateBrandProfile);

router.put('/:clientId/card-color', validate(clientCardColorSchema), handleUpdateClientCardColor);

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

// Rutas anidadas para la integración con Meta Ads
router.use('/:clientId/meta-integration', metaIntegrationRoutes);

// Rutas anidadas para LinkedIn y TikTok
router.use('/:clientId/linkedin-integration', linkedinRoutes);
router.use('/:clientId/tiktok-integration', tiktokRoutes);
router.use('/:clientId/google-integration', googleAdsRoutes);

// Rutas de administración y papelera (deben ir ANTES de la paramétrica /:clientId)
router.get('/trash', handleGetTrashClients);
router.post('/:clientId/restore', handleRestoreClient);

// Ruta para un cliente específico - DEBE IR AL FINAL
router.route('/:clientId')
  .get(handleGetClientById)
  .put(validate(clientSchema.partial()), handleUpdateClient)
  .delete(handleDeleteClient);

export default router;
