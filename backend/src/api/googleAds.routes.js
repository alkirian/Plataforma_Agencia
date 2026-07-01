import { Router } from 'express';
import {
  handleGetGoogleConfig,
  handleGetGoogleIntegration,
  handleSaveGoogleIntegration,
  handleDeleteGoogleIntegration,
  handleExchangeGoogleToken,
  handleGetGoogleCampaigns,
  handleGetGoogleRules,
  handleSaveGoogleRules
} from '../controllers/googleAds.controller.js';

const router = Router({ mergeParams: true });

// Configuración inicial de OAuth de Google
router.get('/config', handleGetGoogleConfig);

// Intercambio de code de Google
router.post('/exchange-token', handleExchangeGoogleToken);

// Reglas de optimización de anuncios de Google
router.route('/rules')
  .get(handleGetGoogleRules)
  .post(handleSaveGoogleRules);

// Consultar campañas y analíticas
router.get('/campaigns', handleGetGoogleCampaigns);

// Rutas principales para la integración
router.route('/')
  .get(handleGetGoogleIntegration)
  .post(handleSaveGoogleIntegration)
  .delete(handleDeleteGoogleIntegration);

export default router;
