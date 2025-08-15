// src/api/index.js
import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
import documentsRoutes from './documents.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Registrar las rutas de los módulos de forma clara y sin conflictos
router.use('/users', userRoutes);
router.use('/clients', clientRoutes); // Maneja TODO lo que empieza con /clients
router.use('/documents', documentsRoutes); // Maneja TODO lo que empieza con /documents

export default router;