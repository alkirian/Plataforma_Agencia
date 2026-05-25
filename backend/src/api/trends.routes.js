import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleRunTrends,
  handleRunTrendsForClient,
  handleGetTrendReports,
  handleGetLatestTrendReports,
} from '../controllers/trends.controller.js';

const router = Router();

router.use(protect);

// GET  /api/v1/trends/latest/all  — reporte más reciente de cada cliente
router.get('/latest/all', handleGetLatestTrendReports);

// POST /api/v1/trends/run         — disparar análisis para todos los clientes de la agencia
router.post('/run', handleRunTrends);

// POST /api/v1/trends/run/:clientId — disparar análisis para un cliente específico
router.post('/run/:clientId', handleRunTrendsForClient);

// GET  /api/v1/trends/:clientId   — obtener reportes de un cliente
router.get('/:clientId', handleGetTrendReports);

export default router;
