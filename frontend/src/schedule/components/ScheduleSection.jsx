import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getCurrentDate } from '@shared/utils/dateHelpers'
import TaskPopover from './modals/TaskPopover'
import { ContentModal } from './modals/ContentModal'
// import { BulkAIGeneratorModal } from './modals/BulkAIGeneratorModal'
// import AIReviewModal from './modals/AIReviewModal'

import { useAIGenerationStore } from '@stores/useAIGenerationStore'

// Importaciones de FullCalendar
import FullCalendarWrapper from './calendar/FullCalendarWrapper'
import { CalendarSidebar } from './calendar/CalendarSidebar'
import { useCalendarEvents } from '../hooks/useCalendarEvents'

// Estilos del módulo schedule
import '../styles'
import { getClientById } from '@api/clients.api'
import { useCalendarView } from '@shared/contexts/CalendarViewContext'

/**
 * Componente de calendario renovado con FullCalendar
 * Implementa todas las mejores prácticas y funcionalidades optimizadas
 */
export const ScheduleSection = ({ clientId }) => {
  // Hook de vista de calendario (sincronizado con el header)
  const { currentView, changeView, currentDate, setCurrentDate, setDateLabel } = useCalendarView()

  // Estados del componente
  const [client, setClient] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  // State for TaskPopover edit mode
  const [isTaskPopoverEditOpen, setIsTaskPopoverEditOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [isIdeasOpen, setIsIdeasOpen] = useState(false)
  // Estados para el modal de creación/edición de contenido
  const [isContentModalOpen, setIsContentModalOpen] = useState(false)
  const [contentModalMode, setContentModalMode] = useState('create')
  const [contentModalDate, setContentModalDate] = useState(new Date())
  const [contentModalTask, setContentModalTask] = useState(null)
  // Estados para el popover de edición rápida
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false)
  const [quickTaskDate, setQuickTaskDate] = useState(null)
  const [clickCoords, setClickCoords] = useState(null)
  const [cellBounds, setCellBounds] = useState(null)
  // Docking system state
  const [isDocked, setIsDocked] = useState(false)

  // Estados para el modo de selección (IA)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])

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

  // Use the AI generation store
  const { startJob, pendingIdeas, updateIdea, clearPendingIdeas } = useAIGenerationStore()

  // Local state for the review modal
  const [isAIReviewOpen, setIsAIReviewOpen] = useState(false)

  // Effect to automatically open the modal when we have pending ideas for this client
  const clientPendingIdeas = useMemo(() => {
    return pendingIdeas[clientId] || []
  }, [pendingIdeas, clientId])

  useEffect(() => {
    if (clientPendingIdeas.length > 0) {
      setIsAIReviewOpen(true)
    }
  }, [clientPendingIdeas.length])

  // Handler for saving selected ideas from the modal
  const handleSaveAIContent = useCallback(
    async selectedIdeas => {
      try {
        // Create tasks for each selected idea
        const createPromises = selectedIdeas.map(idea => {
          // Map idea to task format
          const taskData = {
            title: idea.title,
            status: 'pendiente', // Default status
            copy: idea.copy,
            channel: idea.channel,
            scheduled_at: new Date(idea.date).toISOString(), // Ensure date is ISO
          }
          return createEvent(taskData)
        })

        await Promise.all(createPromises)

        toast.success(`${selectedIdeas.length} tareas creadas exitosamente`)

        // Clear pending ideas for this client
        clearPendingIdeas(clientId)
        setIsAIReviewOpen(false)
      } catch (error) {
        console.error('Error saving AI content:', error)
        toast.error('Error al guardar las tareas')
      }
    },
    [createEvent, clientId, clearPendingIdeas]
  )

  const handleUpdateIdeaStatus = useCallback(
    (ideaId, newStatus) => {
      updateIdea(clientId, ideaId, { status: newStatus })
    },
    [clientId, updateIdea]
  )

  const handleCloseAIReview = useCallback(() => {
    if (
      window.confirm(
        'Si cierras ahora, se perderán las ideas generadas no guardadas. ¿Estás seguro?'
      )
    ) {
      clearPendingIdeas(clientId)
      setIsAIReviewOpen(false)
    }
  }, [clientId, clearPendingIdeas])

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
  const handleDateClick = useCallback(
    (date, clickInfo) => {
      console.log('[ScheduleSection] handleDateClick received', {
        date,
        clickInfo,
        isSelectionMode,
      })

      if (isSelectionMode) {
        // Logic for selecting/deselecting dates
        const dateStr = date.toISOString().split('T')[0]
        setSelectedDates(prev => {
          const newDates = prev.includes(dateStr)
            ? prev.filter(d => d !== dateStr)
            : [...prev, dateStr]
          return newDates.sort()
        })
        return
      }

      // Normal behavior (create content)
      setContentModalDate(date)
      setContentModalMode('create')
      setContentModalTask(null)
      setIsContentModalOpen(true)
    },
    [isSelectionMode]
  )

  // Handler for AI generation triggered from toolbar
  const handleGenerateSelected = useCallback(() => {
    if (selectedDates.length === 0) return

    // Start background job directly
    startJob(clientId, selectedDates)

    // Reset selection mode
    setIsSelectionMode(false)
    setSelectedDates([])

    // Open review modal (BulkAIGeneratorModal will handle 'review-ideas' step if job is done or pending ideas exist)
    // For now, we just rely on the store/toast notification as user requested "remove date selection modal"
    // We can show the BulkAIGeneratorModal in "review" mode later if needed, but for now we just start the job.
  }, [clientId, selectedDates, startJob])

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedDates([]) // Clear selection when exiting
      }
      return !prev
    })
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

  const handleViewChange = useCallback(
    viewType => {
      changeView(viewType)
    },
    [changeView]
  )

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
        changeView('timeGridDay')
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
    <div className='calendar-container flex h-full gap-4 p-0'>
      {/* Sidebar izquierdo con mini-calendario */}
      <CalendarSidebar
        currentDate={new Date(currentDate)}
        onDateSelect={date => handleDateChange(date)}
        className="w-52 flex-shrink-0 h-full"
        events={events}
        onEventClick={handleEventClick}
      />

      {/* Main content area */}
      <div className='flex-1 flex flex-col min-w-0 h-full'>
        {/* Calendar container */}
        <div className='flex-1 min-h-0'>
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
            onLabelChange={setDateLabel}
            height='100%'
            clientName={client?.name || ''}
            isDocked={isDocked}
            onAddTask={() => {
              setContentModalDate(new Date())
              setContentModalMode('create')
              setContentModalTask(null)
              setIsContentModalOpen(true)
            }}
            // Toggle selection mode instead of opening modal immediately
            onGenerateAI={toggleSelectionMode}
            selectedDates={selectedDates}
            onToggleDate={date => {
              // Reuse the logic from handleDateClick for the checkbox specific event
              const dateStr = date.toISOString().split('T')[0]
              setSelectedDates(prev => {
                const newDates = prev.includes(dateStr)
                  ? prev.filter(d => d !== dateStr)
                  : [...prev, dateStr]
                return newDates.sort()
              })
            }}
            isSelectionMode={isSelectionMode}
            onGenerateSelected={range => {
              if (range.start) {
                setContentModalDate(range.start)
                setContentModalMode('create')
                setContentModalTask(null)
                setIsContentModalOpen(true)
              }
            }}
          />
        </div>
      </div>

      {/* Modal de generación masiva con IA */}
      {/* <BulkAIGeneratorModal
        isOpen={isIdeasOpen}
        onClose={() => setIsIdeasOpen(false)}
        clientId={clientId}
        initialSelectedDates={selectedDates}
        onSuccess={() => {
          // Refrescar eventos del calendario
          loadEvents()
          setSelectedDates([]) // Limpiar selección tras éxito
        }}
      /> */}

      {/* Modal de creación/edición de contenido */}
      <ContentModal
        isOpen={isContentModalOpen}
        onClose={() => {
          setIsContentModalOpen(false)
          setContentModalTask(null)
        }}
        mode={contentModalMode}
        clientId={clientId}
        initialDate={contentModalDate}
        existingTask={contentModalTask}
        onSuccess={async eventData => {
          await loadEvents()
          setIsContentModalOpen(false)
          setContentModalTask(null)
        }}
      />

      {/* Modal de Generación Masiva (Guía / Status) */}

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
      {/* Modal de Revisión de IA */}
      {/* <AIReviewModal
        isOpen={isAIReviewOpen}
        onClose={handleCloseAIReview}
        ideas={clientPendingIdeas}
        onUpdateIdeaStatus={handleUpdateIdeaStatus}
        onSaveSelected={handleSaveAIContent}
      /> */}
    </div>
  )
}
