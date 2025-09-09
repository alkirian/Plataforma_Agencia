import type { Document, DocumentInsert, DocumentUpdate } from './supabase.types'
import type { FileWithPreview, UploadProgress, ISO8601Date } from './common.types'

// Re-export the base types from supabase.types
export type { Document, DocumentInsert, DocumentUpdate }

// Extended document types
export interface DocumentWithClient extends Document {
  client: {
    id: string
    name: string
    company: string | null
  }
}

export interface DocumentUploadData {
  file: File
  clientId: string
  folderPath?: string
  metadata?: Record<string, unknown>
}

export interface DocumentUploadProgress extends UploadProgress {
  documentId?: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

// Document folder system
export interface DocumentFolder {
  path: string
  name: string
  parent?: string
  children: DocumentFolder[]
  documents: Document[]
  created_at: ISO8601Date
}

export interface DocumentFolderCreate {
  name: string
  parent?: string
  clientId: string
}

// Document AI processing
export interface DocumentAIMetadata {
  summary?: string
  keywords?: string[]
  category?: string
  language?: string
  word_count?: number
  page_count?: number
  extracted_entities?: Array<{
    type: string
    value: string
    confidence: number
  }>
  topics?: Array<{
    name: string
    confidence: number
  }>
}

export interface DocumentProcessingStatus {
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
  started_at?: ISO8601Date
  completed_at?: ISO8601Date
}

// Document search and filtering
export interface DocumentSearchFilters {
  clientId?: string
  fileType?: string
  folderPath?: string
  aiStatus?: 'pending' | 'processing' | 'completed' | 'error'
  createdAfter?: string
  createdBefore?: string
  sizeMin?: number
  sizeMax?: number
}

export interface DocumentSortOptions {
  field: 'file_name' | 'created_at' | 'file_size' | 'file_type' | 'ai_status'
  direction: 'asc' | 'desc'
}

// Document preview types
export interface DocumentPreview {
  documentId: string
  type: 'text' | 'image' | 'pdf' | 'office' | 'unknown'
  content?: string
  thumbnail?: string
  metadata?: {
    title?: string
    pages?: number
    words?: number
    size: number
  }
}

// File type configurations
export const SUPPORTED_FILE_TYPES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  spreadsheet: ['.xls', '.xlsx', '.csv'],
  presentation: ['.ppt', '.pptx'],
  archive: ['.zip', '.rar', '.7z'],
} as const

export const FILE_TYPE_ICONS = {
  'application/pdf': 'DocumentTextIcon',
  'application/msword': 'DocumentIcon',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DocumentIcon',
  'text/plain': 'DocumentTextIcon',
  'image/jpeg': 'PhotoIcon',
  'image/png': 'PhotoIcon',
  'image/gif': 'PhotoIcon',
  'application/zip': 'ArchiveBoxIcon',
  default: 'DocumentIcon',
} as const

export type SupportedFileType = keyof typeof FILE_TYPE_ICONS

// Document bulk operations
export interface DocumentBulkOperation {
  type: 'delete' | 'move' | 'copy' | 'process'
  documentIds: string[]
  destination?: string // for move/copy operations
}

export interface DocumentBulkResult {
  success: string[]
  failed: Array<{
    documentId: string
    error: string
  }>
}

// Document version control
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_name: string
  storage_path: string
  file_size: number
  created_at: ISO8601Date
  created_by: string
  changelog?: string
}

// Document sharing
export interface DocumentShare {
  id: string
  document_id: string
  share_token: string
  expires_at?: ISO8601Date
  password_protected: boolean
  download_enabled: boolean
  view_count: number
  created_at: ISO8601Date
  created_by: string
}

export interface DocumentShareCreate {
  documentId: string
  expiresAt?: Date
  password?: string
  downloadEnabled?: boolean
}
