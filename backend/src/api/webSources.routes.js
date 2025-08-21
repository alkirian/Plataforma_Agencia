// src/api/webSources.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleStartScraping, handleListWebSources } from '../controllers/webSources.controller.js';

const router = Router({ mergeParams: true });

// Todas protegidas
router.use(protect);

// Lista de fuentes de un cliente
router.get('/clients/:clientId/web-sources', handleListWebSources);

// Iniciar scraping para un cliente
router.post('/clients/:clientId/scrape-website', handleStartScraping);

export default router;
