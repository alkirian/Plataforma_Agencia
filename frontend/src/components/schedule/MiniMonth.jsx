import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getCurrentDate, isToday } from '../../utils/dateHelpers';

/**
 * Mini calendario personalizado sin react-big-calendar
 * Evita conflictos y loops infinitos
 */
export const MiniMonth = ({ currentDate, onNavigate, events = [] }) => {
  // Generar días del mes
  const monthData = useMemo(() => {
    const date = currentDate || getCurrentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    // Primer y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0 = domingo)
    const startDayOfWeek = firstDay.getDay();

    // Días a mostrar (incluyendo días del mes anterior)
    const days = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Días del mes actual
    const todayDate = getCurrentDate();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      const isTodayDate = isToday(dayDate);

      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: isTodayDate,
      });
    }

    // Días del mes siguiente para completar la grilla (42 días = 6 semanas)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false,
      });
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
    ];
    const monthName = `${months[date.getMonth()]} de ${date.getFullYear()}`;

    return {
      monthName,
      days: days.slice(0, 42), // Exactamente 6 semanas
    };
  }, [currentDate]);

  // Obtener eventos para una fecha específica
  const getEventsForDate = date => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Navegación
  const navigateMonth = direction => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    onNavigate(newDate);
  };

  const goToToday = () => {
    onNavigate(getCurrentDate());
  };

  const handleDayClick = date => {
    onNavigate(date);
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='relative'
    >
      <div className='p-2.5'>
        {/* Header */}
        <div className='mb-2 pb-1'>
          <h3 className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>
            Navegación Rápida
          </h3>
        </div>

        {/* Navegación del mes */}
        <div className='flex items-center justify-between mb-2 px-0.5'>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(-1)}
            className='p-1 hover:bg-surface-soft rounded-md transition-all group'
          >
            <ChevronLeftIcon className='w-3.5 h-3.5 text-gray-400 group-hover:text-gray-200' />
          </motion.button>

          <span className='text-xs font-semibold text-gray-200 capitalize'>
            {monthData.monthName}
          </span>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(1)}
            className='p-1 hover:bg-surface-soft rounded-md transition-all group'
          >
            <ChevronRightIcon className='w-3.5 h-3.5 text-gray-400 group-hover:text-gray-200' />
          </motion.button>
        </div>

        {/* Días de la semana */}
        <div className='grid grid-cols-7 gap-0.5 mb-1.5 justify-items-center'>
          {dayNames.map(day => (
            <div key={day} className='text-center text-[10px] font-medium text-gray-400 py-0.5'>
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className='grid grid-cols-7 gap-0.5 justify-items-center'>
          {monthData.days.map((dayData, index) => {
            const dayEvents = getEventsForDate(dayData.date);
            const hasEvents = dayEvents.length > 0;

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(dayData.date)}
                className={`
                  relative w-7 h-7 text-[11px] font-medium rounded-md transition-all
                  ${
                    dayData.isCurrentMonth
                      ? 'text-gray-200 hover:bg-white/[0.04]'
                      : 'text-gray-500 hover:bg-white/[0.04]'
                  }
                  ${
                    dayData.isToday
                      ? 'bg-white/[0.08] text-white font-bold hover:bg-white/[0.1]'
                      : ''
                  }
                  ${hasEvents && !dayData.isToday ? 'text-accent-400 font-semibold' : ''}
                `}
              >
                {dayData.date.getDate()}

                {/* Indicadores de eventos sutiles */}
                {hasEvents && (
                  <div className='absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5'>
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <span
                        key={idx}
                        className={`w-0.5 h-0.5 rounded-full ${
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
                      <span className='w-0.5 h-0.5 bg-gray-400 rounded-full opacity-60' />
                    )}
                  </div>
                )}

                {/* Contador de eventos para días con muchas tareas */}
                {dayEvents.length > 3 && (
                  <span className='absolute top-0.5 right-0.5 text-[7px] text-accent-400 font-bold'>
                    {dayEvents.length}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Leyenda de estados */}
        <div className='mt-2 p-1.5'>
          <div className='text-[10px] text-gray-400 mb-1'>Estados:</div>
          <div className='grid grid-cols-2 gap-0.5 text-[9px]'>
            <div className='flex items-center space-x-1'>
              <span className='w-0.5 h-0.5 bg-orange-500 rounded-full'></span>
              <span className='text-gray-400'>Pendiente</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='w-0.5 h-0.5 bg-gray-600 rounded-full'></span>
              <span className='text-gray-400'>En Diseño</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='w-0.5 h-0.5 bg-green-500 rounded-full'></span>
              <span className='text-gray-400'>Aprobado</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span className='w-0.5 h-0.5 bg-gray-500 rounded-full'></span>
              <span className='text-gray-400'>Publicado</span>
            </div>
          </div>
        </div>

        {/* Botón "Ir a Hoy" */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={goToToday}
          className='w-full mt-2 py-1.5 bg-transparent hover:bg-white/[0.04]
                     text-gray-300 text-xs font-medium rounded-lg border border-transparent
                     hover:border-white/[0.055] transition-all duration-200'
        >
          Ir a Hoy
        </motion.button>
      </div>
    </motion.div>
  );
};
