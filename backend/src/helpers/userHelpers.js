import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Busca el perfil de usuario intentando primero en 'profiles' y, si no existe,
 * en 'profile' (singular), para cubrir diferencias de esquema.
 * @param {string} userId
 * @returns {Promise<object>} Perfil completo
 */
export const getUserProfile = async (userId) => {
  // Intento 1: tabla plural 'profiles'
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // Si no hay resultado, intentamos con la tabla singular 'profile'
  if ((!data || Object.keys(data).length === 0) || error) {
    const fallback = await supabaseAdmin
      .from('profile')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (!data || error) {
    const msg = `No se pudo encontrar el perfil del usuario (id=${userId}). Verifica que exista en 'profiles' o 'profile' y que el id coincida con auth.users.id.`;
    throw new Error(msg);
  }

  return data;
};

/**
 * Obtiene el agency_id desde el perfil del usuario
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const getUserAgencyId = async (userId) => {
  const profile = await getUserProfile(userId);
  if (!profile.agency_id) {
    throw new Error('El perfil no tiene agency_id asociado.');
  }
  return profile.agency_id;
};