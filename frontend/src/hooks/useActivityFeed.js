import { useInfiniteQuery } from '@tanstack/react-query';
import { getAgencyActivityFeed } from '../api/activity';

export const useActivityFeed = ({ limit = 20 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ['activity-feed', { limit }],
    queryFn: async ({ pageParam }) => {
      const res = await getAgencyActivityFeed({ limit, cursor: pageParam });
      if (res?.success === false) throw new Error(res.message || 'Error al cargar actividad');
      return { items: res?.data || [], nextCursor: res?.nextCursor || null };
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  });

  const items = query.data?.pages?.flatMap(p => p.items) || [];

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
};
