import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { getCurrentDate } from '../../utils/dateHelpers';

// Importaciones de FullCalendar
import FullCalendarWrapper from './FullCalendarWrapper';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Componentes existentes
import { MiniMonth } from './MiniMonth';
import { AIAssistant } from '../ai/AIAssistant';
import { TaskTemplateSelector } from './TaskTemplateSelector';

// Estilos
import '../../styles/fullcalendar-custom.css';
import { getClientById } from '../../api/clients';

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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    status: 'pendiente'
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
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
        toast.error('Error al cargar datos del cliente');
      }
    };

    loadInitialData();
  }, [clientId, loadEvents]);

  // Handlers del calendario
  const handleDateClick = (date) => {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    setFormData({
      title: '',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      status: 'pendiente'
    });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
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
        status: event.extendedProps?.status || 'pendiente'
      });
      setIsModalOpen(true);
    } catch {
      // fallback
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleEventDrop = async (event) => {
    try {
      await moveEvent(event.id, event.start, event.end);
    } catch (err) {
      // El hook maneja el error y recarga
    }
  };

  const handleViewChange = (viewType) => {
    setCurrentView(viewType);
  };

  const handleDateChange = (start /*, end, view */) => {
    if (start && Math.abs(start.getTime() - currentDate.getTime()) > 24 * 60 * 60 * 1000) {
      setCurrentDate(start);
    }
  };

  // Formulario handlers
  const handleFormSubmit = async (e) => {
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
        scheduled_at: scheduled_at.toISOString()
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
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteEvent(selectedEvent.id);
        closeModal();
        setIsEventDetailOpen(false);
      } catch (err) {
        // El hook ya maneja los errores
      }
    }
  };

  // Handler para plantillas
  const handleSelectTemplate = async (template) => {
    try {
      const baseDate = getCurrentDate();
      
      for (let i = 0; i < template.tasks.length; i++) {
        const task = template.tasks[i];
        // Espaciar las tareas cada día
        const taskDate = new Date(baseDate);
        taskDate.setDate(taskDate.getDate() + i);
        
        const eventData = {
          title: task.title,
          scheduled_at: taskDate.toISOString(),
          status: task.status || 'pendiente'
        };
        
        await createEvent(eventData);
      }
      
      toast.success(`Se crearon ${template.tasks.length} tareas desde la plantilla "${template.name}"`);
    } catch (error) {
      toast.error('Error al crear tareas desde la plantilla');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '09:00',
      status: 'pendiente'
    });
  };

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
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Cronograma de Contenidos
          </h2>
          {client && (
            <p className="text-sm text-gray-400 mt-1">
              Cliente: {client.name} • {eventStats.total} eventos totales
            </p>
          )}
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white 
                       font-semibold rounded-lg shadow-sm transition-all duration-200 
                       flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Plantillas</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDateClick(getCurrentDate())}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white 
                       font-semibold rounded-lg shadow-sm transition-all duration-200"
          >
            Nuevo Evento
          </motion.button>
        </div>
      </motion.div>

      {/* Estadísticas superiores (full width) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6"
      >
        <div className="bg-surface-900/40 backdrop-blur-sm border border-white/10 
                        rounded-xl p-4 shadow-lg">
          <div className="text-sm font-semibold text-gray-300 mb-3">Estadísticas</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center justify-between text-xs bg-white/5 rounded-md px-3 py-2">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-medium">{eventStats.total}</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-white/5 rounded-md px-3 py-2">
              <span className="text-gray-400">Pendientes</span>
              <span className="text-orange-400 font-medium">{eventStats.byStatus.pendiente || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-white/5 rounded-md px-3 py-2">
              <span className="text-gray-400">En progreso</span>
              <span className="text-blue-400 font-medium">{(eventStats.byStatus['en-diseño'] || 0) + (eventStats.byStatus['en-progreso'] || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-white/5 rounded-md px-3 py-2">
              <span className="text-gray-400">Completados</span>
              <span className="text-green-400 font-medium">{eventStats.byStatus.publicado || 0}</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Izquierda: mini calendario */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:col-span-3"
        >
          <MiniMonth 
            currentDate={currentDate}
            onNavigate={setCurrentDate}
            events={events}
          />
        </motion.div>

        {/* Centro: calendario principal ampliado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-9"
        >
          <div className="bg-surface-900/40 backdrop-blur-sm 
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
            />
          </div>
        </motion.div>
      </div>

      {/* Fila inferior: chat con IA (full width) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-6"
      >
        <div className="bg-surface-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg">
          <AIAssistant />
        </div>
      </motion.div>

      {/* Modal para crear/editar eventos */}
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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md bg-surface-900/90 backdrop-blur-sm
                                        border border-white/20 rounded-xl p-6 shadow-xl">
                  <Dialog.Title className="mb-4 text-xl font-bold text-gray-100">
                    {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Título</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                        className="input-cyber w-full" 
                        placeholder="Nombre del evento" 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Fecha</label>
                        <input 
                          type="date" 
                          value={formData.date} 
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                          className="input-cyber w-full" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Hora</label>
                        <input 
                          type="time" 
                          value={formData.time} 
                          onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} 
                          className="input-cyber w-full" 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Estado</label>
                      <select 
                        value={formData.status} 
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} 
                        className="input-cyber w-full"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en-diseño">En Diseño</option>
                        <option value="en-progreso">En Progreso</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="publicado">Publicado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      {selectedEvent && (
                        <motion.button 
                          type="button" 
                          onClick={handleDeleteEvent}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white 
                                     font-semibold rounded-lg transition-all duration-200"
                        >
                          Eliminar
                        </motion.button>
                      )}
                      
                      <motion.button 
                        type="button" 
                        onClick={closeModal}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-white/20 rounded-lg text-gray-300 
                                   hover:border-white/40 hover:text-white transition-all duration-300"
                      >
                        Cancelar
                      </motion.button>
                      
                      <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-accent-600 hover:bg-accent-700 
                                   text-white font-semibold rounded-lg shadow-sm 
                                   transition-all duration-200"
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

      {/* Modal de plantillas */}
      <TaskTemplateSelector
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </motion.div>
  );
};