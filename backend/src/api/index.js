import { Router } from 'express';
const router = Router();

// Endpoint de salud para verificar que la API está viva
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Aquí se importarán y usarán las rutas de los módulos (clientes, cronograma, etc.)
// Ejemplo futuro: router.use('/clients', clientRoutes);

export default router;
