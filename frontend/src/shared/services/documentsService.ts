/**
 * Documents Service - Centralized API Management
 * Provides unified interface for all document operations
 */

import { apiFetch } from '../../api/apiFetch.js'
import { supabase } from '../../supabaseClient.js'
import type {
  DocumentV2,
  DocumentV1,
  DocumentUploadPayload,
  DocumentUpdatePayload,
  DocumentQueryParams,
  DocumentListResponse,
  DocumentStats,
  DocumentsService,
  DocumentsServiceConfig,
  DocumentError,
} from '../types/document.types'

// API endpoints configuration
const ENDPOINTS = {
  V1: {
    BASE: '/documents',
    UPLOAD: (clientId: string) => `/documents/${clientId}/upload`,
    DELETE: (clientId: string, docId: string | number) => `/documents/${clientId}/${docId}`,
    DOWNLOAD: '/documents/download',
  },
  V2: {
    BASE: '/documents-v2',
    UPLOAD: '/documents-v2/upload',
    PIN: (docId: string | number) => `/documents-v2/${docId}/pin`,
    DELETE: (docId: string | number) => `/documents-v2/${docId}`,
    RESTORE: (docId: string | number) => `/documents-v2/${docId}/restore`,
    DOWNLOAD: (docId: string | number) => `/documents-v2/${docId}/download`,
    PREVIEW: (docId: string | number) => `/documents-v2/${docId}/preview`,
    STATS: '/documents-v2/stats',
  },
} as const

/**
 * Create DocumentError from various error sources
 */
function createDocumentError(error: any, operation: string): DocumentError {
  const docError = new Error(error?.message || `${operation} operation failed`) as DocumentError

  docError.name = 'DocumentError'
  docError.code = error?.code || 'UNKNOWN_ERROR'
  docError.status = error?.status || 500
  docError.details = error?.details

  return docError
}

/**
 * Document V1 Service (Legacy)
 */
export const documentsV1Service: Partial<DocumentsService> = {
  async getDocuments(clientId: string): Promise<DocumentListResponse> {
    try {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required')
      }

      const response = await apiFetch(`${ENDPOINTS.V1.BASE}/${clientId}`)

      if (!response?.success) {
        throw new Error(response?.message || 'Error loading documents')
      }

      const documents = (response?.data || []).map(
        (doc: any): DocumentV2 => ({
          id: doc.id,
          filename: doc.file_name || doc.filename,
          filenameOriginal: doc.file_name || doc.filename,
          mimeType: doc.file_type || doc.mimeType,
          file_size: doc.file_size,
          createdAt: doc.created_at || doc.createdAt,
          clientId: doc.client_id || doc.clientId,
          processingStatus: doc.ai_status === 'processing' ? 'processing' : 'completed',
        })
      )

      return {
        data: documents,
        pagination: {
          page: 1,
          limit: documents.length,
          total: documents.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        success: true,
      }
    } catch (error) {
      throw createDocumentError(error, 'getDocuments')
    }
  },

  async uploadDocuments(
    clientId: string,
    files: DocumentUploadPayload[],
    onProgress?: (progress: number) => void
  ): Promise<DocumentV2[]> {
    try {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required for upload')
      }

      const results = await Promise.all(
        files.map(async ({ file }) => {
          const response = await apiFetch(ENDPOINTS.V1.UPLOAD(clientId), {
            method: 'POST',
            body: (() => {
              const formData = new FormData()
              formData.append('file', file)
              return formData
            })(),
          })

          if (!response?.success) {
            throw new Error(response?.message || 'Upload failed')
          }

          return {
            id: response.data.id,
            filename: file.name,
            filenameOriginal: file.name,
            mimeType: file.type,
            file_size: file.size,
            createdAt: new Date().toISOString(),
            clientId,
            processingStatus: 'processing' as const,
          } as DocumentV2
        })
      )

      return results
    } catch (error) {
      throw createDocumentError(error, 'uploadDocuments')
    }
  },

  async deleteDocument(id: string | number): Promise<void> {
    try {
      // This requires clientId which we don't have in this context
      // Legacy V1 delete needs to be handled in the specific hook
      throw new Error('V1 delete requires clientId - use hook-specific implementation')
    } catch (error) {
      throw createDocumentError(error, 'deleteDocument')
    }
  },

  async updateDocument(id: string | number, updates: DocumentUpdatePayload): Promise<DocumentV2> {
    throw new Error('V1 update not supported')
  },
}

/**
 * Document V2 Service (Enhanced)
 */
