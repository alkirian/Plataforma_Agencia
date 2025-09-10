import { registerNewAgency, completeUserProfile, checkUserExistsByEmail } from '../services/users.service.js';

/**
 * Maneja la petición HTTP para registrar un nuevo usuario y su agencia.
 * Uses validated data from Zod middleware for enhanced security.
 */
export const registerUser = async (req, res, next) => {
  try {
    // Use validated data from middleware - guaranteed to be clean and secure
    const { email, password, fullName, agencyName } = req.validatedBody;

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
 * Uses validated data from Zod middleware for enhanced security.
 */
export const handleCompleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Obtenemos el ID del usuario desde el middleware
    // Use validated data from middleware - guaranteed to be clean and secure
    const { fullName, agencyName, role, website } = req.validatedBody;

    const result = await completeUserProfile({ userId, fullName, agencyName, role, website });

    res.status(201).json({
      success: true,
      message: 'Perfil completado y agencia creada exitosamente.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Maneja la petición HTTP para verificar si un email existe en el sistema.
 * Uses validated data from Zod middleware for enhanced security.
 */
export const handleCheckEmail = async (req, res, next) => {
  try {
    // Use validated data from middleware - email is guaranteed to be valid format
    const { email } = req.validatedBody;

    // Verificar si el usuario existe
    const exists = await checkUserExistsByEmail(email);

    res.status(200).json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    next(error);
  }
};
