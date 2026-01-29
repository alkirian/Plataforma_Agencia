import React, { useState } from 'react'
import { Download, Plus, Sparkles } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { CalendarViewDropdown } from '@shared/components/ui'
import { useCalendarView } from '@shared/contexts/CalendarViewContext'
import { ExportModal } from '../modals/ExportModal'
import { SearchBar } from './SearchBar'

export const CalendarToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  events = [],
  clientName = '',
  isChatOpen = false,
  onJumpToEvent,
  onAddTask,
  onGenerateAI,
  selectedDates = [],
  isSelectionMode = false,
  onGenerateSelected,
}) => {
  const { changeView, getSimplifiedView } = useCalendarView()
  const [showExportModal, setShowExportModal] = useState(false)

  // ... (rest of the component)

  // Logic to determine button content
  const renderAIButtonContent = () => {
    if (selectedDates?.length > 0) {
      return (
        <>
          <Sparkles className='w-4 h-4 mr-1.5 animate-pulse' />
          Generar ({selectedDates.length})
        </>
      )
    }
    if (isSelectionMode) {
      return (
        <>
          <Sparkles className='w-4 h-4 mr-1.5' />
          Cancelar
        </>
      )
    }
    return (
      <>
        <Sparkles className='w-4 h-4 mr-1.5' />
        IA
      </>
    )
  }

  const getAIButtonClass = () => {
    if (selectedDates?.length > 0) {
      return 'h-9 px-3 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 border border-purple-500 shadow-lg shadow-purple-500/30 ring-1 ring-purple-400/50 transition-all duration-300'
    }
    if (isSelectionMode) {
      return 'h-9 px-3 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-strong border border-[color:var(--color-border-subtle)]'
    }
    return 'h-9 px-3 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20'
  }

  const handleAIButtonClick = () => {
    if (selectedDates?.length > 0 && onGenerateSelected) {
      onGenerateSelected()
    } else {
      onGenerateAI()
    }
  }

  const isMonth = view === 'dayGridMonth' || view === 'month'
  const isWeek = view === 'timeGridWeek' || view === 'week'
  const isDay = view === 'timeGridDay' || view === 'day'
  const isAgenda = view === 'listMonth' || view === 'agenda'

  return (
    <div className='flex items-center justify-end h-10 gap-3 mb-3 px-1'>
      {/* LEFT: empty or spacer if needed, but justify-end will push actions to the right */}

      {/* RIGHT: Actions */}

      {/* RIGHT: Actions only */}
      <div className='flex items-center gap-2'>
        {/* AI Mode Toggle */}
        <Button
          onClick={onGenerateAI}
          variant='ghost'
          className={`h-8 px-2 text-xs font-medium border transition-all duration-300 ${
            isSelectionMode
              ? 'text-text-muted hover:text-text-primary hover:bg-surface-strong border-[color:var(--color-border-subtle)]'
              : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border-purple-500/20'
          }`}
        >
          <Sparkles
            className={`w-4 h-4 ${selectedDates?.length > 0 ? 'mr-1' : ''} ${!isSelectionMode ? 'text-purple-400' : ''}`}
          />
          {selectedDates?.length > 0 ? selectedDates.length : isSelectionMode ? '' : ''}
        </Button>

        <Button
          onClick={onAddTask}
          className='h-8 px-3 text-xs font-medium bg-[color:var(--palette-primary-accent)] hover:bg-[color:var(--palette-hover-state)] text-white shadow-sm'
        >
          <Plus className='w-4 h-4 mr-1' />
          Tarea
        </Button>
      </div>
    </div>
  )
}

export default CalendarToolbar
