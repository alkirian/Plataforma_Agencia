import { supabase, supabaseAdmin } from '../config/supabaseClient.js';
import { getPendingInvitationForEmail, acceptInvitation, acceptInviteLink, resolveInviteLink } from './invitations.service.js';

/**
 * Registra un nuevo usuario en Supabase Auth y luego crea una nueva agencia
 * o lo une a una agencia existente si tiene una invitación pendiente o un código.
 * @param {object} userData - Los datos del usuario y la agencia.
 * @returns {Promise<object>} El perfil del nuevo usuario y los datos de la agencia.
 */
export const registerNewAgency = async ({ email, password, fullName, agencyName, inviteCode, agencyType = 'agency' }) => {
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

  // Paso 2: Verificar si hay una invitación directa por email o un código de enlace de invitación
  const invitation = await getPendingInvitationForEmail(email);
  let agencyId = null;
  let joinedByInvitation = false;

  if (invitation) {
    // Si tiene invitación directa por email, aceptarla inmediatamente
    await acceptInvitation({ userId, email, fullName });
    agencyId = invitation.agencyId;
    joinedByInvitation = true;
  } else if (inviteCode) {
    // Si tiene código de enlace de invitación compartido, aceptarlo
    try {
      const inviteLinkResult = await acceptInviteLink(userId, email, inviteCode);
      agencyId = inviteLinkResult.agencyId;
      
      // Actualizar el nombre completo en su perfil recién creado
      await supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('id', userId);
      joinedByInvitation = true;
    } catch (err) {
      console.error('[registerNewAgency] Error al unirse por código de invitación:', err.message);
    }
  }

  // Si no se unió a ninguna agencia por invitación, crear una nueva
  if (!agencyId) {
    const { data: agencyData, error: rpcError } = await supabase.rpc('create_new_agency_and_admin', {
      user_id: userId,
      agency_name: agencyName,
      user_full_name: fullName,
      agency_type: agencyType,
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }
    agencyId = agencyData;

    // Si es un negocio propio, auto-creamos el primer cliente (su marca)
    if (agencyType === 'own_business') {
      try {
        await supabaseAdmin.from('clients').insert({
          agency_id: agencyId,
          name: agencyName,
          industry: 'Mi Negocio',
          brand_info: { card_color: '#7C5CFC' },
        });
      } catch (clientErr) {
        console.error('[registerNewAgency] Error al auto-crear marca para negocio propio:', clientErr.message);
      }
    }
  }

  return {
    userId,
    email,
    fullName,
    agencyId,
    joinedByInvitation
  };
};

/**
 * Completa el perfil de un usuario existente en Auth creando su agencia o uniéndolo a una invitada.
 * @param {object} profileData - Los datos del perfil.
 * @param {string} profileData.userId - El ID del usuario autenticado.
 * @param {string} profileData.fullName - El nombre completo del usuario.
 * @param {string} profileData.agencyName - El nombre de la nueva agencia (si aplica).
 * @param {string} [profileData.inviteCode] - El código de invitación opcional.
 * @returns {Promise<object>} Los datos de la nueva agencia.
 */
export const completeUserProfile = async ({ userId, fullName, agencyName, inviteCode, agencyType = 'agency' }) => {
  // 1) Obtener el correo del usuario desde Auth
  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUser(userId);
  if (authUserError) {
    throw new Error(`Error al obtener usuario de auth: ${authUserError.message}`);
  }
  const email = authUser.user.email;

  // 2) Verificar si hay una invitación directa o un código de enlace de invitación
  const invitation = await getPendingInvitationForEmail(email);
  let agencyId = null;
  let joinedByInvitation = false;

  if (invitation) {
    // Si tiene invitación directa por email, aceptarla
    await acceptInvitation({ userId, email, fullName });
    agencyId = invitation.agencyId;
    joinedByInvitation = true;
  } else if (inviteCode) {
    // Si tiene código de enlace de invitación compartido, aceptarlo
    try {
      const inviteLinkResult = await acceptInviteLink(userId, email, inviteCode);
      agencyId = inviteLinkResult.agencyId;
      
      // Actualizar el nombre completo en su perfil
      await supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('id', userId);
      joinedByInvitation = true;
    } catch (err) {
      console.error('[completeUserProfile] Error al unirse por código de invitación:', err.message);
    }
  }

  // Si no se unió por ninguna invitación, crear una nueva agencia
  if (!agencyId) {
    const { data, error } = await supabase.rpc('create_new_agency_and_admin', {
      user_id: userId,
      agency_name: agencyName,
      user_full_name: fullName,
      agency_type: agencyType,
    });

    if (error) {
      throw new Error(`Error al completar el perfil: ${error.message}`);
    }
    agencyId = data;

    // Si es un negocio propio, auto-creamos el primer cliente (su marca)
    if (agencyType === 'own_business') {
      try {
        await supabaseAdmin.from('clients').insert({
          agency_id: agencyId,
          name: agencyName,
          industry: 'Mi Negocio',
          brand_info: { card_color: '#7C5CFC' },
        });
      } catch (clientErr) {
        console.error('[completeUserProfile] Error al auto-crear marca para negocio propio:', clientErr.message);
      }
    }
  }

  return {
    agencyId,
    joinedByInvitation
  };
};

/**
 * Verifica si un usuario existe en el sistema por su email.
 * @param {string} email - El email a verificar.
 * @returns {Promise<boolean>} True si el usuario existe, false si no.
 */
export const checkUserExistsByEmail = async (email) => {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return { exists: false, hasAgency: false };

    let authUser = null;

    // 1. Intentar buscar directamente en Supabase Auth por email (mucho más rápido y eficiente)
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail);
      if (!error && data?.user) {
        authUser = data.user;
      }
    } catch (err) {
      console.warn('[checkUserExistsByEmail] getUserByEmail falló, usando listUsers como fallback:', err.message);
    }

    // 2. Fallback: Paginación si getUserByEmail no está disponible o falla
    if (!authUser) {
      const perPage = 200;
      let page = 1;

      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

        if (error) {
          throw new Error(`Error al verificar usuario en auth: ${error.message}`);
        }

        const users = data?.users || [];
        const found = users.find((user) => (user.email || '').toLowerCase() === normalizedEmail);
        if (found) {
          authUser = found;
          break;
        }

        if (users.length < perPage) break;
        page += 1;
      }
    }

    if (!authUser) {
      return { exists: false, hasAgency: false };
    }

    // 3. Si el usuario existe en Auth, verificar si tiene un perfil con agencia en public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('agency_id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[checkUserExistsByEmail] Error al verificar perfil:', profileError.message);
    }

    const hasAgency = !!(profile && profile.agency_id);

    return {
      exists: true,
      hasAgency
    };
  } catch (error) {
    console.error('Error en checkUserExistsByEmail:', error);
    throw new Error('Error al verificar el email en el sistema');
  }
};
