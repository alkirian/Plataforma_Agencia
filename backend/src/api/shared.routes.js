import { Router } from 'express';
import {
  handleGetSharedApprovalDetails,
  handleSharedApprovePost,
  handleSharedFeedbackPost,
  handleSharedRevertPost,
} from '../controllers/shared.controller.js';
import { handleResolveInviteLink } from '../controllers/invitations.controller.js';

const router = Router();

// Rutas públicas (no protegidas por token de usuario de la agencia)
router.get('/approval/:token', handleGetSharedApprovalDetails);
router.post('/approval/:token/items/:itemId/approve', handleSharedApprovePost);
router.post('/approval/:token/items/:itemId/feedback', handleSharedFeedbackPost);
router.post('/approval/:token/items/:itemId/revert', handleSharedRevertPost);

// Resolución pública de enlace de invitación compartido
router.get('/invite/:code', handleResolveInviteLink);

export default router;
