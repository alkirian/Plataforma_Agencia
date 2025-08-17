import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Utilidad para formatear fechas en es-ES
const formatDayHeader = (date) => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });
};

const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const MonthAgenda = ({ events = [], currentDate, onEventClick, loading = false }) => {
  // Filtrar y ordenar eventos del mes actual
  const grouped = useMemo(() => {
    const result = new Map();
    const base = currentDate || new Date();

    const monthEvents = events
      .filter((e) => e.start && sameMonth(new Date(e.start), base))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    monthEvents.forEach((e) => {
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
      className="mt-4"
    >
      <div className="bg-surface-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg">
        <div className="mb-3 pb-2 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Agenda del mes</h3>
          <span className="text-xs text-gray-400">{grouped.reduce((acc, g) => acc + g.items.length, 0)} tareas</span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Cargando…</div>
        ) : grouped.length === 0 ? (
          <div className="text-sm text-gray-400">Sin tareas planificadas para este mes.</div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {grouped.map((group) => (
              <div key={group.date.toISOString()} className="mb-3">
                <div className="text-xs font-medium text-gray-400 mb-1 capitalize">
                  {formatDayHeader(group.date)}
                </div>
                <ul className="space-y-1.5">
                  {group.items.map((e) => {
                    const time = new Date(e.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const status = e.extendedProps?.status || 'pendiente';
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => onEventClick && onEventClick(e)}
                          className="w-full text-left group flex items-center gap-2 px-2 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: e.backgroundColor || 'var(--accent-500)' }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm text-gray-100 font-medium">{e.title}</span>
                              <span className="text-[10px] text-gray-400 tabular-nums">{time}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 capitalize">{status.replace('-', ' ')}</span>
                              {e.extendedProps?.originalData?.channel && (
                                <span className="text-[10px] text-accent-300/80 bg-accent-500/10 border border-accent-400/20 px-1.5 py-0.5 rounded">
                                  {e.extendedProps.originalData.channel}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
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
