import { Router } from 'express';
import { registerUser } from '../controllers/users.controller.js';

const router = Router();

router.post('/register', registerUser);

export default router;
