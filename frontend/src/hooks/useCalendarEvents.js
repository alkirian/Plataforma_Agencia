import { useState, useCallback, useMemo } from 'react';
import { getSchedule, createScheduleItem, updateScheduleItem, deleteScheduleItem } from '../api/schedule';
import { TASK_STATES } from '../constants/taskStates';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para manejar eventos del calendario con FullCalendar
 * Implementa mejores prácticas: memoización, manejo de errores, optimistic updates
 */
export const useCalendarEvents = (clientId) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Transformar datos del backend a formato FullCalendar
  const transformToFullCalendarEvents = (scheduleData) => {
    return scheduleData.map(item => {
      const startDate = new Date(item.scheduled_at);
      
  return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: startDate, // Eventos de momento específico
        allDay: false,
        extendedProps: {
          status: item.status,
          description: item.description,
          channel: item.channel,
          priority: item.priority,
          originalData: item
        }
      };
    });
  };

  // Cargar eventos desde la API
  const loadEvents = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const scheduleData = await getSchedule(clientId);
      const transformedEvents = transformToFullCalendarEvents(scheduleData);
      
      setEvents(transformedEvents);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 FullCalendar events loaded:', {
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
      // Optimistic update: agregar evento inmediatamente
  const tempEvent = {
        id: `temp-${Date.now()}`,
        title: eventData.title,
        start: new Date(eventData.scheduled_at),
        end: new Date(eventData.scheduled_at),
        extendedProps: {
          status: eventData.status,
          isTemporary: true
        }
      };
      
      setEvents(prev => [...prev, tempEvent]);
      
      // Crear en backend
      const newEvent = await createScheduleItem(clientId, eventData);
      
      // Reemplazar evento temporal con el real
      setEvents(prev => 
        prev.map(event => 
          event.id === tempEvent.id 
            ? transformToFullCalendarEvents([newEvent])[0]
            : event
        )
      );
      
      toast.success('Evento creado exitosamente');
      return newEvent;
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[createEvent] Error:', err?.message || err, { eventData });
      }
      // Revertir optimistic update en caso de error
      setEvents(prev => prev.filter(event => !event.extendedProps?.isTemporary));
      toast.error('Error al crear evento');
      throw err;
    }
  }, [clientId]);

  // Actualizar evento
  const updateEvent = useCallback(async (eventId, updateData) => {
    try {
      const updatedEvent = await updateScheduleItem(clientId, eventId, updateData);
      
      // Actualizar estado local
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? transformToFullCalendarEvents([updatedEvent])[0]
            : event
        )
      );
      
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
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast.success('Evento eliminado');
      
    } catch (err) {
      toast.error('Error al eliminar evento');
      throw err;
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