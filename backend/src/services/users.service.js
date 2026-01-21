import { supabase, supabaseAdmin } from "../config/supabaseClient.js";
import { logger } from "../utils/logger.js";

/**
 * Registra un nuevo usuario en Supabase Auth y luego crea una nueva agencia
 * y un perfil de administrador para ese usuario.
 * @param {object} userData - Los datos del usuario y la agencia.
 * @returns {Promise<object>} El perfil del nuevo usuario y los datos de la agencia.
 */
export const registerNewAgency = async ({
  email,
  password,
  fullName,
  agencyName,
}) => {
  // Paso 1: Registrar al usuario en el sistema de autenticación de Supabase.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }
  if (!authData.user) {
    throw new Error(
      "No se pudo crear el usuario en el sistema de autenticación.",
    );
  }

  const userId = authData.user.id;

  // Paso 2: Crear la agencia directamente (Reemplaza RPC create_new_agency_and_admin)
  // Usamos supabaseAdmin para bypass RLS durante la creación inicial
  const { data: agencyData, error: agencyError } = await supabaseAdmin
    .from("agencies")
    .insert({
      name: agencyName,
      owner_id: userId,
      created_by: userId, // Cumple con NOT NULL constraint
    })
    .select()
    .single();

  if (agencyError) {
    // Rollback (opcional, borrar usuario auth si falla agencia)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Error creando agencia: ${agencyError.message}`);
  }

  // Paso 3: Crear el miembro de la agencia
  const { error: memberError } = await supabaseAdmin
    .from("agency_members")
    .insert({
      agency_id: agencyData.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    throw new Error(`Error asignando miembro: ${memberError.message}`);
  }

  // Paso 4: Actualizar perfil con agency_id (si existe la columna en profiles)
  try {
    await supabaseAdmin
      .from("profiles")
      .update({ agency_id: agencyData.id, full_name: fullName })
      .eq("id", userId);
  } catch (e) {
    logger.warn("Error actualizando perfil con agency_id", e);
  }

  return {
    userId,
    email,
    fullName,
    agencyId: agencyData.id,
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
export const completeUserProfile = async ({
  userId,
  fullName,
  agencyName,
  role,
  website,
}) => {
  // Reemplaza RPC create_new_agency_and_admin con inserts directos
  
  // 1. Crear Agencia
  const { data: agencyData, error: agencyError } = await supabaseAdmin
    .from("agencies")
    .insert({
      name: agencyName,
      owner_id: userId,
      created_by: userId, // Cumple con NOT NULL constraint
      website: website || null
    })
    .select()
    .single();

  if (agencyError) {
    throw new Error(`Error creando agencia: ${agencyError.message}`);
  }

  const agencyId = agencyData.id;

  // 2. Crear Miembro
  const { error: memberError } = await supabaseAdmin
    .from("agency_members")
    .insert({
      agency_id: agencyId,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    throw new Error(`Error asignando miembro: ${memberError.message}`);
  }

  // 3. Actualizar Perfil
  const updateData = { 
    agency_id: agencyId,
    full_name: fullName
  };
  if (role) updateData.role = role;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (profileError) {
    logger.warn("Error actualizando perfil", { error: profileError.message });
  }

  return { agencyId };
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
    const userExists = data.users.some((user) => user.email === email);

    return userExists;
  } catch (error) {
    logger.error("Error en checkUserExistsByEmail", error, { email });
    throw new Error("Error al verificar el email en el sistema");
  }
};
