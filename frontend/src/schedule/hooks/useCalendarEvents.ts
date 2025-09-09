import { useState, useCallback, useMemo } from 'react'
import {
  getSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from '../services/schedule'
import { TASK_STATE_ORDER, fromExternalTaskState } from '../constants'
import toast from 'react-hot-toast'
import type { TaskState } from '@schedule/types'

interface ScheduleItem {
  id: string
  title: string
  scheduled_at: string
  status: string
  description?: string
  channel?: string
  priority?: number
}

interface FullCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  extendedProps: {
    status: TaskState
    description?: string
    channel?: string
    priority?: number
    originalData?: ScheduleItem
    isTemporary?: boolean
  }
}

interface EventStats {
  total: number
  byStatus: Record<TaskState, number>
}

interface UseCalendarEventsReturn {
  events: FullCalendarEvent[]
  loading: boolean
  error: string | null
  loadEvents: () => Promise<void>
  createEvent: (eventData: Omit<ScheduleItem, 'id'>) => Promise<ScheduleItem>
  updateEvent: (eventId: string, updateData: Partial<ScheduleItem>) => Promise<ScheduleItem>
  deleteEvent: (eventId: string) => Promise<void>
  moveEvent: (eventId: string, newStart: Date, newEnd: Date) => Promise<void>
  eventStats: EventStats
  refresh: () => Promise<void>
}

/**
 * Hook personalizado para manejar eventos del calendario con FullCalendar
 * Implementa mejores prácticas: memoización, manejo de errores, optimistic updates
 */
export const useCalendarEvents = (clientId?: string): UseCalendarEventsReturn => {
  const [events, setEvents] = useState<FullCalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transformar datos del backend a formato FullCalendar
  const transformToFullCalendarEvents = (scheduleData: ScheduleItem[]): FullCalendarEvent[] => {
    return scheduleData.map(item => {
      const startDate = new Date(item.scheduled_at)

      return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: startDate, // Eventos de momento específico
        allDay: false,
        extendedProps: {
          status: fromExternalTaskState(item.status) as TaskState,
          description: item.description,
          channel: item.channel,
          priority: item.priority,
          originalData: item,
        },
      }
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
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading calendar events:', err)
      }
      setError((err as Error).message)
      toast.error('Error al cargar eventos del calendario')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  // Crear nuevo evento (Optimistic Update)
  const createEvent = useCallback(
    async (eventData: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> => {
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
            isTemporary: true,
          },
        }

        setEvents(prev => [...prev, tempEvent])

        // Crear en backend
        const newEvent = await createScheduleItem(clientId!, eventData)

        // Reemplazar evento temporal con el real
        setEvents(prev =>
          prev.map(event =>
            event.id === tempEvent.id ? transformToFullCalendarEvents([newEvent])[0] : event
          )
        )

        toast.success('Evento creado exitosamente')
        return newEvent
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[createEvent] Error:', (err as Error)?.message || err, { eventData })
        }
        // Revertir optimistic update en caso de error
        setEvents(prev => prev.filter(event => !event.extendedProps?.isTemporary))
        toast.error('Error al crear evento')
        throw err
      }
    },
    [clientId]
  )

  // Actualizar evento
  const updateEvent = useCallback(
    async (eventId: string, updateData: Partial<ScheduleItem>): Promise<ScheduleItem> => {
      try {
        const updatedEvent = await updateScheduleItem(clientId!, eventId, updateData)

        // Actualizar estado local
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId ? transformToFullCalendarEvents([updatedEvent])[0] : event
          )
        )

        toast.success('Evento actualizado')
        return updatedEvent
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[updateEvent] Error:', (err as Error)?.message || err, {
            eventId,
            updateData,
          })
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
        await deleteScheduleItem(clientId!, eventId)

        // Actualizar estado local
        setEvents(prev => prev.filter(event => event.id !== eventId))

        toast.success('Evento eliminado')
      } catch (err) {
        toast.error('Error al eliminar evento')
        throw err
      }
    },
    [clientId]
  )

  // Mover evento (drag & drop)
  const moveEvent = useCallback(
    async (eventId: string, newStart: Date, newEnd: Date): Promise<void> => {
      try {
        const updateData = {
          scheduled_at: newStart.toISOString(),
        }

        await updateEvent(eventId, updateData)
      } catch (err) {
        // Recargar eventos para revertir el cambio visual
        loadEvents()
        throw err
      }
    },
    [updateEvent, loadEvents]
  )

  // Eventos memoizados para optimización
  const memoizedEvents = useMemo(() => events, [events])

  // Estadísticas de eventos (útil para dashboards)
  const eventStats = useMemo(() => {
    const stats: EventStats = {
      total: events.length,
      byStatus: {} as Record<TaskState, number>,
    }

    ;(TASK_STATE_ORDER as readonly string[]).forEach((status: string) => {
      stats.byStatus[status as TaskState] = events.filter(
        event => event.extendedProps?.status === status
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

export async function onCreateEvent(clientId: string, form: Omit<ScheduleItem, 'id'>) {
  try {
    await createScheduleItem(clientId, form)
    // refrescar lista/calendario...
  } catch (err) {
    console.error('Crear evento falló:', err)
    alert((err as Error).message || 'No se pudo crear el evento. Verifique título, fecha y estado.')
  }
}
