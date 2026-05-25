import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '../api/schedule';
import { TASK_STATES } from '../constants/taskStates';

/**
 * Hook para obtener estadísticas rápidas de un cliente.
 * Soporta precarga en memoria si se pasa el objeto 'clientPreloaded'.
 * @param {string} clientId - ID del cliente
 * @param {object} [clientPreloaded] - Datos del cliente con schedule_items pre-cargados
 */
export const useClientStats = (clientId, clientPreloaded = null) => {
  // Si ya tenemos los datos precargados, no hacemos la consulta a la base de datos
  const hasPreloaded = clientPreloaded && Array.isArray(clientPreloaded.schedule_items);
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: () => getSchedule(clientId),
    enabled: !!clientId && !hasPreloaded,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const sourceEvents = hasPreloaded ? clientPreloaded.schedule_items : events;

  // Calcular estadísticas
  const stats = {
    total: sourceEvents.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    percentage: 0,
  };

  if (sourceEvents.length > 0) {
    // Contar por estado
    sourceEvents.forEach(event => {
      const status = (event.status || 'pendiente').toLowerCase();
      
      if (status === 'publicado' || status === 'completado' || status === 'aprobado' || status === 'listo-publicar') {
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
    isLoading: hasPreloaded ? false : isLoading,
    hasEvents: sourceEvents.length > 0,
  };
};

/**
 * Hook optimizado para obtener estadísticas de múltiples clientes a partir del listado pre-cargado.
 * Evita por completo realizar peticiones HTTP simultáneas en bucle.
 * @param {Array} clients - Array de objetos cliente (con la relación schedule_items unificada)
 */
export const useMultipleClientStats = (clients = []) => {
  const statsMap = {};
  
  clients.forEach(client => {
    const events = client.schedule_items || [];

    const stats = {
      total: events.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percentage: 0,
    };

    if (events.length > 0) {
      events.forEach(event => {
        const status = (event.status || 'pendiente').toLowerCase();
        
        if (status === 'publicado' || status === 'completado' || status === 'aprobado' || status === 'listo-publicar') {
          stats.completed++;
        } else if (status === 'en-progreso' || status === 'en-diseño' || status === 'en-revision') {
          stats.inProgress++;
        } else {
          stats.pending++;
        }
      });

      stats.percentage = Math.round((stats.completed / stats.total) * 100);
    }

    statsMap[client.id] = {
      stats,
      isLoading: false,
      hasEvents: events.length > 0,
    };
  });

  return {
    statsMap,
    isLoading: false,
  };
};