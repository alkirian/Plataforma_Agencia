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

// LOG TEMPORAL: Verificar rutas registradas
console.log('🔍 Rutas registradas:');
console.log('  - /api/v1/users (userRoutes)');
console.log('  - /api/v1/clients (clientRoutes)');

export default router;