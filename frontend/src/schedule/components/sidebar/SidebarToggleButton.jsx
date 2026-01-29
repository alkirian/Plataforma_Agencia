import React from 'react'
import { motion } from 'framer-motion'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Animated toggle button for sidebar collapse/expand with accessibility support
 */
export const SidebarToggleButton = ({ isCollapsed, onToggle, variant = 'hamburger' }) => {
  const renderIcon = () => {
    if (variant === 'chevron') {
      return (
        <motion.div
          key={isCollapsed ? 'expand' : 'collapse'}
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 180, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isCollapsed ? <ChevronRight className='w-5 h-5' /> : <ChevronLeft className='w-5 h-5' />}
        </motion.div>
      )
    }

    // Hamburger menu icon (3 lines)
    if (variant === 'hamburger') {
      return (
        <motion.div
          key={isCollapsed ? 'hamburger' : 'close'}
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='flex flex-col gap-1'
        >
          {isCollapsed ? (
            // Hamburger icon (3 horizontal lines)
            <>
              <div className='w-5 h-0.5 bg-current rounded-full' />
              <div className='w-5 h-0.5 bg-current rounded-full' />
              <div className='w-5 h-0.5 bg-current rounded-full' />
            </>
          ) : (
            <X className='w-5 h-5' />
          )}
        </motion.div>
      )
    }

    return (
      <motion.div
        key={isCollapsed ? 'expand' : 'collapse'}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isCollapsed ? <Menu className='w-5 h-5' /> : <X className='w-5 h-5' />}
      </motion.div>
    )
  }

  return (
    <motion.button
      whileHover={{
        scale: 1.05,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`
        group relative p-3 rounded-xl transition-all duration-300 
        border border-slate-600/30 hover:border-blue-400/40
        bg-slate-800/90 hover:bg-slate-700/90
        backdrop-blur-sm shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800
        ${isCollapsed ? 'text-slate-400' : 'text-slate-300'}
        hover:text-blue-300
      `}
      aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      aria-expanded={!isCollapsed}
    >
      {/* Background glow effect */}
      <div
        className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/10 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300'
      />

      {/* Icon container */}
      <div className='relative z-10'>{renderIcon()}</div>

      {/* Subtle shine effect */}
      <div
        className='absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 
                   -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700'
      />
    </motion.button>
  )
}

// Default export for index.ts re-export compatibility
export default SidebarToggleButton
