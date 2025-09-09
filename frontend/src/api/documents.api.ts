import { apiClient } from './api-client'
import { supabase } from '../supabaseClient'
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types/api.types'
import type {
  Document,
  DocumentInsert,
  DocumentUpdate,
  DocumentWithClient,
  DocumentSearchFilters,
  DocumentUploadData,
  DocumentUploadProgress,
  DocumentFolder,
  DocumentFolderCreate,
  DocumentPreview,
  DocumentBulkOperation,
  DocumentBulkResult,
} from '../types/document.types'

/**
 * Type-safe API functions for document management
 */

export const documentsApi = {
  /**
   * Get documents for a specific client
   */
  async getDocumentsForClient(
    clientId: string,
    params?: QueryParams & DocumentSearchFilters
  ): Promise<PaginatedResponse<Document>> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.fileType) searchParams.append('fileType', params.fileType)
    if (params?.folderPath) searchParams.append('folderPath', params.folderPath)
    if (params?.aiStatus) searchParams.append('aiStatus', params.aiStatus)
    if (params?.createdAfter) searchParams.append('createdAfter', params.createdAfter)
    if (params?.createdBefore) searchParams.append('createdBefore', params.createdBefore)

    const query = searchParams.toString()
    const endpoint = query
      ? `/clients/${clientId}/documents?${query}`
      : `/clients/${clientId}/documents`

    return apiClient.get<PaginatedResponse<Document>>(endpoint)
  },

  /**
   * Get all documents across all clients (admin view)
   */
  async getAllDocuments(
    params?: QueryParams & DocumentSearchFilters
  ): Promise<PaginatedResponse<DocumentWithClient>> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.clientId) searchParams.append('clientId', params.clientId)
    if (params?.fileType) searchParams.append('fileType', params.fileType)
    if (params?.aiStatus) searchParams.append('aiStatus', params.aiStatus)

    const query = searchParams.toString()
    const endpoint = query ? `/documents?${query}` : '/documents'

    return apiClient.get<PaginatedResponse<DocumentWithClient>>(endpoint)
  },

  /**
   * Get document by ID
   */
  async getDocumentById(clientId: string, documentId: string): Promise<ApiResponse<Document>> {
    return apiClient.get<ApiResponse<Document>>(`/clients/${clientId}/documents/${documentId}`)
  },

  /**
   * Upload document with Supabase Storage integration
   */
  async uploadDocument(
    uploadData: DocumentUploadData,
    onProgress?: (progress: DocumentUploadProgress) => void
  ): Promise<ApiResponse<Document>> {
    const { file, clientId, folderPath, metadata } = uploadData

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const basePath = folderPath ? `${clientId}/${folderPath}` : clientId
      const fileName = `${basePath}/${timestamp}.${fileExt}`

      // Report upload start
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading',
      })

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Report storage upload complete
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 50,
        status: 'processing',
      })

      // Create document record via API
      const documentData: DocumentInsert = {
        client_id: clientId,
        agency_id: '', // Will be set by backend
        file_name: file.name,
        storage_path: fileName,
        file_type: file.type,
        file_size: file.size,
        ai_status: 'pending',
        folder_path: folderPath || null,
        ai_summary: null,
        ai_metadata: metadata || null,
      }

      const response = await apiClient.post<ApiResponse<Document>>(
        `/clients/${clientId}/documents`,
        documentData
      )

      // Report completion
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'completed',
        documentId: response.data?.id,
      })

      return response
    } catch (error) {
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      })
      throw error
    }
  },

  /**
   * Update document metadata
   */
  async updateDocument(
    clientId: string,
    documentId: string,
    updates: DocumentUpdate
  ): Promise<ApiResponse<Document>> {
    return apiClient.patch<ApiResponse<Document>>(
      `/clients/${clientId}/documents/${documentId}`,
      updates
    )
  },

  /**
   * Delete document
   */
  async deleteDocument(clientId: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/clients/${clientId}/documents/${documentId}`)
  },

  /**
   * Download document from Supabase Storage
   */
  async downloadDocument(documentRecord: Document): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(documentRecord.storage_path)

      if (error) {
        throw new Error(`Download failed: ${error.message}`)
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = documentRecord.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Download failed')
    }
  },

  /**
   * Get document preview
   */
  async getDocumentPreview(
    clientId: string,
    documentId: string
  ): Promise<ApiResponse<DocumentPreview>> {
    return apiClient.get<ApiResponse<DocumentPreview>>(
      `/clients/${clientId}/documents/${documentId}/preview`
    )
  },

  /**
   * Folder management
   */
  folders: {
    /**
     * Get folder structure for client
     */
    async getFolders(clientId: string): Promise<ApiResponse<DocumentFolder[]>> {
      return apiClient.get<ApiResponse<DocumentFolder[]>>(`/clients/${clientId}/folders`)
    },

    /**
     * Create new folder
     */
    async createFolder(folderData: DocumentFolderCreate): Promise<ApiResponse<DocumentFolder>> {
      return apiClient.post<ApiResponse<DocumentFolder>>(
        `/clients/${folderData.clientId}/folders`,
        folderData
      )
    },

    /**
     * Delete folder
     */
    async deleteFolder(clientId: string, folderPath: string): Promise<ApiResponse<void>> {
      return apiClient.post<ApiResponse<void>>(
        `/clients/${clientId}/folders/delete`,
        JSON.stringify({ folderPath })
      )
    },
  },

  /**
   * Bulk operations
   */
  async bulkOperation(
    clientId: string,
    operation: DocumentBulkOperation
  ): Promise<ApiResponse<DocumentBulkResult>> {
    return apiClient.post<ApiResponse<DocumentBulkResult>>(
      `/clients/${clientId}/documents/bulk`,
      operation
    )
  },

  /**
   * Search documents across all clients
   */
  async searchDocuments(query: string, limit = 10): Promise<ApiResponse<DocumentWithClient[]>> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    })

    return apiClient.get<ApiResponse<DocumentWithClient[]>>(`/documents/search?${searchParams}`)
  },
}

// Legacy exports for backward compatibility
export const getDocumentsForClient = documentsApi.getDocumentsForClient
export const uploadDocument = (clientId: string, file: File) =>
  documentsApi.uploadDocument({ file, clientId })
export const deleteDocument = documentsApi.deleteDocument
export const downloadDocument = documentsApi.downloadDocument
