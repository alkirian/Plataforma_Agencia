// src/api/invitations.js
import { apiFetch } from './apiFetch'

export const listMembersAndInvites = async () => {
  return apiFetch('/invitations')
}

export const createInvitations = async ({ emails, role, redirectUrl }) => {
  return apiFetch('/invitations', {
    method: 'POST',
    body: JSON.stringify({ emails, role, redirectUrl }),
  })
}

export const validateInvitation = async token => {
  return apiFetch(`/invitations/validate/${token}`)
}

export const acceptInvitation = async ({ token, fullName, role, avatarUrl }) => {
  return apiFetch('/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token, fullName, role, avatarUrl }),
  })
}

export const revokeInvitation = async invitationId => {
  return apiFetch('/invitations/revoke', {
    method: 'POST',
    body: JSON.stringify({ invitationId }),
  })
}

export const resendInvitation = async invitationId => {
  return apiFetch('/invitations/resend', {
    method: 'POST',
    body: JSON.stringify({ invitationId }),
  })
}
