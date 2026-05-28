import {
  createInvitation,
  getPendingInvitations,
  deleteInvitation,
  getPendingInvitationForEmail,
  acceptInvitation,
  rejectInvitation,
  getAgencyMembers,
  getActiveOrCreateInviteLink,
  regenerateInviteLink,
  resolveInviteLink,
  acceptInviteLink
} from '../services/invitations.service.js';
import { getUserProfile } from '../helpers/userHelpers.js';

/**
 * Crea una nueva invitación para un email.
 */
export const handleCreateInvitation = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);

    if (profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo los administradores pueden enviar invitaciones.'
      });
    }

    if (!profile.agency_id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviar invitaciones porque tu cuenta no está asociada a ninguna agencia.'
      });
    }

    const { email, role = 'member' } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido.'
      });
    }

    const origin = req.headers.origin || req.get('origin') || req.headers.referer || 'http://localhost:5173/';
    const invitation = await createInvitation({
      agencyId: profile.agency_id,
      email,
      role,
      invitedBy: profile.id,
      redirectUrl: origin
    });

    res.status(201).json({
      success: true,
      message: 'Invitación enviada exitosamente.',
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene las invitaciones pendientes de la agencia.
 */
export const handleGetPendingInvitations = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);

    if (!profile.agency_id) {
      return res.status(400).json({
        success: false,
        message: 'Tu perfil no está asociado a ninguna agencia.'
      });
    }

    const invitations = await getPendingInvitations(profile.agency_id);

    res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancela una invitación.
 */
export const handleDeleteInvitation = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);

    if (profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo los administradores pueden cancelar invitaciones.'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la invitación es requerido.'
      });
    }

    await deleteInvitation(id, profile.agency_id);

    res.status(200).json({
      success: true,
      message: 'Invitación cancelada y eliminada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene la invitación pendiente del usuario logueado por su email.
 */
export const handleGetUserPendingInvitation = async (req, res, next) => {
  try {
    const email = req.user.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener el correo de tu sesión de usuario.'
      });
    }

    const invitation = await getPendingInvitationForEmail(email);

    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Acepta una invitación para el usuario actual.
 */
export const handleAcceptInvitation = async (req, res, next) => {
  try {
    const email = req.user.email;
    const userId = req.user.id;
    const { fullName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo verificar tu correo electrónico.'
      });
    }

    const result = await acceptInvitation({
      userId,
      email,
      fullName
    });

    res.status(200).json({
      success: true,
      message: '¡Te has unido exitosamente a la agencia!',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rechaza una invitación para el usuario actual.
 */
export const handleRejectInvitation = async (req, res, next) => {
  try {
    const email = req.user.email;
    const { id } = req.params;

    if (!email || !id) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para rechazar la invitación.'
      });
    }

    await rejectInvitation(id, email);

    res.status(200).json({
      success: true,
      message: 'Invitación rechazada correctamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los miembros de la agencia del usuario actual.
 */
export const handleGetAgencyMembers = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);

    if (!profile.agency_id) {
      return res.status(400).json({
        success: false,
        message: 'Tu perfil no está asociado a ninguna agencia.'
      });
    }

    const members = await getAgencyMembers(profile.agency_id);

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene o crea el enlace de invitación activo de la agencia del usuario.
 */
export const handleGetActiveInviteLink = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);
    if (!profile.agency_id) {
      return res.status(400).json({
        success: false,
        message: 'Tu perfil no está asociado a ninguna agencia.'
      });
    }

    const link = await getActiveOrCreateInviteLink(profile.agency_id, profile.id);

    res.status(200).json({
      success: true,
      data: link
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenera el enlace de invitación activo de la agencia (solo administradores).
 */
export const handleRegenerateInviteLink = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);
    if (profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden regenerar el enlace de invitación.'
      });
    }

    if (!profile.agency_id) {
      return res.status(400).json({
        success: false,
        message: 'Tu perfil no está asociado a ninguna agencia.'
      });
    }

    const newLink = await regenerateInviteLink(profile.agency_id, profile.id);

    res.status(200).json({
      success: true,
      message: 'Enlace de invitación regenerado exitosamente.',
      data: newLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resuelve un código de invitación públicamente (sin autenticación).
 */
export const handleResolveInviteLink = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'El código de invitación es requerido.'
      });
    }

    const inviteInfo = await resolveInviteLink(code);

    res.status(200).json({
      success: true,
      data: inviteInfo
    });
  } catch (error) {
    // Si falla (código inválido), devolvemos 404
    res.status(404).json({
      success: false,
      message: error.message || 'Código de invitación no válido.'
    });
  }
};

/**
 * Une al usuario actual a la agencia del enlace.
 */
export const handleAcceptInviteLink = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'El código de invitación es requerido.'
      });
    }

    const result = await acceptInviteLink(userId, email, code);

    res.status(200).json({
      success: true,
      message: '¡Te has unido a la agencia exitosamente!',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

