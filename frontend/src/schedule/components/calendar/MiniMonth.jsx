import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentDate, isToday } from '@shared/utils/dateHelpers'

/**
 * Mini calendario personalizado sin react-big-calendar
 * Evita conflictos y loops infinitos
 */
export const MiniMonth = ({ currentDate, onNavigate, events = [] }) => {
  // Generar días del mes
  const monthData = useMemo(() => {
    const date = currentDate || getCurrentDate()
    const year = date.getFullYear()
    const month = date.getMonth()

    // Primer y último día del mes
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Día de la semana del primer día (0 = domingo)
    const startDayOfWeek = firstDay.getDay()

    // Días a mostrar (incluyendo días del mes anterior)
    const days = []

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    // Días del mes actual
    const todayDate = getCurrentDate()
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day)
      const isTodayDate = isToday(dayDate)

      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: isTodayDate,
      })
    }

    // Días del mes siguiente para completar la grilla (42 días = 6 semanas)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ]
    const monthName = `${months[date.getMonth()]} de ${date.getFullYear()}`

    return {
      monthName,
      days: days.slice(0, 42), // Exactamente 6 semanas
    }
  }, [currentDate])

  // Obtener eventos para una fecha específica
  const getEventsForDate = date => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }

  // Navegación
  const navigateMonth = direction => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    onNavigate(newDate)
  }

  const goToToday = () => {
    onNavigate(getCurrentDate())
  }

  const handleDayClick = date => {
    onNavigate(date)
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='relative'
    >
      <div
        className='bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-800/95 
                   border border-slate-600/30 rounded-xl p-6 shadow-xl backdrop-blur-sm
                   ring-1 ring-white/5'
      >
        {/* Enhanced Header */}
        <div className='mb-6 pb-4 border-b border-slate-600/40'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
            <h3 className='text-sm font-bold text-slate-300 uppercase tracking-wide'>
              Navegación Rápida
            </h3>
          </div>
        </div>

        {/* Enhanced month navigation */}
        <div className='flex items-center justify-between mb-4 px-1'>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(-1)}
            className='p-2 hover:bg-blue-500/10 rounded-lg transition-all group border border-transparent hover:border-blue-400/20'
          >
            <ChevronLeft className='w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors' />
          </motion.button>

          <span className='text-base font-bold text-slate-100 capitalize px-4 py-2 bg-slate-700/50 rounded-lg backdrop-blur-sm'>
            {monthData.monthName}
          </span>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(1)}
            className='p-2 hover:bg-blue-500/10 rounded-lg transition-all group border border-transparent hover:border-blue-400/20'
          >
            <ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors' />
          </motion.button>
        </div>

        {/* Enhanced day headers */}
        <div className='grid grid-cols-7 gap-1 mb-3'>
          {dayNames.map(day => (
            <div
              key={day}
              className='text-center text-xs font-bold text-slate-400 py-2 uppercase tracking-wide'
            >
              {day.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className='grid grid-cols-7 gap-1'>
          {monthData.days.map((dayData, index) => {
            const dayEvents = getEventsForDate(dayData.date)
            const hasEvents = dayEvents.length > 0

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleDayClick(dayData.date)}
                className={`
                  relative w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200
                  border border-transparent hover:border-blue-400/20
                  ${
                    dayData.isCurrentMonth
                      ? 'text-slate-200 hover:bg-blue-500/10 hover:text-blue-300'
                      : 'text-slate-500 hover:bg-slate-600/30 hover:text-slate-400'
                  }
                  ${
                    dayData.isToday
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25'
                      : ''
                  }
                  ${
                    hasEvents && !dayData.isToday
                      ? 'text-blue-300 font-bold ring-1 ring-blue-400/30 bg-blue-500/5'
                      : ''
                  }
                `}
              >
                {dayData.date.getDate()}

                {/* Indicadores de eventos sutiles */}
                {hasEvents && (
                  <div className='absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5'>
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <span
                        key={idx}
                        className={`w-1 h-1 rounded-full ${
                          event.extendedProps?.status === 'Pendiente'
                            ? 'bg-orange-500'
                            : event.extendedProps?.status === 'En Diseño'
                              ? 'bg-gray-600'
                              : event.extendedProps?.status === 'Aprobado'
                                ? 'bg-green-500'
                                : event.extendedProps?.status === 'Publicado'
                                  ? 'bg-gray-500'
                                  : 'bg-accent-500'
                        }`}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className='w-1 h-1 bg-gray-400 rounded-full opacity-60' />
                    )}
                  </div>
                )}

                {/* Contador de eventos para días con muchas tareas */}
                {dayEvents.length > 3 && (
                  <span className='absolute top-0.5 right-0.5 text-[8px] text-accent-400 font-bold'>
                    {dayEvents.length}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Enhanced status legend */}
        <div className='mt-4 p-4 bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-lg border border-slate-600/30 backdrop-blur-sm'>
          <div className='text-sm text-slate-300 mb-3 font-semibold'>Estados:</div>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='flex items-center space-x-2'>
              <span className='w-2 h-2 bg-amber-500 rounded-full shadow-sm' />
              <span className='text-slate-300'>Pendiente</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='w-2 h-2 bg-blue-500 rounded-full shadow-sm' />
              <span className='text-slate-300'>En Diseño</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='w-2 h-2 bg-emerald-500 rounded-full shadow-sm' />
              <span className='text-slate-300'>Aprobado</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='w-2 h-2 bg-green-500 rounded-full shadow-sm' />
              <span className='text-slate-300'>Publicado</span>
            </div>
          </div>
        </div>

        {/* Enhanced "Go to Today" button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={goToToday}
          className='w-full mt-4 py-3 bg-gradient-to-r from-blue-600/80 to-blue-700/80 
                     hover:from-blue-500/80 hover:to-blue-600/80 text-white text-sm font-semibold 
                     rounded-lg border border-blue-500/30 hover:border-blue-400/50 
                     transition-all duration-200 backdrop-blur-sm shadow-lg shadow-blue-600/20
                     flex items-center justify-center gap-2'
        >
          <span>📅</span>
          Ir a Hoy
        </motion.button>
      </div>
    </motion.div>
  )
}
