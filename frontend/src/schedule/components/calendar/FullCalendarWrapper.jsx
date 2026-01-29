import { useRef, useEffect, useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import { getCurrentDate } from '@shared/utils/dateHelpers'
import { TASK_STATE_MAP } from '@constants/domainMap'
import { CalendarToolbar } from './CalendarToolbar'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import '../../styles/fullcalendar-custom.css'

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
  isChatOpen = false,
  isDocked = false,
  onAddTask,
  onGenerateAI,
  selectedDates = [],
  onToggleDate,
  isSelectionMode = false,
  onGenerateSelected,
  onLabelChange, // New callback for label changes
}) => {
  const calendarRef = useRef(null)
  const [calendarLabel, setCalendarLabel] = useState('')
  const [highlightId, setHighlightId] = useState(null)

  // Renderizado personalizado de celda para incluir checkbox
  const renderDayCellContent = useCallback(
    arg => {
      // Solo renderizar en vistas de grid de días
      if (arg.view.type !== 'dayGridMonth' && arg.view.type !== 'multiMonthYear') {
        return arg.dayNumberText
      }

      const d = arg.date
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      // Check if in selection mode and if selected
      const isModeActive = isSelectionMode && !!onToggleDate
      const isSelected = selectedDates.includes(dateStr)

      // Si no estamos en modo selección, devolvemos solo el texto
      if (!isModeActive) return arg.dayNumberText

      return (
        <div className='flex items-center justify-center relative min-w-[24px] min-h-[24px]'>
          {/* Fake Checkbox (div/span) to avoid Invalid HTML (interactive inside anchor) */}
          <div
            className={`absolute -left-1 -top-1 z-10 flex items-center justify-center w-4 h-4 rounded border transition-all duration-200 
            ${
              isSelected
                ? 'bg-purple-600 border-purple-600 opacity-100 shadow-sm'
                : 'bg-surface-soft border-gray-500 opacity-0 group-hover:opacity-100'
            }
          `}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              e.preventDefault() // Prevent anchor click
              onToggleDate(d)
            }}
          >
            {isSelected && (
              <svg
                className='w-2.5 h-2.5 text-white'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={3}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            )}
          </div>
          <span className='relative z-0'>{arg.dayNumberText}</span>
        </div>
      )
    },
    [isSelectionMode, onToggleDate, selectedDates]
  )

  const isAgendaView =
    currentView === 'listMonth' ||
    currentView === 'agenda' ||
    (typeof currentView === 'string' && currentView.startsWith('list'))
  // Ancla de mes/año para mantener consistencia al cambiar de vista
  const anchorYMRef = useRef(() => {
    const d = currentDate || getCurrentDate()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const prevViewRef = useRef(null)

  // Navegar programáticamente cuando cambia currentDate
  useEffect(() => {
    if (calendarRef.current && currentDate) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.gotoDate(currentDate)
      try {
        anchorYMRef.current = { y: currentDate.getFullYear(), m: currentDate.getMonth() }
        setCalendarLabel(calendarApi.view.title)
      } catch {}
    }
  }, [currentDate])

  useEffect(() => {
    if (calendarRef.current && currentView) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(currentView)
    }
  }, [currentView])

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      requestAnimationFrame(() => {
        calendarApi.updateSize()
        calendarApi.render()
      })
    }
  }, [isChatOpen, isDocked])

  const handleDateClick = arg => {
    const clickedDate = new Date(arg.date)
    const jsEvent = arg.jsEvent
    let clientX = jsEvent.clientX
    let clientY = jsEvent.clientY
    if (jsEvent.touches && jsEvent.touches.length > 0) {
      clientX = jsEvent.touches[0].clientX
      clientY = jsEvent.touches[0].clientY
    } else if (jsEvent.changedTouches && jsEvent.changedTouches.length > 0) {
      clientX = jsEvent.changedTouches[0].clientX
      clientY = jsEvent.changedTouches[0].clientY
    }
    const elementRect = arg.dayEl ? arg.dayEl.getBoundingClientRect() : null
    const relativeX = elementRect ? clientX - elementRect.left : 0
    const relativeY = elementRect ? clientY - elementRect.top : 0
    const clickInfo = {
      clickCoords: {
        x: clientX,
        y: clientY,
        relative: { x: relativeX, y: relativeY },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      },
      elementRect,
      originalEvent: arg,
    }
    onDateClick?.(clickedDate, clickInfo)
  }

  const handleEventClick = arg => {
    arg.jsEvent.preventDefault()
    onEventClick?.(arg.event, arg)
  }

  const handleDatesSet = arg => {
    const label = arg.view.title
    setCalendarLabel(label)

    // Notificar al padre si existe el callback
    if (onLabelChange) {
      onLabelChange(label)
    }

    const computedStart = arg.view?.currentStart ?? arg.start
    const computedEnd = arg.view?.currentEnd ?? arg.end
    try {
      const viewType = arg.view?.type
      const cs = computedStart
      const anchor = anchorYMRef.current
      const isMonthView =
        viewType === 'dayGridMonth' || viewType === 'multiMonthYear' || viewType === 'listMonth'

      if (isMonthView && cs) {
        anchorYMRef.current = { y: cs.getFullYear(), m: cs.getMonth() }
      } else if (cs && anchor && (cs.getFullYear() !== anchor.y || cs.getMonth() !== anchor.m)) {
        const mid = new Date(anchor.y, anchor.m, 15)
        if (cs.getFullYear() !== mid.getFullYear() || cs.getMonth() !== mid.getMonth()) {
          calendarRef.current?.getApi()?.gotoDate(mid)
        }
      }
      prevViewRef.current = viewType
    } catch {}
    if (onDateChange) {
      onDateChange(computedStart, computedEnd, arg.view)
    }
  }

  const handleViewDidMount = arg => {}

  const handleEventDrop = arg => {
    if (onEventDrop) onEventDrop(arg.event, arg.oldEvent, arg)
  }

  const handleEventResize = arg => {
    if (onEventResize) onEventResize(arg.event, arg.oldEvent, arg)
  }

  const handleToolbarNavigate = action => {
    if (!calendarRef.current) return
    const calendarApi = calendarRef.current.getApi()
    switch (action) {
      case 'PREV':
        calendarApi.prev()
        break
      case 'NEXT':
        calendarApi.next()
        break
      case 'TODAY':
        calendarApi.today()
        break
    }
  }

  const handleToolbarView = viewType => {
    if (!calendarRef.current) return
    const viewMap = {
      month: 'dayGridMonth',
      week: 'timeGridWeek',
      day: 'timeGridDay',
      agenda: 'listMonth',
    }
    const fullCalendarView = viewMap[viewType] || viewType
    const calendarApi = calendarRef.current.getApi()
    calendarApi.changeView(fullCalendarView)
    onViewChange?.(fullCalendarView)
  }

  const jumpToEvent = eventId => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    const ev = api.getEventById(eventId)
    if (!ev) return
    const start = ev.start || getCurrentDate()
    api.gotoDate(start)
    setHighlightId(eventId)
    requestAnimationFrame(() => api.updateSize())
  }

  // Render personalizado para vista Agenda (list*)
  const renderEventContent = arg => {
    const viewType = arg?.view?.type || ''
    if (!viewType.startsWith('list')) return undefined

    try {
      const start = arg.event.start ? new Date(arg.event.start) : null
      const fecha = start
        ? start.toLocaleString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : arg.timeText || ''
      const ext = arg.event.extendedProps || {}
      const copy = (
        ext.description ||
        ext.originalData?.description ||
        arg.event.title ||
        ''
      ).toString()
      const media = (ext.channel || ext.originalData?.channel || '').toString()
      const estadoRaw = (ext.status || '').toString()
      const estado = estadoRaw.replace('-', ' ')

      const statusClass = (() => {
        const s = estadoRaw.toLowerCase()
        const base = 'px-2 py-0.5 text-[10px] font-medium rounded border'
        if (s === 'aprobado') return `${base} bg-green-500/10 border-green-400/20 text-green-300`
        if (s === 'publicado')
          return `${base} bg-emerald-500/10 border-emerald-400/20 text-emerald-300`
        if (s === 'pendiente')
          return `${base} bg-orange-500/10 border-orange-400/20 text-orange-300`
        if (s === 'en-diseño' || s === 'en-diseno')
          return `${base} bg-gray-500/10 border-gray-400/20 text-gray-300`
        if (s === 'en-progreso') return `${base} bg-blue-500/10 border-blue-400/20 text-blue-300`
        if (s === 'en-revision' || s === 'en-revisión')
          return `${base} bg-indigo-500/10 border-indigo-400/20 text-indigo-300`
        if (s === 'cancelado') return `${base} bg-red-500/10 border-red-400/20 text-red-300`
        return `${base} bg-accent-500/10 border-accent-400/20 text-accent-300`
      })()

      const mediaChip = media
        ? `<span class="px-2 py-0.5 text-[10px] font-medium rounded bg-accent-500/10 border border-accent-400/20 text-accent-300">${media}</span>`
        : '<span class="text-[11px] text-text-muted">—</span>'

      const safeCopy = copy.replace(/</g, '&lt;').replace(/>/g, '&gt;')

      return {
        html: `
          <div class="fc-agenda-grid-row">
            <div class="fc-ag-col fc-ag-fecha">${fecha}</div>
            <div class="fc-ag-col fc-ag-copy" title="${safeCopy}">
              <div class="truncate">${safeCopy}</div>
            </div>
            <div class="fc-ag-col fc-ag-media">${mediaChip}</div>
            <div class="fc-ag-col fc-ag-estado"><span class="${statusClass}">${estado}</span></div>
          </div>
        `,
      }
    } catch {
      return undefined
    }
  }

  // Configuración optimizada de FullCalendar
  const calendarOptions = {
    // Plugins requeridos
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],

    // Renderizado custom de celdas (Checkboxes)
    dayCellContent: renderDayCellContent,
    dayCellClassNames: arg => {
      const d = arg.date
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const isSelected = selectedDates.includes(dateStr)

      const baseClasses = 'group relative hover:bg-surface-soft/10 transition-colors'
      return isSelected ? `${baseClasses} fc-day-selected` : baseClasses
    },

    // Configuración de localización estándar
    locale: esLocale,

    // Vista inicial y navegación
    initialView: currentView,
    initialDate: currentDate || getCurrentDate(),

    // Datos
    events,

    // Interacción
    selectable: true,
    selectMirror: true,
    select: arg => {
      // If in custom selection mode (checkboxes), ignore standard selection
      if (isSelectionMode) {
        arg.view.calendar.unselect()
        return
      }

      if (onGenerateSelected) {
        onGenerateSelected({
          start: arg.start,
          end: arg.end,
          allDay: arg.allDay,
        })
      }
    },

    // Variantes de evento por estado + plataforma + resaltado
    eventClassNames: arg => {
      const status = arg.event.extendedProps?.status
      const channel = arg.event.extendedProps?.channel
      const classes = []

      // Map internal EN status to legacy CSS (ES ASCII) for styling
      let classKey = null
      if (status && TASK_STATE_MAP[status]) {
        classKey = TASK_STATE_MAP[status].externalCode
      }
      if (classKey) {
        classes.push(`fc-event--${classKey}`)
      } else if (status) {
        classes.push(`fc-event--${status}`)
      }

      // Add platform-specific class for colorful cards
      if (channel) {
        const platformClass = (() => {
          const ch = channel.toString().toLowerCase()
          if (ch === 'ig' || ch.toLowerCase().includes('instagram')) return 'instagram'
          if (ch === 'fb' || ch.toLowerCase().includes('facebook')) return 'facebook'
          if (ch === 'li' || ch === 'linkedin') return 'linkedin'
          if (ch === 'tw' || ch.toLowerCase().includes('twitter') || ch === 'x') return 'twitter'
          if (ch === 'tk' || ch === 'tiktok') return 'tiktok'
          if (ch === 'yt' || ch.toLowerCase().includes('youtube')) return 'youtube'
          if (ch.toLowerCase().includes('whatsapp')) return 'whatsapp'
          if (ch.toLowerCase().includes('threads')) return 'threads'
          return null
        })()

        if (platformClass) {
          classes.push(`fc-event--${platformClass}`)
        }
      }

      classes.push('fc-event-base')
      if (highlightId && arg.event.id === highlightId) classes.push('fc-event--highlight')
      return classes
    },

    // Interactividad
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

    eventDidMount: info => {
      // marcar elemento con id para poder desplazar y resaltar
      try {
        info.el.setAttribute('data-event-id', info.event.id)
      } catch {}
      if (highlightId && info.event.id === highlightId) {
        // scroll suave al centro
        setTimeout(() => {
          try {
            info.el.classList.add('fc-event--highlight')
            info.el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          } catch {}
        }, 50)
        setTimeout(() => setHighlightId(null), 5000)
      }
    },

    // Header y navegación
    headerToolbar,

    // Distribución de filas
    fixedWeekCount: false,

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
    viewDidMount: handleViewDidMount,
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

    // Configuración de tiempo eventos
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

    moreLinkClick: 'popover',
    dayHeaderFormat: { weekday: 'short' },
    aspectRatio: window.innerWidth < 768 ? 0.8 : 1.35,
    lazyFetching: true,
    rerenderDelay: 10,

    loading: isLoading => {
      if (loading !== isLoading) {
      }
    },
  }

  return (
    <div className={`fullcalendar-wrapper flex flex-col h-full ${className}`}>
      {/* Toolbar eliminado por petición del usuario para maximizar espacio */}

      {loading && (
        <div className='absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <LoadingSpinner size='sm' variant='primary' />
            <span className='text-sm text-gray-400'>Cargando eventos...</span>
          </div>
        </div>
      )}

      {isAgendaView && (
        <div className='fc-agenda-header bg-surface-800/60 border border-[color:var(--color-border-subtle)] rounded-md mb-2'>
          <div className='fc-agenda-grid-row px-2 py-2'>
            <div className='fc-ag-col fc-ag-fecha text-xs font-semibold uppercase tracking-wide text-text-muted'>
              Fecha
            </div>
            <div className='fc-ag-col fc-ag-copy text-xs font-semibold uppercase tracking-wide text-text-muted'>
              Copy
            </div>
            <div className='fc-ag-col fc-ag-media text-xs font-semibold uppercase tracking-wide text-text-muted'>
              Media
            </div>
            <div className='fc-ag-col fc-ag-estado text-xs font-semibold uppercase tracking-wide text-text-muted'>
              Estado
            </div>
          </div>
        </div>
      )}

      <FullCalendar ref={calendarRef} {...calendarOptions} />
    </div>
  )
}

export default FullCalendarWrapper
