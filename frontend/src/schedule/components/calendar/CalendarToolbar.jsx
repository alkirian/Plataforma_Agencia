import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@components/ui/Button'
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
}) => {
  const [showExportModal, setShowExportModal] = useState(false)

  const isMonth = view === 'dayGridMonth' || view === 'month'
  const isWeek = view === 'timeGridWeek' || view === 'week'
  const isDay = view === 'timeGridDay' || view === 'day'
  const isAgenda = view === 'listMonth' || view === 'agenda'

  return (
    <div className='bg-surface-strong/70 border border-[color:var(--color-border-subtle)] rounded-lg p-2 mb-3 backdrop-blur-sm'>
      <div className='flex items-center justify-between gap-2'>
        {/* Izquierda: navegación */}
        <div className='flex items-center gap-2 min-w-0'>
          <Button
            onClick={() => onNavigate('TODAY')}
            variant='ghost'
            size='sm'
            className='text-[11px] font-semibold tracking-[0.02em]'
            aria-label='Ir a hoy'
          >
            Hoy
          </Button>

          <div className='h-4 w-px bg-gray-700/50' />

          <Button
            onClick={() => onNavigate('PREV')}
            variant='ghost'
            size='sm'
            className='!px-1'
            aria-label='Anterior'
            icon={
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            }
          />

          <div
            className={`text-xs font-semibold text-text-primary/90 tracking-wide truncate ${isChatOpen ? 'max-w-[110px] sm:max-w-[160px]' : 'max-w-[200px]'}`}
          >
            {label}
          </div>

          <Button
            onClick={() => onNavigate('NEXT')}
            variant='ghost'
            size='sm'
            className='!px-1'
            aria-label='Siguiente'
            icon={
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            }
          />
        </div>

        {/* Centro: vistas tipo segmented */}
        <div className='flex items-center gap-1 bg-surface-soft p-1 rounded-md border border-[color:var(--color-border-subtle)]'>
          <Button
            onClick={() => onView('month')}
            variant={isMonth ? 'primary' : 'ghost'}
            size='sm'
            className='text-[11px] font-semibold tracking-[0.02em]'
            aria-label='Vista mes'
          >
            {isChatOpen ? 'M' : 'Mes'}
          </Button>
          <Button
            onClick={() => onView('week')}
            variant={isWeek ? 'primary' : 'ghost'}
            size='sm'
            className='text-[11px] font-semibold tracking-[0.02em]'
            aria-label='Vista semana'
          >
            {isChatOpen ? 'S' : 'Semana'}
          </Button>
          <Button
            onClick={() => onView('day')}
            variant={isDay ? 'primary' : 'ghost'}
            size='sm'
            className='text-[11px] font-semibold tracking-[0.02em]'
            aria-label='Vista día'
          >
            {isChatOpen ? 'D' : 'Día'}
          </Button>
          <Button
            onClick={() => onView('agenda')}
            variant={isAgenda ? 'primary' : 'ghost'}
            size='sm'
            className='text-[11px] font-semibold tracking-[0.02em]'
            aria-label='Vista agenda'
          >
            {isChatOpen ? 'A' : 'Agenda'}
          </Button>
        </div>

        {/* Derecha: búsqueda + export */}
        <div className='flex items-center gap-2 min-w-[180px]'>
          <SearchBar events={events} onSelect={onJumpToEvent} />
          <Button
            onClick={() => setShowExportModal(true)}
            variant='ghost'
            size='sm'
            className='!py-1.5'
            aria-label='Exportar calendario'
            icon={<Download className='w-4 h-4' />}
          />
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        events={events}
        clientName={clientName}
      />
    </div>
  )
}

export default CalendarToolbar
