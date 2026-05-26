import { useState, useCallback, useMemo } from 'react';
import { getSchedule, createScheduleItem, updateScheduleItem, deleteScheduleItem, clearSchedule, clearAllSchedule } from '../api/schedule';
import { TASK_STATES } from '../constants/taskStates';
import toast from 'react-hot-toast';

// Caché global en memoria para persistir eventos entre montajes del componente
const calendarCache = new Map();

/**
 * Hook personalizado para manejar eventos del calendario con FullCalendar
 * Implementa mejores prácticas: memoización, manejo de errores, optimistic updates, caché SWR
 */
export const useCalendarEvents = (clientId) => {
  const [events, setEvents] = useState(() => {
    if (clientId && calendarCache.has(clientId)) {
      return calendarCache.get(clientId);
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    return !(clientId && calendarCache.has(clientId));
  });

  const [error, setError] = useState(null);

  // Transformar datos del backend a formato FullCalendar con mapeo de color directo
  const transformToFullCalendarEvents = (scheduleData) => {
    return scheduleData.map(item => {
      const startDate = new Date(item.scheduled_at);
      const statusKey = (item.status || 'en-diseño').toLowerCase();
      
      // Obtener estilo del estado según TASK_STATES (considera los aliases)
      const stateStyle = TASK_STATES[statusKey] || TASK_STATES['en-diseño'];
      
      return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: startDate, // Eventos de momento específico
        allDay: false,
        backgroundColor: stateStyle.color, // Color de fondo del badge
        borderColor: stateStyle.color,
        textColor: '#161517', // Color de tipografía oscura para excelente contraste
        color: stateStyle.color, // Compatibilidad con componentes móviles/agenda
        extendedProps: {
          status: item.status,
          description: item.description,
          copy: item.copy,
          channel: item.channel,
          priority: item.priority,
          client_feedback: item.client_feedback,
          creative_idea: item.creative_idea,
          goal: item.goal,
          format: item.format,
          platforms: item.platforms,
          originalData: item
        }
      };
    });
  };

  // Cargar eventos desde la API
  const loadEvents = useCallback(async () => {
    if (!clientId) return;
    
    try {
      // Solo encendemos el loading bloqueante si no tenemos nada en el caché
      if (!calendarCache.has(clientId)) {
        setLoading(true);
      }
      setError(null);
      
      const scheduleData = await getSchedule(clientId);
      const transformedEvents = transformToFullCalendarEvents(scheduleData);
      
      setEvents(transformedEvents);
      calendarCache.set(clientId, transformedEvents);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 FullCalendar events loaded (cached/updated):', {
          rawData: scheduleData,
          transformedEvents,
          eventCount: transformedEvents.length
        });
      }
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading calendar events:', err);
      }
      setError(err.message);
      toast.error('Error al cargar eventos del calendario');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Crear nuevo evento (Optimistic Update)
  const createEvent = useCallback(async (eventData) => {
    try {
      // Obtener color del estado del evento
      const statusKey = (eventData.status || 'en-diseño').toLowerCase();
      const stateStyle = TASK_STATES[statusKey] || TASK_STATES['en-diseño'];

      // Optimistic update: agregar evento inmediatamente con su respectivo color
      const tempEvent = {
        id: `temp-${Date.now()}`,
        title: eventData.title,
        start: new Date(eventData.scheduled_at),
        end: new Date(eventData.scheduled_at),
        backgroundColor: stateStyle.color,
        borderColor: stateStyle.color,
        textColor: '#161517',
        color: stateStyle.color,
        extendedProps: {
          status: eventData.status,
          isTemporary: true
        }
      };
      
      setEvents(prev => {
        const next = [...prev, tempEvent];
        calendarCache.set(clientId, next);
        return next;
      });
      
      // Crear en backend
      const newEvent = await createScheduleItem(clientId, eventData);
      
      // Reemplazar evento temporal con el real
      setEvents(prev => {
        const next = prev.map(event => 
          event.id === tempEvent.id 
            ? transformToFullCalendarEvents([newEvent])[0]
            : event
        );
        calendarCache.set(clientId, next);
        return next;
      });
      
      toast.success('Evento creado exitosamente');
      return newEvent;
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[createEvent] Error:', err?.message || err, { eventData });
      }
      // Revertir optimistic update en caso de error
      setEvents(prev => {
        const next = prev.filter(event => !event.extendedProps?.isTemporary);
        calendarCache.set(clientId, next);
        return next;
      });
      toast.error('Error al crear evento');
      throw err;
    }
  }, [clientId]);

  // Actualizar evento
  const updateEvent = useCallback(async (eventId, updateData) => {
    try {
      const updatedEvent = await updateScheduleItem(clientId, eventId, updateData);
      
      // Actualizar estado local
      setEvents(prev => {
        const next = prev.map(event => 
          event.id === eventId 
            ? transformToFullCalendarEvents([updatedEvent])[0]
            : event
        );
        calendarCache.set(clientId, next);
        return next;
      });
      
      toast.success('Evento actualizado');
      return updatedEvent;
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[updateEvent] Error:', err?.message || err, { eventId, updateData });
      }
      toast.error('Error al actualizar evento');
      throw err;
    }
  }, [clientId]);

  // Eliminar evento
  const deleteEvent = useCallback(async (eventId) => {
    try {
      await deleteScheduleItem(clientId, eventId);
      
      // Actualizar estado local
      setEvents(prev => {
        const next = prev.filter(event => event.id !== eventId);
        calendarCache.set(clientId, next);
        return next;
      });
      
      toast.success('Evento eliminado');
      
    } catch (err) {
      toast.error('Error al eliminar evento');
      throw err;
    }
  }, [clientId]);

  // Eliminar todos los eventos de un mes específico
  const clearMonthEvents = useCallback(async (year, month) => {
    try {
      setLoading(true);
      await clearSchedule(clientId, year, month);
      
      // Actualizar estado local: filtrar y mantener solo los que no coincidan con este mes
      setEvents(prev => {
        const next = prev.filter(event => {
          const d = new Date(event.start);
          return !(d.getFullYear() === year && d.getMonth() === month);
        });
        calendarCache.set(clientId, next);
        return next;
      });
      
      toast.success('Cronograma del mes limpiado');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[clearMonthEvents] Error:', err);
      }
      toast.error('Error al limpiar el cronograma del mes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Eliminar TODOS los eventos del cronograma (sin filtro de mes)
  const clearAllEvents = useCallback(async () => {
    try {
      setLoading(true);
      await clearAllSchedule(clientId);
      setEvents([]);
      calendarCache.set(clientId, []);
      toast.success('Cronograma completo eliminado');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[clearAllEvents] Error:', err);
      }
      toast.error('Error al limpiar el cronograma');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Mover evento (drag & drop)
  const moveEvent = useCallback(async (eventId, newStart, newEnd) => {
    try {
      const updateData = {
        scheduled_at: newStart.toISOString()
      };
      
      await updateEvent(eventId, updateData);
      
    } catch (err) {
      // Recargar eventos para revertir el cambio visual
      loadEvents();
      throw err;
    }
  }, [updateEvent, loadEvents]);

  // Eventos memoizados para optimización
  const memoizedEvents = useMemo(() => events, [events]);

  // Estadísticas de eventos (útil para dashboards)
  const eventStats = useMemo(() => {
    const stats = {
      total: events.length,
      byStatus: {}
    };
    
    Object.keys(TASK_STATES).forEach(status => {
      stats.byStatus[status] = events.filter(
        event => event.extendedProps?.status === status
      ).length;
    });
    
    return stats;
  }, [events]);

  return {
    // Estado
    events: memoizedEvents,
    loading,
    error,
    
    // Acciones
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearMonthEvents,
    clearAllEvents,
    moveEvent,
    
    // Utilidades
    eventStats,
    
    // Refresh manual
    refresh: loadEvents
  };
};

async function onCreateEvent(clientId, form) {
  try {
    await createScheduleItem(clientId, form);
    // refrescar lista/calendario...
  } catch (err) {
    console.error('Crear evento falló:', err);
    alert(err.message || 'No se pudo crear el evento. Verifique título, fecha y estado.');
  }
}