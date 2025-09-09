/**
 * useDocumentsV2.ts - Modern Documents V2 Hook with TypeScript
 * Enhanced with pagination, versioning, and improved upload handling
 * Refactored to use composition with useDocumentsCore
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useDocumentsCore, documentQueryKeys } from '../shared/hooks/useDocumentsCore'
import { documentsV2Service } from '../shared/services/documentsService'
import type {
  DocumentV2,
  DocumentUploadPayload,
  UseDocumentsV2Return,
  DocumentQueryParams,
  UploadProgress,
  DocumentError,
} from '../shared/types/document.types'

/**
 * Enhanced document model with utility methods
 */
class DocumentV2Enhanced implements DocumentV2 {
  id: string | number
  filename?: string
  filenameOriginal?: string
  mimeType?: string
  file_size?: number
  createdAt?: string
  clientId?: string
  pinned?: boolean
  deletedAt?: string | null
  isDuplicate?: boolean
  tags?: string[]
  description?: string
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  metadata?: Record<string, any>

  constructor(data: DocumentV2) {
    Object.assign(this, data)
    this.id = data.id
  }

  isPinned(): boolean {
    return this.pinned === true
  }

  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined
  }

  isDuplicateFile(): boolean {
    return this.isDuplicate === true
  }

  isImage(): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    return imageTypes.includes(this.mimeType || '')
  }

  isVideo(): boolean {
    return this.mimeType?.startsWith('video/') || false
  }

  isPdf(): boolean {
    return this.mimeType === 'application/pdf'
  }

  getExtension(): string {
    return this.filenameOriginal?.split('.').pop()?.toLowerCase() || ''
  }

  getFileIcon(): string {
    if (this.isImage()) return 'photo'
    if (this.isVideo()) return 'video'
    if (this.isPdf()) return 'pdf'
    if (['zip', 'rar', '7z'].includes(this.getExtension())) return 'archive'
    return 'document'
  }

  getDisplayName(): string {
    return this.filenameOriginal || this.filename || 'Unknown Document'
  }

  getFormattedSize(): string {
    if (!this.file_size) return 'Unknown size'
    const bytes = this.file_size
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

/**
 * Configuration for useDocumentsV2
 */
export interface UseDocumentsV2Config {
  defaultParams?: Partial<DocumentQueryParams>
  enableAutoRefresh?: boolean
  refreshInterval?: number
  maxUploadSize?: number
  allowedFileTypes?: string[]
}

/**
 * Enhanced Documents V2 Hook using composition with core hook
 */
export function useDocumentsV2(
  clientId: string,
  config: UseDocumentsV2Config = {}
): UseDocumentsV2Return {
  const {
    defaultParams = {},
    enableAutoRefresh = false,
    refreshInterval = 30000,
    maxUploadSize = 50 * 1024 * 1024, // 50MB
    allowedFileTypes = [],
  } = config

  const queryClient = useQueryClient()

  // V2-specific state
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const uploadAbortControllerRef = useRef<AbortController | null>(null)

  // Enhanced default parameters for V2
  const v2DefaultParams: Partial<DocumentQueryParams> = {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeDeleted: false,
    limit: 20,
    ...defaultParams,
  }

  // Use the core hook with V2 service
  const coreHook = useDocumentsCore(clientId, {
    service: documentsV2Service,
    defaultParams: v2DefaultParams,
    eventHandlers: {
      onUploadStart: files => {
        // Initialize progress for each file
        files.forEach(file => {
          const fileId = `upload-${Date.now()}-${Math.random()}`
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { progress: 0, status: 'uploading' },
          }))
        })
      },
      onUploadError: error => {
        console.error('Upload error:', error)
      },
    },
  })

  // Enhanced documents with utility methods
  const enhancedDocuments = useMemo(() => {
    return coreHook.documents.map(doc => new DocumentV2Enhanced(doc))
  }, [coreHook.documents])

  // V2-specific mutations

  // Enhanced upload with progress tracking and validation
  const uploadMutation = useMutation({
    mutationFn: async ({ files }: { files: DocumentUploadPayload[] }) => {
      // Validate files
      const validatedFiles = files.filter(fileItem => {
        const file = fileItem.file

        // Size validation
        if (maxUploadSize && file.size > maxUploadSize) {
          toast.error(`File ${file.name} exceeds maximum size limit`)
          return false
        }

        // Type validation
        if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
          toast.error(`File type ${file.type} not allowed for ${file.name}`)
          return false
        }

        return true
      })

      if (validatedFiles.length === 0) {
        throw new Error('No valid files to upload')
      }

      // Cancel previous upload if exists
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort()
      }

      // Create new abort controller
      uploadAbortControllerRef.current = new AbortController()
      const signal = uploadAbortControllerRef.current.signal

      try {
        // Initialize progress tracking
        validatedFiles.forEach(fileItem => {
          const fileId = fileItem.id || `upload-${Date.now()}-${Math.random()}`
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { progress: 0, status: 'uploading' },
          }))
        })

        const results = await Promise.allSettled(
          validatedFiles.map(fileItem => {
            return documentsV2Service.uploadDocuments(clientId, [fileItem], (progress: number) => {
              if (!signal.aborted) {
                const fileId = fileItem.id || `upload-${Date.now()}-${Math.random()}`
                setUploadProgress(prev => ({
                  ...prev,
                  [fileId]: { progress, status: 'uploading' },
                }))
              }
            })
          })
        )

        // Process results
        results.forEach((result, index) => {
          const fileItem = validatedFiles[index]
          const fileId = fileItem.id || `upload-${Date.now()}-${Math.random()}`

          if (result.status === 'fulfilled') {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { progress: 100, status: 'done' },
            }))
          } else {
            if (result.reason?.message !== 'Upload cancelled') {
              setUploadProgress(prev => ({
                ...prev,
                [fileId]: {
                  progress: 0,
                  status: 'error',
                  error: result.reason.message,
                },
              }))
            }
          }
        })

        const successfulUploads = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value)
          .flat()

        return successfulUploads
      } catch (error) {
        if ((error as Error).message !== 'Upload cancelled') {
          throw error
        }
        return []
      }
    },
    onSuccess: results => {
      const successCount = results.length
      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploaded successfully`)
        queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: documentQueryKeys.stats(clientId) })
      }
    },
    onError: (error: DocumentError) => {
      toast.error(error.message || 'Upload failed')
    },
  })

  // Pin toggle mutation
  const pinMutation = useMutation({
    mutationFn: (documentId: string | number) => documentsV2Service.togglePin!(documentId),
    onMutate: async documentId => {
      await queryClient.cancelQueries({
        queryKey: documentQueryKeys.list(clientId, coreHook.queryParams),
      })

      const previousData = queryClient.getQueryData(
        documentQueryKeys.list(clientId, coreHook.queryParams)
      )

      queryClient.setQueryData(
        documentQueryKeys.list(clientId, coreHook.queryParams),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            documents: old.documents.map((doc: DocumentV2) =>
              doc.id === documentId ? { ...doc, pinned: !doc.pinned } : doc
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (error: DocumentError, documentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          documentQueryKeys.list(clientId, coreHook.queryParams),
          context.previousData
        )
      }
      toast.error(error.message || 'Failed to update pin status')
    },
    onSuccess: () => {
      toast.success('Pin status updated')
    },
  })

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: ({ documentId, newName }: { documentId: string | number; newName: string }) =>
      coreHook.updateDocument(documentId, { filename: newName }),
    onSuccess: () => {
      toast.success('Document renamed successfully')
    },
  })

  // Utility functions
  const search = useCallback(
    (query: string) => {
      coreHook.updateQueryParams({ search: query, page: 1 })
    },
    [coreHook.updateQueryParams]
  )

  const changePage = useCallback(
    (page: number) => {
      coreHook.updateQueryParams({ page })
    },
    [coreHook.updateQueryParams]
  )

  const changeSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      coreHook.updateQueryParams({ sortBy, sortOrder, page: 1 })
    },
    [coreHook.updateQueryParams]
  )

  const clearUploadProgress = useCallback(() => {
    setUploadProgress({})
  }, [])

  const downloadDocument = useCallback(async (document: DocumentV2) => {
    try {
      if (!documentsV2Service.getDownloadUrl) {
        throw new Error('Download not supported')
      }

      const downloadUrl = await documentsV2Service.getDownloadUrl(document.id)

      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = document.filenameOriginal || 'document'
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      toast.success('Download started')
    } catch (error) {
      toast.error((error as Error).message || 'Download failed')
    }
  }, [])

  const previewDocument = useCallback(async (document: DocumentV2): Promise<void> => {
    try {
      if (!documentsV2Service.getPreviewUrl) {
        throw new Error('Preview not supported')
      }

      const previewUrl = await documentsV2Service.getPreviewUrl(document.id)
      window.open(previewUrl, '_blank')
    } catch (error) {
      toast.error((error as Error).message || 'Preview failed')
    }
  }, [])

  // Selection management
  const selectDocument = useCallback((document: DocumentV2, selected: boolean) => {
    setSelectedDocuments(prev => {
      const docId = String(document.id)
      if (selected) {
        return prev.includes(docId) ? prev : [...prev, docId]
      } else {
        return prev.filter(id => id !== docId)
      }
    })
  }, [])

  const selectAllDocuments = useCallback(
    (selected: boolean) => {
      if (selected) {
        const allIds = enhancedDocuments.map(doc => String(doc.id))
        setSelectedDocuments(allIds)
      } else {
        setSelectedDocuments([])
      }
    },
    [enhancedDocuments]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto refresh if enabled
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        coreHook.refetch()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [enableAutoRefresh, refreshInterval, coreHook.refetch])

  // Return enhanced interface
  return {
    // Inherit all core functionality
    ...coreHook,

    // Override documents with enhanced versions
    documents: enhancedDocuments,

    // V2-specific data
    uploadProgress,
    selectedDocuments,

    // Enhanced upload functionality (override core's uploadDocuments)
    uploadDocuments: (files: DocumentUploadPayload[]) => uploadMutation.mutateAsync({ files }),
    isUploading: uploadMutation.isPending,

    // V2-specific operations
    togglePin: pinMutation.mutateAsync,
    renameDocument: (id: string | number, newName: string) =>
      renameMutation.mutateAsync({ documentId: id, newName }),
    downloadDocument,
    previewDocument,

    // Selection management
    selectDocument,
    selectAllDocuments,
    clearSelection: () => setSelectedDocuments([]),

    // Navigation & search
    search,
    changePage,
    changeSort,

    // Upload progress management
    clearUploadProgress,
  }
}

export default useDocumentsV2
