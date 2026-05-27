import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleGetLinkedInIntegration,
  handleSaveLinkedInIntegration,
  handleDeleteLinkedInIntegration,
  handleExchangeLinkedInToken,
} from '../controllers/linkedin.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(handleGetLinkedInIntegration)
  .post(handleSaveLinkedInIntegration)
  .delete(handleDeleteLinkedInIntegration);

router.post('/exchange-token', handleExchangeLinkedInToken);

export default router;
