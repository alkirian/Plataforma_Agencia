import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePopoverPosition } from '@hooks/usePopoverPosition'
import { useClickOutside } from '@shared/hooks/useClickOutside'
import { useDeviceType } from '@hooks/useDeviceType'
import { useTaskDrafts } from '../../hooks/useTaskDrafts'
import { useAutoSave } from '@hooks/useAutoSave'
import TaskForm from '../forms/TaskForm'
import TaskIdeasAI from '../ai/TaskIdeasAI'
import taskPopoverStyles from './TaskPopover.styles'

/**
 * TaskPopover - Reusable popover for task operations
 *
 * Modes:
 * - 'create': Create new task (default)
 * - 'edit': Edit existing task
 * - 'ai-generate': Generate task with AI suggestions
 */
const TaskPopover = ({
  isOpen,
  onClose,
  mode = 'create',

  // Positioning
  clickCoords,
  cellBounds = null,
  selectedDate,

  // Context
  clientId,
  existingTask = null,

  // Actions
  onCreateTask,
  onUpdateTask,
  onDeleteTask,

  // AI
  aiPrompt = null,

  // Docking system
  isDocked = false,
  onDockToggle = null,
}) => {
  const deviceType = useDeviceType()

  // Initialize form data based on mode
  const getInitialFormData = useCallback(() => {
    const defaultData = {
      title: '',
      copy: '',
      status: 'pendiente',
      channel: 'IG',
    }

    switch (mode) {
      case 'edit':
        return existingTask
          ? {
              title: existingTask.title || '',
              copy: existingTask.copy || '',
              status: existingTask.status || 'pendiente',
              channel: existingTask.channel || 'IG',
            }
          : defaultData

      case 'ai-generate':
        return {
          ...defaultData,
          title: aiPrompt || '',
        }

      case 'create':
      default:
        return defaultData
    }
  }, [mode, existingTask, aiPrompt])

  const [formData, setFormData] = useState(getInitialFormData())
  const [isLoading, setIsLoading] = useState(false)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)

  // Reset form data when mode or existingTask changes
  useEffect(() => {
    setFormData(getInitialFormData())
  }, [getInitialFormData])

  // Hooks para drafts (only for create mode)
  const shouldUseDrafts = mode === 'create'
  const { saveDraft, loadDraft, clearDraft, cleanupOldDrafts, hasDraft } = useTaskDrafts(
    shouldUseDrafts ? clientId : null,
    shouldUseDrafts ? selectedDate : null
  )

  // Auto-save with debounce (only for create mode)
  useAutoSave(
    shouldUseDrafts ? formData : null,
    shouldUseDrafts ? saveDraft : () => {},
    2000,
    isOpen && isDraftLoaded && shouldUseDrafts
  )

  // Load drafts when popover opens (only for create mode)
  useEffect(() => {
    if (isOpen && shouldUseDrafts && clientId && selectedDate) {
      // Clean old drafts first
      cleanupOldDrafts()

      // Load existing draft if exists
      const existingDraft = loadDraft()
      if (existingDraft) {
        setFormData(existingDraft)
      }

      setIsDraftLoaded(true)
    } else {
      setIsDraftLoaded(false)
    }
  }, [isOpen, clientId, selectedDate, loadDraft, cleanupOldDrafts, shouldUseDrafts])

  // Clear drafts when popover closes after successful action (only for create mode)
  useEffect(() => {
    if (!isOpen && isDraftLoaded && shouldUseDrafts) {
      const timeoutId = setTimeout(() => {
        clearDraft()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, isDraftLoaded, clearDraft, shouldUseDrafts])

  // Dynamic positioning (only for desktop when not docked)
  const { position, isVisible } = usePopoverPosition(
    deviceType === 'desktop' && !isDocked ? clickCoords : null,
    { width: 384, height: 420 },
    deviceType === 'desktop' && !isDocked ? cellBounds : null
  )

  // Calculate pointer position for visual connection to click point (not shown when docked)
  const getPointerPosition = useCallback(() => {
    if (!clickCoords || !position || deviceType !== 'desktop' || isDocked) return null

    const { x: clickX, y: clickY } = clickCoords
    const { x: popoverX, y: popoverY } = position

    // Determine which edge the pointer should be on
    const isAbove = clickY > popoverY + 200 // Popover is above click point
    const isBelow = clickY < popoverY + 100 // Popover is below click point
    const isLeft = clickX > popoverX + 192 // Popover is left of click point (half of 384px width)
    const isRight = clickX < popoverX + 192 // Popover is right of click point (half of 384px width)

    // Calculate pointer position relative to popover
    let pointerStyle = {}
    const pointerClass = taskPopoverStyles.getPointerClasses()

    if (isBelow && Math.abs(clickX - popoverX) < 360) {
      // Pointer on top edge
      const leftOffset = Math.max(12, Math.min(clickX - popoverX, 372))
      pointerStyle = {
        top: -6,
        left: leftOffset,
        zIndex: 1001,
      }
    } else if (isAbove && Math.abs(clickX - popoverX) < 360) {
      // Pointer on bottom edge
      const leftOffset = Math.max(12, Math.min(clickX - popoverX, 372))
      pointerStyle = {
        bottom: -6,
        left: leftOffset,
        zIndex: 1001,
      }
    } else if (isRight && Math.abs(clickY - popoverY) < 400) {
      // Pointer on left edge
      const topOffset = Math.max(12, Math.min(clickY - popoverY, 400))
      pointerStyle = {
        left: -6,
        top: topOffset,
        zIndex: 1001,
      }
    } else if (isLeft && Math.abs(clickY - popoverY) < 400) {
      // Pointer on right edge
      const topOffset = Math.max(12, Math.min(clickY - popoverY, 400))
      pointerStyle = {
        right: -6,
        top: topOffset,
        zIndex: 1001,
      }
    } else {
      return null // No pointer if too far away
    }

    return { style: pointerStyle, className: pointerClass }
  }, [clickCoords, position, deviceType, isDocked])

  // Click outside to close
  const popoverRef = useClickOutside(() => {
    if (isOpen) onClose()
  }, isOpen)

  // Handler for AI suggestions
  const handleAISuggestion = useCallback(suggestion => {
    setFormData(prev => ({
      ...prev,
      title: suggestion,
    }))
  }, [])

  // Get mode-specific configuration
  const getModeConfig = () => {
    switch (mode) {
      case 'edit':
        return {
          title: 'Editar Tarea',
          buttonText: 'Actualizar Tarea',
          loadingText: 'Actualizando...',
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          ),
        }

      case 'ai-generate':
        return {
          title: 'Generar con IA',
          buttonText: 'Generar Tarea',
          loadingText: 'Generando...',
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              />
            </svg>
          ),
        }

      case 'create':
      default:
        return {
          title: 'Nueva Tarea',
          buttonText: 'Crear Tarea',
          loadingText: 'Creando...',
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          ),
        }
    }
  }

  const handleSubmit = useCallback(
    async data => {
      if (!data.title?.trim()) return

      setIsLoading(true)
      try {
        const taskData = {
          title: data.title.trim(),
          status: data.status,
          copy: data.copy?.trim() || '',
          channel: data.channel,
        }

        switch (mode) {
          case 'edit':
            if (onUpdateTask && existingTask) {
              await onUpdateTask({
                ...existingTask,
                ...taskData,
              })
            }
            break

          case 'ai-generate':
          case 'create':
          default:
            if (onCreateTask) {
              const eventData = {
                ...taskData,
                scheduled_at: new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                  9,
                  0,
                  0 // 9:00 AM by default
                ).toISOString(),
              }
              await onCreateTask(eventData)
            }
            break
        }

        // Clear draft after successful action (only for create mode)
        if (shouldUseDrafts) {
          clearDraft()
        }

        // Reset form for create/ai-generate modes
        if (mode !== 'edit') {
          setFormData(getInitialFormData())
        }

        onClose()
      } catch (error) {
        console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} task:`, error)
      } finally {
        setIsLoading(false)
      }
    },
    [
      mode,
      selectedDate,
      onCreateTask,
      onUpdateTask,
      existingTask,
      onClose,
      shouldUseDrafts,
      clearDraft,
      getInitialFormData,
    ]
  )

  const handleDelete = useCallback(async () => {
    if (mode !== 'edit' || !existingTask || !onDeleteTask) return

    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      setIsLoading(true)
      try {
        await onDeleteTask(existingTask)
        onClose()
      } catch (error) {
        console.error('Error deleting task:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [mode, existingTask, onDeleteTask, onClose])

  if (!isOpen) return null

  const modeConfig = getModeConfig()

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {deviceType !== 'desktop' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={taskPopoverStyles.getOverlayClasses()}
          onClick={onClose}
        />
      )}

      <AnimatePresence>
        <motion.div
          ref={popoverRef}
          style={taskPopoverStyles.getPopoverStyles(
            deviceType,
            position,
            clickCoords,
            isVisible,
            isDocked
          )}
          className={taskPopoverStyles.getPopoverClasses(deviceType, isDocked)}
          variants={taskPopoverStyles.getAnimationVariants(deviceType, isDocked)}
          initial='hidden'
          animate={isOpen ? 'visible' : 'hidden'}
          exit='exit'
        >
          {/* Visual pointer/arrow for desktop positioning */}
          {deviceType === 'desktop' &&
            (() => {
              const pointerInfo = getPointerPosition()
              return pointerInfo ? (
                <motion.div
                  className={pointerInfo.className}
                  style={pointerInfo.style}
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: 1, rotate: 45 }}
                  transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
                />
              ) : null
            })()}

          {/* Dock button for desktop when not showing full header */}
          {deviceType === 'desktop' && !isDocked && onDockToggle && (
            <div className='absolute top-2 left-2 z-10'>
              <button
                onClick={onDockToggle}
                className={taskPopoverStyles.getDockButtonClasses()}
                title='Anclar panel'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Header for mobile/tablet and desktop dock mode */}
          {(deviceType !== 'desktop' || isDocked) && (
            <div className={taskPopoverStyles.getHeaderClasses()}>
              <div className={taskPopoverStyles.getHeaderActionsClasses()}>
                <h2 className={taskPopoverStyles.getHeaderTitleClasses()}>{modeConfig.title}</h2>
                {shouldUseDrafts && isDraftLoaded && hasDraft() && (
                  <div className={taskPopoverStyles.getDraftIndicatorClasses()}>
                    <div className={taskPopoverStyles.getDraftIndicatorDotClasses()} />
                    <span className={taskPopoverStyles.getDraftIndicatorTextClasses()}>Draft</span>
                  </div>
                )}
              </div>
              <div className={taskPopoverStyles.getHeaderActionsClasses()}>
                {/* Dock/Undock button - only show for desktop */}
                {deviceType === 'desktop' && onDockToggle && (
                  <button
                    onClick={onDockToggle}
                    className={taskPopoverStyles.getDockButtonClasses()}
                    title={isDocked ? 'Desanclar panel' : 'Anclar panel'}
                  >
                    {isDocked ? (
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                        />
                      </svg>
                    )}
                  </button>
                )}
                {mode === 'edit' && onDeleteTask && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className={taskPopoverStyles.getDeleteButtonClasses()}
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                )}
                <button onClick={onClose} className={taskPopoverStyles.getCloseButtonClasses()}>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Draft indicator for desktop */}
          {deviceType === 'desktop' && shouldUseDrafts && isDraftLoaded && hasDraft() && (
            <div className={taskPopoverStyles.getDraftIndicatorClasses(true)}>
              <div className={taskPopoverStyles.getDraftIndicatorDotClasses(true)} />
              <span className={taskPopoverStyles.getDraftIndicatorTextClasses(true)}>
                Borrador guardado
              </span>
            </div>
          )}

          {/* Delete button for desktop edit mode */}
          {deviceType === 'desktop' && mode === 'edit' && onDeleteTask && (
            <div className={taskPopoverStyles.getDesktopDeleteContainerClasses()}>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className={taskPopoverStyles.getDeleteButtonClasses(true)}
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                Eliminar
              </button>
            </div>
          )}

          {/* Form */}
          <TaskForm
            mode={mode}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            selectedDate={selectedDate}
            isLoading={isLoading}
            modeConfig={modeConfig}
          />

          {/* AI Component for suggestions (only for create and ai-generate modes) */}
          {(mode === 'create' || mode === 'ai-generate') && (
            <TaskIdeasAI
              clientId={clientId}
              selectedDate={selectedDate}
              onSuggestionClick={handleAISuggestion}
              currentFormData={formData}
              aiPrompt={aiPrompt}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default TaskPopover
