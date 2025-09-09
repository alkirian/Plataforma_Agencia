import { apiClient } from './api-client'
import { supabase } from '../supabaseClient'
import type { ApiResponse } from '../types/api.types'

/**
 * Type-safe API functions for context sources management
 */

export interface ContextSource {
  id: string
  client_id: string
  type: 'document' | 'url' | 'manual' | 'note'
  title: string
  description?: string
  content?: string
  tags: string[]
  file_name?: string
  storage_path?: string
  file_type?: string
  file_size?: number
  url?: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ContextSourceStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  totalSize: number
}

export interface SearchQuery {
  query: string
}

export interface DocumentMetadata {
  title?: string
  description?: string
  tags?: string[]
}

export interface UrlData {
  url: string
  title?: string
  description?: string
  tags?: string[]
}

export interface ManualData {
  title: string
  content: string
  description?: string
  tags?: string[]
}

export interface NoteData {
  title: string
  content: string
  tags?: string[]
}

export const contextSourcesApi = {
  /**
   * Get all context sources for a specific client
   */
  async getContextSources(clientId: string): Promise<ApiResponse<ContextSource[]>> {
    return apiClient.get<ApiResponse<ContextSource[]>>(`/context-sources/${clientId}`)
  },

  /**
   * Get context sources statistics for a client
   */
  async getContextSourcesStats(clientId: string): Promise<ApiResponse<ContextSourceStats>> {
    return apiClient.get<ApiResponse<ContextSourceStats>>(`/context-sources/${clientId}/stats`)
  },

  /**
   * Search within context sources of a client
   */
  async searchContextSources(
    clientId: string,
    query: string
  ): Promise<ApiResponse<ContextSource[]>> {
    return apiClient.post<ApiResponse<ContextSource[]>>(`/context-sources/${clientId}/search`, {
      query,
    })
  },

  /**
   * Upload a document as context source
   */
  async createDocumentSource(
    clientId: string,
    file: File,
    metadata: DocumentMetadata = {}
  ): Promise<ApiResponse<ContextSource>> {
    const fileExt = file.name.split('.').pop()
    const fileName = `context-sources/${clientId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)

    if (uploadError) throw uploadError

    const sourceData = {
      title: metadata.title || file.name,
      description: metadata.description || '',
      tags: metadata.tags || [],
      file_name: file.name,
      storage_path: fileName,
      file_type: file.type,
      file_size: file.size,
    }

    return apiClient.post<ApiResponse<ContextSource>>(
      `/context-sources/${clientId}/document`,
      sourceData
    )
  },

  /**
   * Create context source from URL
   */
  async createUrlSource(clientId: string, urlData: UrlData): Promise<ApiResponse<ContextSource>> {
    return apiClient.post<ApiResponse<ContextSource>>(`/context-sources/${clientId}/url`, urlData)
  },

  /**
   * Create manual context source
   */
  async createManualSource(
    clientId: string,
    manualData: ManualData
  ): Promise<ApiResponse<ContextSource>> {
    return apiClient.post<ApiResponse<ContextSource>>(
      `/context-sources/${clientId}/manual`,
      manualData
    )
  },

  /**
   * Create note as context source
   */
  async createNoteSource(
    clientId: string,
    noteData: NoteData
  ): Promise<ApiResponse<ContextSource>> {
    return apiClient.post<ApiResponse<ContextSource>>(`/context-sources/${clientId}/note`, noteData)
  },

  /**
   * Update existing context source
   */
  async updateContextSource(
    clientId: string,
    sourceId: string,
    updateData: Partial<ContextSource>
  ): Promise<ApiResponse<ContextSource>> {
    return apiClient.put<ApiResponse<ContextSource>>(
      `/context-sources/${clientId}/${sourceId}`,
      updateData
    )
  },

  /**
   * Delete context source
   */
  async deleteContextSource(clientId: string, sourceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/context-sources/${clientId}/${sourceId}`)
  },

  /**
   * Download context source file from Supabase Storage
   */
  async downloadContextSource(source: ContextSource): Promise<{ success: boolean }> {
    if (!source.storage_path) {
      throw new Error('Esta fuente no tiene archivo para descargar')
    }

    const { data, error } = await supabase.storage.from('documents').download(source.storage_path)

    if (error) throw error

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = source.file_name || source.title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return { success: true }
  },
}

// Source types constants
export const SOURCE_TYPES = {
  DOCUMENT: 'document' as const,
  URL: 'url' as const,
  MANUAL: 'manual' as const,
  NOTE: 'note' as const,
} as const

// Processing status constants
export const PROCESSING_STATUS = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  READY: 'ready' as const,
  ERROR: 'error' as const,
} as const

// Configuration for source types
export const SOURCE_TYPE_CONFIG = {
  [SOURCE_TYPES.DOCUMENT]: {
    name: 'Documentos',
    icon: '📄',
    color: 'blue',
    description: 'Sube archivos PDF, imágenes y documentos',
  },
  [SOURCE_TYPES.URL]: {
    name: 'URLs',
    icon: '🌐',
    color: 'green',
    description: 'Extrae contenido de páginas web',
  },
  [SOURCE_TYPES.MANUAL]: {
    name: 'Manual',
    icon: '✍️',
    color: 'orange',
    description: 'Ingresa texto directamente',
  },
  [SOURCE_TYPES.NOTE]: {
    name: 'Notas',
    icon: '📝',
    color: 'purple',
    description: 'Información contextual adicional',
  },
} as const

// Legacy exports for backward compatibility
export const getContextSources = contextSourcesApi.getContextSources
export const getContextSourcesStats = contextSourcesApi.getContextSourcesStats
export const searchContextSources = contextSourcesApi.searchContextSources
export const createDocumentSource = contextSourcesApi.createDocumentSource
export const createUrlSource = contextSourcesApi.createUrlSource
export const createManualSource = contextSourcesApi.createManualSource
export const createNoteSource = contextSourcesApi.createNoteSource
export const updateContextSource = contextSourcesApi.updateContextSource
export const deleteContextSource = contextSourcesApi.deleteContextSource
export const downloadContextSource = contextSourcesApi.downloadContextSource
