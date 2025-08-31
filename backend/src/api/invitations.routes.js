import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleCreateInvitations,
  handleListMembersAndInvites,
  handleValidateInvitation,
  handleAcceptInvitation,
  handleRevokeInvitation,
  handleResendInvitation,
} from '../controllers/invitations.controller.js';

const router = Router();

// Admin-only: create invitations for one or more emails
router.post('/', protect, handleCreateInvitations);

// Auth: list members and pending invites of my agency
router.get('/', protect, handleListMembersAndInvites);

// Public: validate invitation token and get display info
router.get('/validate/:token', handleValidateInvitation);

// Public: accept invitation with basic profile data
router.post('/accept', handleAcceptInvitation);

// Admin-only: revoke a pending invitation
router.post('/revoke', protect, handleRevokeInvitation);

// Admin-only: resend invitation email
router.post('/resend', protect, handleResendInvitation);

export default router;

