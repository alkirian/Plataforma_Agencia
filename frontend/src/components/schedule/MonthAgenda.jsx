import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Utilidad para formatear fechas en es-ES
const formatDayHeader = date => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
};

const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const MonthAgenda = ({ events = [], currentDate, onEventClick, loading = false }) => {
  // Filtrar y ordenar eventos del mes actual
  const grouped = useMemo(() => {
    const result = new Map();
    const base = currentDate || new Date();

    const monthEvents = events
      .filter(e => e.start && sameMonth(new Date(e.start), base))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    monthEvents.forEach(e => {
      const d = new Date(e.start);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!result.has(key)) result.set(key, { date: d, items: [] });
      result.get(key).items.push(e);
    });

    // Convertir a array ordenado por fecha
    return Array.from(result.values()).sort((a, b) => a.date - b.date);
  }, [events, currentDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='w-full'
    >
      <div className='p-3'>
        <div className='mb-4 pb-2 flex items-center justify-between border-b border-white/5'>
          <h3 className='text-sm font-bold text-white tracking-tight flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse'></span>
            <span>Agenda del Mes</span>
          </h3>
          <span className='text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400'>
            {grouped.reduce((acc, g) => acc + g.items.length, 0)} tareas
          </span>
        </div>

        {loading ? (
          <div className='flex items-center gap-2 text-xs text-gray-400 animate-pulse py-4 justify-center'>
            <span className='h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent' />
            <span>Cargando agenda...</span>
          </div>
        ) : grouped.length === 0 ? (
          <div className='text-xs text-gray-500 py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5'>
            Sin tareas planificadas para este mes.
          </div>
        ) : (
          <div className='space-y-4 pr-1'>
            {grouped.map(group => (
              <div key={group.date.toISOString()} className='space-y-2'>
                <div className='text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono'>
                  {formatDayHeader(group.date)}
                </div>
                <ul className='space-y-2'>
                  {group.items.map(e => {
                    const time = new Date(e.start).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const status = e.extendedProps?.status || 'pendiente';
                    return (
                      <li key={e.id}>
                        <motion.button
                          whileHover={{ x: 2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onEventClick && onEventClick(e)}
                          className='w-full text-left group flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#1e1c20]/30 hover:bg-[#1e1c20]/65 hover:border-white/10 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                        >
                          <div className='flex items-start justify-between gap-3 w-full'>
                            <div className='flex items-start gap-2 min-w-0'>
                              <span
                                className='inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_currentColor]'
                                style={{
                                  backgroundColor: e.backgroundColor || 'var(--color-accent-sage)',
                                  color: e.backgroundColor || 'var(--color-accent-sage)',
                                }}
                                aria-hidden
                              />
                              <span className='text-xs text-gray-200 font-bold group-hover:text-white transition-colors line-clamp-2 leading-snug'>
                                {e.title}
                              </span>
                            </div>
                            <span className='text-[9px] text-gray-400 font-mono flex-shrink-0 bg-white/5 rounded-md px-1.5 py-0.5 leading-none mt-0.5'>
                              {time}
                            </span>
                          </div>

                          <div className='flex items-center justify-between gap-2 pl-3.5 border-t border-white/[0.03] pt-1.5 mt-0.5 w-full'>
                            <span className='text-[8px] font-bold tracking-wider text-gray-400 uppercase font-mono'>
                              {status.replace('-', ' ')}
                            </span>
                            {e.extendedProps?.originalData?.channel && (
                              <span className='text-[8px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md font-sans font-bold scale-90 uppercase tracking-widest'>
                                {e.extendedProps.originalData.channel}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MonthAgenda;
