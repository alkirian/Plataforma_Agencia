// src/api/documents.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
	handleProcessDocument,
	handleDeleteDocument,
} from '../controllers/documents.controller.js';

const router = Router();

router.use(protect);

// Rutas que operan directamente sobre /documents/:documentId
router.delete('/:documentId', handleDeleteDocument);
router.post('/:documentId/process', handleProcessDocument);

export default router;
