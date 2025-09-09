import { supabase } from '../../supabaseClient'
import type {
  LoginCredentials,
  RegisterCredentials,
  OAuthProvider,
  AuthError,
  AUTH_ERROR_CODES,
} from '../types/auth.types'

/**
 * Auth Service - Handles all authentication-related API calls
 * Follows Single Responsibility Principle - only handles auth API operations
 */
export class AuthService {
  private static instance: AuthService

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Check if email exists in the system
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw this.createAuthError(
          error.message || 'Error checking email',
          'EMAIL_CHECK_FAILED',
          response.status
        )
      }

      const result = await response.json()
      return result.data?.exists || false
    } catch (error) {
      console.error('Email check error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw this.createAuthError(error.message, 'INVALID_CREDENTIALS', error.status || 401)
      }

      return data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials) {
    try {
      const response = await fetch('/api/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          fullName: credentials.name,
          agencyName: credentials.agencyName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw this.createAuthError(
          result.message || 'Registration failed',
          'REGISTRATION_FAILED',
          response.status
        )
      }

      // Auto-login after successful registration
      const loginData = await this.login({
        email: credentials.email,
        password: credentials.password,
      })

      return { registration: result, session: loginData }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * OAuth login (Google, GitHub, etc.)
   */
  async loginWithOAuth(provider: OAuthProvider, redirectTo?: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || window.location.origin,
        },
      })

      if (error) {
        throw this.createAuthError(error.message, 'OAUTH_FAILED', error.status || 500)
      }

      return data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw this.createAuthError(error.message, 'LOGOUT_FAILED', error.status || 500)
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw this.createAuthError(error.message, 'PASSWORD_RESET_FAILED', error.status || 500)
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Update password with reset token
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw this.createAuthError(error.message, 'PASSWORD_UPDATE_FAILED', error.status || 500)
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw this.createAuthError(error.message, 'SESSION_FETCH_FAILED', error.status || 500)
      }

      return data.session
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        throw this.createAuthError(error.message, 'SESSION_REFRESH_FAILED', error.status || 500)
      }

      return data.session
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(message: string, code: string, status: number): AuthError {
    const error = new Error(message) as AuthError
    error.code = code
    error.status = status
    error.name = 'AuthError'
    return error
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown): AuthError {
    if (this.isAuthError(error)) {
      return error
    }

    if (error instanceof Error) {
      return this.createAuthError(error.message, 'UNKNOWN_ERROR', 500)
    }

    return this.createAuthError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
  }

  /**
   * Type guard for AuthError
   */
  private isAuthError(error: unknown): error is AuthError {
    return error instanceof Error && 'code' in error && 'status' in error
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
