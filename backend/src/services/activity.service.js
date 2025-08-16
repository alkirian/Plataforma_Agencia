// src/services/activity.service.js
import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Registra una nueva acción en el log de actividad.
 * @param {object} logData - Los datos de la actividad a registrar.
 */
export const logActivity = async (logData) => {
  try {
    const { error } = await supabaseAdmin.from('activity_logs').insert(logData);
    if (error) {
      console.error('Error al registrar la actividad:', error.message);
      // No lanzamos error para no interrumpir el flujo principal
    }
  } catch (error) {
    console.error('Error inesperado al registrar actividad:', error);
  }
};

/**
 * Obtiene el feed de actividad para un cliente específico.
 * @param {string} clientId - El ID del cliente.
 * @param {string} agencyId - El ID de la agencia (para seguridad).
 * @returns {Promise<Array>} La lista de eventos de actividad.
 */
export const getActivityFeedByClient = async (clientId, agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .select(`
      id,
      created_at,
      action_type,
      details,
      author:profiles ( id, full_name )
    `)
    .eq('client_id', clientId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Error al obtener el feed de actividad: ${error.message}`);
  return data || [];
};

/**
 * Obtiene el feed de actividad para toda la agencia (global dashboard).
 * Soporta paginación por cursor basado en created_at.
 * @param {string} agencyId
 * @param {{ limit?: number, cursor?: string }} options
 */
export const getAgencyActivityFeed = async (agencyId, { limit = 20, cursor } = {}) => {
  let query = supabaseAdmin
    .from('activity_logs')
    .select(`
      id,
      created_at,
      action_type,
      client_id,
      details,
      author:profiles ( id, full_name )
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    // Traer items más antiguos que el cursor
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener actividad global: ${error.message}`);

  const items = data || [];
  const nextCursor = items.length === limit ? items[items.length - 1].created_at : null;

  return { items, nextCursor };
};
