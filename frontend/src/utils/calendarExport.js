/**
 * Utilidades para exportar eventos del calendario a diferentes formatos
 */

/**
 * Convierte eventos a formato CSV
 */
export const exportToCSV = (events, clientName = '') => {
  const headers = [
    'Título',
    'Fecha y Hora',
    'Estado',
    'Descripción',
    'Canal',
    'Prioridad'
  ];

  const csvContent = [
    headers.join(','),
    ...events.map(event => {
      const row = [
        `"${event.title || ''}"`,
        `"${event.start ? new Date(event.start).toLocaleString('es-ES') : ''}"`,
        `"${event.extendedProps?.status || ''}"`,
        `"${event.extendedProps?.description || ''}"`,
        `"${event.extendedProps?.channel || ''}"`,
        `"${event.extendedProps?.priority || ''}"`
      ];
      return row.join(',');
    })
  ].join('\n');

  downloadFile(
    csvContent, 
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.csv`,
    'text/csv'
  );
};

/**
 * Convierte eventos a formato iCal/ICS
 */
export const exportToICS = (events, clientName = '') => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:\.]/g, '').split('T');
  const dateStamp = timestamp[0] + 'T' + timestamp[1].substring(0, 6) + 'Z';

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rambla//Calendar Export//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${clientName ? `${clientName} - ` : ''}Calendario Rambla`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires'
  ];

  events.forEach(event => {
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora por defecto
    
    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:\.]/g, '').split('.')[0] + 'Z';
    };

    const description = [
      event.extendedProps?.description || '',
      event.extendedProps?.channel ? `Canal: ${event.extendedProps.channel}` : '',
      event.extendedProps?.priority ? `Prioridad: ${event.extendedProps.priority}` : '',
      event.extendedProps?.status ? `Estado: ${event.extendedProps.status}` : ''
    ].filter(Boolean).join('\\n');

    icsContent.push(
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${dateStamp}`,
      `UID:${event.id}@rambla-calendar`,
      `SUMMARY:${event.title || 'Sin título'}`,
      description ? `DESCRIPTION:${description}` : '',
      event.extendedProps?.status ? `CATEGORIES:${event.extendedProps.status}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  downloadFile(
    icsContent.join('\r\n'), 
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.ics`,
    'text/calendar'
  );
};

/**
 * Convierte eventos a formato JSON
 */
export const exportToJSON = (events, clientName = '') => {
  const exportData = {
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
      originalData: event.extendedProps?.originalData
    }))
  };

  downloadFile(
    JSON.stringify(exportData, null, 2), 
    `calendario-${clientName ? clientName.toLowerCase().replace(/\s+/g, '-') : 'eventos'}-${formatDate()}.json`,
    'application/json'
  );
};

/**
 * Función auxiliar para descargar archivos
 */
const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};

/**
 * Función auxiliar para formatear fecha actual
 */
const formatDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Función para obtener estadísticas de eventos para el resumen de exportación
 */
export const getExportSummary = (events) => {
  const stats = {
    total: events.length,
    byStatus: {},
    byMonth: {},
    dateRange: null
  };

  if (events.length === 0) return stats;

  // Estadísticas por estado
  events.forEach(event => {
    const status = event.extendedProps?.status || 'sin-estado';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  // Estadísticas por mes
  events.forEach(event => {
    if (event.start) {
      const month = new Date(event.start).toLocaleString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    }
  });

  // Rango de fechas
  const dates = events
    .map(event => event.start ? new Date(event.start) : null)
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (dates.length > 0) {
    stats.dateRange = {
      from: dates[0].toLocaleDateString('es-ES'),
      to: dates[dates.length - 1].toLocaleDateString('es-ES')
    };
  }

  return stats;
};