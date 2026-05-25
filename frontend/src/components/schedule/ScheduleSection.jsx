import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, PlusIcon, SparklesIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { ShareApprovalModal } from './ShareApprovalModal';
import { getCurrentDate } from '../../utils/dateHelpers';
import QuickTaskPopover from './QuickTaskPopover';

// Importaciones de FullCalendar
import FullCalendarWrapper from './FullCalendarWrapper';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Componentes existentes
import { MiniMonth } from './MiniMonth';
import { MonthAgenda } from './MonthAgenda';
import { AIContentGenerator } from './AIContentGenerator';
import { ScheduleImportModal } from './ScheduleImportModal';

// Estilos
import '../../styles/fullcalendar-custom.css';
import { getClientById } from '../../api/clients';
import { uploadScheduleAsset, getScheduleItemAssetsWithPreview, generateImageForEvent } from '../../api/schedule';
import { generateIdeas } from '../../api/ai';

const toDateInputValue = date => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeFormat = (formatStr) => {
  if (!formatStr) return 'Post Estático';
  const s = formatStr.toLowerCase();
  if (s.includes('reel') || s.includes('tiktok') || s.includes('short') || s.includes('video')) return 'Reel / TikTok';
  if (s.includes('carrusel') || s.includes('carousel')) return 'Carrusel';
  if (s.includes('historia') || s.includes('story')) return 'Historia';
  if (s.includes('entrevista')) return 'Entrevista';
  if (s.includes('influencer')) return 'Video Influencer';
  if (s.includes('cobertura')) return 'Cobertura de Evento';
  if (s.includes('estatico') || s.includes('post') || s.includes('imagen')) return 'Post Estático';
  return 'Post Estático';
};

const normalizePlatform = (channel) => {
  if (!channel) return 'Instagram';
  const c = channel.toUpperCase();
  if (c === 'IG' || c.includes('INSTAGRAM')) return 'Instagram';
  if (c === 'TIKTOK' || c.includes('TIKTOK')) return 'TikTok';
  if (c === 'YT' || c.includes('YOUTUBE') || c.includes('SHORTS')) return 'YouTube';
  if (c === 'FB' || c.includes('FACEBOOK')) return 'Facebook';
  if (c === 'LI' || c.includes('LINKEDIN')) return 'LinkedIn';
  return 'Instagram';
};

/**
 * Componente de calendario renovado con FullCalendar
 * Implementa todas las mejores prácticas y funcionalidades optimizadas
 */
