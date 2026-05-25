import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleCreateInvitation,
  handleGetPendingInvitations,
  handleDeleteInvitation,
  handleGetUserPendingInvitation,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleGetAgencyMembers,
  handleGetActiveInviteLink,
  handleRegenerateInviteLink,
  handleAcceptInviteLink
} from '../controllers/invitations.controller.js';

const router = Router();

// Todas las rutas de invitaciones requieren estar autenticado
router.use(protect);

// Rutas para Enlaces de Invitación Compartidos (Join Links)
router.get('/links/active', handleGetActiveInviteLink);
router.post('/links/regenerate', handleRegenerateInviteLink);
router.post('/links/accept', handleAcceptInviteLink);

// Rutas generales de invitaciones de agencia (para el admin)
router.post('/', handleCreateInvitation);
router.get('/', handleGetPendingInvitations);
router.delete('/:id', handleDeleteInvitation);

// Ruta para obtener los miembros de la agencia
router.get('/members', handleGetAgencyMembers);

// Rutas de invitaciones del usuario logueado
router.get('/pending', handleGetUserPendingInvitation);
router.post('/accept', handleAcceptInvitation);
router.post('/:id/reject', handleRejectInvitation);

export default router;
