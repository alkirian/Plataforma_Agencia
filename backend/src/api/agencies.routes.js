import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /agencies/my-agency
 * Obtiene la agencia del usuario actual
 */
router.get('/my-agency', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, agency_id, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.error('Error fetching user profile', profileError, { userId });
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo perfil de usuario',
        error: profileError.message
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de usuario no encontrado'
      });
    }

    // Si no tiene agencia, devolver null
    if (!profile.agency_id) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Usuario no tiene agencia asignada'
      });
    }

    // Obtener información de la agencia por separado (intentar con website y fallback sin website)
    let agency = null;
    let agencyError = null;
    try {
      const resp = await supabaseAdmin
        .from('agencies')
        .select('id, name, description, color, created_at, website')
        .eq('id', profile.agency_id)
        .single();
      agency = resp.data; agencyError = resp.error;
      if (agencyError) throw agencyError;
    } catch (err) {
      // Fallback si la columna website no existe
      const resp2 = await supabaseAdmin
        .from('agencies')
        .select('id, name, description, color, created_at')
        .eq('id', profile.agency_id)
        .single();
      agency = resp2.data; agencyError = resp2.error;
    }

    if (agencyError) {
      logger.error('Error fetching agency', agencyError, { agencyId: profile.agency_id, userId });
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo información de agencia',
        error: agencyError.message
      });
    }

    if (!agency) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Agencia no encontrada'
      });
    }

    // Devolver la información de la agencia
    res.status(200).json({
      success: true,
      data: {
        id: agency.id,
        name: agency.name,
        description: agency.description,
        color: agency.color,
        created_at: agency.created_at,
        user_role: profile.role,
        website: agency.website || null
      }
    });

  } catch (error) {
    logger.error('Error in /agencies/my-agency', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

export default router;
