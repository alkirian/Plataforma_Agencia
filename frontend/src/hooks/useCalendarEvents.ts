import { useState, useCallback, useMemo } from 'react'
import {
  getSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from '../api/schedule'
import { TASK_STATES } from '../constants/taskStates'
import toast from 'react-hot-toast'
import type {
  ScheduleItem,
  FullCalendarEvent,
  CreateScheduleItemPayload,
  UpdateScheduleItemPayload,
  EventStatistics,
  UseCalendarEventsReturn,
  TaskState,
} from '../schedule/models'

/**
 * Hook personalizado para manejar eventos del calendario con FullCalendar
 * Implementa mejores prácticas: memoización, manejo de errores, optimistic updates
 */
export const useCalendarEvents = (clientId: string): UseCalendarEventsReturn => {
  const [events, setEvents] = useState<FullCalendarEvent[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Transformar datos del backend a formato FullCalendar
  const transformToFullCalendarEvents = (scheduleData: ScheduleItem[]): FullCalendarEvent[] => {
    return scheduleData.map((item: ScheduleItem) => {
      const startDate = new Date(item.scheduled_at)

      return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: startDate, // Eventos de momento específico
        allDay: false,
        extendedProps: {
          status: item.status,
          description: item.description,
          copy: item.copy,
          channel: item.channel,
          priority: item.priority,
          originalData: item,
        },
      } as FullCalendarEvent
    })
  }

  // Cargar eventos desde la API
  const loadEvents = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)

      const scheduleData = await getSchedule(clientId)
      const transformedEvents = transformToFullCalendarEvents(scheduleData)

      setEvents(transformedEvents)

      if (process.env.NODE_ENV === 'development') {
        console.log('📅 FullCalendar events loaded:', {
          rawData: scheduleData,
          transformedEvents,
          eventCount: transformedEvents.length,
        })
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading calendar events:', err)
      }
      setError(err?.message || 'Error desconocido')
      toast.error('Error al cargar eventos del calendario')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  // Crear nuevo evento (Optimistic Update)
  const createEvent = useCallback(
    async (eventData: CreateScheduleItemPayload): Promise<ScheduleItem> => {
      try {
        // Optimistic update: agregar evento inmediatamente
        const tempEvent: FullCalendarEvent = {
          id: `temp-${Date.now()}`,
          title: eventData.title,
          start: new Date(eventData.scheduled_at),
          end: new Date(eventData.scheduled_at),
          allDay: false,
          extendedProps: {
            status: eventData.status,
            channel: eventData.channel,
            isTemporary: true,
            originalData: {} as ScheduleItem,
          },
        }

        setEvents((prev: FullCalendarEvent[]) => [...prev, tempEvent])

        // Crear en backend
        const newEvent = await createScheduleItem(clientId, eventData)

        // Reemplazar evento temporal con el real
        setEvents((prev: FullCalendarEvent[]) =>
          prev.map((event: FullCalendarEvent) =>
            event.id === tempEvent.id ? transformToFullCalendarEvents([newEvent])[0] : event
          )
        )

        toast.success('Evento creado exitosamente')
        return newEvent
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[createEvent] Error:', err?.message || err, { eventData })
        }
        // Revertir optimistic update en caso de error
        setEvents((prev: FullCalendarEvent[]) =>
          prev.filter(event => !event.extendedProps?.isTemporary)
        )
        toast.error('Error al crear evento')
        throw err
      }
    },
    [clientId]
  )

  // Actualizar evento
  const updateEvent = useCallback(
    async (eventId: string, updateData: UpdateScheduleItemPayload): Promise<ScheduleItem> => {
      try {
        const updatedEvent = await updateScheduleItem(clientId, eventId, updateData)

        // Actualizar estado local
        setEvents((prev: FullCalendarEvent[]) =>
          prev.map((event: FullCalendarEvent) =>
            event.id === eventId ? transformToFullCalendarEvents([updatedEvent])[0] : event
          )
        )

        toast.success('Evento actualizado')
        return updatedEvent
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[updateEvent] Error:', err?.message || err, { eventId, updateData })
        }
        toast.error('Error al actualizar evento')
        throw err
      }
    },
    [clientId]
  )

  // Eliminar evento
  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        await deleteScheduleItem(clientId, eventId)

        // Actualizar estado local
        setEvents((prev: FullCalendarEvent[]) => prev.filter(event => event.id !== eventId))

        toast.success('Evento eliminado')
      } catch (err: any) {
        toast.error('Error al eliminar evento')
        throw err
      }
    },
    [clientId]
  )

  // Mover evento (drag & drop)
  const moveEvent = useCallback(
    async (eventId: string, newStart: Date, newEnd?: Date): Promise<void> => {
      try {
        const updateData = {
          scheduled_at: newStart.toISOString(),
        }

        await updateEvent(eventId, updateData)
      } catch (err: any) {
        // Recargar eventos para revertir el cambio visual
        loadEvents()
        throw err
      }
    },
    [updateEvent, loadEvents]
  )

  // Eventos memoizados para optimización
  const memoizedEvents = useMemo((): FullCalendarEvent[] => events, [events])

  // Estadísticas de eventos (útil para dashboards)
  const eventStats = useMemo((): EventStatistics => {
    const stats: EventStatistics = {
      total: events.length,
      byStatus: {} as Record<TaskState, number>,
      byChannel: {} as any,
      byPriority: {} as any,
    }

    Object.keys(TASK_STATES).forEach(status => {
      const taskState = status as TaskState
      stats.byStatus[taskState] = events.filter(
        event => event.extendedProps?.status === taskState
      ).length
    })

    return stats
  }, [events])

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
    refresh: loadEvents,
  }
}

// Utility function for creating events (example usage)
export async function onCreateEvent(
  clientId: string,
  form: CreateScheduleItemPayload
): Promise<void> {
  try {
    await createScheduleItem(clientId, form)
    // refrescar lista/calendario...
  } catch (err: any) {
    console.error('Crear evento falló:', err)
    alert(err?.message || 'No se pudo crear el evento. Verifique título, fecha y estado.')
  }
}