export const ScheduleSection = ({ clientId }) => {
  // Estados del componente
  const [client, setClient] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate());
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const isChatOpen = false;
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCalendarDragOver, setIsCalendarDragOver] = useState(false);
  const [eventAssets, setEventAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isGeneratingEventAI, setIsGeneratingEventAI] = useState(false);
  const [isEventAIGenOpen, setIsEventAIGenOpen] = useState(false);
  const [eventAIPrompt, setEventAIPrompt] = useState('');
  const [eventAIAspectRatio, setEventAIAspectRatio] = useState('1:1');
  const [isGeneratingEventImage, setIsGeneratingEventImage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mockupTab, setMockupTab] = useState('Instagram');
  
  // Estados para el nuevo popover
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskDate, setQuickTaskDate] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    status: 'en-diseño',
    copy: '',
    channel: 'IG',
    creative_idea: '',
    goal: '',
    format: 'Carrusel',
    platforms: 'Instagram',
    description: ''
  });

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
    moveEvent
  } = useCalendarEvents(clientId);

  // Calcular estadísticas basadas en eventos visibles del calendario (simplificado a los 3 estados principales)
  const calculateVisibleStats = () => {
    const total = events.length;
    const byStatus = {
      'en-diseño': 0,
      'en-progreso': 0,
      'aprobado': 0
    };
    
    events.forEach(event => {
      let status = (event.resource?.status || event.status || 'en-diseño').toLowerCase();
      
      // Mapear estados a los 3 principales
      if (status === 'planificacion' || status === 'pendiente' || status === 'en-diseño' || status === 'en-diseno' || status === 'requiere-cambios' || status === 'cancelado') {
        byStatus['en-diseño'] = (byStatus['en-diseño'] || 0) + 1;
      } else if (status === 'en-progreso' || status === 'en-revision' || status === 'esperando-aprobacion' || status === 'pausado') {
        byStatus['en-progreso'] = (byStatus['en-progreso'] || 0) + 1;
      } else {
        byStatus['aprobado'] = (byStatus['aprobado'] || 0) + 1;
      }
    });

    return {
      total,
      byStatus
    };
  };

  const visibleStats = calculateVisibleStats();

  // Cargar datos iniciales - memoizar loadInitialData
  const loadInitialData = useCallback(async () => {
    try {
      if (clientId) {
        const [clientResponse] = await Promise.all([
          getClientById(clientId),
          loadEvents()
        ]);
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
    const loadAssets = async () => {
      if (!isModalOpen || !selectedEvent?.id) {
        setEventAssets([]);
        return;
      }
      try {
        setIsLoadingAssets(true);
        const assets = await getScheduleItemAssetsWithPreview(clientId, selectedEvent.id);
        setEventAssets(assets);
      } catch (_error) {
        setEventAssets([]);
      } finally {
        setIsLoadingAssets(false);
      }
    };
    loadAssets();
  }, [isModalOpen, selectedEvent, clientId]);

  // Handlers del calendario - memoizados para evitar re-renders
  const handleDateClick = useCallback((date, clickInfo) => {
    const clickedDate = date instanceof Date ? date : new Date(date);
    const safeDate = Number.isNaN(clickedDate.getTime()) ? getCurrentDate() : clickedDate;

    setSelectedEvent(null);
    setEventAssets([]);
    setIsQuickTaskOpen(false);
    setQuickTaskDate(safeDate);
    setClickCoords(clickInfo?.clickCoords || null);
    setFormData({
      title: '',
      date: toDateInputValue(safeDate),
      time: '09:00',
      status: 'en-diseño',
      copy: '',
      channel: 'IG',
      creative_idea: '',
      goal: '',
      format: 'Carrusel',
      platforms: 'Instagram',
      description: ''
    });
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    try {
      const d = event.start ? new Date(event.start) : getCurrentDate();
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');

      setSelectedEvent(event);
      setFormData({
        title: event.title || '',
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        status: event.extendedProps?.status || 'en-diseño',
        copy: event.extendedProps?.copy || '',
        channel: event.extendedProps?.channel || 'IG',
        creative_idea: event.extendedProps?.creative_idea || '',
        goal: event.extendedProps?.goal || '',
        format: event.extendedProps?.format || 'Carrusel',
        platforms: event.extendedProps?.platforms || 'Instagram',
        description: event.extendedProps?.description || ''
      });
      setIsModalOpen(true);
    } catch {
      setSelectedEvent(event);
      setFormData(prev => ({
        title: prev.title ?? (event?.title || ''),
        date: prev.date || '',
        time: prev.time || '09:00',
        status: prev.status || (event?.extendedProps?.status || 'en-diseño'),
        copy: typeof prev.copy === 'string' ? prev.copy : (event?.extendedProps?.copy || ''),
        channel: prev.channel || 'IG',
        creative_idea: event?.extendedProps?.creative_idea || '',
        goal: event?.extendedProps?.goal || '',
        format: event?.extendedProps?.format || 'Carrusel',
        platforms: event?.extendedProps?.platforms || 'Instagram',
        description: event?.extendedProps?.description || ''
      }));
      setIsModalOpen(true);
    }
  }, []);

  const handleEventDrop = useCallback(async (event) => {
    try {
      await moveEvent(event.id, event.start, event.end);
    } catch (err) {
      // El hook maneja el error y recarga
    }
  }, [moveEvent]);

  const handleViewChange = useCallback((viewType) => {
    setCurrentView(viewType);
  }, []);

  const handleDateChange = useCallback((start) => {
    if (start && Math.abs(start.getTime() - currentDate.getTime()) > 24 * 60 * 60 * 1000) {
      setCurrentDate(start);
    }
  }, [currentDate]);

  // Formulario handlers - memoizados
  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.date || !formData.time) {
        toast.error('Completa título, fecha y hora');
        return;
      }

      const scheduled_at = new Date(`${formData.date}T${formData.time}:00`);
      const eventData = {
        title: formData.title,
        status: formData.status,
        scheduled_at: scheduled_at.toISOString(),
        copy: formData.copy || '',
        channel: formData.channel || 'IG',
        creative_idea: formData.creative_idea || '',
        goal: formData.goal || '',
        format: formData.format || 'Carrusel',
        platforms: formData.platforms || 'Instagram',
        description: formData.description || ''
      };

      if (selectedEvent?.id) {
        await updateEvent(selectedEvent.id, eventData);
        toast.success('Evento actualizado');
      } else {
        await createEvent(eventData);
        toast.success('Evento creado');
      }
      closeModal();
    } catch (err) {
      // El hook ya maneja los errores
    }
  }, [formData, selectedEvent, createEvent, updateEvent]);

  const handleDeleteEvent = useCallback(async () => {
    if (selectedEvent && window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteEvent(selectedEvent.id);
        closeModal();
        setIsEventDetailOpen(false);
      } catch (err) {
        // El hook ya maneja los errores
      }
    }
  }, [selectedEvent, deleteEvent]);

  const handleClearMonthSchedule = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthsNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
    const handleViewEvent = (e) => {
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
    window.dispatchEvent(new CustomEvent('cadence:calendar-view-changed', { detail: { view: currentView } }));
  }, [currentView]);

  // Escuchar acciones disparadas desde el Header (menú de tres puntos)
  useEffect(() => {
    const handleActionEvent = (e) => {
      const action = e.detail?.action;
      if (action === 'import') {
        setIsImportOpen(true);
      } else if (action === 'share') {
        setIsShareModalOpen(true);
      } else if (action === 'clear') {
        handleClearAllSchedule();
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

  const handleGenerateEventIdea = useCallback(async () => {
    if (!formData.date) {
      toast.error('Elegi una fecha antes de generar con IA.');
      return;
    }

    const selectedDay = new Date(`${formData.date}T12:00:00`);
    const dateLabel = Number.isNaN(selectedDay.getTime())
      ? formData.date
      : selectedDay.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

    setIsGeneratingEventAI(true);
    try {
      const response = await generateIdeas(clientId, {
        userPrompt: [
          `Genera una unica idea de posteo para la fecha exacta ${dateLabel}.`,
          formData.title?.trim() ? `Tema inicial o titulo del usuario: ${formData.title.trim()}.` : '',
          formData.copy?.trim() ? `Copy o borrador actual: ${formData.copy.trim()}.` : '',
          `Canal preferido: ${formData.channel || 'IG'}.`,
          'La idea debe incluir titulo, copy completo, formato sugerido, objetivo y CTA.'
        ].filter(Boolean).join(' '),
        monthContext: [
          `Fecha objetivo exacta: ${formData.date}`,
          `Canal seleccionado: ${formData.channel || 'IG'}`,
          'Generacion desde modal de creacion de evento puntual.'
        ],
        quantity: 1,
        targetDate: formData.date,
      });

      const idea = Array.isArray(response) ? response[0] : response?.ideas?.[0];
      if (!idea) {
        toast.error('La IA no devolvio una idea para esta fecha.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: idea.title || prev.title,
        copy: idea.copy || prev.copy || '',
        creative_idea: idea.title || prev.creative_idea || '',
        goal: idea.objective || idea.goal || prev.goal || '',
        format: normalizeFormat(idea.format) || prev.format || 'Carrusel',
        platforms: normalizePlatform(idea.channel) || prev.platforms || 'Instagram',
        channel: idea.channel || prev.channel || 'IG',
        status: idea.status || prev.status || 'en-diseño',
        date: formData.date,
      }));
      toast.success('Idea generada para esta fecha.');
    } catch (error) {
      toast.error(error.message || 'No se pudo generar contenido con IA.');
    } finally {
      setIsGeneratingEventAI(false);
    }
  }, [clientId, formData]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
    setEventAssets([]);
    setIsGeneratingEventAI(false);
    setIsEventAIGenOpen(false);
    setEventAIPrompt('');
    setEventAIAspectRatio('1:1');
    setIsGeneratingEventImage(false);
    setFormData({
      title: '',
      date: '',
      time: '09:00',
      status: 'en-diseño',
      copy: '',
      channel: 'IG',
      creative_idea: '',
      goal: '',
      format: 'Carrusel',
      platforms: 'Instagram',
      description: ''
    });
  }, []);

  const inferFormatFromFiles = files => {
    if (!files?.length) return 'Post';
    if (files.length > 1) return 'Carrusel';
    const type = files[0]?.type || '';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('image/')) return 'Imagen';
    return 'Post';
  };

  const buildDraftFromEvent = (eventLike) => {
    const d = eventLike.start ? new Date(eventLike.start) : getCurrentDate();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return {
      title: eventLike.title || '',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      status: 'en-diseño',
      copy: eventLike.extendedProps?.copy || '',
      channel: eventLike.extendedProps?.channel || 'IG',
    };
  };

  const handleCalendarDragOver = useCallback((e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    setIsCalendarDragOver(true);
  }, []);

  const handleCalendarDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsCalendarDragOver(false);
    }
  }, []);

  const handleCalendarDrop = useCallback(async (e) => {
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
    const titleBase = firstName.includes('.') ? firstName.slice(0, firstName.lastIndexOf('.')) : firstName;
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
      setFormData(buildDraftFromEvent(eventLike));
      setIsModalOpen(true);
      toast.success(`Contenido anclado al calendario (${files.length} archivo${files.length > 1 ? 's' : ''}).`);
    } catch (error) {
      toast.error(error.message || 'No se pudo anclar el contenido al calendario.');
    }
  }, [clientId, createEvent, currentDate]);

  // Handler para crear tareas desde el QuickTaskPopover
  const handleCreateQuickTask = useCallback(async (taskData) => {
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
  }, [createEvent]);

  // Handler para cerrar el QuickTaskPopover
  const handleCloseQuickTask = useCallback(() => {
    setIsQuickTaskOpen(false);
    setQuickTaskDate(null);
    setClickCoords(null);
  }, []);

  const handleCreateAIItems = useCallback(async (items) => {
    let generatedImages = 0;
    let failedImages = 0;

    try {
      for (const item of items) {
        const {
          generateImage,
          imagePrompt,
          imageAspectRatio,
          ...eventData
        } = item;
        const createdEvent = await createEvent(eventData);

        if (generateImage && createdEvent?.id) {
          try {
            await generateImageForEvent(clientId, createdEvent.id, {
              prompt: imagePrompt || [
                `Imagen para el post "${eventData.title}".`,
                eventData.description || eventData.copy || '',
                `Canal: ${eventData.channel || 'IG'}.`
              ].filter(Boolean).join(' '),
              aspectRatio: imageAspectRatio || '1:1'
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
        toast.error(`${failedImages} imagen${failedImages > 1 ? 'es' : ''} no se pudieron generar.`);
      }
    } catch (error) {
      toast.error('No se pudieron crear todas las piezas');
      throw error;
    }
  }, [clientId, createEvent]);

  const handleImportRows = useCallback(async (rows) => {
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
  }, [createEvent]);

  // Estados de carga y error
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-955/20 border border-red-900/30 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-400 font-medium">Error al cargar el calendario</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button 
            onClick={loadEvents}
            className="mt-3 px-4 py-2 bg-red-900/40 border border-red-500/20 text-red-200 hover:bg-red-900/60 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="calendar-container"
    >
      {/* Header rediseñado con mejor jerarquía sólida */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Título y contexto */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gray-500 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Cronograma de Contenidos
                </h1>
                {client && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full opacity-70"></span>
                    <p className="text-gray-300 font-medium">
                      {client.name}
                    </p>
                    <span className="text-gray-500">•</span>
                    <p className="text-gray-400 text-sm">
                      {visibleStats.total} eventos visibles
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Acciones principales */}
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-surface-soft rounded-lg border border-white/5">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{visibleStats.byStatus['en-diseño'] || 0}</div>
                <div className="text-xs text-gray-400">En Diseño</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{visibleStats.byStatus['en-progreso'] || 0}</div>
                <div className="text-xs text-gray-400">En Producción</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{visibleStats.byStatus['aprobado'] || 0}</div>
                <div className="text-xs text-gray-400">Aprobados</div>
              </div>
            </div>
            
            {/* Botón principal mejorado sin gradientes */}
	            <motion.button
	              whileHover={{ scale: 1.02 }}
	              whileTap={{ scale: 0.98 }}
	              onClick={() => handleDateClick(getCurrentDate())}
	              className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-colors duration-200"
	            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
	                <span>Nuevo Evento</span>
	              </div>
	            </motion.button>
	            <motion.button
	              whileHover={{ scale: 1.02 }}
	              whileTap={{ scale: 0.98 }}
	              onClick={() => setIsAIGeneratorOpen(true)}
	              className="px-6 py-3 bg-surface-soft hover:bg-white/10 text-text-primary font-semibold rounded-xl border border-white/10 transition-colors duration-200"
	            >
	              Generar con IA
	            </motion.button>
	            <motion.button
	              whileHover={{ scale: 1.02 }}
	              whileTap={{ scale: 0.98 }}
	              onClick={() => setIsImportOpen(true)}
	              className="px-6 py-3 bg-surface-soft hover:bg-white/10 text-text-primary font-semibold rounded-xl border border-white/10 transition-colors duration-200"
	            >
	              Importar archivo
	            </motion.button>
	            <motion.button
	              whileHover={{ scale: 1.02 }}
	              whileTap={{ scale: 0.98 }}
	              onClick={handleClearMonthSchedule}
	              className="px-6 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 font-semibold rounded-xl border border-red-500/20 transition-colors duration-200"
	            >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        className="hidden"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface border border-white/10 rounded-lg">
          {/* Total */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#222024] border border-white/5 rounded-lg transition-all duration-200">
            <div className="w-8 h-8 bg-white/5 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{visibleStats.total}</p>
            </div>
          </div>

          {/* En Diseño */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2b2824] border border-orange-500/10 rounded-lg transition-all duration-200">
            <div className="w-8 h-8 bg-orange-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-orange-300/60">En Diseño</p>
              <p className="text-lg font-bold text-orange-300">{visibleStats.byStatus['en-diseño'] || 0}</p>
            </div>
          </div>

          {/* En Producción */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#24272c] border border-blue-500/10 rounded-lg transition-all duration-200">
            <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-300/60">En Producción</p>
              <p className="text-lg font-bold text-blue-300">{visibleStats.byStatus['en-progreso'] || 0}</p>
            </div>
          </div>

          {/* Aprobado */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#242926] border border-emerald-500/10 rounded-lg transition-all duration-200">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-300/60">Aprobado</p>
              <p className="text-lg font-bold text-emerald-300">{visibleStats.byStatus['aprobado'] || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="flex flex-col xl:flex-row gap-4 transition-all duration-300">
        {/* Izquierda: mini calendario */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:w-64 xl:flex-shrink-0 xl:max-h-[calc(100vh-4.5rem)] xl:overflow-y-auto"
        >
          <MiniMonth 
            currentDate={currentDate}
            onNavigate={setCurrentDate}
            events={events}
          />
          {/* Agenda mensual bajo el mini calendario */}
          <MonthAgenda
            events={events}
            currentDate={currentDate}
            loading={loading}
            onEventClick={handleEventClick}
          />
        </motion.div>

        {/* Centro: calendario principal ampliado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isChatOpen ? 'xl:mr-[33.333333%]' : 'xl:mr-0'
          }`}
        >
          <div
            className={`flex h-[calc(100vh-4.5rem)] flex-col overflow-hidden bg-transparent p-0 shadow-none transition-colors ${
              isCalendarDragOver ? 'ring-1 ring-[color:var(--color-accent-blue)] bg-surface-soft' : ''
            }`}
            onDragOver={handleCalendarDragOver}
            onDragLeave={handleCalendarDragLeave}
            onDrop={handleCalendarDrop}
          >
            {isCalendarDragOver && (
              <div className="mb-3 rounded-lg border border-[color:var(--color-accent-blue)] bg-[color:var(--color-accent-blue)]/10 px-3 py-2 text-sm text-text-primary">
                Suelta archivos para anclarlos a esta fecha del calendario.
              </div>
            )}
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
              height="100%"
              className="flex-1 min-h-0"
              clientName={client?.name || ''}
              isChatOpen={isChatOpen}
            />
          </div>
        </motion.div>
      </div>

      {/* Modales */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child 
            as={Fragment} 
            enter="ease-out duration-200" 
            enterFrom="opacity-0" 
            enterTo="opacity-100" 
            leave="ease-in duration-150" 
            leaveFrom="opacity-100" 
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child 
                as={Fragment} 
                enter="ease-out duration-200" 
                enterFrom="opacity-0 scale-95" 
                enterTo="opacity-100 scale-100" 
                leave="ease-in duration-150" 
                leaveFrom="opacity-100 scale-100" 
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-6xl bg-[#161517] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all duration-300">
                  {/* Header */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-white/5 pb-5">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {selectedEvent ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <span>Editar Evento</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Nuevo Evento</span>
                          </>
                        )}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-400">
                        {formData.date ? `Fecha seleccionada: ${formData.date}` : 'Elegí una fecha para programar el contenido.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={handleGenerateEventIdea}
                        disabled={isGeneratingEventAI || !formData.date}
                        whileHover={!isGeneratingEventAI ? { scale: 1.02 } : {}}
                        whileTap={!isGeneratingEventAI ? { scale: 0.98 } : {}}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                      >
                        {isGeneratingEventAI ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>Generando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.75 11 7l3.25 1.25L11 9.5l-1.25 3.25L8.5 9.5 5.25 8.25 8.5 7l1.25-3.25ZM17 12l.8 2.2L20 15l-2.2.8L17 18l-.8-2.2L14 15l2.2-.8L17 12Z" />
                            </svg>
                            <span>Generar Idea con IA</span>
                          </>
                        )}
                      </motion.button>
                      
                      <button
                        type="button"
                        onClick={closeModal}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                        aria-label="Cerrar modal"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleFormSubmit}>
                    {/* Dos Columnas Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Columna Izquierda: Formulario (col-span-7) */}
                    <div className="lg:col-span-7 space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                      
                      {selectedEvent?.extendedProps?.client_feedback && (
                        <div className="rounded-xl bg-[#fe0979]/10 border border-[#fe0979]/20 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#fe0979] uppercase tracking-wider">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Ajustes Solicitados por el Cliente
                          </div>
                          <p className="text-xs text-gray-300 italic leading-relaxed pl-6">
                            "{selectedEvent.extendedProps.client_feedback}"
                          </p>
                        </div>
                      )}

                      {/* Grupo 1: Datos Básicos */}
                      <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">1. Planificación General</h3>
                        
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-300">Título del Post</label>
                          <input 
                            type="text" 
                            value={formData.title} 
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                            className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all shadow-inner" 
                            placeholder="Nombre explicativo del evento" 
                            required 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Idea Creativa (Concepto)</label>
                            <input 
                              type="text" 
                              value={formData.creative_idea || ''} 
                              onChange={(e) => setFormData(prev => ({ ...prev, creative_idea: e.target.value }))} 
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all" 
                              placeholder="Ej: Infografía de cómo cuidar la salud" 
                            />
                          </div>
                          
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Objetivo del Post</label>
                            <input 
                              type="text" 
                              value={formData.goal || ''} 
                              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))} 
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all" 
                              placeholder="Ej: Captar leads, interacción, etc." 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Formato de Publicación</label>
                            <select
                              value={formData.format || 'Carrusel'}
                              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              {['Historia', 'Carrusel', 'Reel / TikTok', 'Entrevista', 'Video Influencer', 'Cobertura de Evento', 'Post Estático'].map(f => (
                                <option key={f} value={f} className="bg-[#161517] text-white">{f}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Prioridad</label>
                            <select
                              value={formData.priority || 'medium'}
                              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              <option value="low" className="bg-[#161517] text-white">Baja</option>
                              <option value="medium" className="bg-[#161517] text-white">Media</option>
                              <option value="high" className="bg-[#161517] text-white">Alta</option>
                              <option value="urgente" className="bg-[#161517] text-white">Urgente</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Grupo 2: Canales y Programación */}
                      <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">2. Canales, Programación y Estado</h3>
                        
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-gray-300">Plataformas Destino (Multi-selección)</label>
                          <div className="flex flex-wrap gap-2.5">
                            {['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'].map(p => {
                              const active = formData.platforms ? formData.platforms.split(', ').includes(p) : p === 'Instagram';
                              
                              // Native brand color gradients
                              const colors = {
                                'Instagram': active ? 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white border-transparent' : 'bg-[#222024] hover:bg-white/5 text-gray-400 border-white/10',
                                'TikTok': active ? 'bg-black text-white border-[#00f2fe]' : 'bg-[#222024] hover:bg-white/5 text-gray-400 border-white/10',
                                'YouTube': active ? 'bg-red-600 text-white border-transparent' : 'bg-[#222024] hover:bg-white/5 text-gray-400 border-white/10',
                                'Facebook': active ? 'bg-blue-600 text-white border-transparent' : 'bg-[#222024] hover:bg-white/5 text-gray-400 border-white/10',
                                'LinkedIn': active ? 'bg-[#0077b5] text-white border-transparent' : 'bg-[#222024] hover:bg-white/5 text-gray-400 border-white/10'
                              };

                              return (
                                <motion.button
                                  key={p}
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const activePlats = formData.platforms ? formData.platforms.split(', ').filter(Boolean) : ['Instagram'];
                                    let newPlats;
                                    if (activePlats.includes(p)) {
                                      newPlats = activePlats.filter(item => item !== p);
                                    } else {
                                      newPlats = [...activePlats, p];
                                    }
                                    const resultStr = newPlats.join(', ') || 'Instagram';
                                    setFormData(prev => ({ ...prev, platforms: resultStr }));
                                    setMockupTab(p);
                                  }}
                                  className={`rounded-xl px-4 py-2 text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${colors[p]}`}
                                >
                                  <span>{p}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Fecha de Publicación</label>
                            <input 
                              type="date" 
                              value={formData.date} 
                              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all" 
                              required 
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Hora</label>
                            <input 
                              type="time" 
                              value={formData.time} 
                              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} 
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all" 
                              required 
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Estado de la Publicación</label>
                            <select 
                              value={formData.status} 
                              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} 
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              <option value="en-diseño" className="bg-[#161517] text-white">En Diseño</option>
                              <option value="en-progreso" className="bg-[#161517] text-white">En Producción</option>
                              <option value="aprobado" className="bg-[#161517] text-white">Aprobado</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Canal Principal (Reportes)</label>
                            <select
                              value={formData.channel || 'IG'}
                              onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              <option value="IG" className="bg-[#161517] text-white">Instagram</option>
                              <option value="TikTok" className="bg-[#161517] text-white">TikTok</option>
                              <option value="YT" className="bg-[#161517] text-white">YouTube</option>
                              <option value="FB" className="bg-[#161517] text-white">Facebook</option>
                              <option value="LI" className="bg-[#161517] text-white">LinkedIn</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Grupo 3: Copy del Post */}
                      <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">3. Copy de la Publicación</h3>
                        </div>
                        
                        <div className="relative">
                          <textarea
                            rows={4}
                            maxLength={2000}
                            value={formData.copy}
                            onChange={(e) => setFormData(prev => ({ ...prev, copy: e.target.value }))}
                            className="w-full rounded-xl border border-white/10 bg-[#222024] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all resize-none min-h-[100px] pr-2 custom-scrollbar font-sans leading-relaxed"
                            placeholder="Redacta el texto del posteo para copiar y pegar directamente en las redes (puedes usar emojis y hashtags)..."
                          />
                          <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-500">{(formData.copy || '').length}/2000</div>
                        </div>
                      </div>

                      {/* Grupo 4: Assets y Nano Banana */}
                      <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">4. Multimedia & Generador Visual</h3>
                          {selectedEvent?.id && !isEventAIGenOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEventAIGenOpen(true);
                                const suggestedPrompt = `${formData.title || ''} ${formData.copy || ''}`.trim().slice(0, 400);
                                setEventAIPrompt(suggestedPrompt);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all animate-pulse"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.75 11 7l3.25 1.25L11 9.5l-1.25 3.25L8.5 9.5 5.25 8.25 8.5 7l1.25-3.25ZM17 12l.8 2.2L20 15l-2.2.8L17 18l-.8-2.2L14 15l2.2-.8L17 12Z" />
                              </svg>
                              <span>Generar Imagen con IA 🍌</span>
                            </button>
                          )}
                        </div>

                        {isEventAIGenOpen && (
                          <div className="rounded-xl border border-amber-500/30 bg-[#25221d] p-4 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <span>🍌</span>
                                <span>Generador Nano Banana</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEventAIGenOpen(false)}
                                className="text-gray-400 hover:text-white text-xs font-medium"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Prompt de la Imagen</label>
                                <textarea
                                  rows={3}
                                  value={eventAIPrompt}
                                  onChange={(e) => setEventAIPrompt(e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-[#161517] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                  placeholder="Describe la imagen que quieres generar en detalle (e.g. 'Infografía moderna en tonos pastel sobre cómo cuidar la salud'...)"
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Proporción / Formato</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { id: '1:1', label: '1:1', desc: 'Cuadrado (Post)' },
                                    { id: '16:9', label: '16:9', desc: 'Horizontal (YT)' },
                                    { id: '9:16', label: '9:16', desc: 'Story / Reel' }
                                  ].map(ratio => (
                                    <button
                                      key={ratio.id}
                                      type="button"
                                      onClick={() => setEventAIAspectRatio(ratio.id)}
                                      className={`rounded-xl border p-2 text-center transition-all ${
                                        eventAIAspectRatio === ratio.id
                                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                                          : 'border-white/10 bg-[#161517] text-gray-400 hover:bg-white/5'
                                      }`}
                                    >
                                      <div className="text-sm font-bold">{ratio.label}</div>
                                      <div className="text-[9px] opacity-70 mt-0.5">{ratio.desc}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isGeneratingEventImage || !eventAIPrompt.trim()}
                                onClick={async () => {
                                  setIsGeneratingEventImage(true);
                                  try {
                                    const newAsset = await generateImageForEvent(clientId, selectedEvent.id, {
                                      prompt: eventAIPrompt,
                                      aspectRatio: eventAIAspectRatio
                                    });
                                    setEventAssets(prev => [...prev, newAsset]);
                                    toast.success('¡Imagen generada e incorporada!');
                                    setIsEventAIGenOpen(false);
                                  } catch (err) {
                                    console.error(err);
                                    toast.error(err.message || 'Error al generar imagen');
                                  } finally {
                                    setIsGeneratingEventImage(false);
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                              >
                                {isGeneratingEventImage ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                    <span>Generando Imagen con IA...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Generar e Insertar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Visualizador de assets actuales */}
                        {isLoadingAssets ? (
                          <div className="rounded-xl border border-white/5 bg-[#222024]/40 px-3 py-4 text-center text-sm text-gray-500 animate-pulse">
                            Cargando archivos multimedia...
                          </div>
                        ) : eventAssets.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 bg-[#222024]/30 px-3 py-6 text-center text-sm text-gray-500">
                            Ningún archivo multimedia adjunto. Guarda el post y usa Nano Banana o sube archivos desde el calendario.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {eventAssets.map(asset => {
                              const mime = asset.mime_type || '';
                              const isImage = mime.startsWith('image/');
                              const isVideo = mime.startsWith('video/');
                              return (
                                <div key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#222024]/60 group relative shadow-md">
                                  <div className="aspect-square w-full bg-black/40 relative">
                                    {isImage && asset.preview_url && (
                                      <img src={asset.preview_url} alt={asset.file_name} className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300" />
                                    )}
                                    {isVideo && asset.preview_url && (
                                      <video src={asset.preview_url} className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300" controls muted />
                                    )}
                                    {!isImage && !isVideo && (
                                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 font-semibold uppercase">
                                        Archivo
                                      </div>
                                    )}
                                  </div>
                                  <div className="truncate px-2 py-1.5 text-[10px] text-gray-300 bg-[#1a181c] border-t border-white/5" title={asset.file_name}>
                                    {asset.file_name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                    
                    {/* Columna Derecha: Vista Previa Mockup Móvil (col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-start py-2">
                      <div className="w-full max-w-[320px]">
                        
                        {/* Selector de mockup social */}
                        <div className="flex justify-center gap-1.5 mb-4 bg-white/5 p-1 rounded-xl border border-white/5 w-full">
                          {['Instagram', 'TikTok', 'YouTube'].map(platform => (
                            <button
                              key={platform}
                              type="button"
                              onClick={() => setMockupTab(platform)}
                              className={`flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all ${
                                mockupTab === platform
                                  ? 'bg-white text-black shadow-md'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {platform}
                            </button>
                          ))}
                        </div>

                        {/* Contenedor del Móvil Virtual */}
                        <div className="relative mx-auto w-[310px] h-[580px] rounded-[40px] border-[10px] border-gray-800 bg-[#161517] shadow-2xl overflow-hidden flex flex-col ring-4 ring-white/5">
                          {/* Notch de la cámara */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-800 rounded-full z-20 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-black/60 mr-12"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></span>
                          </div>

                          {/* Pantalla del Celular */}
                          <div className="flex-1 flex flex-col overflow-hidden pt-7 relative text-white bg-black">
                            
                            {/* Renderizar según la plataforma mockupTab */}
                            {mockupTab === 'Instagram' ? (
                              <div className="h-full flex flex-col justify-between text-xs select-none">
                                {/* IG Header */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#161517]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 flex items-center justify-center p-[1px]">
                                      <div className="w-full h-full rounded-full bg-[#161517] flex items-center justify-center font-bold text-[9px] text-white">
                                        {client?.name ? client.name.charAt(0) : 'M'}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="font-bold text-[10px] leading-none text-white">{client?.name || 'mi_marca'}</p>
                                      <p className="text-[8px] text-gray-400">Patrocinado</p>
                                    </div>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </div>

                                {/* IG Post Image */}
                                <div className="aspect-square w-full bg-[#222024] relative flex items-center justify-center overflow-hidden border-b border-white/5">
                                  {eventAssets.find(a => a.preview_url) ? (
                                    <img 
                                      src={eventAssets.find(a => a.preview_url).preview_url} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-800/80 via-pink-700/70 to-indigo-900/80 flex flex-col items-center justify-center p-6 text-center text-white/90">
                                      <svg className="w-10 h-10 mb-2 text-white/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">Multimedia</p>
                                      <p className="text-[8px] mt-1 opacity-50">Genera o sube un asset visual para verlo aquí</p>
                                    </div>
                                  )}
                                </div>

                                {/* IG Actions */}
                                <div className="px-3 py-2 space-y-1 bg-[#161517] flex-1 flex flex-col justify-between">
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-3">
                                      <span className="text-lg">❤️</span>
                                      <span className="text-lg">💬</span>
                                      <span className="text-lg">✈️</span>
                                    </div>
                                    <span className="text-lg">🔖</span>
                                  </div>

                                  <div className="space-y-0.5 mt-1 overflow-hidden">
                                    <p className="font-bold text-[9px]">1.242 Me gusta</p>
                                    <p className="text-[9px] leading-relaxed text-gray-200">
                                      <span className="font-bold mr-1">{client?.name ? client.name.toLowerCase().replace(/\s+/g, '') : 'mi_marca'}</span>
                                      {formData.copy ? (formData.copy.length > 90 ? formData.copy.slice(0, 90) + '...' : formData.copy) : 'Tu copy aparecerá aquí redactado con elegancia...'}
                                    </p>
                                    <p className="text-[7px] text-gray-500 uppercase tracking-widest mt-1">Hace 2 minutos</p>
                                  </div>
                                </div>
                              </div>
                            ) : mockupTab === 'TikTok' ? (
                              <div className="h-full flex flex-col justify-between text-xs relative select-none">
                                {/* TikTok Background Video/Photo Mockup */}
                                <div className="absolute inset-0 bg-[#161517] z-0 flex items-center justify-center overflow-hidden">
                                  {eventAssets.find(a => a.preview_url) ? (
                                    <img 
                                      src={eventAssets.find(a => a.preview_url).preview_url} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover opacity-80"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-[#121212] via-[#fe0979]/20 to-[#050505] flex flex-col items-center justify-center p-6 text-center">
                                      <span className="text-3xl mb-2 animate-bounce">🎵</span>
                                      <p className="text-[10px] font-bold text-white/70">TikTok Mockup</p>
                                      <p className="text-[8px] text-gray-500 mt-1">Sube un archivo para simular tu post de TikTok</p>
                                    </div>
                                  )}
                                </div>

                                {/* TikTok Top Headers */}
                                <div className="flex justify-center gap-6 py-2 px-3 bg-gradient-to-b from-black/50 to-transparent z-10 font-semibold text-[10px]">
                                  <span className="opacity-70">Siguiendo</span>
                                  <span className="border-b-2 border-white pb-1 font-bold">Para ti</span>
                                </div>

                                {/* TikTok Right Sidebar Action Icons */}
                                <div className="absolute right-2 bottom-20 z-10 flex flex-col items-center gap-3.5">
                                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center p-[1px] relative">
                                    <div className="w-full h-full rounded-full bg-[#fe0979] flex items-center justify-center font-bold text-[10px] text-white">
                                      {client?.name ? client.name.charAt(0) : 'M'}
                                    </div>
                                    <span className="absolute -bottom-1 bg-red-500 text-white rounded-full text-[8px] px-1 font-bold">+</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-2xl">❤️</span>
                                    <span className="text-[8px] font-bold mt-0.5">85.4K</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-2xl">💬</span>
                                    <span className="text-[8px] font-bold mt-0.5">924</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-2xl">⚡</span>
                                    <span className="text-[8px] font-bold mt-0.5">2.5K</span>
                                  </div>
                                </div>

                                {/* TikTok Bottom Caption */}
                                <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 space-y-1">
                                  <p className="font-bold text-[10px]">@{client?.name ? client.name.toLowerCase().replace(/\s+/g, '') : 'mi_marca'}</p>
                                  <p className="text-[9px] leading-relaxed text-gray-200">
                                    {formData.copy ? (formData.copy.length > 70 ? formData.copy.slice(0, 70) + '...' : formData.copy) : 'Tu descripción de TikTok aparecerá en esta sección...'}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[8px] text-gray-300 mt-1">
                                    <span>🎵</span>
                                    <span className="truncate w-36">Sonido original - {client?.name || 'mi_marca'}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // YouTube Shorts Mockup
                              <div className="h-full flex flex-col justify-between text-xs relative select-none">
                                <div className="absolute inset-0 bg-[#161517] z-0 flex items-center justify-center overflow-hidden">
                                  {eventAssets.find(a => a.preview_url) ? (
                                    <img 
                                      src={eventAssets.find(a => a.preview_url).preview_url} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover opacity-85"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-[#ff0000]/10 via-[#121212] to-[#000000] flex flex-col items-center justify-center p-6 text-center">
                                      <span className="text-3xl mb-2">🎥</span>
                                      <p className="text-[10px] font-bold text-white/70">YouTube Shorts</p>
                                      <p className="text-[8px] text-gray-500 mt-1">Sube un archivo para previsualizar como Short</p>
                                    </div>
                                  )}
                                </div>

                                {/* Shorts Header */}
                                <div className="flex justify-between items-center py-2 px-3 bg-gradient-to-b from-black/50 to-transparent z-10">
                                  <span className="font-bold text-white text-[11px]">Shorts</span>
                                  <span className="text-base">🔍</span>
                                </div>

                                {/* Shorts Icons */}
                                <div className="absolute right-2 bottom-20 z-10 flex flex-col items-center gap-4">
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg bg-black/45 p-2 rounded-full">👍</span>
                                    <span className="text-[8px] font-semibold mt-1">12K</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg bg-black/45 p-2 rounded-full">👎</span>
                                    <span className="text-[8px] font-semibold mt-1">No me gusta</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg bg-black/45 p-2 rounded-full">💬</span>
                                    <span className="text-[8px] font-semibold mt-1">456</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg bg-black/45 p-2 rounded-full">➡️</span>
                                    <span className="text-[8px] font-semibold mt-1">Compartir</span>
                                  </div>
                                </div>

                                {/* Shorts Caption */}
                                <div className="p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 space-y-2">
                                  <p className="text-[9px] leading-relaxed text-white">
                                    {formData.copy ? (formData.copy.length > 60 ? formData.copy.slice(0, 60) + '...' : formData.copy) : 'El título del Short se mostrará aquí...'}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center font-bold text-[8px]">
                                      {client?.name ? client.name.charAt(0) : 'M'}
                                    </div>
                                    <span className="font-bold text-[9px]">{client?.name || 'mi_marca'}</span>
                                    <button className="bg-white text-black rounded-full px-2 py-0.5 text-[8px] font-bold">Suscribirse</button>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                  
                  {/* Footer de Acciones */}
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-white/5 mt-6 gap-4">
                    <div>
                      {selectedEvent && (
                        <motion.button 
                          type="button" 
                          onClick={handleDeleteEvent}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-5 py-2 bg-red-950/40 border border-red-500/20 hover:border-red-500/40 hover:bg-red-900/40 text-red-300 font-semibold rounded-xl text-sm transition shadow-sm w-full sm:w-auto"
                        >
                          Eliminar Evento
                        </motion.button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <motion.button 
                        type="button" 
                        onClick={closeModal}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-5 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition w-full sm:w-auto text-center"
                      >
                        Cancelar
                      </motion.button>
                      
                      <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-2.5 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition shadow w-full sm:w-auto text-center"
                      >
                        {selectedEvent ? 'Guardar Cambios' : 'Crear Publicación'}
                      </motion.button>
                    </div>
                  </div>
                </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Botón flotante para Generar con IA premium - Emerald style */}
      <motion.button
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAIGeneratorOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 rounded-full px-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:text-white shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 font-semibold text-sm hover:from-emerald-500/25 hover:via-teal-500/25 hover:to-cyan-500/25"
        style={{
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
        }}
        title="Generar cronograma completo con IA"
      >
        <SparklesIcon className="h-5 w-5 animate-pulse text-emerald-400" />
        <span>Generar IA</span>
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

	    </motion.div>
  );
};
