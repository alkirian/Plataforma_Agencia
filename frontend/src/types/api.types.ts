// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  status?: number
}

export interface ApiError extends Error {
  status: number
  code?: string
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API Method Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiFetchOptions extends Omit<RequestInit, 'method' | 'body'> {
  method?: HttpMethod
  body?: any
}

// Query and Mutation Types
export interface QueryConfig {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  retry?: number | boolean
}

export interface MutationConfig<TData = unknown, TError = ApiError, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: TError, variables: TVariables) => void | Promise<void>
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void | Promise<void>
}

// Filter and Sort Types
export interface FilterParam<T = string> {
  field: string
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'like' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte'
  value: T | T[]
}

export interface SortParam {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryParams extends PaginationParams {
  filters?: FilterParam[]
  sorts?: SortParam[]
  search?: string
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refresh: '/auth/refresh',

  // Clients
  clients: '/clients',
  clientById: (id: string): string => `/clients/${id}`,

  // Documents
  clientDocuments: (clientId: string): string => `/clients/${clientId}/documents`,
  documentById: (clientId: string, docId: string): string =>
    `/clients/${clientId}/documents/${docId}`,

  // Context Sources
  contextSources: '/context-sources',
  contextSourceById: (id: string): string => `/context-sources/${id}`,

  // Schedule/Tasks
  tasks: '/tasks',
  taskById: (id: string): string => `/tasks/${id}`,

  // AI Assistant
  aiChat: '/ai/chat',
  aiIdeas: '/ai/ideas',
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
