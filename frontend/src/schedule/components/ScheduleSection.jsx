import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getCurrentDate } from '@shared/utils/dateHelpers'
import TaskPopover from './modals/TaskPopover'

// Importaciones de FullCalendar
import FullCalendarWrapper from './calendar/FullCalendarWrapper'
import { useCalendarEvents } from '../hooks/useCalendarEvents'

// Chat embebido antiguo removido: usamos el nuevo dock global
import { IdeasAIButton } from '@components/ideas/IdeasAIButton'
import { IdeasModal } from '@components/ideas/IdeasModal'

// Estilos del módulo schedule
import '../styles'
import { getClientById } from '@api/clients'

/**
 * Componente de calendario renovado con FullCalendar
 * Implementa todas las mejores prácticas y funcionalidades optimizadas
 */
export const ScheduleSection = ({ clientId }) => {
  // Estados del componente
  const [client, setClient] = useState(null)
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate())
  const [currentView, setCurrentView] = useState('dayGridMonth')
  const [selectedEvent, setSelectedEvent] = useState(null)
  // State for TaskPopover edit mode
  const [isTaskPopoverEditOpen, setIsTaskPopoverEditOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [isIdeasOpen, setIsIdeasOpen] = useState(false)
  // Estados para el nuevo popover
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false)
  const [quickTaskDate, setQuickTaskDate] = useState(null)
  const [clickCoords, setClickCoords] = useState(null)
  const [cellBounds, setCellBounds] = useState(null)
  // Docking system state
  const [isDocked, setIsDocked] = useState(false)

  // Hook personalizado para eventos
  const {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    eventStats,
  } = useCalendarEvents(clientId)

  // Calcular estadísticas basadas en eventos visibles del calendario
  const calculateVisibleStats = () => {
    const total = events.length
    const byStatus = {}

    events.forEach(event => {
      const status = event.resource?.status || event.status || 'pendiente'
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    return {
      total,
      byStatus,
    }
  }

  const visibleStats = calculateVisibleStats()

  // Cargar datos iniciales - memoizar loadInitialData
  const loadInitialData = useCallback(async () => {
    try {
      if (clientId) {
        // Cargar cliente y eventos en paralelo
        const [clientResponse] = await Promise.all([getClientById(clientId), loadEvents()])
        setClient(clientResponse.data)
      }
    } catch (err) {
      toast.error('Error al cargar datos del cliente')
    }
  }, [clientId, loadEvents])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Handlers del calendario - memoizados para evitar re-renders
  const handleDateClick = useCallback((date, clickInfo) => {
    // Usar el nuevo popover para crear tareas rápidamente
    setQuickTaskDate(date)
    setClickCoords(clickInfo?.clickCoords || null)
    setCellBounds(clickInfo?.elementRect || null)
    setIsQuickTaskOpen(true)
  }, [])

  const handleEventClick = useCallback(event => {
    try {
      // Convert the FullCalendar event to our task format
      const taskData = {
        id: event.id,
        title: event.title || '',
        status: event.extendedProps?.status || 'pendiente',
        copy: event.extendedProps?.copy ?? event.extendedProps?.description ?? '',
        channel: event.extendedProps?.channel || 'IG',
        start: event.start,
        end: event.end,
        // Include all extended props
        ...event.extendedProps,
      }

      setTaskToEdit(taskData)
      setSelectedEvent(event)
      setIsTaskPopoverEditOpen(true)
    } catch (error) {
      console.error('Error handling event click:', error)
      // Fallback: still try to edit with minimal data
      setTaskToEdit({
        id: event?.id,
        title: event?.title || '',
        status: 'pendiente',
        copy: '',
        channel: 'IG',
        start: event?.start,
        end: event?.end,
      })
      setSelectedEvent(event)
      setIsTaskPopoverEditOpen(true)
    }
  }, [])

  const handleEventDrop = useCallback(
    async event => {
      try {
        await moveEvent(event.id, event.start, event.end)
      } catch (err) {
        // El hook maneja el error y recarga
      }
    },
    [moveEvent]
  )

  const handleViewChange = useCallback(viewType => {
    setCurrentView(viewType)
  }, [])

  const handleDateChange = useCallback(
    (start /*, end, view */) => {
      if (start && Math.abs(start.getTime() - currentDate.getTime()) > 24 * 60 * 60 * 1000) {
        setCurrentDate(start)
      }
    },
    [currentDate]
  )

  const closeEditTaskPopover = useCallback(() => {
    setIsTaskPopoverEditOpen(false)
    setTaskToEdit(null)
    setSelectedEvent(null)
    // Reset docked state when closing popover
    setIsDocked(false)
  }, [])

  // Handler para crear tareas desde el TaskPopover
  const handleCreateQuickTask = useCallback(
    async taskData => {
      try {
        await createEvent(taskData)
        toast.success('Tarea creada exitosamente')
        setIsQuickTaskOpen(false)
        setQuickTaskDate(null)
        setClickCoords(null)
        setCellBounds(null)
      } catch (error) {
        toast.error('Error al crear la tarea')
        throw error // Re-throw para que el popover maneje el loading
      }
    },
    [createEvent]
  )

  // Handler para actualizar tareas desde el TaskPopover
  const handleUpdateTask = useCallback(
    async taskData => {
      try {
        if (!taskData.id) {
          throw new Error('Task ID is required for updates')
        }

        const eventData = {
          title: taskData.title,
          status: taskData.status,
          copy: taskData.copy?.trim() || '',
          channel: taskData.channel,
          // If start time exists, preserve it; otherwise use existing scheduled_at
          scheduled_at: taskData.start
            ? new Date(taskData.start).toISOString()
            : taskToEdit?.start
              ? new Date(taskToEdit.start).toISOString()
              : new Date().toISOString(),
        }

        await updateEvent(taskData.id, eventData)
        toast.success('Evento actualizado exitosamente')
        closeEditTaskPopover()
      } catch (error) {
        toast.error('Error al actualizar el evento')
        throw error // Re-throw para que el popover maneje el loading
      }
    },
    [updateEvent, taskToEdit, closeEditTaskPopover]
  )

  // Handler para eliminar tareas desde el TaskPopover
  const handleDeleteTask = useCallback(
    async taskData => {
      try {
        if (!taskData.id) {
          throw new Error('Task ID is required for deletion')
        }

        await deleteEvent(taskData.id)
        toast.success('Evento eliminado exitosamente')
        closeEditTaskPopover()
      } catch (error) {
        toast.error('Error al eliminar el evento')
        throw error // Re-throw para que el popover maneje el loading
      }
    },
    [deleteEvent, closeEditTaskPopover]
  )

  // Handler para cerrar el TaskPopover
  const handleCloseQuickTask = useCallback(() => {
    setIsQuickTaskOpen(false)
    setQuickTaskDate(null)
    setClickCoords(null)
    setCellBounds(null)
    // Reset docked state when closing popover
    setIsDocked(false)
  }, [])

  // Handler for docking/undocking TaskPopover
  const handleDockToggle = useCallback(() => {
    setIsDocked(prev => {
      const newDocked = !prev
      // When docking, switch to day view for better layout
      if (newDocked && currentView !== 'timeGridDay') {
        setCurrentView('timeGridDay')
      }
      return newDocked
    })
  }, [currentView])

  // Chat embebido removido: se elimina enfoque accesibilidad del panel

  // Estados de carga y error
  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto'>
          <p className='text-red-400 font-medium'>Error al cargar el calendario</p>
          <p className='text-red-300 text-sm mt-1'>{error}</p>
          <button
            onClick={loadEvents}
            className='mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-text-primary rounded-lg transition-colors'
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='calendar-container flex h-screen'>
      {/* Main content area */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
        {/* Calendar container */}
        <div className='flex-1 overflow-hidden'>
          <div
            className='h-full bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-800/95 
                       border border-slate-600/30 rounded-xl shadow-2xl backdrop-blur-sm 
                       ring-1 ring-white/5 overflow-hidden'
          >
            <FullCalendarWrapper
              events={events}
              currentDate={currentDate}
              currentView={currentView}
              loading={loading}
              onDateChange={handleDateChange}
              onViewChange={handleViewChange}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onEventDrop={handleEventDrop}
              height='calc(100vh - 200px)'
              clientName={client?.name || ''}
              isDocked={isDocked}
            />
          </div>
        </div>
      </div>

      {/* Modal de ideas IA */}
      <IdeasModal
        isOpen={isIdeasOpen}
        onClose={() => setIsIdeasOpen(false)}
        clientId={clientId}
        onCreateEvent={async payload => {
          // Use store's createEvent for optimistic UI
          await createEvent(payload)
        }}
      />

      {/* TaskPopover - Sistema unificado de creación y edición de tareas */}
      <TaskPopover
        mode='create'
        isOpen={isQuickTaskOpen}
        onClose={handleCloseQuickTask}
        clickCoords={clickCoords}
        cellBounds={cellBounds}
        selectedDate={quickTaskDate}
        clientId={clientId}
        onCreateTask={handleCreateQuickTask}
        isDocked={isDocked}
        onDockToggle={handleDockToggle}
      />

      {/* TaskPopover - Edición de tareas existentes */}
      <TaskPopover
        mode='edit'
        isOpen={isTaskPopoverEditOpen}
        onClose={closeEditTaskPopover}
        existingTask={taskToEdit}
        selectedDate={taskToEdit?.start ? new Date(taskToEdit.start) : getCurrentDate()}
        clientId={clientId}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        isDocked={isDocked}
        onDockToggle={handleDockToggle}
      />
    </div>
  )
}
