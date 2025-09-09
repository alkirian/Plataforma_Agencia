/**
 * Shared Hooks - Barrel Export
 * Provides centralized access to all shared hooks
 */

// Core document management hook
export {
  useDocumentsCore,
  documentQueryKeys,
  type UseDocumentsCoreConfig,
} from './useDocumentsCore'

// Re-export all document types for convenience
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
} from '../types/document.types'

// Re-export services for convenience
export {
  documentsV1Service,
  documentsV2Service,
  createDocumentsService,
} from '../services/documentsService'
