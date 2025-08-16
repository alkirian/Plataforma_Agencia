import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { getCurrentDate } from '../../utils/dateHelpers';

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
  headerToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
  },
  className = ''
}) => {
  const calendarRef = useRef(null);
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
  const handleDateClick = (arg) => {
    const clickedDate = new Date(arg.date);
    onDateClick?.(clickedDate, arg);
  };

  const handleEventClick = (arg) => {
    arg.jsEvent.preventDefault(); // Prevenir navegación default
    onEventClick?.(arg.event, arg);
  };

  const handleDatesSet = (arg) => {
    // Usar el inicio "real" del periodo de la vista (p.ej., 1er día del mes) en lugar del rango visible
    const computedStart = arg.view?.currentStart ?? arg.start;
    const computedEnd = arg.view?.currentEnd ?? arg.end;
    // Debug mínimo para detectar saltos inesperados
    try {
      const api = calendarRef.current?.getApi();
      // eslint-disable-next-line no-console
      console.debug('[FullCalendar] datesSet', {
        view: arg.view?.type,
        start: arg.start,
        end: arg.end,
        currentStart: arg.view?.currentStart,
        apiDate: api?.getDate?.(),
      });
      // Lógica de anclaje por mes/año
      const viewType = arg.view?.type;
      const cs = computedStart;
      const anchor = anchorYMRef.current;
      const isMonthView = viewType === 'dayGridMonth' || viewType === 'multiMonthYear' || viewType === 'listMonth';
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

  const handleViewChange = (arg) => {
    // Solo propagar el cambio
    if (onViewChange && arg.view?.type) {
      onViewChange(arg.view.type, arg.view);
    }
  };

  const handleViewDidMount = (arg) => {
    // No modificar nada, dejar que FullCalendar funcione normalmente
  };

  const handleEventDrop = (arg) => {
    if (onEventDrop) {
      onEventDrop(arg.event, arg.oldEvent, arg);
    }
  };

  const handleEventResize = (arg) => {
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
    eventStartEditable: true,
    eventDurationEditable: true,
    
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
          hour12: false
        }
      },
      timeGridWeek: {
        allDaySlot: false,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      },
      timeGridDay: {
        allDaySlot: false
      },
      listWeek: {
        listDayFormat: { weekday: 'long', month: 'long', day: 'numeric' }
      },
      listMonth: {
        listDayFormat: { weekday: 'long', month: 'long', day: 'numeric' },
        listDaySideFormat: false,
        noEventsText: 'No hay tareas programadas para este mes'
      }
    },
    
    // Configuración de eventos
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    
    // Textos personalizados
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      listMonth: 'Lista'
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
    loading: (isLoading) => {
      if (loading !== isLoading) {
        // Aquí podrías emitir un evento de loading si lo necesitas
      }
    }
  };

  return (
    <div className={`fullcalendar-wrapper ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-400">Cargando eventos...</span>
          </div>
        </div>
      )}
      
      <FullCalendar
        ref={calendarRef}
        {...calendarOptions}
      />
    </div>
  );
};

export default FullCalendarWrapper;