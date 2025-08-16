import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '../api/schedule';
import { TASK_STATES } from '../constants/taskStates';

/**
 * Hook para obtener estadísticas rápidas de un cliente
 * @param {string} clientId - ID del cliente
 */
export const useClientStats = (clientId) => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: () => getSchedule(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Calcular estadísticas
  const stats = {
    total: events.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    percentage: 0,
  };

  if (events.length > 0) {
    // Contar por estado
    events.forEach(event => {
      const status = event.status || 'pendiente';
      
      if (status === 'publicado' || status === 'completado') {
        stats.completed++;
      } else if (status === 'en-progreso' || status === 'en-diseño' || status === 'en-revision') {
        stats.inProgress++;
      } else {
        stats.pending++;
      }
    });

    // Calcular porcentaje de completado
    stats.percentage = Math.round((stats.completed / stats.total) * 100);
  }

  return {
    stats,
    isLoading,
    hasEvents: events.length > 0,
  };
};

/**
 * Hook para obtener estadísticas de múltiples clientes
 * @param {Array} clientIds - Array de IDs de clientes
 */
export const useMultipleClientStats = (clientIds = []) => {
  const queries = clientIds.map(clientId => ({
    queryKey: ['client-stats', clientId],
    queryFn: () => getSchedule(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  }));

  const results = queries.map(query => useQuery(query));

  // Combinar resultados
  const statsMap = {};
  
  clientIds.forEach((clientId, index) => {
    const events = results[index]?.data || [];
    const isLoading = results[index]?.isLoading || false;

    const stats = {
      total: events.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percentage: 0,
    };

    if (events.length > 0) {
      events.forEach(event => {
        const status = event.status || 'pendiente';
        
        if (status === 'publicado' || status === 'completado') {
          stats.completed++;
        } else if (status === 'en-progreso' || status === 'en-diseño' || status === 'en-revision') {
          stats.inProgress++;
        } else {
          stats.pending++;
        }
      });

      stats.percentage = Math.round((stats.completed / stats.total) * 100);
    }

    statsMap[clientId] = {
      stats,
      isLoading,
      hasEvents: events.length > 0,
    };
  });

  const isAnyLoading = results.some(result => result.isLoading);

  return {
    statsMap,
    isLoading: isAnyLoading,
  };
};