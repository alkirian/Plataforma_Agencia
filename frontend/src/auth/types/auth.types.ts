import type { AuthUser, AuthSession, Database } from '../../types/supabase.types'
import type { Permission, UserPermissions } from '../../types/common.types'

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
  confirmPassword: string
  agencyName?: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  password: string
  confirmPassword: string
  token: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

// User profile types
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  phone: string | null
  timezone: string
  language: string
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserProfileUpdate
  extends Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>> {
  avatar?: File
}

// Agency context types
export interface AgencyContext {
  agency: {
    id: string
    name: string
    logo_url: string | null
    settings: Record<string, unknown> | null
  }
  member: {
    id: string
    role: Database['public']['Enums']['member_role']
    joined_at: string | null
  }
  permissions: UserPermissions
}

// Auth state types
export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  profile: UserProfile | null
  agency: AgencyContext | null
  loading: boolean
  initialized: boolean
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (data: ForgotPasswordData) => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<void>
  changePassword: (data: ChangePasswordData) => Promise<void>
  updateProfile: (data: UserProfileUpdate) => Promise<void>
  refreshSession: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  switchAgency: (agencyId: string) => Promise<void>
}

// OAuth provider types
export type OAuthProvider = 'google' | 'github' | 'microsoft'

export interface OAuthCredentials {
  provider: OAuthProvider
  redirectTo?: string
}

// Session management types
export interface SessionConfig {
  maxAge: number // in seconds
  refreshThreshold: number // refresh if expires in less than this many seconds
  storageKey: string
}

// Auth error types
export interface AuthError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>
}

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  WEAK_PASSWORD: 'weak_password',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  TOO_MANY_REQUESTS: 'too_many_requests',
  INVALID_TOKEN: 'invalid_token',
  EXPIRED_TOKEN: 'expired_token',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

// JWT token types
export interface JWTPayload {
  sub: string // user id
  email: string
  aud: string
  exp: number
  iat: number
  iss: string
  role: string
  agency_id?: string
  permissions?: Permission[]
}

// Auth hooks return types
export interface UseAuthReturn extends AuthContextValue {}

export interface UseSessionReturn {
  session: AuthSession | null
  loading: boolean
  error: AuthError | null
  refresh: () => Promise<void>
}

export interface UsePermissionsReturn {
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  role: Database['public']['Enums']['member_role'] | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
}

// Invitation system types
export interface AgencyInvitation {
  id: string
  agency_id: string
  email: string
  role: Database['public']['Enums']['member_role']
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface InvitationCreate {
  email: string
  role: Database['public']['Enums']['member_role']
  message?: string
}

export interface AcceptInvitationData {
  token: string
  name: string
  password: string
}
