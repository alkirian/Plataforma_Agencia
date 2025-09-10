import React from 'react'
import { motion } from 'framer-motion'
import { SidebarToggleButton } from './SidebarToggleButton'
import { QuickActions } from './QuickActions'
import { ViewFilters } from './ViewFilters'
import { MiniMonth } from '../calendar/MiniMonth'
import { MonthAgenda } from '../calendar/MonthAgenda'
import { getCurrentDate } from '@shared/utils/dateHelpers'

/**
 * Collapsible sidebar for Schedule section with smooth animations
 */
export const ScheduleSidebar = ({
  // Sidebar state
  isCollapsed,
  onToggle,
  isOverlay = false,

  // Calendar data
  currentDate,
  onDateChange,
  events = [],
  loading = false,

  // View state
  currentView,
  onViewChange,

  // Event handlers
  onNewEvent,
  onAIGenerate,
  onEventClick,

  // Statistics
  stats = { total: 0, byStatus: {} },
}) => {
  // Calculate edges like AI panel does
  const [edges, setEdges] = React.useState({ top: 72, bottom: 8 })

  React.useEffect(() => {
    const onResize = () => {
      const headerEl = document.querySelector('.header-cyber') || document.querySelector('header')
      const footerEl = document.querySelector('footer')
      const headerH = headerEl?.offsetHeight || 72
      const footerH = footerEl?.offsetHeight || 0
      setEdges({ top: headerH + 8, bottom: footerH + 8 })
    }
    if (typeof window !== 'undefined') {
      onResize()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }
  }, [])
  const sidebarVariants = {
    collapsed: {
      width: 60,
      opacity: 1,
    },
    expanded: {
      width: 320,
      opacity: 1,
    },
  }

  const contentVariants = {
    collapsed: {
      opacity: 0,
      scale: 0.8,
    },
    expanded: {
      opacity: 1,
      scale: 1,
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <>
      {/* Overlay backdrop for mobile */}
      {isOverlay && !isCollapsed && (
        <motion.div
          initial='hidden'
          animate='visible'
          exit='hidden'
          variants={overlayVariants}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial='collapsed'
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='fixed left-0 z-50 flex-shrink-0'
        style={{
          top: edges.top || 72,
          bottom: edges.bottom || 8,
          height: `calc(100vh - ${(edges.top || 72) + (edges.bottom || 8)}px)`,
        }}
      >
        <div
          className={`
            h-full bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95
            border-r border-slate-700/50 backdrop-blur-sm shadow-2xl
            ${isCollapsed ? 'overflow-hidden' : ''}
          `}
        >
          {/* Toggle Button - Always visible at edge */}
          <div className={`absolute ${isCollapsed ? 'right-3' : '-right-14'} top-6 z-10`}>
            <SidebarToggleButton
              isCollapsed={isCollapsed}
              onToggle={onToggle}
              variant='hamburger'
            />
          </div>

          {/* Collapsed State - Icons Only */}
          {isCollapsed && !isOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='p-4 space-y-6 h-full flex flex-col justify-center'
            >
              {/* Quick Actions - Collapsed */}
              <QuickActions
                onNewEvent={onNewEvent}
                onAIGenerate={onAIGenerate}
                isCollapsed={true}
              />
            </motion.div>
          )}

          {/* Expanded State - Full Content */}
          {!isCollapsed && (
            <motion.div
              initial='collapsed'
              animate='expanded'
              variants={contentVariants}
              transition={{ duration: 0.4, delay: 0.1 }}
              className='p-6 h-full overflow-y-auto custom-scrollbar'
            >
              {/* Header */}
              <div className='mb-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-3 h-3 bg-blue-400 rounded-full animate-pulse' />
                  <h2 className='text-xl font-bold text-white'>Panel de Control</h2>
                </div>
                <p className='text-sm text-slate-400'>Gestiona tu cronograma de contenidos</p>
              </div>

              {/* Quick Actions */}
              <div className='mb-8'>
                <div className='text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2'>
                  <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
                  Acciones Rápidas
                </div>
                <QuickActions
                  onNewEvent={onNewEvent}
                  onAIGenerate={onAIGenerate}
                  isCollapsed={false}
                />
              </div>

              {/* Statistics Cards */}
              <div className='mb-8'>
                <div className='text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2'>
                  <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse' />
                  Estadísticas
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-4 rounded-lg border border-slate-600/30'>
                    <div className='text-2xl font-bold text-blue-300'>{stats.total}</div>
                    <div className='text-xs text-slate-400'>Total</div>
                  </div>

                  <div className='bg-gradient-to-br from-amber-900/20 to-amber-800/20 p-4 rounded-lg border border-amber-600/30'>
                    <div className='text-2xl font-bold text-amber-300'>
                      {stats.byStatus.pendiente || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Pendientes</div>
                  </div>

                  <div className='bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 p-4 rounded-lg border border-emerald-600/30'>
                    <div className='text-2xl font-bold text-emerald-300'>
                      {stats.byStatus.aprobado || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Aprobados</div>
                  </div>

                  <div className='bg-gradient-to-br from-green-900/20 to-green-800/20 p-4 rounded-lg border border-green-600/30'>
                    <div className='text-2xl font-bold text-green-300'>
                      {stats.byStatus.publicado || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Publicados</div>
                  </div>
                </div>
              </div>

              {/* Mini Calendar */}
              <div className='mb-6'>
                <MiniMonth
                  currentDate={currentDate || getCurrentDate()}
                  onNavigate={onDateChange}
                  events={events}
                />
              </div>

              {/* Month Agenda */}
              <div>
                <MonthAgenda
                  events={events}
                  currentDate={currentDate || getCurrentDate()}
                  loading={loading}
                  onEventClick={onEventClick}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

// Default export for index.ts re-export compatibility
export default ScheduleSidebar
