/**
 * useDocuments.ts - Legacy Documents Hook (V1 Compatibility Layer)
 * Maintains backward compatibility while using the new core architecture
 */

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useDocumentsCore } from '@shared/hooks/useDocumentsCore'
import { documentsV1Service, createDocumentsService } from '@shared/services/documentsService'
import type {
  DocumentV1,
  UseDocumentsV1Return,
  DocumentUploadPayload,
  DocumentError,
} from '@shared/types/document.types'

// Legacy API functions - keeping original structure for compatibility
import {
  getDocumentsForClient,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from '@api/documents.api'

// Query key for legacy compatibility
const QUERY_KEY = (clientId: string) => ['documents', clientId]

/**
 * @deprecated Use useDocumentsV2 or useDocumentsCore instead
 * This hook is maintained for backward compatibility with existing components
 */
export function useDocuments(clientId: string): UseDocumentsV1Return {
  const queryClient = useQueryClient()

  // Show deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`
🚨 useDocuments is deprecated!
Please migrate to useDocumentsV2 for enhanced features or useDocumentsCore for basic functionality.
This compatibility layer will be removed in a future version.
Component using deprecated hook detected.
    `)
  }

  // Use the new core hook but adapt it to V1 interface
  const coreHook = useDocumentsCore(clientId, {
    service: createDocumentsService('v1'), // Use V1 service
    defaultParams: {
      page: 1,
      limit: 1000, // V1 typically loaded all documents at once
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  })

  // Transform V2 documents back to V1 format for compatibility
  const documentsV1 = useMemo(() => {
    return coreHook.documents.map(
      (doc): DocumentV1 => ({
        id: doc.id,
        file_name: doc.filenameOriginal || doc.filename,
        filename: doc.filenameOriginal || doc.filename,
        file_type: doc.mimeType,
        file_size: doc.file_size,
        created_at: doc.createdAt,
        client_id: doc.clientId,
        ai_status: doc.processingStatus === 'processing' ? 'processing' : 'completed',
        _optimistic: doc.metadata?._optimistic || false,
      })
    )
  }, [coreHook.documents])

  // Legacy upload mutation - keeping original structure
  const uploadMut = useMutation({
    mutationFn: ({ file }: { file: File }) => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required for upload')
      }
      // Use original upload function for compatibility
      return uploadDocument(clientId, file)
    },
    onMutate: async ({ file }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))

      const optimistic: DocumentV1 = {
        id: `temp-${Date.now()}`,
        file_name: file?.name || 'archivo',
        filename: file?.name || 'archivo',
        file_type: file?.type,
        file_size: file?.size,
        created_at: new Date().toISOString(),
        ai_status: 'processing',
        _optimistic: true,
      }

      queryClient.setQueryData(QUERY_KEY(clientId), (old: DocumentV1[] = []) => [
        ...old,
        optimistic,
      ])
      return { prev }
    },
    onError: (err: DocumentError, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      toast.error(err?.message || 'Error al subir documento')
    },
    onSuccess: () => {
      toast.success('Documento subido')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      // Also invalidate the new core queries
      coreHook.refetch()
    },
  })

  // Legacy delete mutation - keeping original structure
  const deleteMut = useMutation({
    mutationFn: (documentId: string | number) => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required for delete')
      }
      // Use original delete function for compatibility
      return deleteDocument(clientId, documentId)
    },
    onMutate: async documentId => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))

      queryClient.setQueryData(QUERY_KEY(clientId), (old: DocumentV1[] = []) =>
        old.filter(d => d.id !== documentId)
      )
      return { prev }
    },
    onError: (err: DocumentError, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      toast.error(err?.message || 'Error al eliminar')
    },
    onSuccess: () => {
      toast.success('Documento eliminado')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      // Also invalidate the new core queries
      coreHook.refetch()
    },
  })

  // Legacy download mutation - keeping original structure
  const downloadMut = useMutation({
    mutationFn: (doc: DocumentV1) => downloadDocument(doc),
    onError: (err: DocumentError) => toast.error(err?.message || 'Error al descargar'),
  })

  // Direct query for legacy compatibility - this ensures existing components work
  const documentsQuery = useQuery({
    queryKey: QUERY_KEY(clientId),
    queryFn: async () => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required')
      }
      const res = await getDocumentsForClient(clientId)
      if (res?.success === false) throw new Error(res.message || 'Error al cargar documentos')
      return res?.data || []
    },
    enabled: !!clientId && clientId !== 'undefined',
    staleTime: 5 * 60 * 1000,
    select: (data: any[]) => {
      return data.map(
        (doc): DocumentV1 => ({
          id: doc.id,
          file_name: doc.file_name || doc.filename,
          filename: doc.file_name || doc.filename,
          file_type: doc.file_type || doc.mimeType,
          file_size: doc.file_size,
          created_at: doc.created_at || doc.createdAt,
          client_id: doc.client_id || doc.clientId,
          ai_status:
            doc.ai_status || (doc.processingStatus === 'processing' ? 'processing' : 'completed'),
          _optimistic: doc._optimistic || false,
        })
      )
    },
  })

  // Helper function to sync data between old and new systems
  const syncData = useCallback(() => {
    // Invalidate both query systems to ensure consistency
    queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
    coreHook.refetch()
  }, [queryClient, clientId, coreHook.refetch])

  // Return legacy interface
  return {
    // Use direct query data for maximum compatibility
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error as DocumentError | null,
    refetch: () => {
      syncData()
      return documentsQuery.refetch()
    },

    // Legacy upload with original interface
    upload: (payload: { file: File }) => uploadMut.mutateAsync(payload),
    isUploading: uploadMut.isPending,

    // Legacy delete with original interface
    remove: (id: string | number) => deleteMut.mutateAsync(id),
    isDeleting: deleteMut.isPending,

    // Legacy download with original interface
    download: (document: DocumentV1) => downloadMut.mutateAsync(document),
    isDownloading: downloadMut.isPending,
  }
}

/**
 * Export both named and default for maximum compatibility
 */
export default useDocuments

/**
 * Migration helper function - helps identify components that need migration
 */
export function createMigrationHelper() {
  const components = new Set<string>()

  return {
    trackUsage: (componentName: string) => {
      components.add(componentName)
      console.warn(`📝 Migration needed: ${componentName} is using deprecated useDocuments hook`)
    },

    getUsageReport: () => {
      return {
        totalComponents: components.size,
        components: Array.from(components),
        migrationGuide: {
          'For basic usage': 'Replace useDocuments with useDocumentsCore',
          'For enhanced features': 'Replace useDocuments with useDocumentsV2',
          'For board functionality': 'Use useDocumentBoard alongside useDocumentsCore',
        },
      }
    },

    clearReport: () => {
      components.clear()
    },
  }
}

// Global migration helper instance
export const migrationHelper = createMigrationHelper()

/**
 * Wrapper that automatically tracks usage for migration purposes
 */
export function useDocumentsWithTracking(
  clientId: string,
  componentName?: string
): UseDocumentsV1Return {
  if (componentName && process.env.NODE_ENV === 'development') {
    migrationHelper.trackUsage(componentName)
  }

  return useDocuments(clientId)
}
