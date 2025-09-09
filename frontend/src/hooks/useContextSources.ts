import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  getContextSources,
  getContextSourcesStats,
  searchContextSources,
  createDocumentSource,
  createUrlSource,
  createManualSource,
  createNoteSource,
  updateContextSource,
  deleteContextSource,
  downloadContextSource,
  SOURCE_TYPES,
} from '../api/contextSources'

// Types for context sources
interface ContextSource {
  id: string
  source_type: string
  title: string
  description: string
  tags: string[]
  status: 'pending' | 'processing' | 'completed' | 'error'
  created_at: string
  updated_at?: string
  url?: string
  file_name?: string
  file_size?: number
  content?: string
  _optimistic?: boolean
}

interface ContextSourcesStats {
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
}

interface DocumentSourceData {
  file: File
  title?: string
  description?: string
  tags?: string[]
}

interface UrlSourceData {
  url: string
  title?: string
  description?: string
  tags?: string[]
}

interface ManualSourceData {
  title: string
  content: string
  description?: string
  tags?: string[]
}

interface NoteSourceData {
  title: string
  content: string
  description?: string
  tags?: string[]
}

interface UpdateSourceData {
  title?: string
  description?: string
  tags?: string[]
  content?: string
}

interface CreateDocumentMutationData {
  file: File
  metadata: Omit<DocumentSourceData, 'file'>
}

interface UpdateMutationData {
  sourceId: string
  updateData: UpdateSourceData
}

interface SearchResult {
  success: boolean
  data: ContextSource[]
  message?: string
}

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

// Query key generators with proper typing
const QUERY_KEY = (clientId: string): string[] => ['contextSources', clientId]
const STATS_QUERY_KEY = (clientId: string): string[] => ['contextSources', 'stats', clientId]

// Hook return type
interface UseContextSourcesReturn {
  // Data
  sources: ContextSource[]
  stats: ContextSourcesStats
  isLoading: boolean
  error: Error | null
  refetch: () => void

  // Helper functions
  getSourcesByType: (sourceType: string) => ContextSource[]
  getSourcesCount: (sourceType: string) => number

  // Create operations
  createDocument: (data: CreateDocumentMutationData) => Promise<ApiResponse>
  createUrl: (data: UrlSourceData) => Promise<ApiResponse>
  createManual: (data: ManualSourceData) => Promise<ApiResponse>
  createNote: (data: NoteSourceData) => Promise<ApiResponse>

  // CRUD operations
  update: (data: UpdateMutationData) => Promise<ApiResponse>
  remove: (sourceId: string) => Promise<ApiResponse>
  download: (source: ContextSource) => Promise<void>
  search: (query: string) => Promise<SearchResult>

  // Loading states
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isDownloading: boolean
  isSearching: boolean

  // Search results
  searchResults: ContextSource[]
}

/**
 * Enhanced hook for managing context sources with TypeScript support
 */
