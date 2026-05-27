import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleGetTikTokIntegration,
  handleSaveTikTokIntegration,
  handleDeleteTikTokIntegration,
  handleExchangeTikTokToken,
} from '../controllers/tiktok.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(handleGetTikTokIntegration)
  .post(handleSaveTikTokIntegration)
  .delete(handleDeleteTikTokIntegration);

router.post('/exchange-token', handleExchangeTikTokToken);

export default router;
