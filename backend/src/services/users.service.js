import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Registra un nuevo usuario en Supabase Auth y luego crea una nueva agencia
 * y un perfil de administrador para ese usuario.
 * @param {object} userData - Los datos del usuario y la agencia.
 * @returns {Promise<object>} El perfil del nuevo usuario y los datos de la agencia.
 */
export const registerNewAgency = async ({ email, password, fullName, agencyName }) => {
  // Paso 1: Registrar al usuario en el sistema de autenticación de Supabase.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }
  if (!authData.user) {
    throw new Error('No se pudo crear el usuario en el sistema de autenticación.');
  }

  const userId = authData.user.id;

  // Paso 2: Llamar a nuestra función SQL para crear la agencia y el perfil de admin.
  const { data: agencyData, error: rpcError } = await supabase.rpc('create_new_agency_and_admin', {
    user_id: userId,
    agency_name: agencyName,
    user_full_name: fullName,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  return {
    userId,
    email,
    fullName,
    agencyId: agencyData,
  };
};

/**
 * Completa el perfil de un usuario existente en Auth creando su agencia y perfil.
 * @param {object} profileData - Los datos del perfil.
 * @param {string} profileData.userId - El ID del usuario autenticado.
 * @param {string} profileData.fullName - El nombre completo del usuario.
 * @param {string} profileData.agencyName - El nombre de la nueva agencia.
 * @returns {Promise<object>} Los datos de la nueva agencia.
 */
export const completeUserProfile = async ({ userId, fullName, agencyName }) => {
  // ✅ ASEGÚRATE DE QUE LA LLAMADA INCLUYA 'user_id'
  const { data, error } = await supabase.rpc('create_new_agency_and_admin', {
    user_id: userId, // <-- Esta línea es importante
    agency_name: agencyName,
    user_full_name: fullName,
  });

  if (error) {
    throw new Error(`Error al completar el perfil: ${error.message}`);
  }

  return {
    agencyId: data,
  };
};

/**
 * Verifica si un usuario existe en el sistema por su email.
 * @param {string} email - El email a verificar.
 * @returns {Promise<boolean>} True si el usuario existe, false si no.
 */
export const checkUserExistsByEmail = async (email) => {
  try {
    // Usar supabaseAdmin para acceder a auth.users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Error al verificar usuario: ${error.message}`);
    }

    // Buscar si existe un usuario con ese email
    const userExists = data.users.some(user => user.email === email);
    
    return userExists;
  } catch (error) {
    console.error('Error en checkUserExistsByEmail:', error);
    throw new Error('Error al verificar el email en el sistema');
  }
};
