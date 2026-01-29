import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'

/**
 * Quick actions component for sidebar - New Event and Generate with AI buttons
 */
export const QuickActions = ({
  onNewEvent,
  onAIGenerate,
  isCollapsed = false,
  isLoading = false,
}) => {
  const buttonBaseClasses = `
    relative overflow-hidden transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const collapsedButtonClasses = `
    ${buttonBaseClasses}
    w-12 h-12 rounded-xl
    bg-slate-700/80 hover:bg-slate-600/80
    border border-slate-600/30 hover:border-slate-500/40
  `

  const expandedButtonClasses = `
    ${buttonBaseClasses}
    w-full px-4 py-3 rounded-xl text-left
    flex items-center gap-3
    border border-slate-600/30 hover:border-slate-500/40
  `

  const primaryButton = `
    bg-blue-600/90 hover:bg-blue-500/90
    text-white font-semibold
    shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30
  `

  const secondaryButton = `
    bg-purple-600/20 hover:bg-purple-500/25
    border-purple-500/30 hover:border-purple-400/40
    text-purple-300 hover:text-purple-200
  `

  if (isCollapsed) {
    return (
      <div className='space-y-3'>
        {/* New Event Button - Collapsed */}
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewEvent}
          disabled={isLoading}
          className={`${collapsedButtonClasses} ${primaryButton}`}
          title='Nuevo Evento'
          aria-label='Crear nuevo evento'
        >
          <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
          <Plus className='w-5 h-5 relative z-10 mx-auto' />
        </motion.button>

        {/* AI Generate Button - Collapsed */}
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAIGenerate}
          disabled={isLoading}
          className={`${collapsedButtonClasses} ${secondaryButton}`}
          title='Generar con IA'
          aria-label='Generar eventos con inteligencia artificial'
        >
          <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
          <Sparkles className='w-5 h-5 relative z-10 mx-auto' />
        </motion.button>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {/* New Event Button - Expanded */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewEvent}
        disabled={isLoading}
        className={`${expandedButtonClasses} ${primaryButton} group`}
        aria-label='Crear nuevo evento'
      >
        <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />

        <div className='w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center relative z-10'>
          <Plus className='w-4 h-4' />
        </div>

        <div className='flex-1 relative z-10'>
          <div className='font-semibold'>Nuevo Evento</div>
          <div className='text-xs text-white/70'>Crear nueva tarea</div>
        </div>

        <div className='w-2 h-2 bg-white/20 rounded-full relative z-10' />
      </motion.button>

      {/* AI Generate Button - Expanded */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAIGenerate}
        disabled={isLoading}
        className={`${expandedButtonClasses} ${secondaryButton} group`}
        aria-label='Generar eventos con inteligencia artificial'
      >
        <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />

        <div className='w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center relative z-10'>
          <Sparkles className='w-4 h-4' />
        </div>

        <div className='flex-1 relative z-10'>
          <div className='font-semibold'>Generar con IA</div>
          <div className='text-xs text-purple-300/70'>Ideas automáticas</div>
        </div>

        <div className='w-2 h-2 bg-purple-400/40 rounded-full relative z-10 animate-pulse' />
      </motion.button>
    </div>
  )
}

// Default export for index.ts re-export compatibility
export default QuickActions
