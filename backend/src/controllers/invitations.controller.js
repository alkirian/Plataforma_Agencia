import {
  createInvitations,
  listAgencyMembersAndInvites,
  validateInvitationToken,
  acceptInvitation,
  revokeInvitation,
  resendInvitation,
} from '../services/invitations.service.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

// Helper to get requester profile and agency/role
const getRequesterProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, agency_id, role, full_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

export const handleCreateInvitations = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) return res.status(401).json({ success: false, message: 'No autorizado' });

    const requester = await getRequesterProfile(requesterId);
    if (!requester?.agency_id) {
      return res.status(400).json({ success: false, message: 'Usuario sin agencia asociada' });
    }
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden invitar' });
    }

    const { emails, role = 'member', redirectUrl } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Proporciona al menos un email' });
    }

    const { invitations, errors } = await createInvitations({
      inviterId: requesterId,
      inviterName: requester.full_name || null,
      agencyId: requester.agency_id,
      emails,
      role,
      redirectUrl,
    });

    res.status(201).json({ success: true, data: { invitations, errors } });
  } catch (error) {
    next(error);
  }
};

export const handleListMembersAndInvites = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) return res.status(401).json({ success: false, message: 'No autorizado' });

    const requester = await getRequesterProfile(requesterId);
    if (!requester?.agency_id) {
      return res.status(400).json({ success: false, message: 'Usuario sin agencia asociada' });
    }

    const result = await listAgencyMembersAndInvites(requester.agency_id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleValidateInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, message: 'Token requerido' });
    const info = await validateInvitationToken(token);
    res.status(200).json({ success: true, data: info });
  } catch (error) {
    // Si la validación falla, devolver 400/404 apropiado
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const handleAcceptInvitation = async (req, res, next) => {
  try {
    const { token, fullName, role, avatarUrl } = req.body || {};
    if (!token || !fullName) {
      return res.status(400).json({ success: false, message: 'Token y nombre son requeridos' });
    }
    const result = await acceptInvitation({ token, fullName, role, avatarUrl });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const handleRevokeInvitation = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) return res.status(401).json({ success: false, message: 'No autorizado' });
    const requester = await getRequesterProfile(requesterId);
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo administradores' });
    }
    const { invitationId } = req.body || {};
    if (!invitationId) return res.status(400).json({ success: false, message: 'invitationId requerido' });
    const ok = await revokeInvitation({ invitationId, agencyId: requester.agency_id });
    res.status(200).json({ success: ok });
  } catch (error) {
    next(error);
  }
};

export const handleResendInvitation = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) return res.status(401).json({ success: false, message: 'No autorizado' });
    const requester = await getRequesterProfile(requesterId);
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo administradores' });
    }
    const { invitationId } = req.body || {};
    if (!invitationId) return res.status(400).json({ success: false, message: 'invitationId requerido' });
    const result = await resendInvitation({ invitationId, agencyId: requester.agency_id });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

