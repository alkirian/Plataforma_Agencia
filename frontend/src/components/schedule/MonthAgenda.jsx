import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Helpers
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const formatDateTime = (date) =>
  date.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

const statusStyles = (statusRaw) => {
  const s = (statusRaw || '').toLowerCase();
  const base = 'px-2 py-0.5 text-[10px] font-medium rounded border';
  switch (s) {
    case 'aprobado':
      return `${base} bg-green-500/10 border-green-400/20 text-green-300`;
    case 'publicado':
      return `${base} bg-emerald-500/10 border-emerald-400/20 text-emerald-300`;
    case 'pendiente':
      return `${base} bg-orange-500/10 border-orange-400/20 text-orange-300`;
    case 'en-diseño':
    case 'en-diseno':
      return `${base} bg-gray-500/10 border-gray-400/20 text-gray-300`;
    case 'en-progreso':
      return `${base} bg-blue-500/10 border-blue-400/20 text-blue-300`;
    case 'en-revision':
    case 'en-revisión':
      return `${base} bg-indigo-500/10 border-indigo-400/20 text-indigo-300`;
    case 'cancelado':
      return `${base} bg-red-500/10 border-red-400/20 text-red-300`;
    default:
      return `${base} bg-accent-500/10 border-accent-400/20 text-accent-300`;
  }
};

export const MonthAgenda = ({ events = [], currentDate, onEventClick, loading = false }) => {
  // Filtrar, ordenar y mapear eventos del mes actual a filas de tabla
  const rows = useMemo(() => {
    const base = currentDate || new Date();
    return (events || [])
      .filter((e) => e?.start && sameMonth(new Date(e.start), base))
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map((e) => {
        const start = new Date(e.start);
        const description = e.extendedProps?.description || e.extendedProps?.originalData?.description || '';
        const channel = e.extendedProps?.channel || e.extendedProps?.originalData?.channel || '';
        const status = e.extendedProps?.status || 'pendiente';
        return {
          id: e.id,
          fecha: formatDateTime(start),
          copy: description,
          media: channel,
          estado: status,
          original: e
        };
      });
  }, [events, currentDate]);

  const total = rows.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-4"
    >
      <div className="bg-surface-900/70 border border-[color:var(--color-border-subtle)] rounded-xl p-4 shadow-lg">
        <div className="mb-3 pb-2 border-b border-[color:var(--color-border-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Cronograma del mes</h3>
          <span className="text-xs text-text-muted">{total} {total === 1 ? 'tarea' : 'tareas'}</span>
        </div>

        {loading ? (
          <div className="text-sm text-text-muted">Cargando…</div>
        ) : total === 0 ? (
          <div className="text-sm text-text-muted">Sin tareas planificadas para este mes.</div>
        ) : (
          <div className="max-h-[520px] overflow-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-800/60 border-b border-[color:var(--color-border-subtle)]">
                  <th scope="col" className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-2 py-2">Fecha</th>
                  <th scope="col" className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-2 py-2">Copy</th>
                  <th scope="col" className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-2 py-2">Media</th>
                  <th scope="col" className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-2 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[color:var(--color-border-subtle)] hover:bg-surface-800/40 transition-colors">
                    <td className="px-2 py-2 align-top whitespace-nowrap text-text-primary/90">{row.fecha}</td>
                    <td className="px-2 py-2 align-top max-w-[220px]">
                      <button
                        onClick={() => onEventClick && onEventClick(row.original)}
                        className="text-left text-text-primary hover:text-white transition-colors"
                        title={row.copy || row.original?.title || ''}
                      >
                        <div className="truncate">
                          {row.copy?.trim() ? row.copy : (row.original?.title || '')}
                        </div>
                      </button>
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.media ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-accent-500/10 border border-accent-400/20 text-accent-300">
                          {row.media}
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <span className={statusStyles(row.estado)}>
                        {String(row.estado || '').replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MonthAgenda;

