/**
 * Utilidades para exportar eventos del calendario a diferentes formatos
 */

interface CalendarEvent {
  id: string
  title?: string
  start?: Date | string
  end?: Date | string
  allDay?: boolean
  backgroundColor?: string
  extendedProps?: {
    status?: string
    description?: string
    channel?: string
    priority?: string
    originalData?: any
  }
}

interface ExportStats {
  total: number
  byStatus: Record<string, number>
  byMonth: Record<string, number>
  dateRange: {
    from: string
    to: string
  } | null
}

interface ExportData {
  exportDate: string
  clientName: string | null
  totalEvents: number
  events: Array<{
    id: string
    title?: string
    start?: Date | string
    end?: Date | string
    allDay?: boolean
    status?: string
    description?: string
    channel?: string
    priority?: string
    backgroundColor?: string
    originalData?: any
  }>
}

/**
 * Convierte eventos a formato CSV
 */
export const exportToCSV = (events: CalendarEvent[], clientName = '') => {
  const headers = ['Título', 'Fecha y Hora', 'Estado', 'Descripción', 'Canal', 'Prioridad']

  const csvContent = [
    headers.join(','),
    ...events.map(event => {
      const row = [
        `"${event.title || ''}"`,
        `"${event.start ? new Date(event.start).toLocaleString('es-ES') : ''}"`,
        `"${event.extendedProps?.status || ''}"`,
        `"${event.extendedProps?.description || ''}"`,
        `"${event.extendedProps?.channel || ''}"`,
        `"${event.extendedProps?.priority || ''}"`,
      ]
      return row.join(',')
    }),
  ].join('\n')

  downloadFile(
    csvContent,
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.csv`,
    'text/csv'
  )
}

/**
 * Convierte eventos a formato iCal/ICS
 */
export const exportToICS = (
  events: CalendarEvent[],
  clientName = '',
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
) => {
  const now = new Date()
  const timestamp = now
    .toISOString()
    .replace(/[-:\.]/g, '')
    .split('T')
  const dateStamp = timestamp[0] + 'T' + timestamp[1].substring(0, 6) + 'Z'

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Calendar Export//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${clientName ? `${clientName} - ` : ''}Calendario Cadence`,
    `X-WR-TIMEZONE:${timeZone}`,
  ]

  events.forEach(event => {
    const startDate = new Date(event.start!)
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hora por defecto

    const formatICSDate = (date: Date): string => {
      return (
        date
          .toISOString()
          .replace(/[-:\.]/g, '')
          .split('.')[0] + 'Z'
      )
    }

    const description = [
      event.extendedProps?.description || '',
      event.extendedProps?.channel ? `Canal: ${event.extendedProps.channel}` : '',
      event.extendedProps?.priority ? `Prioridad: ${event.extendedProps.priority}` : '',
      event.extendedProps?.status ? `Estado: ${event.extendedProps.status}` : '',
    ]
      .filter(Boolean)
      .join('\\n')

    icsContent.push(
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${dateStamp}`,
      `UID:${event.id}@cadence-calendar`,
      `SUMMARY:${event.title || 'Sin título'}`,
      description ? `DESCRIPTION:${description}` : '',
      event.extendedProps?.status ? `CATEGORIES:${event.extendedProps.status}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    )
  })

  icsContent.push('END:VCALENDAR')

  downloadFile(
    icsContent.join('\r\n'),
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.ics`,
    'text/calendar'
  )
}

/**
 * Convierte eventos a formato JSON
 */
export const exportToJSON = (events: CalendarEvent[], clientName = '') => {
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    clientName: clientName || null,
    totalEvents: events.length,
    events: events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      status: event.extendedProps?.status,
      description: event.extendedProps?.description,
      channel: event.extendedProps?.channel,
      priority: event.extendedProps?.priority,
      backgroundColor: event.backgroundColor,
      originalData: event.extendedProps?.originalData,
    })),
  }

  downloadFile(
    JSON.stringify(exportData, null, 2),
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.json`,
    'application/json'
  )
}

/**
 * Función auxiliar para descargar archivos
 */
const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}

/**
 * Función auxiliar para formatear fecha actual
 */
const formatDate = (): string => {
  const now = new Date()
  return now.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Función para obtener estadísticas de eventos para el resumen de exportación
 */
export const getExportSummary = (events: CalendarEvent[]): ExportStats => {
  const stats: ExportStats = {
    total: events.length,
    byStatus: {},
    byMonth: {},
    dateRange: null,
  }

  if (events.length === 0) return stats

  // Estadísticas por estado
  events.forEach(event => {
    const status = event.extendedProps?.status || 'sin-estado'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
  })

  // Estadísticas por mes
  events.forEach(event => {
    if (event.start) {
      const month = new Date(event.start).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
      })
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1
    }
  })

  // Rango de fechas
  const dates = events
    .map(event => (event.start ? new Date(event.start) : null))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())

  if (dates.length > 0) {
    stats.dateRange = {
      from: dates[0].toLocaleDateString('es-ES'),
      to: dates[dates.length - 1].toLocaleDateString('es-ES'),
    }
  }

  return stats
}
