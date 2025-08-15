import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
// No importamos scheduleRoutes aquí

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Registra las rutas de los módulos
router.use('/users', userRoutes);
router.use('/clients', clientRoutes); // Solo registramos la ruta principal de clientes

export default router;