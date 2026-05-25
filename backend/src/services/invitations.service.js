import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Crea o re-envía una invitación para que un correo electrónico se una a una agencia.
 */
export const createInvitation = async ({ agencyId, email, role, invitedBy }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  
  if (!normalizedEmail) {
    throw new Error('El correo electrónico es requerido.');
  }
  if (!['admin', 'member'].includes(role)) {
    throw new Error('El rol debe ser "admin" o "member".');
  }

  // 1) Verificar si el usuario ya existe y ya pertenece a esta agencia
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    throw new Error(`Error al listar usuarios de autenticación: ${authError.message}`);
  }

  const existingAuthUser = users.find(u => (u.email || '').toLowerCase() === normalizedEmail);
  if (existingAuthUser) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('agency_id')
      .eq('id', existingAuthUser.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Error al verificar perfil existente: ${profileError.message}`);
    }

    if (profile && profile.agency_id === agencyId) {
      throw new Error('El usuario con este correo electrónico ya pertenece a esta agencia.');
    }
  }

  // 2) Insertar o actualizar (upsert) la invitación en la base de datos
  const { data, error } = await supabaseAdmin
    .from('agency_invitations')
    .upsert({
      agency_id: agencyId,
      email: normalizedEmail,
      role,
      invited_by: invitedBy,
      status: 'pending',
      created_at: new Date().toISOString()
    }, { onConflict: 'agency_id,email' })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear la invitación: ${error.message}`);
  }

  // 3) Enviar correo real usando el sistema de invitaciones nativo de Supabase Auth
  try {
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173/';
    await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: redirectUrl
    });
  } catch (inviteError) {
    console.error('Error al enviar email de invitación por Supabase:', inviteError.message);
    // No lanzamos error para que el flujo de base de datos continúe y el registro/onboarding sea posible
  }

  return data;
};

/**
 * Obtiene todas las invitaciones pendientes para una agencia.
 */
export const getPendingInvitations = async (agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('agency_invitations')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al listar invitaciones: ${error.message}`);
  }

  return data;
};

/**
 * Cancela una invitación eliminándola de la base de datos.
 */
export const deleteInvitation = async (invitationId, agencyId) => {
  const { error } = await supabaseAdmin
    .from('agency_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('agency_id', agencyId);

  if (error) {
    throw new Error(`Error al cancelar la invitación: ${error.message}`);
  }

  return true;
};

/**
 * Obtiene una invitación pendiente por correo electrónico.
 */
export const getPendingInvitationForEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data: invitations, error } = await supabaseAdmin
    .from('agency_invitations')
    .select('*, agencies(name)')
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .limit(1);

  if (error) {
    throw new Error(`Error al buscar invitación: ${error.message}`);
  }

  if (invitations && invitations.length > 0) {
    const inv = invitations[0];
    return {
      id: inv.id,
      agencyId: inv.agency_id,
      agencyName: inv.agencies?.name || 'Agencia',
      role: inv.role,
      status: inv.status
    };
  }

  return null;
};

/**
 * Acepta una invitación pendiente para un usuario.
 */
export const acceptInvitation = async ({ userId, email, fullName }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const invitation = await getPendingInvitationForEmail(normalizedEmail);

  if (!invitation) {
    throw new Error('No se encontró ninguna invitación pendiente para este correo electrónico.');
  }

  // 1) Actualizar el estado de la invitación a aceptado
  const { error: updateError } = await supabaseAdmin
    .from('agency_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  if (updateError) {
    throw new Error(`Error al actualizar invitación: ${updateError.message}`);
  }

  // 2) Actualizar o insertar el perfil del usuario asociándolo a la agencia
  const { data: profile, error: profileFetchError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    throw new Error(`Error al verificar perfil del usuario: ${profileFetchError.message}`);
  }

  if (profile) {
    // Actualizar perfil existente
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        agency_id: invitation.agencyId,
        role: invitation.role,
        full_name: fullName || 'Miembro Invitado'
      })
      .eq('id', userId);

    if (updateProfileError) {
      throw new Error(`Error al actualizar perfil de usuario: ${updateProfileError.message}`);
    }
  } else {
    // Insertar perfil nuevo
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        agency_id: invitation.agencyId,
        full_name: fullName || 'Miembro Invitado',
        role: invitation.role
      });

    if (insertProfileError) {
      throw new Error(`Error al crear perfil de usuario: ${insertProfileError.message}`);
    }
  }

  return invitation;
};

/**
 * Rechaza una invitación pendiente.
 */
export const rejectInvitation = async (invitationId, email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  
  const { error } = await supabaseAdmin
    .from('agency_invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId)
    .eq('email', normalizedEmail);

  if (error) {
    throw new Error(`Error al rechazar invitación: ${error.message}`);
  }

  return true;
};

/**
 * Obtiene todos los miembros asociados a una agencia (perfil y email).
 */
export const getAgencyMembers = async (agencyId) => {
  if (!agencyId) {
    throw new Error('ID de agencia es requerido.');
  }

  // 1) Obtener todos los perfiles de la agencia
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true });

  if (profilesError) {
    throw new Error(`Error al obtener perfiles: ${profilesError.message}`);
  }

  // 2) Obtener todos los usuarios de Auth para mapear correos electrónicos (soportando hasta 1000 miembros)
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    throw new Error(`Error al listar usuarios de autenticación: ${authError.message}`);
  }

  const emailMap = {};
  users.forEach(u => {
    emailMap[u.id] = u.email;
  });

  // Mapear perfiles con correos
  return profiles.map(p => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    createdAt: p.created_at,
    email: emailMap[p.id] || 'Sin correo registrado'
  }));
};

/**
 * Genera un código de invitación aleatorio y único
 */
const generateRandomCode = () => {
  return 'inv_' + Math.random().toString(36).substring(2, 10).toLowerCase();
};

/**
 * Obtiene el enlace de invitación activo de la agencia, o crea uno nuevo si no existe.
 */
export const getActiveOrCreateInviteLink = async (agencyId, userId) => {
  if (!agencyId) {
    throw new Error('ID de agencia es requerido.');
  }

  // 1) Buscar enlace activo existente
  const { data: existingLink, error: fetchError } = await supabaseAdmin
    .from('agency_invite_links')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('active', true)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Error al buscar enlace existente: ${fetchError.message}`);
  }

  if (existingLink) {
    return existingLink;
  }

  // 2) Si no existe, crear uno nuevo
  const code = generateRandomCode();
  const { data: newLink, error: insertError } = await supabaseAdmin
    .from('agency_invite_links')
    .insert({
      agency_id: agencyId,
      code,
      role: 'member',
      created_by: userId,
      active: true,
      uses: 0
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error al crear enlace de invitación: ${insertError.message}`);
  }

  return newLink;
};

/**
 * Inactiva el enlace actual de la agencia y genera uno nuevo.
 */
export const regenerateInviteLink = async (agencyId, userId) => {
  if (!agencyId) {
    throw new Error('ID de agencia es requerido.');
  }

  // 1) Desactivar todos los enlaces anteriores de esta agencia
  const { error: deactivateError } = await supabaseAdmin
    .from('agency_invite_links')
    .update({ active: false })
    .eq('agency_id', agencyId);

  if (deactivateError) {
    throw new Error(`Error al desactivar enlaces anteriores: ${deactivateError.message}`);
  }

  // 2) Crear un nuevo enlace activo
  const code = generateRandomCode();
  const { data: newLink, error: insertError } = await supabaseAdmin
    .from('agency_invite_links')
    .insert({
      agency_id: agencyId,
      code,
      role: 'member',
      created_by: userId,
      active: true,
      uses: 0
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error al regenerar enlace de invitación: ${insertError.message}`);
  }

  return newLink;
};

