import { Router } from 'express';
import userRoutes from './users.routes.js'; // 1. IMPORTAR
import clientRoutes from './clients.routes.js'; // 1. IMPORTAR
const router = Router();

// Endpoint de salud para verificar que la API está viva
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 2. USAR LAS RUTAS
// Cualquier petición a /api/v1/users/... será manejada por userRoutes
router.use('/users', userRoutes);
router.use('/clients', clientRoutes); // 2. USAR

export default router;
