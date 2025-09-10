import { supabase } from '../supabaseClient'
import type {
  ApiResponse,
  ApiError as ApiErrorInterface,
  ApiFetchOptions,
  HttpMethod,
} from '../types/api.types'

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3001/api/v1'

/**
 * Type-safe API client with automatic token management and error handling
 */
class ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Get authentication token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const liveToken = sessionData?.session?.access_token

      if (liveToken) return liveToken

      // Fallback to localStorage for legacy compatibility
      return localStorage.getItem('authToken')
    } catch (error) {
      console.warn('Failed to get auth token:', error)
      return localStorage.getItem('authToken')
    }
  }

  /**
   * Prepare headers for API request
   */
  private async prepareHeaders(options: ApiFetchOptions = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    const token = await this.getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle empty responses (204, etc.)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true } as T
    }

    let data: any
    const contentType = response.headers.get('content-type')

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = { message: await response.text() }
      }
    } catch (parseError) {
      throw new ApiError(`Failed to parse response: ${parseError}`, response.status)
    }

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}`
      const error = new ApiError(errorMessage, response.status)
      error.code = data?.code
      throw error
    }

    return data
  }

  /**
   * Retry request with refreshed token on 401
   */
  private async retryWithRefresh<T>(url: string, options: ApiFetchOptions): Promise<T> {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error || !data?.session?.access_token) {
        throw new ApiError('Failed to refresh session', 401)
      }

      // Update headers with new token
      const headers = await this.prepareHeaders(options)
      const response = await fetch(url, { ...options, headers })

      return this.handleResponse<T>(response)
    } catch (error) {
      throw new ApiError('Session refresh failed', 401)
    }
  }

  /**
   * Core request method with automatic retry logic
   */
  public async request<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = await this.prepareHeaders(options)

    const requestOptions: RequestInit = {
      method: options.method,
      headers,
      body: options.body
        ? options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
      cache: options.cache,
      credentials: options.credentials,
      integrity: options.integrity,
      keepalive: options.keepalive,
      mode: options.mode,
      redirect: options.redirect,
      referrer: options.referrer,
      referrerPolicy: options.referrerPolicy,
      signal: options.signal,
      window: options.window,
    }

    try {
      const response = await fetch(url, requestOptions)
      return await this.handleResponse<T>(response)
    } catch (error) {
      // Retry on 401 with token refresh
      if (error instanceof ApiError && error.status === 401) {
        const { data: sessionData } = await supabase.auth.getSession()
        const hasLiveToken = sessionData?.session?.access_token

        if (hasLiveToken) {
          return this.retryWithRefresh<T>(url, options)
        }
      }

      // Log errors in development
      if (import.meta.env.DEV) {
        console.error(`API Error: ${options.method || 'GET'} ${endpoint}`, error)
      }

      throw error
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options: Omit<ApiFetchOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options: Omit<ApiFetchOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options: Omit<ApiFetchOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    options: Omit<ApiFetchOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options: Omit<ApiFetchOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error implements ApiErrorInterface {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export { ApiError }

// Legacy apiFetch export removed - use apiClient directly

/**
 * Agency management functions
 * Manage active agency ID for API requests
 */
const ACTIVE_AGENCY_KEY = 'activeAgencyId'

export const setActiveAgencyIdForAPI = (agencyId: string | null): void => {
  if (agencyId) {
    localStorage.setItem(ACTIVE_AGENCY_KEY, agencyId)
  } else {
    localStorage.removeItem(ACTIVE_AGENCY_KEY)
  }
}

export const getActiveAgencyIdFromAPI = (): string | null => {
  return localStorage.getItem(ACTIVE_AGENCY_KEY)
}
