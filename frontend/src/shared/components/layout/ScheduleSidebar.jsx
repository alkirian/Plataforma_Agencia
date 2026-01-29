import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Menu, X, Calendar, Sparkles } from 'lucide-react'
import { getCurrentDate } from '@shared/utils/dateHelpers'

// Import schedule components
import { MonthAgenda } from '@schedule/components/calendar/MonthAgenda'

/**
 * Global Schedule Sidebar that overlays the entire application
 * Only shows on schedule/client detail pages
 */
export const ScheduleSidebar = ({ clientId, currentClient }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(72)

  // Only show sidebar on client detail pages (which have the schedule)
  const shouldShowSidebar = location.pathname.includes('/clients/')

  // Calculate header height dynamically
  useEffect(() => {
    const calculateHeaderHeight = () => {
      const headerEl = document.querySelector('header') || document.querySelector('.header-cyber')
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight)
      }
    }

    calculateHeaderHeight()
    window.addEventListener('resize', calculateHeaderHeight)
    return () => window.removeEventListener('resize', calculateHeaderHeight)
  }, [])

  // Load events for the client
  useEffect(() => {
    if (!clientId || !shouldShowSidebar) return

    const loadEvents = async () => {
      setLoading(true)
      try {
        // TODO: Import and use useCalendarEvents hook or API call
        // For now, empty array
        setEvents([])
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [clientId, shouldShowSidebar])

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = events.length
    const byStatus = {}

    events.forEach(event => {
      const status = event.resource?.status || event.status || 'pendiente'
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    return { total, byStatus }
  }, [events])

  // Don't render if not on schedule pages
  if (!shouldShowSidebar) return null

  return (
    <>
      {/* Hamburger Button - Always visible on left edge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed left-4 z-[35] p-3 rounded-xl
          bg-slate-800/90 hover:bg-slate-700/90
          border border-slate-600/30 hover:border-blue-400/40
          backdrop-blur-sm shadow-lg
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-blue-400/50
          ${isOpen ? 'text-blue-300' : 'text-slate-300'}
        `}
        style={{ top: `${headerHeight + 16}px` }}
        aria-label={isOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
      >
        <motion.div
          key={isOpen ? 'close' : 'menu'}
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
        </motion.div>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='fixed left-0 w-80 z-[30] 
                       bg-slate-900/95
                       border-r border-slate-700/50 backdrop-blur-sm shadow-2xl'
            style={{
              top: `${headerHeight}px`,
              bottom: '0px',
              height: `calc(100vh - ${headerHeight}px)`,
            }}
          >
            <div className='h-full overflow-y-auto custom-scrollbar'>
              {/* Header */}
              <div className='p-4 border-b border-slate-700/50'>
                <div className='flex items-center gap-2 mb-3'>
                  <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
                  <h2 className='text-sm font-bold text-white'>Cronograma</h2>
                </div>
                {currentClient && (
                  <div className='flex items-center gap-2'>
                    <span className='w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse' />
                    <p className='text-white font-medium text-xs'>{currentClient.name}</p>
                    <span className='text-gray-500 text-xs'>•</span>
                    <p className='text-gray-400 text-xs'>{stats.total} eventos</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className='p-3 border-b border-slate-700/50'>
                <div className='text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5'>
                  <div className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse' />
                  Acciones
                </div>

                <div className='space-y-2'>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full p-2 rounded-lg bg-blue-600/80
                               text-white text-xs font-medium border border-blue-500/30
                               hover:bg-blue-600/90
                               transition-all duration-200 flex items-center gap-2'
                  >
                    <Calendar className='w-3.5 h-3.5' />
                    Nuevo Evento
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full p-2 rounded-lg bg-purple-600/80
                               text-white text-xs font-medium border border-purple-500/30
                               hover:bg-purple-600/90
                               transition-all duration-200 flex items-center gap-2'
                  >
                    <Sparkles className='w-3.5 h-3.5' />
                    IA
                  </motion.button>
                </div>
              </div>

              {/* Statistics */}
              <div className='p-3 border-b border-slate-700/50'>
                <div className='text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5'>
                  <div className='w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse' />
                  Stats
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div className='bg-slate-800/60 p-2 rounded-md border border-slate-600/30'>
                    <div className='text-sm font-bold text-blue-300'>{stats.total}</div>
                    <div className='text-xs text-slate-400'>Total</div>
                  </div>

                  <div className='bg-amber-900/20 p-2 rounded-md border border-amber-600/30'>
                    <div className='text-sm font-bold text-amber-300'>
                      {stats.byStatus.pendiente || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Pendientes</div>
                  </div>

                  <div className='bg-emerald-900/20 p-2 rounded-md border border-emerald-600/30'>
                    <div className='text-sm font-bold text-emerald-300'>
                      {stats.byStatus.aprobado || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Aprobados</div>
                  </div>

                  <div className='bg-green-900/20 p-2 rounded-md border border-green-600/30'>
                    <div className='text-sm font-bold text-green-300'>
                      {stats.byStatus.publicado || 0}
                    </div>
                    <div className='text-xs text-slate-400'>Publicados</div>
                  </div>
                </div>
              </div>

              {/* Month Agenda */}
              <div className='p-3'>
                <div className='text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5'>
                  <div className='w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse' />
                  Agenda
                </div>
                <div className='text-xs'>
                  <MonthAgenda
                    events={events}
                    currentDate={currentDate}
                    loading={loading}
                    onEventClick={() => {}} // TODO: Implement event click handler
                  />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
