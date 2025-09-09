/**
 * API and Supabase integration TypeScript interfaces
 * Used throughout the application for API interactions
 */

// Base API response structure
export interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
  error?: string
}

export interface ApiError {
  status: number
  message: string
  code?: string
  details?: any
  stack?: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Query options
export interface QueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: boolean | number
  retryDelay?: number
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
}

// Mutation options
export interface MutationOptions<TData = any, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: ApiError, variables: TVariables) => void
  onSettled?: (data?: TData, error?: ApiError, variables?: TVariables) => void
}

// Supabase specific types
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
  status: number
  statusText: string
}

// Real-time subscription types
export interface RealtimePayload<T = any> {
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  schema: string
  table: string
  new: T
  old: T
}

export interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  table?: string
  filter?: string
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Request configuration
export interface RequestConfig {
  method: HttpMethod
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  withCredentials?: boolean
}

// Fetch configuration specifically for our API
export interface ApiFetchConfig extends Omit<RequestConfig, 'url'> {
  endpoint: string
  baseUrl?: string
  credentials?: 'same-origin' | 'include' | 'omit'
}

// File upload types
export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadOptions {
  onProgress?: (progress: FileUploadProgress) => void
  onSuccess?: (response: any) => void
  onError?: (error: ApiError) => void
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
  key?: string
}

// Search and filter types
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  sort?: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  pagination?: PaginationParams
}

export interface FilterOption {
  key: string
  value: any
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains'
}

// Cache types
export interface CacheConfig {
  ttl?: number
  tags?: string[]
  key?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
}
