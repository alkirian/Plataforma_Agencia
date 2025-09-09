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

const QUERY_KEY = clientId => ['contextSources', clientId]
const STATS_QUERY_KEY = clientId => ['contextSources', 'stats', clientId]

export const useContextSources = clientId => {
  const queryClient = useQueryClient()

  // Fetch context sources list
  const sourcesQuery = useQuery({
    queryKey: QUERY_KEY(clientId),
    queryFn: async () => {
      const res = await getContextSources(clientId)
      if (res?.success === false)
        throw new Error(res.message || 'Error al cargar fuentes de contexto')
      return res?.data || []
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch statistics
  const statsQuery = useQuery({
    queryKey: STATS_QUERY_KEY(clientId),
    queryFn: async () => {
      const res = await getContextSourcesStats(clientId)
      if (res?.success === false) throw new Error(res.message || 'Error al cargar estadísticas')
      return res?.data || {}
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })

  // Generic mutation handler for optimistic updates
  const createOptimisticUpdate = (sourceType, sourceData) => {
    return {
      id: `temp-${Date.now()}`,
      source_type: sourceType,
      title: sourceData.title || sourceData.file?.name || 'Nueva fuente',
      description: sourceData.description || '',
      tags: sourceData.tags || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      _optimistic: true,
      ...sourceData,
    }
  }

  // Create Document Source
  const createDocumentMutation = useMutation({
    mutationFn: ({ file, metadata }) => createDocumentSource(clientId, file, metadata),
    onMutate: async ({ file, metadata }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.DOCUMENT, { file, ...metadata })
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) => [...old, optimistic])
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
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

  // Create URL Source
  const createUrlMutation = useMutation({
    mutationFn: urlData => createUrlSource(clientId, urlData),
    onMutate: async urlData => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.URL, urlData)
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) => [...old, optimistic])
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
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

  // Create Manual Source
  const createManualMutation = useMutation({
    mutationFn: manualData => createManualSource(clientId, manualData),
    onMutate: async manualData => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.MANUAL, manualData)
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) => [...old, optimistic])
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
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

  // Create Note Source
  const createNoteMutation = useMutation({
    mutationFn: noteData => createNoteSource(clientId, noteData),
    onMutate: async noteData => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      const optimistic = createOptimisticUpdate(SOURCE_TYPES.NOTE, noteData)
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) => [...old, optimistic])
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
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

  // Update Source
  const updateMutation = useMutation({
    mutationFn: ({ sourceId, updateData }) => updateContextSource(clientId, sourceId, updateData),
    onMutate: async ({ sourceId, updateData }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) =>
        old.map(source => (source.id === sourceId ? { ...source, ...updateData } : source))
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
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

  // Delete Source
  const deleteMutation = useMutation({
    mutationFn: sourceId => deleteContextSource(clientId, sourceId),
    onMutate: async sourceId => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) })
      const prev = queryClient.getQueryData(QUERY_KEY(clientId))
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) =>
        old.filter(source => source.id !== sourceId)
      )
      return { prev }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev)
      toast.error(err?.message || 'Error al eliminar')
    },
    onSuccess: () => {
      toast.success('Fuente eliminada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY(clientId) })
    },
  })

  // Download Source
  const downloadMutation = useMutation({
    mutationFn: source => downloadContextSource(source),
    onError: err => toast.error(err?.message || 'Error al descargar'),
  })

  // Search Sources
  const searchMutation = useMutation({
    mutationFn: query => searchContextSources(clientId, query),
    onError: err => toast.error(err?.message || 'Error en la búsqueda'),
  })

  // Helper functions to filter by type
  const getSourcesByType = sourceType => {
    return sourcesQuery.data?.filter(source => source.source_type === sourceType) || []
  }

  const getSourcesCount = sourceType => {
    return getSourcesByType(sourceType).length
  }

  return {
    // Data
    sources: sourcesQuery.data || [],
    stats: statsQuery.data || {},
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
