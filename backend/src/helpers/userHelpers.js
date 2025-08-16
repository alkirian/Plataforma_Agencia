import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Obtiene el agency_id de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} Agency ID del usuario
 * @throws {Error} Si no se puede obtener el perfil
 */
export const getUserAgencyId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw new Error('No se pudo obtener el perfil del usuario.');
  }
  
  return data.agency_id;
};

/**
 * Obtiene el perfil completo de un usuario
 * @param {string} userId - ID del usuario  
 * @returns {Promise<object>} Perfil completo del usuario
 * @throws {Error} Si no se puede obtener el perfil
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    throw new Error('No se pudo encontrar el perfil del usuario.');
  }
  
  return data;
};