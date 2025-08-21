import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
import documentsRoutes from './documents.routes.js';
import aiRoutes from './ai.routes.js';
import scheduleRoutes from './schedule.routes.js';
import webSourcesRoutes from './webSources.routes.js';
import { protect } from '../middleware/auth.middleware.js';
import { handleGetAgencyActivityFeed } from '../controllers/activity.controller.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Registra las rutas de los módulos
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/documents', documentsRoutes);
router.use('/ai', aiRoutes);
router.use('/schedule', scheduleRoutes);
router.use(webSourcesRoutes);

// Feed global de actividad de la agencia
router.get('/activity-feed', protect, handleGetAgencyActivityFeed);

export default router;