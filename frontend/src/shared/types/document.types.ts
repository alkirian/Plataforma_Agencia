/**
 * Document Types for the Platform
 * Comprehensive type definitions for document management system
 */

// Base document structure
export interface DocumentBase {
  id: string | number
  file_name?: string
  filename?: string
  filenameOriginal?: string
  file_type?: string
  mimeType?: string
  file_size?: number
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  client_id?: string
  clientId?: string
}

// Document V1 (legacy)
export interface DocumentV1 extends DocumentBase {
  ai_status?: 'processing' | 'completed' | 'failed'
  _optimistic?: boolean
}

// Document V2 (enhanced)
export interface DocumentV2 extends DocumentBase {
  pinned?: boolean
  deletedAt?: string | null
  isDuplicate?: boolean
  tags?: string[]
  description?: string
  downloadUrl?: string
  previewUrl?: string
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  metadata?: Record<string, any>
}

// Document operations payload types
export interface DocumentUploadPayload {
  file: File
  id?: string
  clientId: string
  metadata?: Record<string, any>
}

export interface DocumentUpdatePayload {
  filename?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
}

// Document query parameters
export interface DocumentQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
  tags?: string[]
  mimeType?: string
  dateFrom?: string
  dateTo?: string
}

// Pagination response
export interface DocumentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Document list response
export interface DocumentListResponse {
  data: DocumentV2[]
  pagination: DocumentPagination
  success: boolean
  message?: string
}

// Document statistics
export interface DocumentStats {
  totalDocuments: number
  totalSize: number
  documentsThisWeek: number
  documentsThisMonth: number
  storageUsed: number
  storageLimit: number
  mimeTypeDistribution: Record<string, number>
  recentActivity: Array<{
    date: string
    uploads: number
    deletions: number
  }>
}

// Upload progress tracking
export interface UploadProgress {
  progress: number
  speed?: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}

// Document board column
export interface DocumentBoardColumn {
  id: string
  name: string
  color?: string
  order: number
  createdAt?: string
  updatedAt?: string
}

// Document board data
export interface DocumentBoardData {
  columns: Array<DocumentBoardColumn & { documents: DocumentV2[] }>
  unassignedDocuments: DocumentV2[]
}

// Document board statistics
export interface DocumentBoardStats {
  totalDocuments: number
  totalColumns: number
  organizedDocuments: number
  unorganizedDocuments: number
}

// Hook return types
export interface UseDocumentsCoreReturn {
  // Data
  documents: DocumentV2[]
  pagination: DocumentPagination
  stats: DocumentStats | null

  // Loading states
  isLoading: boolean
  isLoadingStats: boolean
  isUploading: boolean
  isDeleting: boolean
  isUpdating: boolean

  // Error states
  error: Error | null
  statsError: Error | null

  // Core operations
  uploadDocuments: (files: DocumentUploadPayload[]) => Promise<DocumentV2[]>
  updateDocument: (id: string | number, updates: DocumentUpdatePayload) => Promise<DocumentV2>
  deleteDocument: (id: string | number) => Promise<void>
  restoreDocument?: (id: string | number) => Promise<DocumentV2>

  // Utilities
  refetch: () => Promise<any>
  refetchStats: () => Promise<any>
  updateQueryParams: (params: Partial<DocumentQueryParams>) => void
  queryParams: DocumentQueryParams
}

// V2-specific features
export interface UseDocumentsV2Return extends UseDocumentsCoreReturn {
  // V2-specific data
  uploadProgress: Record<string, UploadProgress>
  selectedDocuments: string[]

  // V2-specific operations
  togglePin: (id: string | number) => Promise<DocumentV2>
  renameDocument: (id: string | number, newName: string) => Promise<DocumentV2>
  downloadDocument: (document: DocumentV2) => Promise<void>
  previewDocument: (document: DocumentV2) => Promise<void>

  // Selection management
  selectDocument: (document: DocumentV2, selected: boolean) => void
  selectAllDocuments: (selected: boolean) => void
  clearSelection: () => void

  // Navigation & search
  search: (query: string) => void
  changePage: (page: number) => void
  changeSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void

  // Upload progress
  clearUploadProgress: () => void
}

// Document board hook return type
export interface UseDocumentBoardReturn {
  // Data
  columns: Array<DocumentBoardColumn & { documents: DocumentV2[] }>
  unassignedDocuments: DocumentV2[]
  stats: DocumentBoardStats

  // Actions
  createColumn: (
    columnData: Omit<DocumentBoardColumn, 'id'>
  ) => Promise<{ success: boolean; column?: DocumentBoardColumn; error?: string }>
  updateColumn: (
    columnId: string,
    updates: Partial<DocumentBoardColumn>
  ) => Promise<{ success: boolean; error?: string }>
  deleteColumn: (columnId: string) => Promise<{ success: boolean; error?: string }>
  moveDocument: (
    documentId: string | number,
    sourceColumnId: string,
    targetColumnId: string,
    targetIndex?: number
  ) => Promise<{ success: boolean; error?: string }>
  reorderColumns: (
    sourceIndex: number,
    targetIndex: number
  ) => Promise<{ success: boolean; error?: string }>

  // Utilities
  isEmpty: boolean
  hasColumns: boolean
}

// Legacy V1 hook return type for compatibility
export interface UseDocumentsV1Return {
  documents: DocumentV1[]
  isLoading: boolean
  error: Error | null

  upload: (payload: { file: File }) => Promise<DocumentV1>
  remove: (id: string | number) => Promise<void>
  download: (document: DocumentV1) => Promise<void>
  refetch: () => Promise<any>

  isUploading: boolean
  isDeleting: boolean
  isDownloading: boolean
}

// API service types
export interface DocumentsServiceConfig {
  baseUrl?: string
  timeout?: number
  retries?: number
}

export interface DocumentsService {
  // Core operations
  getDocuments: (clientId: string, params?: DocumentQueryParams) => Promise<DocumentListResponse>
  uploadDocuments: (
    clientId: string,
    files: DocumentUploadPayload[],
    onProgress?: (progress: number) => void
  ) => Promise<DocumentV2[]>
  updateDocument: (id: string | number, updates: DocumentUpdatePayload) => Promise<DocumentV2>
  deleteDocument: (id: string | number) => Promise<void>

  // V2 specific operations
  togglePin?: (id: string | number) => Promise<DocumentV2>
  restoreDocument?: (id: string | number) => Promise<DocumentV2>
  getStats?: (clientId: string) => Promise<DocumentStats>
  getDownloadUrl?: (id: string | number) => Promise<string>
  getPreviewUrl?: (id: string | number) => Promise<string>
}

// Error types
export interface DocumentError extends Error {
  code?: string
  status?: number
  details?: any
}

// Event types for document operations
export interface DocumentEventHandlers {
  onUploadStart?: (files: File[]) => void
  onUploadProgress?: (progress: number) => void
  onUploadSuccess?: (documents: DocumentV2[]) => void
  onUploadError?: (error: DocumentError) => void
  onDeleteSuccess?: (documentId: string | number) => void
  onDeleteError?: (error: DocumentError) => void
}

// Utility types
export type DocumentId = string | number
export type DocumentSortField = 'name' | 'size' | 'type' | 'created_at' | 'updated_at' | 'pinned'
export type DocumentSortOrder = 'asc' | 'desc'

// File type validation
export interface FileValidationRules {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}