export const useContextSources = (clientId: string): UseContextSourcesReturn => {
  const queryClient = useQueryClient()

  // Fetch context sources list with proper typing
  const sourcesQuery = useQuery<ContextSource[], Error>({
    queryKey: QUERY_KEY(clientId),
    queryFn: async (): Promise<ContextSource[]> => {
      const res = await getContextSources(clientId)
      if (res?.success === false) {
        throw new Error(res.message || 'Error al cargar fuentes de contexto')
      }
      return res?.data || []
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch statistics with proper typing
  const statsQuery = useQuery<ContextSourcesStats, Error>({
    queryKey: STATS_QUERY_KEY(clientId),
    queryFn: async (): Promise<ContextSourcesStats> => {
      const res = await getContextSourcesStats(clientId)
      if (res?.success === false) {
        throw new Error(res.message || 'Error al cargar estadísticas')
      }
      return res?.data || { total: 0, by_type: {}, by_status: {} }
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })

  // Generic mutation handler for optimistic updates with proper typing
  const createOptimisticUpdate = (
    sourceType: string,
    sourceData: Partial<ContextSource>
  ): ContextSource => {
    return {
      id: `temp-${Date.now()}`,
      source_type: sourceType,
      title: sourceData.title || (sourceData as any).file?.name || 'Nueva fuente',
      description: sourceData.description || '',
      tags: sourceData.tags || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      _optimistic: true,
      ...sourceData,
    } as ContextSource
  }

  // Create Document Source with proper typing
  const createDocumentMutation = useMutation<ApiResponse, Error, CreateDocumentMutationData>({
    mutationFn: ({ file, metadata }: CreateDocumentMutationData) =>
      createDocumentSource(clientId, file, metadata),
    onMutate: async ({ file, metadata }: CreateDocumentMutationData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.DOCUMENT, {
        file,
        ...metadata,
      } as any)
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) => [
        ...old,
        optimistic,
      ])
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al subir documento')
    },
    onSuccess: () => {
      toast.success('Documento agregado como fuente')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Create URL Source with proper typing
  const createUrlMutation = useMutation<ApiResponse, Error, UrlSourceData>({
    mutationFn: (urlData: UrlSourceData) => createUrlSource(clientId, urlData),
    onMutate: async (urlData: UrlSourceData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.URL, urlData)
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) => [
        ...old,
        optimistic,
      ])
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al agregar URL')
    },
    onSuccess: () => {
      toast.success('URL agregada como fuente')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Create Manual Source with proper typing
  const createManualMutation = useMutation<ApiResponse, Error, ManualSourceData>({
    mutationFn: (manualData: ManualSourceData) => createManualSource(clientId, manualData),
    onMutate: async (manualData: ManualSourceData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.MANUAL, manualData)
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) => [
        ...old,
        optimistic,
      ])
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al crear fuente manual')
    },
    onSuccess: () => {
      toast.success('Contenido manual agregado')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Create Note Source with proper typing
  const createNoteMutation = useMutation<ApiResponse, Error, NoteSourceData>({
    mutationFn: (noteData: NoteSourceData) => createNoteSource(clientId, noteData),
    onMutate: async (noteData: NoteSourceData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.NOTE, noteData)
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) => [
        ...old,
        optimistic,
      ])
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al crear nota')
    },
    onSuccess: () => {
      toast.success('Nota agregada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Update Source with proper typing
  const updateMutation = useMutation<ApiResponse, Error, UpdateMutationData>({
    mutationFn: ({ sourceId, updateData }: UpdateMutationData) =>
      updateContextSource(clientId, sourceId, updateData),
    onMutate: async ({ sourceId, updateData }: UpdateMutationData) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) =>
        old.map(source => (source.id === sourceId ? { ...source, ...updateData } : source))
      )
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al actualizar')
    },
    onSuccess: () => {
      toast.success('Fuente actualizada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) })
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Delete Source with proper typing
  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: (sourceId: string) => deleteContextSource(clientId, sourceId),
    onMutate: async (sourceId: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData<ContextSource[]>(QUERY_KEY(clientId))
      queryClient.setQueryData<ContextSource[]>(QUERY_KEY(clientId), (old = []) =>
        old.filter(source => source.id !== sourceId)
      )
      return { prev }
    },
    onError: (err: Error, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      }
      toast.error(err?.message || 'Error al eliminar')
    },
    onSuccess: () => {
      toast.success('Fuente eliminada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Download Source with proper typing
  const downloadMutation = useMutation<void, Error, ContextSource>({
    mutationFn: (source: ContextSource) => downloadContextSource(source),
    onError: (err: Error) => toast.error(err?.message || 'Error al descargar'),
  })

  // Search Sources with proper typing
  const searchMutation = useMutation<SearchResult, Error, string>({
    mutationFn: (query: string) => searchContextSources(clientId, query),
    onError: (err: Error) => toast.error(err?.message || 'Error en la búsqueda'),
  })

  // Helper functions to filter by type with proper typing
  const getSourcesByType = (sourceType: string): ContextSource[] => {
    return sourcesQuery.data?.filter(source => source.source_type === sourceType) || []
  }

  const getSourcesCount = (sourceType: string): number => {
    return getSourcesByType(sourceType).length
  }

  return {
    // Data
    sources: sourcesQuery.data || [],
    stats: statsQuery.data || { total: 0, by_type: {}, by_status: {} },
    isLoading: sourcesQuery.isLoading || statsQuery.isLoading,
    error: sourcesQuery.error || statsQuery.error,
    refetch: () => {
      sourcesQuery.refetch()
      statsQuery.refetch()
    },

    // Helper functions
    getSourcesByType,
    getSourcesCount,

    // Create operations
    createDocument: createDocumentMutation.mutateAsync,
    createUrl: createUrlMutation.mutateAsync,
    createManual: createManualMutation.mutateAsync,
    createNote: createNoteMutation.mutateAsync,

    // CRUD operations
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    download: downloadMutation.mutateAsync,
    search: searchMutation.mutateAsync,

    // Loading states
    isCreating:
      createDocumentMutation.isPending ||
      createUrlMutation.isPending ||
      createManualMutation.isPending ||
      createNoteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDownloading: downloadMutation.isPending,
    isSearching: searchMutation.isPending,

    // Search results
    searchResults: searchMutation.data?.data || [],
  }
}

export default useContextSources
