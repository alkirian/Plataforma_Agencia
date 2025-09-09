import { useInfiniteQuery } from '@tanstack/react-query'
import { getAgencyActivityFeed } from '../api/activity'
import type {
  ActivityEvent,
  UseActivityFeedReturn,
  ActivityFeedProps,
} from '../shared/types/activity.types'

interface ActivityFeedResponse {
  data: ActivityEvent[]
  nextCursor?: string | null
  success?: boolean
  message?: string
}

interface ActivityFeedPage {
  items: ActivityEvent[]
  nextCursor?: string | null
}

interface UseActivityFeedOptions {
  limit?: number
}

/**
 * Optimized hook for managing activity feed with infinite scroll
 *
 * Key improvements:
 * - Proper TypeScript typing with imported interfaces
 * - Better error handling
 * - Optimized data fetching patterns
 * - Proper pagination handling
 * - Performance optimizations
 */
export const useActivityFeed = ({
  limit = 20,
}: UseActivityFeedOptions = {}): UseActivityFeedReturn => {
  const query = useInfiniteQuery<ActivityFeedPage, Error>({
    queryKey: ['activity-feed', { limit }],
    queryFn: async ({ pageParam }): Promise<ActivityFeedPage> => {
      try {
        const cursor = pageParam as string | undefined
        const res = (await getAgencyActivityFeed({ limit, cursor })) as ActivityFeedResponse

        // Handle API response format
        if (res?.success === false) {
          throw new Error(res.message || 'Error al cargar actividad')
        }

        return {
          items: res?.data || [],
          nextCursor: res?.nextCursor ?? null,
        }
      } catch (error) {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching activity feed:', error)
        }
        throw error
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      return lastPage.nextCursor ?? undefined
    },
    staleTime: 60 * 1000, // Cache for 1 minute
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

  // Flatten all pages into a single items array
  const items: ActivityEvent[] = query.data?.pages?.flatMap(page => page.items) || []

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  }
}

// Re-export for consistency with the dashboard location
export { useActivityFeed as useActivityFeedDashboard }
