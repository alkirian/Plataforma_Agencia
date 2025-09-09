import { apiClient } from './api-client'
import type { ApiResponse } from '../types/api.types'

/**
 * Type-safe API functions for invitation management
 */

export interface CreateInvitationData {
  emails: string[]
  role: string
  redirectUrl?: string
}

export interface AcceptInvitationData {
  token: string
  fullName: string
  role: string
  avatarUrl?: string
}

export interface RevokeInvitationData {
  invitationId: string
}

export interface ResendInvitationData {
  invitationId: string
}

export interface Invitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'revoked'
  token: string
  expires_at: string
  created_at: string
  agency_id: string
  invited_by_id: string
  [key: string]: any
}

export interface Member {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string
  created_at: string
  [key: string]: any
}

export const invitationsApi = {
  /**
   * List members and pending invitations
   */
  async listMembersAndInvites(): Promise<
    ApiResponse<{ members: Member[]; invitations: Invitation[] }>
  > {
    return apiClient.get<ApiResponse<{ members: Member[]; invitations: Invitation[] }>>(
      '/invitations'
    )
  },

  /**
   * Create new invitations
   */
  async createInvitations(data: CreateInvitationData): Promise<ApiResponse<Invitation[]>> {
    return apiClient.post<ApiResponse<Invitation[]>>('/invitations', data)
  },

  /**
   * Validate invitation token
   */
  async validateInvitation(token: string): Promise<ApiResponse<Invitation>> {
    return apiClient.get<ApiResponse<Invitation>>(`/invitations/validate/${token}`)
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(data: AcceptInvitationData): Promise<ApiResponse<Member>> {
    return apiClient.post<ApiResponse<Member>>('/invitations/accept', data)
  },

  /**
   * Revoke invitation
   */
  async revokeInvitation(invitationId: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>('/invitations/revoke', { invitationId })
  },

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string): Promise<ApiResponse<Invitation>> {
    return apiClient.post<ApiResponse<Invitation>>('/invitations/resend', { invitationId })
  },
}

// Legacy exports for backward compatibility
export const listMembersAndInvites = invitationsApi.listMembersAndInvites
export const createInvitations = invitationsApi.createInvitations
export const validateInvitation = invitationsApi.validateInvitation
export const acceptInvitation = invitationsApi.acceptInvitation
export const revokeInvitation = invitationsApi.revokeInvitation
export const resendInvitation = invitationsApi.resendInvitation
