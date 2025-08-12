import { Router } from 'express';
import { handleCreateClient, handleGetClients } from '../controllers/clients.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Aplicamos el middleware 'protect' a todas las rutas de este archivo.
// Solo los usuarios autenticados podrán acceder a ellas.
router.use(protect);

router.route('/')
  .post(handleCreateClient)
  .get(handleGetClients);

export default router;
