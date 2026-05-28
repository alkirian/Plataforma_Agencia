import { registerNewAgency, completeUserProfile, checkUserExistsByEmail } from '../services/users.service.js';
import { getPendingInvitationForEmail } from '../services/invitations.service.js';

/**
 * Maneja la petición HTTP para registrar un nuevo usuario y su agencia.
 */
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, fullName, agencyName, inviteCode, agencyType } = req.body;

    if (!email || !password || !fullName || !agencyName) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    const newAgencyInfo = await registerNewAgency({ 
      email, 
      password, 
      fullName, 
      agencyName, 
      inviteCode, 
      agencyType: agencyType || 'agency' 
    });

    res.status(201).json({
      success: true,
      message: 'Agencia y administrador creados exitosamente.',
      data: newAgencyInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Maneja la petición HTTP para completar el perfil de un usuario.
 */
export const handleCompleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Obtenemos el ID del usuario desde el middleware
    const { fullName, agencyName, inviteCode, agencyType } = req.body;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'El nombre completo es requerido.' });
    }

    const result = await completeUserProfile({ 
      userId, 
      fullName, 
      agencyName, 
      inviteCode, 
      agencyType: agencyType || 'agency' 
    });

    res.status(201).json({
      success: true,
      message: 'Perfil completado exitosamente.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Maneja la petición HTTP para verificar si un email existe en el sistema.
 */
export const handleCheckEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validar que el email esté presente
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'El email es requerido.' 
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'El formato del email no es válido.' 
      });
    }

    // Verificar si el usuario existe y si pertenece a una agencia
    const { exists, hasAgency, loginMethod } = await checkUserExistsByEmail(email);

    // Buscar si hay una invitación pendiente para este correo si no tiene agencia activa
    let invitation = null;
    if (!hasAgency) {
      invitation = await getPendingInvitationForEmail(email);
    }

    res.status(200).json({
      success: true,
      data: { 
        exists,
        hasAgency,
        loginMethod,
        invitation: invitation ? {
          agencyId: invitation.agencyId,
          agencyName: invitation.agencyName,
          role: invitation.role
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};
