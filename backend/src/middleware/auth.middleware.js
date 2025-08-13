import { supabaseAdmin } from '../config/supabaseClient.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado. Token no proporcionado.' });
    }

  const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      // Este es el error que te estaba apareciendo
      return res.status(401).json({ success: false, message: 'No autorizado. Token inválido.' });
    }

  req.user = user;
  req.token = token; // Guardamos el JWT para uso posterior en controladores/servicios
    next();
  } catch (error) {
    next(error);
  }
};