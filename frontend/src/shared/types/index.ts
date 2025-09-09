/**
 * Barrel export for all shared TypeScript types
 * Provides centralized access to type definitions
 */

// Client types
export type {
  Client,
  ClientCreatePayload,
  ClientsListResponse,
  Contact,
  SocialLinks,
  ClientCreationFormData,
  Industry,
} from './client.types'

// Modal types - avoiding duplicate exports
export type { ModalAction, ModalProps } from './modal.types'

// Dashboard types
export type { DashboardProps, WelcomeEmptyStateProps } from './dashboard.types'

// Activity types
export type {
  ActivityType,
  ActivityFeedProps,
  ActivityEvent,
  ActivityTypeConfig,
  ActivityDetails,
} from './activity.types'

// Form types - avoiding duplicate exports by using aliases
export type {
  FormFieldConfig as SharedFormFieldConfig,
  FormModalProps as SharedFormModalProps,
} from './form.types'

// API types - avoiding duplicate by aliasing
export type { ApiResponse as SharedApiResponse, ApiError as SharedApiError } from './api.types'

// Document types
export type {
  DocumentBase,
  DocumentV1,
  DocumentV2,
  DocumentUploadPayload,
  DocumentUpdatePayload,
  DocumentQueryParams,
  DocumentPagination,
  DocumentListResponse,
  DocumentStats,
  UploadProgress,
  DocumentBoardColumn,
  DocumentBoardData,
  DocumentBoardStats,
  UseDocumentsCoreReturn,
  UseDocumentsV2Return,
  UseDocumentBoardReturn,
  UseDocumentsV1Return,
  DocumentsService,
  DocumentsServiceConfig,
  DocumentError,
  DocumentEventHandlers,
  DocumentId,
  DocumentSortField,
  DocumentSortOrder,
  FileValidationRules,
  FileValidationResult,
} from './document.types'

// Constants
export { INDUSTRIES } from './client.types'

// Common utility types
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterState {
  [key: string]: any
}

// Common event handler types
export type EventHandler<T = any> = (event: T) => void
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | boolean
}

export interface FieldError {
  type: string
  message: string
}

// API types
export interface ApiError {
  status: number
  message: string
  code?: string
  details?: any
}

export interface QueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  cacheTime?: number
}
