import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { handleProcessDocument } from '../controllers/documents.controller.js';

const router = Router();

router.use(protect);

// POST /api/v1/documents/:documentId/process
router.post('/:documentId/process', handleProcessDocument);

export default router;