/**
 * Resuelve la información pública del enlace en base a su código (para invitados no logueados).
 */
export const resolveInviteLink = async (code) => {
  const trimmedCode = String(code || '').trim().toLowerCase();
  if (!trimmedCode) {
    throw new Error('Código de invitación es requerido.');
  }

  // Buscar enlace activo con el nombre de la agencia
  const { data: link, error } = await supabaseAdmin
    .from('agency_invite_links')
    .select('*, agencies(name)')
    .eq('code', trimmedCode)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al resolver código: ${error.message}`);
  }

  if (!link) {
    throw new Error('El enlace de invitación no es válido o ha sido revocado.');
  }

  return {
    code: link.code,
    agencyId: link.agency_id,
    agencyName: link.agencies?.name || 'Agencia',
    role: link.role,
    active: link.active
  };
};

/**
 * Une a un usuario autenticado a la agencia asociada al código del enlace.
 */
export const acceptInviteLink = async (userId, email, code) => {
  const trimmedCode = String(code || '').trim().toLowerCase();
  
  // 1) Resolver e indicar error si es inválido
  const inviteInfo = await resolveInviteLink(trimmedCode);

  // 2) Incrementar los usos de este enlace
  const { error: incrementError } = await supabaseAdmin
    .from('agency_invite_links')
    .update({ uses: supabaseAdmin.raw ? undefined : 1 }) // Hacemos un update simple
    .eq('code', trimmedCode);

  // Intentar incrementar el contador de usos (obtenemos el link actual y le sumamos 1)
  try {
    const { data: currentLink } = await supabaseAdmin
      .from('agency_invite_links')
      .select('uses')
      .eq('code', trimmedCode)
      .single();
    if (currentLink) {
      await supabaseAdmin
        .from('agency_invite_links')
        .update({ uses: (currentLink.uses || 0) + 1 })
        .eq('code', trimmedCode);
    }
  } catch (err) {
    console.error('Error al incrementar usos de enlace:', err.message);
  }

  // 3) Asociar el usuario a la agencia
  const { data: profile, error: profileFetchError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    throw new Error(`Error al verificar perfil del usuario: ${profileFetchError.message}`);
  }

  if (profile) {
    // Actualizar perfil existente
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        agency_id: inviteInfo.agencyId,
        role: inviteInfo.role
      })
      .eq('id', userId);

    if (updateProfileError) {
      throw new Error(`Error al actualizar perfil de usuario: ${updateProfileError.message}`);
    }
  } else {
    // Crear perfil nuevo
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        agency_id: inviteInfo.agencyId,
        role: inviteInfo.role,
        full_name: 'Miembro Invitado'
      });

    if (insertProfileError) {
      throw new Error(`Error al crear perfil de usuario: ${insertProfileError.message}`);
    }
  }

  return inviteInfo;
};

