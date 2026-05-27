import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { getCurrentDate } from '../../utils/dateHelpers';
import '../../styles/fullcalendar-custom.css';

const getPlatformIcon = (platformStr = '') => {
  const p = platformStr.toLowerCase().trim();

  // SVG de Instagram
  if (p.includes('instagram') || p === 'ig') {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Instagram">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    );
  }

  // SVG de Facebook
  if (p.includes('facebook') || p === 'fb') {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="Facebook">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }

  // SVG de TikTok
  if (p.includes('tiktok')) {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="TikTok">
        <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.95-1.72-.1-.09-.17-.16-.27-.26v5.17c.02 2.3-.9 4.57-2.62 6.07-1.94 1.7-4.75 2.2-7.18 1.39-2.36-.78-4.24-2.88-4.83-5.33-.74-3.04.57-6.43 3.19-8.02 1.48-.9 3.2-1.22 4.92-.93V9.75c-1.27-.32-2.64-.13-3.75.54-1.39.84-2.18 2.44-2.07 4.06.1 1.47.88 2.87 2.14 3.6 1.42.82 3.27.74 4.61-.2 1.05-.74 1.62-1.97 1.62-3.25V.02z"/>
      </svg>
    );
  }

  // SVG de Twitter / X
  if (p.includes('twitter') || p === 'x' || p === 'tw') {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="X (Twitter)">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }

  // SVG de YouTube
  if (p.includes('youtube') || p === 'yt') {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="YouTube">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  // SVG de LinkedIn
  if (p.includes('linkedin') || p === 'li') {
    return (
      <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title="LinkedIn">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
      </svg>
    );
  }

  // Fallback genérico (globo / web)
  return (
    <svg className="w-3.5 h-3.5 text-current fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" title={platformStr}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
};

/**
 * Wrapper component para FullCalendar con configuración optimizada
 * Implementa mejores prácticas y configuración específica para el proyecto
 */
const FullCalendarWrapper = ({
  events = [],
  currentDate,
  currentView = 'dayGridMonth',
  onDateChange,
  onViewChange,
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
  loading = false,
  height = '600px',
  headerToolbar = false, // Disable default toolbar
  className = '',
  clientName = '',
}) => {
  const calendarRef = useRef(null);
  const [calendarLabel, setCalendarLabel] = useState('');
  // Ancla de mes/año para mantener consistencia al cambiar de vista
  const anchorYMRef = useRef(() => {
    const d = currentDate || getCurrentDate();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const prevViewRef = useRef(null);

  // Navegar programáticamente cuando cambia currentDate
  useEffect(() => {
    if (calendarRef.current && currentDate) {
      const calendarApi = calendarRef.current.getApi();
      // Forzar navegación a la fecha correcta
      calendarApi.gotoDate(currentDate);
      // Actualizar ancla al mes del currentDate
      try {
        anchorYMRef.current = { y: currentDate.getFullYear(), m: currentDate.getMonth() };
        // Actualizar label también
        setCalendarLabel(calendarApi.view.title);
      } catch {}
    }
  }, [currentDate]);

  // Asegurar fecha correcta en el primer mount
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const targetDate = currentDate || getCurrentDate();
      calendarApi.gotoDate(targetDate);
    }
  }, []);

  // Cambiar vista programáticamente
  useEffect(() => {
    if (calendarRef.current && currentView) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  // Handlers optimizados
  const handleDateClick = arg => {
    const clickedDate = new Date(arg.date);
    const clickInfo = {
      clickCoords: {
        x: arg.jsEvent.clientX,
        y: arg.jsEvent.clientY,
      },
      elementRect: arg.dayEl ? arg.dayEl.getBoundingClientRect() : null,
      originalEvent: arg,
    };
    onDateClick?.(clickedDate, clickInfo);
  };

  const handleEventClick = arg => {
    arg.jsEvent.preventDefault(); // Prevenir navegación default
    onEventClick?.(arg.event, arg);
  };

  const handleDatesSet = arg => {
    // Actualizar label cuando cambia la fecha
    setCalendarLabel(arg.view.title);

    // Usar el inicio "real" del periodo de la vista (p.ej., 1er día del mes) en lugar del rango visible
    const computedStart = arg.view?.currentStart ?? arg.start;
    const computedEnd = arg.view?.currentEnd ?? arg.end;
    // Debug mínimo para detectar saltos inesperados
    try {
      const api = calendarRef.current?.getApi();
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[FullCalendar] datesSet', {
          view: arg.view?.type,
          start: arg.start,
          end: arg.end,
          currentStart: arg.view?.currentStart,
          apiDate: api?.getDate?.(),
        });
      }
      // Lógica de anclaje por mes/año
      const viewType = arg.view?.type;
      const cs = computedStart;
      const anchor = anchorYMRef.current;
      const isMonthView =
        viewType === 'dayGridMonth' || viewType === 'multiMonthYear' || viewType === 'listMonth';
      if (isMonthView && cs) {
        // Actualizar ancla cuando estamos en vista de mes
        anchorYMRef.current = { y: cs.getFullYear(), m: cs.getMonth() };
      } else if (cs && anchor && (cs.getFullYear() !== anchor.y || cs.getMonth() !== anchor.m)) {
        // En vistas no-mes, mantenernos dentro del mes ancla
        const mid = new Date(anchor.y, anchor.m, 15);
        if (cs.getFullYear() !== mid.getFullYear() || cs.getMonth() !== mid.getMonth()) {
          api?.gotoDate(mid);
        }
      }
      prevViewRef.current = viewType;
    } catch {}
    if (onDateChange) {
      onDateChange(computedStart, computedEnd, arg.view);
    }
  };

  const handleViewChange = arg => {
    // Solo propagar el cambio
    if (onViewChange && arg.view?.type) {
      onViewChange(arg.view.type, arg.view);
    }
  };

  const handleViewDidMount = arg => {
    // No modificar nada, dejar que FullCalendar funcione normalmente
  };

  const handleEventDrop = arg => {
    if (onEventDrop) {
      onEventDrop(arg.event, arg.oldEvent, arg);
    }
  };

  const handleEventResize = arg => {
    if (onEventResize) {
      onEventResize(arg.event, arg.oldEvent, arg);
    }
  };

  // Configuración optimizada de FullCalendar
  const calendarOptions = {
    // Plugins requeridos
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],

    // Configuración de localización estándar
    locale: esLocale,

    // Vista inicial y navegación
    initialView: currentView,
    initialDate: currentDate || getCurrentDate(), // CRUCIAL: Establecer fecha inicial

    // Datos
    events,

    // Interactividad
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    editable: true,
    droppable: false,

    // Configuración de tiempo
    nowIndicator: true,
    scrollTime: '08:00:00',
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '00:30:00',

    // Header y navegación
    headerToolbar,

    // Eliminar titleFormat personalizado para evitar conflictos

    // Altura
    height,

    // Configuración de eventos
    eventDisplay: 'block',
    eventContent: arg => {
      const hasFeedback = !!arg.event.extendedProps?.client_feedback;
      const title = arg.event.title;
      const timeText = arg.timeText;
      const platformText =
        arg.event.extendedProps?.platforms || arg.event.extendedProps?.channel || '';

      return (
        <div className='fc-event-main-custom flex flex-col w-full h-full p-1.5 min-w-0 relative'>
          <div className='flex items-center justify-between gap-1 w-full'>
            {timeText && (
              <span className='text-[9px] font-semibold opacity-75 leading-none'>{timeText}</span>
            )}
            {platformText && (
              <span className='flex items-center justify-center p-0.5 rounded-md bg-black/10 border border-black/5 hover:bg-black/20 transition-colors' title={platformText}>
                {getPlatformIcon(platformText)}
              </span>
            )}
          </div>
          <div className='text-[10px] font-semibold truncate mt-1 text-current leading-normal pr-3'>
            {title}
          </div>

          {hasFeedback && (
            <div className='absolute right-0.5 bottom-0.5 flex items-center justify-center'>
              <span className='relative flex h-3.5 w-3.5'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe0979] opacity-75'></span>
                <span className='relative inline-flex rounded-full h-3.5 w-3.5 bg-[#fe0979] text-[8px] font-bold text-white items-center justify-center shadow-[0_0_10px_rgba(254,9,121,0.6)]'>
                  💬
                </span>
              </span>
            </div>
          )}
        </div>
      );
    },
    eventStartEditable: true,
    eventDurationEditable: true,
    eventClassNames: arg => {
      const s = (arg.event.extendedProps?.status || '').toLowerCase();
      const classes = ['fc-event-base'];

      // Mapeo unificado de todos los estados a las 3 clases principales del calendario
      let key = 'en-diseño';
      if (
        s === 'planificacion' ||
        s === 'pendiente' ||
        s === 'en-diseño' ||
        s === 'en-diseno' ||
        s === 'en diseño' ||
        s === 'requiere-cambios' ||
        s === 'cancelado'
      ) {
        key = 'en-diseño';
      } else if (
        s === 'en-progreso' ||
        s === 'en-revision' ||
        s === 'esperando-aprobacion' ||
        s === 'pausado' ||
        s === 'en progreso'
      ) {
        key = 'en-progreso';
      } else if (
        s === 'aprobado' ||
        s === 'listo-publicar' ||
        s === 'publicado' ||
        s === 'completado'
      ) {
        key = 'aprobado';
      }

      classes.push(`fc-event--${key}`);
      return classes;
    },

    // Handlers
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    datesSet: handleDatesSet,
    viewDidMount: handleViewDidMount, // Forzar título correcto
    eventDrop: handleEventDrop,
    eventResize: handleEventResize,

    // Configuración de vistas específicas
    views: {
      dayGridMonth: {
        dayMaxEvents: 3,
        moreLinkText: 'más',
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        },
      },
      timeGridWeek: {
        allDaySlot: false,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        },
        dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'short' },
      },
      timeGridDay: {
        allDaySlot: false,
        dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' },
      },
      listWeek: {
        listDayFormat: { weekday: 'long', month: 'long', day: 'numeric' },
      },
      listMonth: {
        listDayFormat: { weekday: 'long', day: 'numeric', month: 'short' },
        listDaySideFormat: { month: 'short', day: 'numeric' },
        noEventsText: '📋 No hay tareas programadas para este mes',
        dayHeaderFormat: { month: 'long', year: 'numeric' },
      },
    },

    // Configuración de eventos
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },

    // Textos personalizados
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      listMonth: 'Lista',
    },

    // Configuración de más enlaces
    moreLinkClick: 'popover',

    // Configuración de días
    dayHeaderFormat: { weekday: 'short' },

    // Configuración responsive
    aspectRatio: window.innerWidth < 768 ? 0.8 : 1.35,

    // Optimizaciones de rendimiento
    lazyFetching: true,
    rerenderDelay: 10,

    // Loading state
    loading: isLoading => {
      if (loading !== isLoading) {
        // Aquí podrías emitir un evento de loading si lo necesitas
      }
    },
  };

  // Keyboard shortcuts para navegación rápida
  useEffect(() => {
    const handleKeyPress = event => {
      // Solo activar si no estamos escribiendo en un input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;

      switch (event.key) {
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            calendarApi.prev();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            calendarApi.next();
          }
          break;
        case 't':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            calendarApi.today();
          }
          break;
        case '1':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onViewChange?.('dayGridMonth');
            calendarApi.changeView('dayGridMonth');
          }
          break;
        case '2':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onViewChange?.('timeGridWeek');
            calendarApi.changeView('timeGridWeek');
          }
          break;
        case '3':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onViewChange?.('timeGridDay');
            calendarApi.changeView('timeGridDay');
          }
          break;
        case '4':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onViewChange?.('listMonth');
            calendarApi.changeView('listMonth');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onViewChange]);

  return (
    <div className={`fullcalendar-wrapper ${className}`}>
      {loading && (
        <div className='absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <div className='w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin'></div>
            <span className='text-sm text-gray-400'>Cargando eventos...</span>
          </div>
        </div>
      )}

      <FullCalendar ref={calendarRef} {...calendarOptions} />
    </div>
  );
};

export default FullCalendarWrapper;
