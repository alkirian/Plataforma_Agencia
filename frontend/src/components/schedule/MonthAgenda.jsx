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
      className="mt-2 border-t border-border-subtle"
    >
      <div className="p-2.5">
        <div className="mb-2 pb-1 flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-primary">Agenda del mes</h3>
          <span className="text-[10px] text-text-secondary">{grouped.reduce((acc, g) => acc + g.items.length, 0)} tareas</span>
        </div>

        {loading ? (
          <div className="text-xs text-text-secondary animate-pulse">Cargando...</div>
        ) : grouped.length === 0 ? (
          <div className="text-xs text-text-secondary">Sin tareas planificadas para este mes.</div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {grouped.map((group) => (
              <div key={group.date.toISOString()} className="mb-2.5">
                <div className="text-[10px] font-bold text-text-muted mb-1 capitalize">
                  {formatDayHeader(group.date)}
                </div>
                <ul className="space-y-1">
                  {group.items.map((e) => {
                    const time = new Date(e.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const status = e.extendedProps?.status || 'pendiente';
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => onEventClick && onEventClick(e)}
                          className="w-full text-left group flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-transparent bg-transparent hover:bg-surface-soft transition-colors"
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: e.backgroundColor || 'var(--color-accent-sage)' }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-text-primary font-semibold">{e.title}</span>
                              <span className="text-[9px] text-text-secondary tabular-nums">{time}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[9px] text-text-muted capitalize">{status.replace('-', ' ')}</span>
                              {e.extendedProps?.originalData?.channel && (
                                <span className="text-[9px] text-text-primary bg-surface border border-border-subtle px-1 py-0.5 rounded font-mono font-medium scale-90">
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
