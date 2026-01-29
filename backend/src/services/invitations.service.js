import crypto from "crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { sendInvitationEmail } from "../utils/email.js";

const INVITE_EXPIRY_DAYS = 7;

const generateToken = () => crypto.randomBytes(24).toString("base64url");

const computeExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d.toISOString();
};

export const createInvitations = async ({
  inviterId,
  inviterName,
  agencyId,
  emails,
  role = "member",
  redirectUrl,
}) => {
  const errors = [];
  const invitations = [];

  // Get agency name for email
  let agencyName = null;
  try {
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("name")
      .eq("id", agencyId)
      .maybeSingle();
    agencyName = agency?.name || null;
  } catch (e) {
    // Continue without agency name
  }

  for (const rawEmail of emails) {
    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();
    if (!email) {
      errors.push({ email: rawEmail, error: "Email vacío" });
      continue;
    }
    const token = generateToken();
    const expiresAt = computeExpiry();

    // insert invitation
    const { data: inserted, error } = await supabaseAdmin
      .from("invitations")
      .insert({
        agency_id: agencyId,
        email,
        token,
        role,
        inviter_id: inviterId,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      errors.push({ email, error: error.message });
      continue;
    }

    const frontendBase =
      process.env.FRONTEND_URL || redirectUrl || "http://localhost:5173";
    const link = `${frontendBase.replace(/\/$/, "")}/invite/${token}`;

    try {
      await sendInvitationEmail({
        to: email,
        agencyId,
        agencyName,
        inviterName,
        link,
        role,
      });
    } catch (mailErr) {
      // no bloquear por email fallido
    }

    invitations.push({ ...inserted, link });
  }

  return { invitations, errors };
};

export const listAgencyMembersAndInvites = async (agencyId) => {
  const [{ data: members, error: memErr }, { data: invites, error: invErr }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, avatar_url, last_sign_in_at")
        .eq("agency_id", agencyId)
        .order("full_name", { ascending: true }),
      supabaseAdmin
        .from("invitations")
        .select("id, email, role, status, created_at, expires_at, inviter_id")
        .eq("agency_id", agencyId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);

  if (memErr) throw new Error(`Error listando miembros: ${memErr.message}`);
  if (invErr) throw new Error(`Error listando invitaciones: ${invErr.message}`);

  return { members: members || [], invitations: invites || [] };
};

export const validateInvitationToken = async (token) => {
  const { data: invite, error } = await supabaseAdmin
    .from("invitations")
    .select(
      "id, token, email, role, status, expires_at, agency:agencies(id, name), inviter:profiles(id, full_name, email)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.status !== "pending") throw new Error("Invitación no disponible");
  if (new Date(invite.expires_at) < new Date())
    throw new Error("Invitación expirada");

  return {
    invitationId: invite.id,
    email: invite.email,
    role: invite.role,
    organizationName: invite.agency?.name || "Agencia",
    inviterName: invite.inviter?.full_name || null,
    inviterEmail: invite.inviter?.email || null,
  };
};

export const acceptInvitation = async ({
  token,
  fullName,
  role,
  avatarUrl,
}) => {
  // Fetch invite
  const { data: invite, error } = await supabaseAdmin
    .from("invitations")
    .select("id, email, role, status, expires_at, agency_id")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.status !== "pending") throw new Error("Invitación no disponible");
  if (new Date(invite.expires_at) < new Date())
    throw new Error("Invitación expirada");

  const finalRole = role || invite.role || "member";

  // Try to invite user by email (creates user if absent and sends email)
  let userId = null;
  try {
    const { data: invited, error: invErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(invite.email, {
        redirectTo:
          (process.env.FRONTEND_URL || "http://localhost:5173") +
          "/auth/callback",
      });
    if (!invErr && invited?.user?.id) {
      userId = invited.user.id;
    } else if (invErr) {
      // If already exists, try to look up profile by email to get user id
      const { data: prof, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", invite.email)
        .maybeSingle();
      if (profErr) throw new Error(profErr.message);
      userId = prof?.id || null;
    }
  } catch {
    // Fallback to profile lookup only
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", invite.email)
      .maybeSingle();
    userId = prof?.id || null;
  }

  // If we have a user id, ensure not already in a different agency, then upsert profile and attach to agency
  if (userId) {
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("profiles")
      .select("id, agency_id")
      .eq("id", userId)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (existing?.agency_id && existing.agency_id !== invite.agency_id) {
      throw new Error("Este usuario ya pertenece a otra agencia.");
    }

    const updates = {
      id: userId,
      email: invite.email,
      full_name: fullName,
      role: finalRole,
      agency_id: existing?.agency_id || invite.agency_id,
    };
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .upsert(updates);
    if (upErr) throw new Error(`Error actualizando perfil: ${upErr.message}`);
  }

  // Mark invitation as accepted
  const { error: updErr } = await supabaseAdmin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (updErr)
    throw new Error(`Error actualizando invitación: ${updErr.message}`);

  return {
    joined: Boolean(userId),
    needsEmailVerification: !userId, // if we couldn't find/create the user, they'll complete via email
    message: userId
      ? "Invitación aceptada. Ya puedes iniciar sesión."
      : "Invitación aceptada. Revisa tu email para completar el acceso.",
  };
};

export const revokeInvitation = async ({ invitationId, agencyId }) => {
  const { error } = await supabaseAdmin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("agency_id", agencyId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return true;
};

export const resendInvitation = async ({ invitationId, agencyId }) => {
  const { data: invite, error } = await supabaseAdmin
    .from("invitations")
    .select("id, email, role, token, status, expires_at, inviter_id")
    .eq("id", invitationId)
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) throw new Error("Invitación no encontrada");
  if (invite.status !== "pending")
    throw new Error("La invitación no está pendiente");
  if (new Date(invite.expires_at) < new Date())
    throw new Error("Invitación expirada");

  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendBase.replace(/\/$/, "")}/invite/${invite.token}`;
  await sendInvitationEmail({ to: invite.email, link, role: invite.role });
  return { invitationId, sent: true };
};
