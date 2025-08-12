import { registerNewAgency, completeUserProfile } from '../services/users.service.js';

/**
 * Maneja la petición HTTP para registrar un nuevo usuario y su agencia.
 */
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, fullName, agencyName } = req.body;

    if (!email || !password || !fullName || !agencyName) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    const newAgencyInfo = await registerNewAgency({ email, password, fullName, agencyName });

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
    const { fullName, agencyName } = req.body;

    if (!fullName || !agencyName) {
      return res.status(400).json({ success: false, message: 'El nombre completo y el nombre de la agencia son requeridos.' });
    }

    const result = await completeUserProfile({ userId, fullName, agencyName });

    res.status(201).json({
      success: true,
      message: 'Perfil completado y agencia creada exitosamente.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
