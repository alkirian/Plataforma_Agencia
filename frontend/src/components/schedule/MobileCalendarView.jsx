import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendarSwipe } from '../../hooks/useSwipeGestures';

export const MobileCalendarView = ({ 
  events = [], 
  selectedDate, 
  onDateSelect, 
  onEventClick,
  onAddEvent 
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Configurar gestos de swipe para navegación
  const swipeHandlers = useCalendarSwipe({
    onPrevious: () => navigateMonth(-1),
    onNext: () => navigateMonth(1)
  });

  const getEventsForDay = (date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), date)
    );
  };

  const EventDot = ({ event }) => (
    <div 
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: event.color || '#60A5FA' }}
      title={event.title}
    />
  );

  return (
    <div 
      ref={swipeHandlers.ref}
      className="bg-surface-soft/80 backdrop-blur-xl rounded-xl border border-[color:var(--color-border-subtle)] overflow-hidden touch-pan-y"
    >
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--color-border-subtle)] bg-surface-strong/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-3 rounded-lg bg-surface-soft hover:bg-white/10 transition-colors touch-target"
              aria-label="Mes anterior"
            >
              <ChevronLeftIcon className="h-5 w-5 text-text-primary" />
            </button>
            
            <h2 className="text-lg font-semibold text-text-primary">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-3 rounded-lg bg-surface-soft hover:bg-white/10 transition-colors touch-target"
              aria-label="Mes siguiente"
            >
              <ChevronRightIcon className="h-5 w-5 text-text-primary" />
            </button>
          </div>

          <button
            onClick={onAddEvent}
            className="p-3 rounded-lg bg-gradient-to-r from-[var(--color-accent-blue)]/20 to-[var(--color-accent-violet)]/20 border border-[color:var(--color-border-subtle)] touch-target"
            aria-label="Nuevo evento"
          >
            <PlusIcon className="h-5 w-5 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
            <div
              key={index}
              className="h-8 flex items-center justify-center text-xs font-medium text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <motion.button
                key={index}
                onClick={() => onDateSelect(day)}
                className={`
                  relative h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-200 touch-target
                  ${isSelected 
                    ? 'bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)]/50 text-text-primary' 
                    : 'hover:bg-white/5'
                  }
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isTodayDate ? 'ring-1 ring-[var(--color-accent-blue)]/50' : ''}
                `}
                whileTap={{ scale: 0.95 }}
                aria-label={`${format(day, 'd MMMM yyyy', { locale: es })}${dayEvents.length > 0 ? ` - ${dayEvents.length} eventos` : ''}`}
              >
                <span className={`text-sm font-medium ${
                  isTodayDate ? 'text-[var(--color-accent-blue)]' : 
                  isCurrentMonth ? 'text-text-primary' : 'text-text-muted'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex space-x-0.5 mt-0.5 max-w-full overflow-hidden">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <EventDot key={eventIndex} event={event} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-[var(--color-accent-blue)] font-medium">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[color:var(--color-border-subtle)] bg-surface-strong/30"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                {format(selectedDate, 'd MMMM yyyy', { locale: es })}
              </h3>
              
              {getEventsForDay(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).map((event, index) => (
                    <motion.button
                      key={index}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left p-3 rounded-lg bg-surface-soft hover:bg-white/5 transition-colors border border-[color:var(--color-border-subtle)]"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color || '#60A5FA' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {event.title}
                          </div>
                          {event.start && (
                            <div className="text-xs text-text-muted">
                              {format(new Date(event.start), 'HH:mm')}
                              {event.end && ` - ${format(new Date(event.end), 'HH:mm')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No hay eventos para este día</p>
                  <button
                    onClick={onAddEvent}
                    className="mt-2 text-sm text-[var(--color-accent-blue)] hover:underline"
                  >
                    Crear evento
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};