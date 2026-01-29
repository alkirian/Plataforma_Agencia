/**
 * Documents Feature - Export Barrel
 * Following Scope Rules: All exports are local to documents feature
 */

// Main container component (follows Scope Rules naming convention)
export { Documents } from './Documents.jsx'

// Legacy export for backward compatibility
export { DocumentsSectionV2 } from './Documents.jsx'

// Hooks - Local to documents feature
export { useDocuments } from './hooks/useDocuments'
export { useDocumentBoard } from './hooks/useDocumentBoard'
export { useDocumentsV2 } from './hooks/useDocumentsV2'

// Re-export shared document types and services for convenience
export type {
  DocumentV2 as Document,
  DocumentBase,
  DocumentUploadPayload,
  DocumentUpdatePayload,
  UploadProgress,
} from '@shared/types/document.types'

export { documentsV2Service } from '@shared/services/documentsService'
