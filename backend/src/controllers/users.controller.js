import { registerNewAgency } from '../services/users.service.js';

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
