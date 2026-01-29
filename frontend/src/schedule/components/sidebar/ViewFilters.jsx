import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Grid3X3, List } from 'lucide-react'

/**
 * View filters component for calendar view selection
 */
export const ViewFilters = ({
  currentView = 'dayGridMonth',
  onViewChange,
  isCollapsed = false,
}) => {
  const viewOptions = [
    {
      id: 'dayGridMonth',
      label: 'Mes',
      icon: Calendar,
      description: 'Vista mensual',
    },
    {
      id: 'timeGridWeek',
      label: 'Semana',
      icon: Grid3X3,
      description: 'Vista semanal',
    },
    {
      id: 'timeGridDay',
      label: 'Día',
      icon: Clock,
      description: 'Vista diaria',
    },
    {
      id: 'listWeek',
      label: 'Agenda',
      icon: List,
      description: 'Lista de eventos',
    },
  ]

  if (isCollapsed) {
    return (
      <div className='space-y-2'>
        {viewOptions.map(option => {
          const Icon = option.icon
          const isActive = currentView === option.id

          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(option.id)}
              className={`
                relative w-12 h-12 rounded-xl transition-all duration-300
                border border-slate-600/30 hover:border-slate-500/40
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800
                ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-700/80 text-slate-300 hover:text-slate-200 hover:bg-slate-600/80'
                }
              `}
              title={`${option.label} - ${option.description}`}
              aria-label={option.description}
              aria-pressed={isActive}
            >
              <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
              <Icon className='w-5 h-5 mx-auto relative z-10' />
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      <div className='text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2'>
        <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
        Vista del Calendario
      </div>

      {viewOptions.map(option => {
        const Icon = option.icon
        const isActive = currentView === option.id

        return (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange(option.id)}
            className={`
              relative w-full px-4 py-3 rounded-xl text-left transition-all duration-300
              border border-slate-600/30 hover:border-slate-500/40
              focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800
              flex items-center gap-3 group
              ${
                isActive
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20 border-blue-500/40'
                  : 'bg-slate-700/60 text-slate-300 hover:text-slate-200 hover:bg-slate-700/80'
              }
            `}
            aria-pressed={isActive}
          >
            <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />

            <div
              className={`
              w-8 h-8 rounded-lg flex items-center justify-center relative z-10
              ${isActive ? 'bg-white/20' : 'bg-slate-600/40 group-hover:bg-slate-600/60'}
            `}
            >
              <Icon className='w-4 h-4' />
            </div>

            <div className='flex-1 relative z-10'>
              <div className='font-semibold'>{option.label}</div>
              <div className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                {option.description}
              </div>
            </div>

            {isActive && (
              <div className='w-2 h-2 bg-white/40 rounded-full relative z-10 animate-pulse' />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Default export for index.ts re-export compatibility
export default ViewFilters
