import { Router } from 'express';
import {
  handleGetSharedApprovalDetails,
  handleSharedApprovePost,
  handleSharedFeedbackPost,
  handleSharedRevertPost,
  handleGetLocalIp,
  handleMobileCallback,
  handleGetMobileStatus,
  handleMobileLoginPage,
} from '../controllers/shared.controller.js';
import { handleDeviceLoginStart, handleDeviceLoginPoll } from '../controllers/metaDeviceLogin.controller.js';
import { handleResolveInviteLink } from '../controllers/invitations.controller.js';

const router = Router();

// Rutas publicas (no protegidas por token de usuario de la agencia)
router.get('/approval/:token', handleGetSharedApprovalDetails);
router.post('/approval/:token/items/:itemId/approve', handleSharedApprovePost);
router.post('/approval/:token/items/:itemId/feedback', handleSharedFeedbackPost);
router.post('/approval/:token/items/:itemId/revert', handleSharedRevertPost);

// Resolucion publica de enlace de invitacion compartido
router.get('/invite/:code', handleResolveInviteLink);

// Rutas de vinculacion movil de Meta Ads (QR clasico / SDK)
router.get('/meta-mobile/ip', handleGetLocalIp);
router.get('/meta-mobile/login', handleMobileLoginPage);
router.post('/meta-mobile/callback', handleMobileCallback);
router.get('/meta-mobile/status', handleGetMobileStatus);

// Device Login Flow — no requiere IPs ni dominios registrados en Meta
router.post('/meta-device/start', handleDeviceLoginStart);
router.get('/meta-device/poll', handleDeviceLoginPoll);

export default router;
