import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getMessage } from '../../constants/notificationMessages';
import { smartToast } from '../../utils/toastManager';
import { getCurrentDate } from '../../utils/dateHelpers';
import QuickTaskPopover from './QuickTaskPopover';

// Importaciones de FullCalendar
import FullCalendarWrapper from './FullCalendarWrapper';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Componentes existentes
import { MiniMonth } from './MiniMonth';
import { MonthAgenda } from './MonthAgenda';
import { AIAssistant } from '../ai/AIAssistant';

// Nuevos componentes de generación de ideas
import { PromptPopover } from './PromptPopover';
import { IdeasModal } from './IdeasModal';
import { IdeasLoadingModal } from './IdeasLoadingModal';

// Estilos
import '../../styles/fullcalendar-custom.css';
import { getClientById } from '../../api/clients';
import { generateIdeas, getChatHistory } from '../../api/ai';
import { getRelevantSpecialDates, getSeasonalContext } from '../../constants/specialDates';

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Estados para el nuevo popover
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskDate, setQuickTaskDate] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);
  
  // Estados para generación de ideas
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
  const [aiDetectedTones, setAiDetectedTones] = useState([]);
  
  // Cargar último prompt usado
  const [lastUsedPrompt, setLastUsedPrompt] = useState(() => 
    localStorage.getItem('lastIdeaPrompt') || ''
  );
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    status: 'pendiente',
    copy: '',
    channel: 'IG',
    // Sin prioridad - se elimina del formulario
    // priority: 'medium'
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
    moveEvent,
    eventStats
  } = useCalendarEvents(clientId);

  // Calcular estadísticas basadas en eventos visibles del calendario
  const calculateVisibleStats = () => {
    const total = events.length;
    const byStatus = {};
    
    events.forEach(event => {
      const status = event.resource?.status || event.status || 'pendiente';
      byStatus[status] = (byStatus[status] || 0) + 1;
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
        // Cargar cliente y eventos en paralelo
        const [clientResponse] = await Promise.all([
          getClientById(clientId),
          loadEvents()
        ]);
        setClient(clientResponse.data);
      }
    } catch (err) {
      smartToast.client.error(getMessage('client.loadError'));
    }
  }, [clientId, loadEvents]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handlers del calendario - memoizados para evitar re-renders
  const handleDateClick = useCallback((date, clickInfo) => {
    // Usar el nuevo popover para crear tareas rápidamente
    setQuickTaskDate(date);
    setClickCoords(clickInfo?.clickCoords || null);
    setIsQuickTaskOpen(true);
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
        status: event.extendedProps?.status || 'pendiente',
        copy: event.extendedProps?.copy ?? event.extendedProps?.description ?? '',
        channel: event.extendedProps?.channel || 'IG',
  priority: event.extendedProps?.priority || 'medium'
      });
      setIsModalOpen(true);
    } catch {
      // fallback
      setSelectedEvent(event);
      // Asegurar defaults si el bloque anterior falló
      setFormData(prev => ({
        title: prev.title ?? (event?.title || ''),
        date: prev.date || '',
        time: prev.time || '09:00',
        status: prev.status || (event?.extendedProps?.status || 'pendiente'),
        copy: typeof prev.copy === 'string' ? prev.copy : (event?.extendedProps?.copy ?? event?.extendedProps?.description ?? ''),
        channel: prev.channel || 'IG',
  priority: prev.priority || 'medium'
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

  const handleDateChange = useCallback((start /*, end, view */) => {
    if (start && Math.abs(start.getTime() - currentDate.getTime()) > 24 * 60 * 60 * 1000) {
      setCurrentDate(start);
    }
  }, [currentDate]);

  // Formulario handlers - memoizados
  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.date || !formData.time) {
        smartToast.task.error(getMessage('task.completeRequired'));
        return;
      }

      const scheduled_at = new Date(`${formData.date}T${formData.time}:00`);
  const eventData = {
        title: formData.title,
        status: formData.status,
        scheduled_at: scheduled_at.toISOString()
      };

  // Campos opcionales
  if (formData.copy?.trim()) eventData.copy = formData.copy.trim();
  if (formData.channel) eventData.channel = formData.channel;
  // Prioridad eliminada - ya no se envía

      if (selectedEvent?.id) {
        await updateEvent(selectedEvent.id, eventData);
        smartToast.task.success(getMessage('task.updateSuccess'));
      } else {
        await createEvent(eventData);
        smartToast.task.success(getMessage('task.createSuccess'));
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


  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '09:00',
      status: 'pendiente',
      copy: '',
      channel: 'IG'
  // priority: 'medium' - eliminado
    });
  }, []);

  // Handler para crear tareas desde el QuickTaskPopover
  const handleCreateQuickTask = useCallback(async (taskData) => {
    try {
      await createEvent(taskData);
      smartToast.task.success(getMessage('task.quickTaskSuccess'));
      setIsQuickTaskOpen(false);
      setQuickTaskDate(null);
      setClickCoords(null);
    } catch (error) {
      smartToast.task.error(getMessage('task.quickTaskError'));
      throw error; // Re-throw para que el popover maneje el loading
    }
  }, [createEvent]);

  // Handler para cerrar el QuickTaskPopover
  const handleCloseQuickTask = useCallback(() => {
    setIsQuickTaskOpen(false);
    setQuickTaskDate(null);
    setClickCoords(null);
  }, []);

  // === NUEVOS HANDLERS PARA GENERACIÓN DE IDEAS ===

  // Handler principal para generar ideas
  const handleGenerateIdeas = useCallback(async ({ userPrompt = null, selectedTones = [] }) => {
    setIsGeneratingIdeas(true);
    setIsPromptOpen(false);
    
    try {
      // 1. Recopilar contexto del chat
      const chatContext = await getChatHistory(clientId, { limit: 50 });
      
      // 2. Obtener fechas especiales relevantes
      const specialDates = getRelevantSpecialDates(
        currentDate.getMonth() + 1,
        currentDate.getFullYear(),
        client?.industry || 'general'
      );
      
      // 3. Contexto estacional
      const seasonalContext = getSeasonalContext(currentDate.getMonth() + 1);

      // 3.1 Rango y mes objetivo visibles actualmente en el calendario
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth() + 1; // 1-12
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0);
      const pad = (n) => String(n).padStart(2, '0');
      const monthContext = {
        month: m,
        year: y,
        range: {
          start: `${y}-${pad(m)}-01`,
          end: `${y}-${pad(m)}-${pad(endOfMonth.getDate())}`
        },
        // Fechas especiales que el modelo puede considerar dentro del mes
        specialDates
      };
      
      // 4. Construir contexto completo para la IA
      const context = {
        client: {
          id: clientId,
          name: client?.name || '',
          sector: client?.industry || 'general',
          description: client?.description || ''
        },
        userPrompt,
        selectedTones,
        chatHistory: chatContext?.messages || [],
        currentEvents: events,
        currentMonth: m,
        currentYear: y,
        specialDates,
        seasonalContext,
        requestedIdeasCount: 10
      };

      console.log('🧠 Generando ideas con contexto:', context);

      // 5. Generar ideas con contexto
      const response = await generateIdeas(clientId, {
        userPrompt: userPrompt || "Genera 10 ideas creativas y alineadas para el cronograma mensual",
        context,
        monthContext
      });

      console.log('✅ Ideas generadas:', response);

      // 6. Procesar y mostrar ideas
      const ideasArray = response?.ideas || response?.data?.ideas || response;
      console.log('📋 Ideas recibidas:', { response, ideasArray });
      
      if (Array.isArray(ideasArray) && ideasArray.length > 0) {
        // Agregar IDs únicos y campos requeridos si no existen
        const ideasWithIds = ideasArray.map((idea, index) => ({
          ...idea,
          id: idea.id || `idea-${Date.now()}-${index}`,
          title: idea.title || `Idea ${index + 1}`,
          copy: idea.copy || idea.description || '',
          suggestedDate: idea.suggestedDate || idea.scheduled_at || new Date().toISOString().split('T')[0],
          suggestedTime: idea.suggestedTime || '09:00',
          channel: idea.channel || 'IG',
          hashtags: idea.hashtags || [],
          status: idea.status || 'pendiente',
          relevanceScore: idea.relevanceScore || Math.random() * 0.3 + 0.7, // Score entre 0.7-1.0
        }));

        setGeneratedIdeas(ideasWithIds);
        setIsIdeasModalOpen(true);
        
        // Guardar prompt si fue exitoso
        if (userPrompt) {
          setLastUsedPrompt(userPrompt);
          localStorage.setItem('lastIdeaPrompt', userPrompt);
        }
        
        // Guardar tonos si fueron seleccionados
        if (selectedTones.length > 0) {
          localStorage.setItem('lastSelectedTones', JSON.stringify(selectedTones));
        }
        
        smartToast.ai.success(getMessage('ai.ideasGenerated', ideasWithIds.length));
      } else {
        smartToast.ai.error(getMessage('ai.ideasGenerationError'));
      }
    } catch (error) {
      console.error('❌ Error generando ideas:', error);
      smartToast.ai.error(getMessage('ai.ideasGenerationErrorGeneric'));
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [clientId, client, events, currentDate]);

  // Handler para aceptar ideas seleccionadas
  const handleAcceptSelectedIdeas = useCallback(async (selectedIdeas) => {
    try {
      let createdCount = 0;
      let errorCount = 0;

      // Crear eventos para cada idea seleccionada
      for (const idea of selectedIdeas) {
        try {
          const eventData = {
            title: idea.title,
            status: 'pendiente',
            scheduled_at: new Date(`${idea.suggestedDate}T${idea.suggestedTime || '09:00'}:00`).toISOString(),
            copy: idea.copy || '',
            channel: idea.channel || 'IG'
          };

          await createEvent(eventData);
          createdCount++;
        } catch (error) {
          console.error('Error creando evento:', error);
          errorCount++;
        }
      }

      // Mostrar resultado
      if (createdCount > 0) {
        smartToast.ai.success(getMessage('ai.ideasAdded', createdCount));
      }
      if (errorCount > 0) {
        smartToast.ai.error(getMessage('ai.ideasAddError', errorCount));
      }

      // Cerrar modal
      setIsIdeasModalOpen(false);
      setGeneratedIdeas([]);
      
    } catch (error) {
      smartToast.ai.error(getMessage('ai.ideasProcessError'));
    }
  }, [createEvent]);

  // Handler para regenerar ideas
  const handleRegenerateIdeas = useCallback(() => {
    // Regenerar con los mismos parámetros
    const lastTones = JSON.parse(localStorage.getItem('lastSelectedTones') || '[]');
    const lastPrompt = localStorage.getItem('lastIdeaPrompt') || '';
    
    handleGenerateIdeas({
      userPrompt: lastPrompt || null,
      selectedTones: lastTones
    });
  }, [handleGenerateIdeas]);

  // Handler para cancelar generación
  const handleCancelGeneration = useCallback(() => {
    setIsGeneratingIdeas(false);
    smartToast.ai.info(getMessage('ai.generationCancelled'));
  }, []);

  // Estados de carga y error
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-400 font-medium">Error al cargar el calendario</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button 
            onClick={loadEvents}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
      {/* Header rediseñado con mejor jerarquía */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-gray-900/90 to-gray-800/80 border border-gray-700/50 rounded-2xl p-6 mb-8 backdrop-blur-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Título y contexto */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Cronograma de Contenidos
                </h1>
                {client && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
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
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-800/60 rounded-lg border border-gray-600/30">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{visibleStats.byStatus.publicado || 0}</div>
                <div className="text-xs text-gray-400">Publicados</div>
              </div>
              <div className="w-px h-8 bg-gray-600"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{visibleStats.byStatus.pendiente || 0}</div>
                <div className="text-xs text-gray-400">Pendientes</div>
              </div>
            </div>
            
            {/* Botones principales */}
            <div className="flex items-center gap-4">
              {/* Botón Nuevo Evento */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDateClick(getCurrentDate())}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nuevo Evento</span>
                </div>
              </motion.button>

              {/* NUEVO: Botón Generar Ideas */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPromptOpen(true)}
                  disabled={isGeneratingIdeas}
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-2">
                    {isGeneratingIdeas ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Generar Ideas</span>
                      </>
                    )}
                  </div>
                </motion.button>

                {/* Popover de configuración de prompt */}
                <PromptPopover
                  isOpen={isPromptOpen && !isGeneratingIdeas}
                  onClose={() => setIsPromptOpen(false)}
                  onGenerate={handleGenerateIdeas}
                  isLoading={isGeneratingIdeas}
                  lastUsedPrompt={lastUsedPrompt}
                  aiDetectedTones={aiDetectedTones}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas sutiles y compactas */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-lg">
          {/* Total */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/40 border border-gray-600/30 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
            <div className="w-8 h-8 bg-gray-600/40 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{visibleStats.total}</p>
            </div>
          </div>

          {/* Pendientes */}
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-900/20 border border-orange-700/20 rounded-lg hover:bg-orange-900/30 transition-all duration-200">
            <div className="w-8 h-8 bg-orange-600/30 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-orange-300/80">Pendientes</p>
              <p className="text-lg font-bold text-orange-300">{visibleStats.byStatus.pendiente || 0}</p>
            </div>
          </div>

          {/* Aprobados */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-700/20 rounded-lg hover:bg-blue-900/30 transition-all duration-200">
            <div className="w-8 h-8 bg-blue-600/30 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-300/80">Aprobados</p>
              <p className="text-lg font-bold text-blue-300">{visibleStats.byStatus.aprobado || 0}</p>
            </div>
          </div>

          {/* Publicados */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/20 rounded-lg hover:bg-green-900/30 transition-all duration-200">
            <div className="w-8 h-8 bg-green-600/30 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-green-300/80">Publicados</p>
              <p className="text-lg font-bold text-green-300">{visibleStats.byStatus.publicado || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="flex flex-col xl:flex-row gap-6 transition-all duration-300">
        {/* Izquierda: mini calendario */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:w-80 xl:flex-shrink-0"
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
          className="flex-1 min-w-0"
        >
          <div className="bg-surface-900/70 
                          border border-white/10 rounded-xl p-6 shadow-lg">
            <FullCalendarWrapper
              key={`${currentDate.getTime()}-${currentView}`}
              events={events}
              currentDate={currentDate}
              currentView={currentView}
              loading={loading}
              onDateChange={handleDateChange}
              onViewChange={handleViewChange}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onEventDrop={handleEventDrop}
              height="800px"
              clientName={client?.name || ''}
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
                <Dialog.Panel className="w-full max-w-lg bg-[#1a1a1a] border border-gray-600 rounded-xl p-6 shadow-2xl backdrop-blur-none">
                  <Dialog.Title className="mb-6 text-2xl font-bold text-white">
                    {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-300">Título</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                        className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all" 
                        placeholder="Nombre del evento" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-300">Copy</label>
                      <textarea
                        rows={5}
                        maxLength={2000}
                        value={formData.copy}
                        onChange={(e) => setFormData(prev => ({ ...prev, copy: e.target.value }))}
                        className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all resize-none min-h-[120px]"
                        placeholder="Texto del post (emojis, hashtags)…"
                      />
                      <div className="mt-1 text-[11px] text-gray-400">{(formData.copy || '').length}/2000</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-300">Fecha</label>
                        <input 
                          type="date" 
                          value={formData.date} 
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                          className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-300">Hora</label>
                        <input 
                          type="time" 
                          value={formData.time} 
                          onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} 
                          className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all" 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-300">Estado</label>
                      <select 
                        value={formData.status} 
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} 
                        className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en-diseño">En Diseño</option>
                        <option value="en-progreso">En Progreso</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="publicado">Publicado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-300">Canal</label>
                      <select
                        value={formData.channel}
                        onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                        className="w-full rounded-lg border-2 border-gray-600 bg-gray-800 px-4 py-3 text-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
                      >
                        <option value="IG">Instagram</option>
                        <option value="FB">Facebook</option>
                        <option value="TikTok">TikTok</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700 mt-8">
                      {selectedEvent && (
                        <motion.button 
                          type="button" 
                          onClick={handleDeleteEvent}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                        >
                          Eliminar
                        </motion.button>
                      )}
                      
                      <motion.button 
                        type="button" 
                        onClick={closeModal}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2.5 border-2 border-gray-600 rounded-lg text-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-800/50"
                      >
                        Cancelar
                      </motion.button>
                      
                      <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                      >
                        {selectedEvent ? 'Actualizar' : 'Crear'} Evento
                      </motion.button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Botón flotante del chat AI */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center hover:scale-110 active:scale-95"
        style={{
          background: isChatOpen 
            ? 'linear-gradient(135deg, #2d2d2d, #1a1a1a)'
            : 'linear-gradient(135deg, var(--color-accent-violet), var(--color-accent-blue))',
          color: 'var(--color-text-primary)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          border: `1px solid ${isChatOpen ? '#404040' : 'var(--color-border-subtle)'}`
        }}
        title={isChatOpen ? 'Cerrar chat' : 'Abrir chat AI'}
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </motion.button>

      {/* Panel del chat AI */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isChatOpen ? 0 : '100%' }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-16 bottom-0 right-0 w-full md:w-96 lg:w-1/3 z-50 bg-surface-strong/95 backdrop-blur-md border-l border-border-subtle shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--color-surface-strong), var(--color-surface-soft))',
          borderColor: 'var(--color-border-subtle)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header del chat */}
          <div 
            className="flex items-center justify-between p-2 border-b"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-accent-violet)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Asistente IA</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Creación de contenido</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 rounded-lg transition-colors"
              style={{ 
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--color-text-primary)';
                e.target.style.backgroundColor = 'var(--color-surface-soft)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--color-text-secondary)';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Contenido del chat */}
          <div 
            className="flex-1"
            style={{
              background: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border-subtle)'
            }}
          >
            <AIAssistant />
          </div>
        </div>
      </motion.div>

      {/* Overlay para móvil */}
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* QuickTaskPopover - Nuevo sistema de creación de tareas */}
      <QuickTaskPopover
        isOpen={isQuickTaskOpen}
        onClose={handleCloseQuickTask}
        clickCoords={clickCoords}
        selectedDate={quickTaskDate}
        clientId={clientId}
        onCreateTask={handleCreateQuickTask}
      />

      {/* === NUEVOS MODALES DE GENERACIÓN DE IDEAS === */}

      {/* Modal de carga con mensajes amables */}
      <IdeasLoadingModal
        isOpen={isGeneratingIdeas}
        onCancel={handleCancelGeneration}
      />

      {/* Modal con las 10 ideas generadas */}
      <IdeasModal
        isOpen={isIdeasModalOpen}
        onClose={() => {
          setIsIdeasModalOpen(false);
          setGeneratedIdeas([]);
        }}
        ideas={generatedIdeas}
        onAcceptSelected={handleAcceptSelectedIdeas}
        onRegenerate={handleRegenerateIdeas}
        isRegenerating={isGeneratingIdeas}
      />

    </motion.div>
  );
};