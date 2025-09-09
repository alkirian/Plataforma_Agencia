/**
 * useDocumentsCore - Core Document Management Hook
 * Provides shared functionality for all document hooks with TypeScript support
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { documentsV2Service, createDocumentsService } from '../services/documentsService'
import type {
  DocumentV2,
  DocumentUploadPayload,
  DocumentUpdatePayload,
  DocumentQueryParams,
  UseDocumentsCoreReturn,
  DocumentsService,
  DocumentError,
  DocumentEventHandlers,
} from '../types/document.types'

// Query key factories
export const documentQueryKeys = {
  all: ['documents'] as const,
  lists: () => [...documentQueryKeys.all, 'list'] as const,
  list: (clientId: string, params?: DocumentQueryParams) =>
    [...documentQueryKeys.lists(), clientId, params] as const,
  stats: (clientId: string) => [...documentQueryKeys.all, 'stats', clientId] as const,
  detail: (id: string | number) => [...documentQueryKeys.all, 'detail', id] as const,
}

/**
 * Core documents hook configuration
 */
export interface UseDocumentsCoreConfig {
  service?: DocumentsService
  defaultParams?: Partial<DocumentQueryParams>
  eventHandlers?: DocumentEventHandlers
  staleTime?: number
  cacheTime?: number
  retryOnMount?: boolean
}

/**
 * Core documents hook - provides shared functionality for all document management
 */
