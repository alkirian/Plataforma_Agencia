import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ShareApprovalModal } from './ShareApprovalModal';
import { getCurrentDate } from '../../utils/dateHelpers';
import QuickTaskPopover from './QuickTaskPopover';

// Importaciones de FullCalendar
import FullCalendarWrapper from './FullCalendarWrapper';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Componentes existentes
import { AIContentGenerator } from './AIContentGenerator';
import { ScheduleImportModal } from './ScheduleImportModal';
import { AgentChatPanel } from '../ui';
import { aiGenerationManager } from '../../utils/aiGenerationManager';
import { DeliverableGallery } from '../documents/DeliverableGallery';
import { EventModal } from './EventModal';

// Utilidades centralizadas
import { inferFormatFromFiles } from './scheduleUtils';

// Estilos
import '../../styles/fullcalendar-custom.css';
import { getClientById } from '../../api/clients';
import { uploadScheduleAsset } from '../../api/schedule';
import { useAuth } from '../../hooks/useAuth';


/**
 * Componente de calendario renovado con FullCalendar
 * Implementa todas las mejores prácticas y funcionalidades optimizadas
 */
export const ScheduleSection = ({ clientId }) => {
  const { profile } = useAuth();
  const isReadOnly = profile?.role === 'client';

  // Estados del componente
  const [client, setClient] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate());
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);
  const [isCalendarDragOver, setIsCalendarDragOver] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);

  const [isAiGenerating, setIsAiGenerating] = useState(() => aiGenerationManager.isGenerating(clientId));
  const [aiIdeasCount, setAiIdeasCount] = useState(() => aiGenerationManager.getIdeas(clientId).length);

  useEffect(() => {
    setIsAiGenerating(aiGenerationManager.isGenerating(clientId));
    setAiIdeasCount(aiGenerationManager.getIdeas(clientId).length);

    const unsubscribe = aiGenerationManager.subscribe(() => {
      setIsAiGenerating(aiGenerationManager.isGenerating(clientId));
      setAiIdeasCount(aiGenerationManager.getIdeas(clientId).length);
    });

    return unsubscribe;
  }, [clientId]);

  // Estados para el nuevo popover
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskDate, setQuickTaskDate] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);

  // Hook personalizado para eventos
  const {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearMonthEvents,
    clearAllEvents,
    moveEvent,
  } = useCalendarEvents(clientId);

  const feedbackEventsCount = useMemo(() => {
    return (events || []).filter(e => e.extendedProps?.client_feedback).length;
  }, [events]);

  // Calcular estadísticas basadas en eventos visibles del calendario (simplificado a los 3 estados principales)
  const calculateVisibleStats = () => {
    const total = events.length;
    const byStatus = {
      'en-diseño': 0,
      'en-progreso': 0,
      aprobado: 0,
    };

    events.forEach(event => {
      let status = (event.resource?.status || event.status || 'en-diseño').toLowerCase();

      // Mapear estados a los 3 principales
      if (
        status === 'planificacion' ||
        status === 'pendiente' ||
        status === 'en-diseño' ||
        status === 'en-diseno' ||
        status === 'requiere-cambios' ||
        status === 'cancelado'
      ) {
        byStatus['en-diseño'] = (byStatus['en-diseño'] || 0) + 1;
      } else if (
        status === 'en-progreso' ||
        status === 'en-revision' ||
        status === 'esperando-aprobacion' ||
        status === 'pausado'
      ) {
        byStatus['en-progreso'] = (byStatus['en-progreso'] || 0) + 1;
      } else {
        byStatus['aprobado'] = (byStatus['aprobado'] || 0) + 1;
      }
    });

    return {
      total,
      byStatus,
    };
  };

  const visibleStats = calculateVisibleStats();

  // Cargar datos iniciales - memoizar loadInitialData
  const loadInitialData = useCallback(async () => {
    try {
      if (clientId) {
        const [clientResponse] = await Promise.all([getClientById(clientId), loadEvents()]);
        setClient(clientResponse.data);
      }
    } catch (err) {
      toast.error('Error al cargar datos del cliente');
    }
  }, [clientId, loadEvents]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const handleRefresh = () => {
      loadEvents();
    };
    window.addEventListener('cadence:refresh-schedule', handleRefresh);
    return () => {
      window.removeEventListener('cadence:refresh-schedule', handleRefresh);
    };
  }, [loadEvents]);

  // Handlers del calendario - memoizados para evitar re-renders
  const handleDateClick = useCallback((date, clickInfo) => {
    const clickedDate = date instanceof Date ? date : new Date(date);
    const safeDate = Number.isNaN(clickedDate.getTime()) ? getCurrentDate() : clickedDate;

    setSelectedEvent(null);
    setModalInitialDate(safeDate);
    setIsQuickTaskOpen(false);
    setQuickTaskDate(safeDate);
    setClickCoords(clickInfo?.clickCoords || null);
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback(event => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    async event => {
      try {
        await moveEvent(event.id, event.start, event.end);
      } catch (err) {
        // El hook maneja el error y recarga
      }
    },
    [moveEvent]
  );

  const handleViewChange = useCallback(viewType => {
    setCurrentView(viewType);
  }, []);

  const handleDateChange = useCallback(
    start => {
      if (start && Math.abs(start.getTime() - currentDate.getTime()) > 24 * 60 * 60 * 1000) {
        setCurrentDate(start);
      }
    },
    [currentDate]
  );

  const handleClearMonthSchedule = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthsNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const monthLabel = `${monthsNames[month]} de ${year}`;

    // Contar cuántos eventos hay en este mes actualmente en local
    const eventsInMonth = events.filter(event => {
      const d = new Date(event.start);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (eventsInMonth.length === 0) {
      toast.error('No hay eventos programados en este mes para limpiar.');
      return;
    }

    const confirmMessage = `¿Estás seguro de que deseas eliminar todas las ${eventsInMonth.length} tareas programadas para ${monthLabel}? Esta acción no se puede deshacer y borrará también los archivos multimedia asociados.`;

    if (window.confirm(confirmMessage)) {
      try {
        await clearMonthEvents(year, month);
      } catch (err) {
        // El error ya es manejado por el hook
      }
    }
  }, [currentDate, events, clearMonthEvents]);

  const handleClearAllSchedule = useCallback(async () => {
    if (events.length === 0) {
      toast.error('No hay eventos en el cronograma para eliminar.');
      return;
    }
    const confirmMessage = `¿Estás seguro de que deseas eliminar TODOS los ${events.length} eventos del cronograma? Esta acción no se puede deshacer.`;
    if (window.confirm(confirmMessage)) {
      try {
        await clearAllEvents();
      } catch (err) {
        // El error ya es manejado por el hook
      }
    }
  }, [events, clearAllEvents]);

  // Sincronizar vista del calendario con el Header principal
  useEffect(() => {
    const handleViewEvent = e => {
      const nextView = e.detail?.view;
      if (nextView) {
        setCurrentView(nextView);
      }
    };
    window.addEventListener('cadence:calendar-view', handleViewEvent);
    return () => {
      window.removeEventListener('cadence:calendar-view', handleViewEvent);
    };
  }, []);

  // Notificar al Header cuando la vista del calendario cambie desde el componente interno
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('cadence:calendar-view-changed', { detail: { view: currentView } })
    );
  }, [currentView]);

  // Escuchar acciones disparadas desde el Header (menú de tres puntos) o ClientDetailPage
  useEffect(() => {
    const handleActionEvent = e => {
      const action = e.detail?.action;
      if (action === 'import') {
        setIsImportOpen(true);
      } else if (action === 'share') {
        setIsShareModalOpen(true);
      } else if (action === 'clear') {
        handleClearAllSchedule();
      } else if (action === 'ai-gen') {
        setIsAIGeneratorOpen(true);
      } else if (action === 'deliverables') {
        setIsDeliverablesOpen(true);
      }
    };
    window.addEventListener('cadence:calendar-action', handleActionEvent);
    return () => {
      window.removeEventListener('cadence:calendar-action', handleActionEvent);
    };
  }, [handleClearAllSchedule]);

  // Escuchar el evento de crear nuevo evento desde el Header o disparadores globales
  useEffect(() => {
    const handleNewEventEvent = () => {
      handleDateClick(getCurrentDate());
    };
    window.addEventListener('cadence:new-event', handleNewEventEvent);
    return () => {
      window.removeEventListener('cadence:new-event', handleNewEventEvent);
    };
  }, [handleDateClick]);

  const handleCalendarDragOver = useCallback(e => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    setIsCalendarDragOver(true);
  }, []);

  const handleCalendarDragLeave = useCallback(e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsCalendarDragOver(false);
    }
  }, []);

  const handleCalendarDrop = useCallback(
    async e => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      setIsCalendarDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const maxSizeBytes = 250 * 1024 * 1024;
      const oversized = files.find(file => file.size > maxSizeBytes);
      if (oversized) {
        toast.error(`${oversized.name} supera 250MB.`);
        return;
      }

      const dateCell = e.target?.closest?.('[data-date]');
      const dateText = dateCell?.getAttribute?.('data-date');
      const dropDate = dateText ? new Date(`${dateText}T09:00:00`) : new Date(currentDate);
      dropDate.setHours(9, 0, 0, 0);

      const firstName = files[0]?.name || 'Contenido';
      const titleBase = firstName.includes('.')
        ? firstName.slice(0, firstName.lastIndexOf('.'))
        : firstName;
      const format = inferFormatFromFiles(files);

      try {
        const created = await createEvent({
          title: titleBase,
          copy: '',
          channel: 'IG',
          status: 'en-diseño',
          scheduled_at: dropDate.toISOString(),
          description: `Formato: ${format}\nArchivos: ${files.length}`,
        });

        for (let i = 0; i < files.length; i++) {
          await uploadScheduleAsset(clientId, created.id, files[i], {
            asset_role: files.length > 1 ? 'carousel_slide' : 'final',
            sort_order: i,
          });
        }

        const eventLike = {
          id: created.id,
          title: created.title,
          start: new Date(created.scheduled_at),
          extendedProps: {
            status: created.status || 'en-diseño',
            channel: created.channel || 'IG',
            copy: created.copy || '',
          },
        };
        setSelectedEvent(eventLike);
        setIsModalOpen(true);
        toast.success(
          `Contenido anclado al calendario (${files.length} archivo${files.length > 1 ? 's' : ''}).`
        );
      } catch (error) {
        toast.error(error.message || 'No se pudo anclar el contenido al calendario.');
      }
    },
    [clientId, createEvent, currentDate]
  );

  // Handler para crear tareas desde el QuickTaskPopover
  const handleCreateQuickTask = useCallback(
    async taskData => {
      try {
        await createEvent(taskData);
        toast.success('Tarea creada exitosamente');
        setIsQuickTaskOpen(false);
        setQuickTaskDate(null);
        setClickCoords(null);
      } catch (error) {
        toast.error('Error al crear la tarea');
        throw error;
      }
    },
    [createEvent]
  );

  // Handler para cerrar el QuickTaskPopover
  const handleCloseQuickTask = useCallback(() => {
    setIsQuickTaskOpen(false);
    setQuickTaskDate(null);
    setClickCoords(null);
  }, []);

  const handleCreateAIItems = useCallback(
    async items => {
      let generatedImages = 0;
      let failedImages = 0;

      try {
        for (const item of items) {
          const { generateImage, imagePrompt, imageAspectRatio, ...eventData } = item;
          const createdEvent = await createEvent(eventData);

          if (generateImage && createdEvent?.id) {
            try {
              await generateImageForEvent(clientId, createdEvent.id, {
                prompt:
                  imagePrompt ||
                  [
                    `Imagen para el post "${eventData.title}".`,
                    eventData.description || eventData.copy || '',
                    `Canal: ${eventData.channel || 'IG'}.`,
                  ]
                    .filter(Boolean)
                    .join(' '),
                aspectRatio: imageAspectRatio || '1:1',
              });
              generatedImages += 1;
            } catch (imageError) {
              failedImages += 1;
              if (process.env.NODE_ENV === 'development') {
                console.error('[AI image generation] Error:', imageError);
              }
            }
          }
        }

        const imageMessage = generatedImages
          ? ` y ${generatedImages} imagen${generatedImages > 1 ? 'es' : ''} generada${generatedImages > 1 ? 's' : ''}`
          : '';
        toast.success(`${items.length} piezas creadas en el calendario${imageMessage}`);

        if (failedImages) {
          toast.error(
            `${failedImages} imagen${failedImages > 1 ? 'es' : ''} no se pudieron generar.`
          );
        }
      } catch (error) {
        toast.error('No se pudieron crear todas las piezas');
        throw error;
      }
    },
    [clientId, createEvent]
  );

  const handleImportRows = useCallback(
    async rows => {
      for (const row of rows) {
        await createEvent({
          title: row.title,
          copy: row.copy || '',
          channel: row.channel || 'IG',
          status: row.status || 'en-diseño',
          scheduled_at: row.scheduled_at,
          description: row.description || null,
        });
      }
    },
    [createEvent]
  );

  // Estados de carga y error
  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='bg-red-955/20 border border-red-900/30 rounded-lg p-4 max-w-md mx-auto'>
          <p className='text-red-400 font-medium'>Error al cargar el calendario</p>
          <p className='text-red-300 text-sm mt-1'>{error}</p>
          <button
            onClick={loadEvents}
            className='mt-3 px-4 py-2 bg-red-900/40 border border-red-500/20 text-red-200 hover:bg-red-900/60 rounded-lg transition-colors'
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='calendar-container h-full'>
      {/* Header rediseñado con mejor jerarquía sólida */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='hidden'
      >
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
          {/* Título y contexto */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-1.5 h-8 bg-gray-500 rounded-full'></div>
              <div>
                <h1 className='text-3xl font-bold text-white tracking-tight'>
                  Cronograma de Contenidos
                </h1>
                {client && (
                  <div className='flex items-center gap-2 mt-2'>
                    <span className='w-2 h-2 bg-emerald-500 rounded-full opacity-70'></span>
                    <p className='text-gray-300 font-medium'>{client.name}</p>
                    <span className='text-gray-500'>•</span>
                    <p className='text-gray-400 text-sm'>{visibleStats.total} eventos visibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones principales */}
          <div className='flex items-center gap-4'>
            {/* Quick stats */}
            <div className='hidden md:flex items-center gap-4 px-4 py-2 bg-surface-soft rounded-lg border border-white/5'>
              <div className='text-center'>
                <div className='text-lg font-bold text-orange-400'>
                  {visibleStats.byStatus['en-diseño'] || 0}
                </div>
                <div className='text-xs text-gray-400'>En Diseño</div>
              </div>
              <div className='w-px h-8 bg-white/10'></div>
              <div className='text-center'>
                <div className='text-lg font-bold text-blue-400'>
                  {visibleStats.byStatus['en-progreso'] || 0}
                </div>
                <div className='text-xs text-gray-400'>En Producción</div>
              </div>
              <div className='w-px h-8 bg-white/10'></div>
              <div className='text-center'>
                <div className='text-lg font-bold text-emerald-400'>
                  {visibleStats.byStatus['aprobado'] || 0}
                </div>
                <div className='text-xs text-gray-400'>Aprobados</div>
              </div>
            </div>

            {/* Botón principal mejorado sin gradientes */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDateClick(getCurrentDate())}
              className='px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-colors duration-200'
            >
              <div className='flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                <span>Nuevo Evento</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`px-6 py-3 rounded-xl border font-semibold transition-all duration-200 flex items-center gap-2
                ${
                  isChatOpen
                    ? 'bg-[#7C5CFC] text-white border-[#7C5CFC]/30 shadow-[0_0_15px_rgba(124,92,252,0.4)]'
                    : 'bg-surface-soft hover:bg-white/10 text-text-primary border-white/10'
                }`}
            >
              <SparklesIcon className={`w-5 h-5 ${isChatOpen ? 'text-white' : 'text-purple-400'}`} />
              <span>Copiloto Aura</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAIGeneratorOpen(true)}
              className='px-6 py-3 bg-surface-soft hover:bg-white/10 text-text-primary font-semibold rounded-xl border border-white/10 transition-colors duration-200'
            >
              Generar con IA
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsImportOpen(true)}
              className='px-6 py-3 bg-surface-soft hover:bg-white/10 text-text-primary font-semibold rounded-xl border border-white/10 transition-colors duration-200'
            >
              Importar archivo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearMonthSchedule}
              className='px-6 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 font-semibold rounded-xl border border-red-500/20 transition-colors duration-200'
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                <span>Limpiar Cronograma</span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas sutiles y compactas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className='hidden'
      >
        <div className='flex flex-wrap items-center gap-3 px-4 py-3 bg-surface border border-border-subtle rounded-lg'>
          {/* Total */}
          <div className='flex items-center gap-2 px-3 py-2 bg-surface-strong border border-border-subtle rounded-lg transition-all duration-200'>
            <div className='w-8 h-8 bg-white/5 rounded-md flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs font-medium text-text-muted'>Total</p>
              <p className='text-lg font-bold text-text-primary'>{visibleStats.total}</p>
            </div>
          </div>

          {/* En Diseño */}
          <div className='flex items-center gap-2 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-lg transition-all duration-200'>
            <div className='w-8 h-8 bg-orange-500/10 rounded-md flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-orange-300/80'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs font-medium text-orange-600/70 dark:text-orange-300/60'>En Diseño</p>
              <p className='text-lg font-bold text-orange-600 dark:text-orange-300'>
                {visibleStats.byStatus['en-diseño'] || 0}
              </p>
            </div>
          </div>

          {/* En Producción */}
          <div className='flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg transition-all duration-200'>
            <div className='w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-blue-300/80'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs font-medium text-blue-600/70 dark:text-blue-300/60'>En Producción</p>
              <p className='text-lg font-bold text-blue-600 dark:text-blue-300'>
                {visibleStats.byStatus['en-progreso'] || 0}
              </p>
            </div>
          </div>

          {/* Aprobado */}
          <div className='flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg transition-all duration-200'>
            <div className='w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-emerald-300/80'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs font-medium text-emerald-600/70 dark:text-emerald-300/60'>Aprobado</p>
              <p className='text-lg font-bold text-emerald-600 dark:text-emerald-300'>
                {visibleStats.byStatus['aprobado'] || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Centro: calendario principal ampliado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`w-full min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isChatOpen ? 'xl:mr-[33.333333%]' : 'xl:mr-0'
        }`}
      >
        <div
          className={`relative flex h-[calc(100dvh-6.25rem)] md:h-[calc(100dvh-6.5rem)] flex-col overflow-hidden bg-transparent p-0 shadow-none transition-colors ${
            isCalendarDragOver
              ? 'ring-1 ring-[color:var(--color-accent-blue)] bg-surface-soft'
              : ''
          }`}
          onDragOver={handleCalendarDragOver}
          onDragLeave={handleCalendarDragLeave}
          onDrop={handleCalendarDrop}
        >
          {/* Overlay de Drag and Drop Premium Inmersivo */}
          <AnimatePresence>
            {isCalendarDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='absolute inset-0 z-30 rounded-2xl border-2 border-dashed border-rose-500/50 bg-surface/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none gap-4 p-6 text-center shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]'
              >
                {/* Aura brillante de fondo */}
                <div className='absolute -z-10 w-48 h-48 rounded-full bg-rose-500/10 blur-[80px]' />

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className='w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400'
                >
                  <ArrowUpTrayIcon className='w-7 h-7 rotate-180 text-rose-300' />
                </motion.div>

                <div className='space-y-1.5'>
                  <h3 className='text-lg font-extrabold text-text-primary tracking-wide uppercase font-sans'>
                    ¡Suelta tus archivos aquí!
                  </h3>
                  <p className='text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto'>
                    Las imágenes o videos se anclarán y previsualizarán de forma automática en este día del calendario.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <FullCalendarWrapper
            key={`${currentDate.getTime()}-${currentView}-${isChatOpen ? 'chat' : 'full'}`}
            events={events}
            currentDate={currentDate}
            currentView={currentView}
            loading={loading}
            onDateChange={handleDateChange}
            onViewChange={handleViewChange}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onEventDrop={handleEventDrop}
            height='100%'
            className='flex-1 min-h-0'
            clientName={client?.name || ''}
            isChatOpen={isChatOpen}
          />
        </div>
      </motion.div>

      {/* Modales */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        selectedEvent={selectedEvent}
        clientId={clientId}
        isReadOnly={isReadOnly}
        createEvent={createEvent}
        updateEvent={updateEvent}
        deleteEvent={deleteEvent}
        loadEvents={loadEvents}
        initialDate={modalInitialDate}
      />

      {/* Botón flotante para Generar con IA premium - Emerald style */}
      <motion.button
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAIGeneratorOpen(true)}
        className='fixed bottom-20 md:bottom-8 right-6 z-40 h-12 rounded-full px-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:text-white shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 font-semibold text-sm hover:from-emerald-500/25 hover:via-teal-500/25 hover:to-cyan-500/25 relative'
        style={{
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
        }}
        title='Generar cronograma completo con IA'
      >
        {isAiGenerating ? (
          <>
            <div className='w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0' />
            <span>Generando...</span>
          </>
        ) : (
          <>
            <SparklesIcon className='h-5 w-5 animate-pulse text-emerald-400 shrink-0' />
            <span>Generar IA</span>
          </>
        )}

        {aiIdeasCount > 0 && !isAiGenerating && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
            {aiIdeasCount}
          </span>
        )}
      </motion.button>

      {/* QuickTaskPopover - Nuevo sistema de creación de tareas */}
      <QuickTaskPopover
        isOpen={isQuickTaskOpen}
        onClose={handleCloseQuickTask}
        clickCoords={clickCoords}
        selectedDate={quickTaskDate}
        clientId={clientId}
        onCreateTask={handleCreateQuickTask}
      />

      <AIContentGenerator
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        clientId={clientId}
        currentDate={currentDate}
        existingEvents={events}
        onCreateItems={handleCreateAIItems}
        clientName={client?.name}
      />

      <ScheduleImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportRows}
      />

      <ShareApprovalModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        clientId={clientId}
        clientName={client?.name || ''}
      />

      {/* Notificación flotante de Ajustes del Cliente */}
      <AnimatePresence>
        {feedbackEventsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className='fixed bottom-6 left-6 z-50 max-w-sm rounded-2xl border border-[#fe0979]/30 bg-[#161517]/95 p-4 shadow-[0_8px_32px_rgba(254,9,121,0.2)] backdrop-blur-md flex items-start gap-3.5'
          >
            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-[#fe0979]/10 border border-[#fe0979]/30 flex items-center justify-center text-[#fe0979] animate-pulse'>
              💬
            </div>
            <div className='flex-1 min-w-0'>
              <h4 className='text-xs font-bold text-white uppercase tracking-wider'>
                Ajustes Solicitados
              </h4>
              <p className='text-xs text-gray-300 mt-1 leading-relaxed font-sans'>
                El cliente ha solicitado {feedbackEventsCount} ajuste{feedbackEventsCount > 1 ? 's' : ''} en las publicaciones de este mes.
              </p>
            </div>
            <button
              onClick={() => {
                toast.success('Los ajustes están destacados con la etiqueta "Ajuste Solicitado" en rojo.');
              }}
              className='text-[10px] font-bold text-[#fe0979] hover:underline self-center px-1 py-0.5'
            >
              Ver
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copiloto Aura Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <AgentChatPanel
            clientId={clientId}
            agent={{ id: 'schedule' }}
            onClose={() => setIsChatOpen(false)}
            client={client}
          />
        )}
      </AnimatePresence>

      {/* Panel Deslizable de Entregables (Galería Multimedia) */}
      <AnimatePresence>
        {isDeliverablesOpen && (
          <>
            {/* Fondo Oscuro Semi-transparente */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeliverablesOpen(false)}
              className='fixed inset-0 bg-black/70 backdrop-blur-sm z-40 cursor-pointer'
            />

            {/* Panel Deslizable (Ancho premium para galería) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 180 }}
              className='fixed top-0 right-0 h-full w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-[#0b0b0d]/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 shadow-2xl flex flex-col overflow-hidden'
            >
              <div className='flex items-center justify-between pb-4 border-b border-white/10 mb-6 flex-shrink-0'>
                <div className='flex items-center space-x-2 text-primary-400'>
                  <PhotoIcon className='h-5 w-5 text-blue-400' />
                  <h3 className='font-bold text-text-primary text-base'>
                    Galería de Entregables y Multimedia
                  </h3>
                </div>
                <button
                  onClick={() => setIsDeliverablesOpen(false)}
                  className='p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary'
                >
                  <XMarkIcon className='h-5 w-5' />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto min-h-0 pr-1'>
                <DeliverableGallery clientId={clientId} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
