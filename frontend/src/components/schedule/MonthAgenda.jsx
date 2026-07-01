import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Utilidad para formatear fechas en es-ES
const formatDayHeader = date => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
};

const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const isToday = (dateInput) => {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const MonthAgenda = ({ events = [], currentDate, onEventClick, loading = false, onPublish }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calcular el total de eventos del mes antes de filtrar (para el Empty State proactivo)
  const monthEventsTotal = useMemo(() => {
    const base = currentDate || new Date();
    return events.filter(e => e.start && sameMonth(new Date(e.start), base)).length;
  }, [events, currentDate]);

  // Filtrar y ordenar eventos del mes actual de forma reactiva
  const grouped = useMemo(() => {
    const result = new Map();
    const base = currentDate || new Date();

    let filteredEvents = events.filter(e => e.start && sameMonth(new Date(e.start), base));

    // 1. Filtrar por búsqueda de texto (Título o Copy)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredEvents = filteredEvents.filter(e => 
        e.title?.toLowerCase().includes(query) || 
        e.extendedProps?.copy?.toLowerCase().includes(query)
      );
    }

    // 2. Filtrar por estado de la publicación
    if (statusFilter !== 'all') {
      filteredEvents = filteredEvents.filter(e => {
        const status = (e.extendedProps?.status || 'pendiente').toLowerCase();
        if (statusFilter === 'diseño') {
          return status === 'en-diseño' || status === 'en-diseno' || status === 'pendiente';
        }
        if (statusFilter === 'progreso') {
          return status === 'en-progreso' || status === 'en-revision' || status === 'esperando-aprobacion';
        }
        if (statusFilter === 'aprobado') {
          return status === 'aprobado' || status === 'publicado';
        }
        return true;
      });
    }

    // Ordenar por fecha cronológicamente
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    filteredEvents.forEach(e => {
      const d = new Date(e.start);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!result.has(key)) result.set(key, { date: d, items: [] });
      result.get(key).items.push(e);
    });

    // Convertir a array ordenado por fecha
    return Array.from(result.values()).sort((a, b) => a.date - b.date);
  }, [events, currentDate, searchQuery, statusFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='w-full'
    >
      <div className='p-3 space-y-4'>
        {/* Cabecera de la Agenda */}
        <div className='pb-2 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5'>
          <h3 className='text-sm font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse'></span>
            <span>Agenda del Mes</span>
          </h3>
          <span className='text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-gray-400'>
            {monthEventsTotal} tareas
          </span>
        </div>

        {/* Buscador y Barra de Filtros (Solo visibles si hay eventos en el mes) */}
        {monthEventsTotal > 0 && (
          <div className='space-y-2 bg-slate-100/70 dark:bg-[#1e1c20]/20 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5'>
            {/* Input de Búsqueda */}
            <div className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Buscar publicación...'
                className='w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/40 pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-rose-500/40 focus:outline-none transition-all shadow-xs'
              />
              <svg
                className='absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 dark:text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='absolute right-2 top-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-white p-0.5 text-xs font-bold'
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de Filtro de Estado */}
            <div className='flex gap-1 overflow-x-auto pb-0.5 scrollbar-none custom-scrollbar'>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'diseño', label: 'Diseño' },
                { id: 'progreso', label: 'Producción' },
                { id: 'aprobado', label: 'Aprobados' },
              ].map(filter => (
                <button
                  key={filter.id}
                  type='button'
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-md px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 flex-shrink-0 ${
                    statusFilter === filter.id
                      ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/25'
                      : 'bg-white/60 dark:bg-black/35 hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200/50 dark:border-transparent hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listado de la Agenda */}
        {loading ? (
          <div className='flex items-center gap-2 text-xs text-gray-400 animate-pulse py-8 justify-center'>
            <span className='h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent' />
            <span>Cargando agenda...</span>
          </div>
        ) : monthEventsTotal === 0 ? (
          /* Empty State Proactivo con Lanzador de IA */
          <div className='p-5 text-center rounded-2xl bg-gradient-to-b from-slate-50 dark:from-white/[0.03] to-transparent border border-dashed border-slate-200 dark:border-white/10 space-y-4 my-2 backdrop-blur-xs'>
            <div className='w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-500 dark:text-amber-400 animate-pulse'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9.75 3.75 11 7l3.25 1.25L11 9.5l-1.25 3.25L8.5 9.5 5.25 8.25 8.5 7l1.25-3.25ZM17 12l.8 2.2L20 15l-2.2.8L17 18l-.8-2.2L14 15l2.2-.8L17 12Z'
                />
              </svg>
            </div>
            <div className='space-y-1.5'>
              <p className='text-xs font-bold text-slate-800 dark:text-white tracking-wide'>¿Lienzo en blanco?</p>
              <p className='text-[10px] text-slate-500 dark:text-gray-400 leading-relaxed max-w-[170px] mx-auto'>
                Deja que Ares diseñe una propuesta estratégica de contenidos para todo el mes con un clic.
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('cadence:calendar-action', { detail: { action: 'ai-gen' } })
                );
              }}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-black text-[10px] font-extrabold transition-all duration-200 shadow-lg'
            >
              <span>Generar con IA</span>
            </button>
          </div>
        ) : grouped.length === 0 ? (
          /* Sin resultados por el filtro */
          <div className='text-xs text-slate-500 dark:text-gray-500 py-8 text-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/5 space-y-2.5'>
            <p>No se encontraron resultados.</p>
            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className='text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest hover:underline'
            >
              Limpiar Filtros
            </button>
          </div>
        ) : (
          /* Listado con Cards Premium y Micro-Animaciones */
          <div className='space-y-4 pr-1 max-h-[calc(100dvh-15.5rem)] overflow-y-auto custom-scrollbar'>
            {grouped.map(group => (
              <div key={group.date.toISOString()} className='space-y-2'>
                <div className='text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest pl-1 font-mono'>
                  {formatDayHeader(group.date)}
                </div>
                <ul className='space-y-2'>
                  {group.items.map(e => {
                    const time = new Date(e.start).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const status = e.extendedProps?.status || 'pendiente';
                    const hasFeedback = !!e.extendedProps?.client_feedback;

                    // Estilo de tarjeta normal o destacado con bordes rosa si tiene ajustes del cliente
                    const cardStyles = hasFeedback
                      ? 'border-[#fe0979]/30 bg-[#fe0979]/5 hover:bg-[#fe0979]/10 shadow-[0_2px_12px_rgba(254,9,121,0.08)] hover:border-[#fe0979]/50'
                      : 'border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#1e1c20]/30 hover:bg-white dark:hover:bg-[#1e1c20]/65 hover:border-slate-350 dark:hover:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)]';

                    return (
                      <li key={e.id}>
                        <motion.button
                          whileHover={{ x: 2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onEventClick && onEventClick(e)}
                          className={`w-full text-left group flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 ${cardStyles}`}
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
                              <span className='text-xs text-slate-700 dark:text-gray-200 font-bold group-hover:text-slate-900 group-hover:dark:text-white transition-colors line-clamp-2 leading-snug'>
                                {e.title}
                              </span>
                            </div>
                            <span className='text-[9px] text-slate-500 dark:text-gray-400 font-mono flex-shrink-0 bg-slate-100 dark:bg-white/5 rounded-md px-1.5 py-0.5 leading-none mt-0.5'>
                              {time}
                            </span>
                          </div>

                          <div className='flex items-center justify-between gap-2 pl-3.5 border-t border-slate-100 dark:border-white/[0.03] pt-1.5 mt-0.5 w-full'>
                            <div className='flex items-center gap-1.5'>
                              <span className='text-[8px] font-bold tracking-wider text-slate-400 dark:text-gray-400 uppercase font-mono'>
                                {status.replace('-', ' ')}
                              </span>
                              {hasFeedback && (
                                <span className='text-[7px] text-[#fe0979] bg-[#fe0979]/15 border border-[#fe0979]/30 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide animate-pulse'>
                                  💬 Ajuste
                                </span>
                              )}
                              {isToday(e.start) && status.toLowerCase() !== 'publicado' && onPublish && (
                                <button
                                  type='button'
                                  onClick={(evt) => {
                                    evt.stopPropagation();
                                    onPublish(e.id);
                                  }}
                                  className='text-[9px] font-extrabold text-white bg-rose-500 hover:bg-rose-600 px-2 py-0.5 rounded-md transition-all shadow-xs cursor-pointer flex items-center gap-1 animate-pulse hover:animate-none ml-1'
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  <span>Publicar</span>
                                </button>
                              )}
                            </div>
                            {e.extendedProps?.originalData?.channel && (
                              <span className='text-[8px] text-rose-500 dark:text-rose-300 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 px-1.5 py-0.5 rounded-md font-sans font-bold scale-90 uppercase tracking-widest'>
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
