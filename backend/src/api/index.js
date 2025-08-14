import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
import documentsRoutes from './documents.routes.js';
import aiRoutes from './ai.routes.js';
// No importamos scheduleRoutes aquí

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Registra las rutas de los módulos
router.use('/users', userRoutes);
router.use('/clients', clientRoutes); // Solo registramos la ruta principal de clientes
router.use('/documents', documentsRoutes);
// AI routes mounted under /clients to achieve /clients/:clientId/generate-ideas
router.use('/clients', aiRoutes);

export default router;