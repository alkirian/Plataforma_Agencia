import { supabase } from '../config/supabaseClient.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ success: false, message: 'No autorizado. Token inválido.' });
    }

    req.user = user; // Adjuntamos el usuario a la petición
    next();
  } catch (error) {
    next(error);
  }
};