export function useDocumentsCore(
  clientId: string,
  config: UseDocumentsCoreConfig = {}
): UseDocumentsCoreReturn {
  const {
    service = documentsV2Service,
    defaultParams = {},
    eventHandlers = {},
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retryOnMount = true,
  } = config

  const queryClient = useQueryClient()

  // Query parameters state with defaults
  const [queryParams, setQueryParams] = useState<DocumentQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeDeleted: false,
    ...defaultParams,
  })

  // Helper to validate clientId
  const isValidClientId = useMemo(() => {
    return !!clientId && clientId !== 'undefined' && clientId !== 'null'
  }, [clientId])

  // Documents query with React Query
  const documentsQuery = useQuery({
    queryKey: documentQueryKeys.list(clientId, queryParams),
    queryFn: async () => {
      if (!isValidClientId) {
        throw new Error('Client ID is required')
      }
      return service.getDocuments(clientId, queryParams)
    },
    enabled: isValidClientId,
    staleTime,
    gcTime: cacheTime,
    retry: retryOnMount ? 3 : false,
    select: data => ({
      documents: data.data || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }),
    meta: {
      onError: (error: DocumentError) => {
        console.error('Documents query error:', error)
        toast.error(error.message || 'Failed to load documents')
      },
    },
  })

  // Stats query
  const statsQuery = useQuery({
    queryKey: documentQueryKeys.stats(clientId),
    queryFn: async () => {
      if (!isValidClientId) {
        throw new Error('Client ID is required for stats')
      }
      return service.getStats?.(clientId) || null
    },
    enabled: isValidClientId && !!service.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes for stats
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    meta: {
      onError: (error: DocumentError) => {
        console.warn('Stats query error:', error)
      },
    },
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: DocumentUploadPayload[]) => {
      if (!isValidClientId) {
        throw new Error('Client ID is required for upload')
      }

      eventHandlers.onUploadStart?.(files.map(f => f.file))

      return service.uploadDocuments(clientId, files, progress => {
        eventHandlers.onUploadProgress?.(progress)
      })
    },
    onMutate: async (files: DocumentUploadPayload[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: documentQueryKeys.list(clientId, queryParams),
      })

      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData(
        documentQueryKeys.list(clientId, queryParams)
      )

      // Optimistically update to the new value
      const optimisticDocuments = files.map(
        (fileItem): DocumentV2 => ({
          id: fileItem.id || `temp-${Date.now()}-${Math.random()}`,
          filename: fileItem.file.name,
          filenameOriginal: fileItem.file.name,
          mimeType: fileItem.file.type,
          file_size: fileItem.file.size,
          createdAt: new Date().toISOString(),
          clientId,
          processingStatus: 'processing' as const,
          // Mark as optimistic for UI handling
          metadata: { ...fileItem.metadata, _optimistic: true },
        })
      )

      queryClient.setQueryData(documentQueryKeys.list(clientId, queryParams), (old: any) => {
        if (!old) return { documents: optimisticDocuments, pagination: {} }
        return {
          ...old,
          documents: [...optimisticDocuments, ...old.documents],
        }
      })

      return { previousDocuments, optimisticDocuments }
    },
    onError: (error: DocumentError, files, context) => {
      // Revert optimistic update
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          documentQueryKeys.list(clientId, queryParams),
          context.previousDocuments
        )
      }

      const errorMessage = error.message || 'Upload failed'
      toast.error(errorMessage)
      eventHandlers.onUploadError?.(error)
    },
    onSuccess: (uploadedDocuments: DocumentV2[]) => {
      toast.success(`${uploadedDocuments.length} document(s) uploaded successfully`)
      eventHandlers.onUploadSuccess?.(uploadedDocuments)

      // Invalidate both documents and stats
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.stats(clientId) })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string | number
      updates: DocumentUpdatePayload
    }) => {
      return service.updateDocument(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: documentQueryKeys.list(clientId, queryParams),
      })

      const previousData = queryClient.getQueryData(documentQueryKeys.list(clientId, queryParams))

      // Optimistically update
      queryClient.setQueryData(documentQueryKeys.list(clientId, queryParams), (old: any) => {
        if (!old) return old
        return {
          ...old,
          documents: old.documents.map((doc: DocumentV2) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        }
      })

      return { previousData, id, updates }
    },
    onError: (error: DocumentError, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          documentQueryKeys.list(clientId, queryParams),
          context.previousData
        )
      }
      toast.error(error.message || 'Update failed')
    },
    onSuccess: () => {
      toast.success('Document updated successfully')
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return service.deleteDocument(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({
        queryKey: documentQueryKeys.list(clientId, queryParams),
      })

      const previousData = queryClient.getQueryData(documentQueryKeys.list(clientId, queryParams))

      // Optimistically remove
      queryClient.setQueryData(documentQueryKeys.list(clientId, queryParams), (old: any) => {
        if (!old) return old
        return {
          ...old,
          documents: old.documents.filter((doc: DocumentV2) => doc.id !== id),
        }
      })

      return { previousData, id }
    },
    onError: (error: DocumentError, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          documentQueryKeys.list(clientId, queryParams),
          context.previousData
        )
      }
      toast.error(error.message || 'Delete failed')
      eventHandlers.onDeleteError?.(error)
    },
    onSuccess: (_, id) => {
      toast.success('Document deleted successfully')
      eventHandlers.onDeleteSuccess?.(id)

      // Invalidate both documents and stats
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.stats(clientId) })
    },
  })

  // Restore mutation (if service supports it)
  const restoreMutation = useMutation({
    mutationFn: async (id: string | number) => {
      if (!service.restoreDocument) {
        throw new Error('Restore operation not supported by this service')
      }
      return service.restoreDocument(id)
    },
    onSuccess: () => {
      toast.success('Document restored successfully')
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.stats(clientId) })
    },
    onError: (error: DocumentError) => {
      toast.error(error.message || 'Restore failed')
    },
  })

  // Utility functions
  const updateQueryParams = useCallback((newParams: Partial<DocumentQueryParams>) => {
    setQueryParams(prev => ({ ...prev, ...newParams }))
  }, [])

  const refetch = useCallback(() => {
    return documentsQuery.refetch()
  }, [documentsQuery])

  const refetchStats = useCallback(() => {
    return statsQuery.refetch()
  }, [statsQuery])

  // Main return object
  return {
    // Data
    documents: documentsQuery.data?.documents || [],
    pagination: documentsQuery.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    stats: statsQuery.data || null,

    // Loading states
    isLoading: documentsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,

    // Error states
    error: documentsQuery.error as DocumentError | null,
    statsError: statsQuery.error as DocumentError | null,

    // Core operations
    uploadDocuments: uploadMutation.mutateAsync,
    updateDocument: (id: string | number, updates: DocumentUpdatePayload) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteDocument: deleteMutation.mutateAsync,
    restoreDocument: service.restoreDocument ? restoreMutation.mutateAsync : undefined,

    // Utilities
    refetch,
    refetchStats,
    updateQueryParams,
    queryParams,
  }
}

export default useDocumentsCore
