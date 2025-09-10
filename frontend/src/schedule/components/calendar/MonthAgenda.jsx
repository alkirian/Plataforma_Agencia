import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { StatusBadge } from '@components/ui/Badge'

// Helpers
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
const formatDateTime = date =>
  date.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const getStatusConfig = statusRaw => {
  const s = (statusRaw || '').toLowerCase()
  switch (s) {
    case 'approved':
    case 'aprobado':
    case 'published':
    case 'publicado':
      return { status: 'completed', label: String(statusRaw || '').replace('-', ' ') }
    case 'pending':
    case 'pendiente':
      return { status: 'pending', label: String(statusRaw || '').replace('-', ' ') }
    case 'en-diseño':
    case 'en-diseno':
    case 'en-progreso':
    case 'en-revision':
    case 'en-revisión':
      return { status: 'active', label: String(statusRaw || '').replace('-', ' ') }
    case 'cancelado':
      return { status: 'failed', label: String(statusRaw || '').replace('-', ' ') }
    default:
      return { status: 'draft', label: String(statusRaw || '').replace('-', ' ') }
  }
}

export const MonthAgenda = ({ events = [], currentDate, onEventClick, loading = false }) => {
  // Filtrar, ordenar y mapear eventos del mes actual a filas de tabla
  const rows = useMemo(() => {
    const base = currentDate || new Date()
    return (events || [])
      .filter(e => e?.start && sameMonth(new Date(e.start), base))
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map(e => {
        const start = new Date(e.start)
        const description =
          e.extendedProps?.description || e.extendedProps?.originalData?.description || ''
        const channel = e.extendedProps?.channel || e.extendedProps?.originalData?.channel || ''
        const status = e.extendedProps?.status || 'pendiente'
        return {
          id: e.id,
          fecha: formatDateTime(start),
          copy: description,
          media: channel,
          estado: status,
          original: e,
        }
      })
  }, [events, currentDate])

  const total = rows.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='mt-4'
    >
      <div
        className='bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-800/95 
                   border border-slate-600/30 rounded-xl p-6 shadow-xl backdrop-blur-sm ring-1 ring-white/5'
      >
        <div className='mb-4 pb-4 border-b border-slate-600/40 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse' />
            <h3 className='text-base font-bold text-slate-100'>Cronograma del mes</h3>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-2xl font-bold text-emerald-400'>{total}</span>
            <span className='text-sm text-slate-300'>{total === 1 ? 'tarea' : 'tareas'}</span>
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <LoadingSpinner size='md' variant='primary' label='Cargando eventos...' />
          </div>
        ) : total === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-slate-600/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>📅</span>
            </div>
            <p className='text-slate-400'>Sin tareas planificadas para este mes</p>
          </div>
        ) : (
          <div className='max-h-[520px] overflow-auto custom-scrollbar'>
            <table className='w-full text-sm'>
              <thead className='sticky top-0 z-10'>
                <tr className='bg-gradient-to-r from-slate-700/60 to-slate-800/60 border-b border-slate-600/30 backdrop-blur-sm'>
                  <th
                    scope='col'
                    className='text-left text-xs font-bold text-slate-300 uppercase tracking-wide px-3 py-3'
                  >
                    📅 Fecha
                  </th>
                  <th
                    scope='col'
                    className='text-left text-xs font-bold text-slate-300 uppercase tracking-wide px-3 py-3'
                  >
                    📝 Copy
                  </th>
                  <th
                    scope='col'
                    className='text-left text-xs font-bold text-slate-300 uppercase tracking-wide px-3 py-3'
                  >
                    📺 Media
                  </th>
                  <th
                    scope='col'
                    className='text-left text-xs font-bold text-slate-300 uppercase tracking-wide px-3 py-3'
                  >
                    ⚡ Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.id}
                    className='border-b border-slate-600/20 hover:bg-slate-700/30 transition-all duration-200 hover:shadow-sm'
                  >
                    <td className='px-3 py-3 align-top whitespace-nowrap text-slate-200 font-medium'>
                      {row.fecha}
                    </td>
                    <td className='px-3 py-3 align-top max-w-[220px]'>
                      <button
                        onClick={() => onEventClick && onEventClick(row.original)}
                        className='text-left text-slate-200 hover:text-blue-300 transition-colors group'
                        title={row.copy || row.original?.title || ''}
                      >
                        <div className='truncate group-hover:text-blue-300'>
                          {row.copy?.trim() ? row.copy : row.original?.title || ''}
                        </div>
                      </button>
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {row.media ? (
                        <span className='px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 text-blue-300 shadow-sm'>
                          {row.media}
                        </span>
                      ) : (
                        <span className='text-xs text-slate-500'>—</span>
                      )}
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {(() => {
                        const statusConfig = getStatusConfig(row.estado)
                        return (
                          <StatusBadge
                            status={statusConfig.status}
                            size='xs'
                            cyber={true}
                            className='text-[10px]'
                          >
                            {statusConfig.label}
                          </StatusBadge>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MonthAgenda
