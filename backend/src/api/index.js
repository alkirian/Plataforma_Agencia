import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
import documentsRoutes from './documents.routes.js';
import aiRoutes from './ai.routes.js';
import scheduleRoutes from './schedule.routes.js';
import invitationRoutes from './invitations.routes.js';
import trendsRoutes from './trends.routes.js';
import sharedRoutes from './shared.routes.js';
import webhooksRoutes from './webhooks.routes.js';
import { protect } from '../middleware/auth.middleware.js';
import { handleGetAgencyActivityFeed } from '../controllers/activity.controller.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Registra las rutas de los módulos
router.use('/users', protect, userRoutes); // proteger rutas
router.use('/clients', protect, clientRoutes);
router.use('/documents', protect, documentsRoutes);
router.use('/ai', protect, aiRoutes);
router.use('/schedule', protect, scheduleRoutes);
router.use('/invitations', protect, invitationRoutes);
router.use('/trends', protect, trendsRoutes);

// Ruta pública compartida para el portal de aprobación
router.use('/shared', sharedRoutes);

// Ruta pública para webhooks externos (Meta Ads Webhooks)
router.use('/webhooks', webhooksRoutes);

// Feed global de actividad de la agencia
router.get('/activity-feed', protect, handleGetAgencyActivityFeed);

export default router;