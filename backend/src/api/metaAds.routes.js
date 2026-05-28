// src/api/metaAds.routes.js
import { Router } from 'express';
import {
  handleGetMetaIntegration,
  handleSaveMetaIntegration,
  handleDeleteMetaIntegration,
  handleGetClientAdInsights,
  handleExchangeOAuthToken,
  handleGetClientComments,
  handleReplyToComment,
  handleTweakCommentDraft,
  handleGetCommentAIDraft
} from '../controllers/metaAds.controller.js';

const router = Router({ mergeParams: true }); // Habilitar mergeParams para heredar :clientId

router.route('/')
  .get(handleGetMetaIntegration)
  .post(handleSaveMetaIntegration)
  .delete(handleDeleteMetaIntegration);

router.get('/config', (req, res) => {
  console.log('🔑 [DEBUG /config] process.env.META_APP_ID =', process.env.META_APP_ID);
  res.status(200).json({
    status: 'success',
    data: {
      appId: process.env.META_APP_ID && !process.env.META_APP_ID.includes('YOUR_META_APP') ? process.env.META_APP_ID : null
    }
  });
});

router.post('/exchange', handleExchangeOAuthToken);
router.get('/campaigns', handleGetClientAdInsights);
router.get('/comments', handleGetClientComments);
router.post('/comments/tweak', handleTweakCommentDraft);
router.get('/comments/:commentId/draft', handleGetCommentAIDraft);
router.post('/comments/:commentId/reply', handleReplyToComment);

export default router;
