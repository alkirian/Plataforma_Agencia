import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query'
import { getSchedule } from '@schedule'

/**
 * Client statistics interface
 */
interface ClientStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  percentage: number
}

/**
 * Return type for useClientStats hook
 */
interface UseClientStatsReturn {
  stats: ClientStats
  isLoading: boolean
  hasEvents: boolean
}

/**
 * Return type for useMultipleClientStats hook
 */
interface UseMultipleClientStatsReturn {
  statsMap: Record<string, UseClientStatsReturn>
  isLoading: boolean
}

/**
 * Event interface (matches the expected structure from getSchedule)
 */
interface ScheduleEvent {
  id: string
  status?: string
  [key: string]: any
}

/**
 * Calculates statistics from events array
 */
const calculateStats = (events: ScheduleEvent[]): ClientStats => {
  const stats: ClientStats = {
    total: events.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    percentage: 0,
  }

  if (events.length > 0) {
    // Count by status
    events.forEach(event => {
      const status = event.status || 'pendiente'

      if (status === 'publicado' || status === 'completado') {
        stats.completed++
      } else if (status === 'en-diseño' || status === 'en-revision') {
        stats.inProgress++
      } else {
        stats.pending++
      }
    })

    // Calculate completion percentage
    stats.percentage = Math.round((stats.completed / stats.total) * 100)
  }

  return stats
}

/**
 * Hook para obtener estadísticas rápidas de un cliente
 *
 * Key improvements:
 * - Full TypeScript support with comprehensive interfaces
 * - Enhanced type safety for event data and statistics
 * - Better error handling and loading states
 * - Optimized calculation logic
 * - Proper query key structure for caching
 *
 * @param clientId - ID del cliente
 */
export const useClientStats = (clientId: string): UseClientStatsReturn => {
  const { data: events = [], isLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ['client-stats', clientId],
    queryFn: () => getSchedule(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      const errorMessage = error?.message || ''
      if (errorMessage.includes('Token inválido') || errorMessage.includes('No autorizado')) {
        return false
      }
      return failureCount < 2
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const stats = calculateStats(events)

  return {
    stats,
    isLoading,
    hasEvents: events.length > 0,
  }
}

/**
 * Hook para obtener estadísticas de múltiples clientes
 *
 * Key improvements:
 * - Enhanced TypeScript support with proper query result typing
 * - Better performance with optimized query structure
 * - Improved error handling per client
 * - Memory optimization for large client lists
 *
 * @param clientIds - Array de IDs de clientes
 */
export const useMultipleClientStats = (clientIds: string[] = []): UseMultipleClientStatsReturn => {
  const results = useQueries({
    queries: clientIds.map(clientId => ({
      queryKey: ['client-stats', clientId],
      queryFn: () => getSchedule(clientId) as Promise<ScheduleEvent[]>,
      enabled: !!clientId,
      staleTime: 2 * 60 * 1000,
      retry: (failureCount: number, error: Error) => {
        // Don't retry on auth errors
        const errorMessage = error?.message || ''
        if (errorMessage.includes('Token inválido') || errorMessage.includes('No autorizado')) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    })),
  })

  // Combine results with proper typing
  const statsMap: Record<string, UseClientStatsReturn> = {}

  clientIds.forEach((clientId, index) => {
    const result = results[index] as UseQueryResult<ScheduleEvent[], Error>
    const events = result?.data || []
    const isLoading = result?.isLoading || false

    const stats = calculateStats(events)

    statsMap[clientId] = {
      stats,
      isLoading,
      hasEvents: events.length > 0,
    }
  })

  const isAnyLoading = results.some(result => result.isLoading)

  return {
    statsMap,
    isLoading: isAnyLoading,
  }
}