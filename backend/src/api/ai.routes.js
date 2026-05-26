import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleGenerateIdeas, handleGenerateCopyFromTrend } from '../controllers/ai.controller.js';

const router = Router();

router.use(protect);

// POST /api/v1/clients/:clientId/generate-ideas
router.post('/:clientId/generate-ideas', handleGenerateIdeas);

// POST /api/v1/clients/:clientId/generate-copy
router.post('/:clientId/generate-copy', handleGenerateCopyFromTrend);

export default router;