export const documentsV2Service: DocumentsService = {
  async getDocuments(
    clientId: string,
    params: DocumentQueryParams = {}
  ): Promise<DocumentListResponse> {
    try {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required')
      }

      const searchParams = new URLSearchParams({
        clientId,
        page: String(params.page || 1),
        limit: String(params.limit || 20),
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
        includeDeleted: String(params.includeDeleted || false),
        ...(params.search && { search: params.search }),
        ...(params.tags && { tags: params.tags.join(',') }),
        ...(params.mimeType && { mimeType: params.mimeType }),
        ...(params.dateFrom && { dateFrom: params.dateFrom }),
        ...(params.dateTo && { dateTo: params.dateTo }),
      })

      const response = await apiFetch(`${ENDPOINTS.V2.BASE}?${searchParams}`)

      if (!response?.success) {
        throw new Error(response?.message || 'Error loading documents')
      }

      return response as DocumentListResponse
    } catch (error) {
      throw createDocumentError(error, 'getDocuments')
    }
  },

  async uploadDocuments(
    clientId: string,
    files: DocumentUploadPayload[],
    onProgress?: (progress: number) => void
  ): Promise<DocumentV2[]> {
    try {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required for upload')
      }

      // Get authentication token following the same pattern as apiFetch
      const { data: sessionData } = await supabase.auth.getSession()
      const liveToken = sessionData?.session?.access_token || null
      const legacyToken = !liveToken ? localStorage.getItem('authToken') : null
      const tokenToUse = liveToken || legacyToken

      const formData = new FormData()
      formData.append('clientId', clientId)

      files.forEach((fileItem, index) => {
        formData.append(`files`, fileItem.file)
        if (fileItem.id) {
          formData.append(`fileIds`, fileItem.id)
        }
        if (fileItem.metadata) {
          formData.append(`metadata_${index}`, JSON.stringify(fileItem.metadata))
        }
      })

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = (event.loaded / event.total) * 100
            onProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success) {
                resolve(response.data)
              } else {
                reject(createDocumentError(response, 'uploadDocuments'))
              }
            } catch (e) {
              reject(createDocumentError({ message: 'Invalid response format' }, 'uploadDocuments'))
            }
          } else {
            reject(
              createDocumentError(
                { status: xhr.status, message: `Upload failed with status ${xhr.status}` },
                'uploadDocuments'
              )
            )
          }
        })

        xhr.addEventListener('error', () => {
          reject(createDocumentError({ message: 'Network error during upload' }, 'uploadDocuments'))
        })

        const baseUrl =
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_API_BASE_URL ||
          'http://localhost:3001/api/v1'

        xhr.open('POST', `${baseUrl}${ENDPOINTS.V2.UPLOAD}`)

        if (tokenToUse) {
          xhr.setRequestHeader('Authorization', `Bearer ${tokenToUse}`)
        }

        xhr.send(formData)
      })
    } catch (error) {
      throw createDocumentError(error, 'uploadDocuments')
    }
  },

  async updateDocument(id: string | number, updates: DocumentUpdatePayload): Promise<DocumentV2> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.DELETE(id), {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (!response?.success) {
        throw new Error(response?.message || 'Update failed')
      }

      return response.data
    } catch (error) {
      throw createDocumentError(error, 'updateDocument')
    }
  },

  async deleteDocument(id: string | number): Promise<void> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.DELETE(id), {
        method: 'DELETE',
      })

      if (!response?.success) {
        throw new Error(response?.message || 'Delete failed')
      }
    } catch (error) {
      throw createDocumentError(error, 'deleteDocument')
    }
  },

  async togglePin(id: string | number): Promise<DocumentV2> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.PIN(id), {
        method: 'PATCH',
      })

      if (!response?.success) {
        throw new Error(response?.message || 'Pin toggle failed')
      }

      return response.data
    } catch (error) {
      throw createDocumentError(error, 'togglePin')
    }
  },

  async restoreDocument(id: string | number): Promise<DocumentV2> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.RESTORE(id), {
        method: 'PATCH',
      })

      if (!response?.success) {
        throw new Error(response?.message || 'Restore failed')
      }

      return response.data
    } catch (error) {
      throw createDocumentError(error, 'restoreDocument')
    }
  },

  async getStats(clientId: string): Promise<DocumentStats> {
    try {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required')
      }

      const response = await apiFetch(`${ENDPOINTS.V2.STATS}?clientId=${clientId}`)

      if (!response?.success) {
        throw new Error(response?.message || 'Stats fetch failed')
      }

      return response.data
    } catch (error) {
      throw createDocumentError(error, 'getStats')
    }
  },

  async getDownloadUrl(id: string | number): Promise<string> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.DOWNLOAD(id))

      if (!response?.success) {
        throw new Error(response?.message || 'Download URL fetch failed')
      }

      return response.data.url
    } catch (error) {
      throw createDocumentError(error, 'getDownloadUrl')
    }
  },

  async getPreviewUrl(id: string | number): Promise<string> {
    try {
      const response = await apiFetch(ENDPOINTS.V2.PREVIEW(id))

      if (!response?.success) {
        throw new Error(response?.message || 'Preview URL fetch failed')
      }

      return response.data.url
    } catch (error) {
      throw createDocumentError(error, 'getPreviewUrl')
    }
  },
}

/**
 * Service factory - returns appropriate service based on version
 */
export function createDocumentsService(
  version: 'v1' | 'v2' = 'v2',
  config?: DocumentsServiceConfig
): DocumentsService {
  const service = version === 'v1' ? documentsV1Service : documentsV2Service

  // Apply configuration if provided
  if (config) {
    // Configuration could be applied here for custom timeouts, retries, etc.
    // For now, we'll return the service as-is
  }

  return service as DocumentsService
}

// Default export is V2 service
export default documentsV2Service
