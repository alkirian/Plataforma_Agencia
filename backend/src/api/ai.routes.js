import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleGenerateIdeas } from '../controllers/ai.controller.js';

const router = Router();

router.use(protect);

// POST /api/v1/clients/:clientId/generate-ideas
router.post('/:clientId/generate-ideas', handleGenerateIdeas);

export default router;
