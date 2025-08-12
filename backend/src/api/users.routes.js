import { Router } from 'express';
import { registerUser, handleCompleteProfile } from '../controllers/users.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);

// Ruta protegida para que un usuario ya logueado complete su perfil
// El middleware 'protect' se ejecuta ANTES que 'handleCompleteProfile'
router.post('/complete-profile', protect, handleCompleteProfile);

export default router;
