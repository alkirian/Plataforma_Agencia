import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { getClientById } from '../../api/clients';
import { getSchedule, createScheduleItem, updateScheduleItem, deleteScheduleItem } from '../../api/schedule';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { MiniMonth } from './MiniMonth.jsx';
import { CalendarToolbar } from './CalendarToolbar.jsx';
import { AIAssistant } from '../ai/AIAssistant.jsx';
import { EventDetailModal } from './EventDetailModal.jsx';
import { TASK_STATES } from '../../constants/taskStates.js';

const localizer = momentLocalizer(moment);

const eventStyleGetter = (event) => {
  const status = event.resource?.status || 'pendiente';
  const stateStyle = TASK_STATES[status] || TASK_STATES.pendiente;
  
  return {
    style: {
      backgroundColor: stateStyle.color,
      border: `1px solid ${stateStyle.color}`,
      borderRadius: '8px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 8px',
      boxShadow: `0 2px 8px ${stateStyle.color}30`,
      backdropFilter: 'blur(4px)',
      // Hacer que ocupen más espacio en la celda
      height: 'auto',
      minHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }
  };
};

export const ScheduleSection = ({ clientId }) => {
  const [client, setClient] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formStatus, setFormStatus] = useState('pendiente');
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientResponse, scheduleResponse] = await Promise.all([
        getClientById(clientId),
        getSchedule(clientId)
      ]);

      setClient(clientResponse.data);
      const formattedEvents = scheduleResponse.data.map(item => ({
        id: item.id,
        title: item.title,
        start: new Date(item.scheduled_at),
        end: new Date(item.scheduled_at),
        resource: item,
      }));
      setScheduleItems(formattedEvents);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    moment.locale('es');
    loadData();
  }, [loadData]);

  const handleSelectSlot = ({ start }) => {
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    const hh = String(start.getHours()).padStart(2, '0');
    const min = String(start.getMinutes()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime(`${hh}:${min}`);
    setIsEditMode(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setFormTitle('');
    setFormStatus('pendiente');
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleUpdateEvent = async (eventId, updateData) => {
    await updateScheduleItem(clientId, eventId, updateData);
    loadData(); // Refresh calendar
  };

  const handleDeleteEvent = async (eventId) => {
    await deleteScheduleItem(clientId, eventId);
    loadData(); // Refresh calendar
  };

  const handleCreateFromModal = async (e) => {
    e.preventDefault();
    try {
      if (!formTitle || !formDate || !formTime) return;
      const iso = new Date(`${formDate}T${formTime}:00`).toISOString();
      await toast.promise(
        createScheduleItem(clientId, {
          title: formTitle,
          scheduled_at: iso,
          status: formStatus,
        }),
        {
          loading: 'Creando evento…',
          success: 'Evento creado',
          error: (e) => e.message || 'No se pudo crear el evento',
        }
      );
      closeModal();
      loadData();
    } catch (err) {
      // El toast.promise ya maneja el error visual
    }
  };

  if (loading) return <div className="text-center text-rambla-text-secondary">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Cronograma de Contenidos</h2>
        <button
          onClick={() => {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setFormDate(`${yyyy}-${mm}-${dd}`);
            setFormTime('09:00');
            setIsOpen(true);
          }}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors duration-200 shadow-purple-subtle"
        >
          Nuevo evento
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Columna izquierda: mini calendario */}
        <div className="xl:col-span-2">
          <MiniMonth
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            onSelectDate={(d) => setCurrentDate(d)}
          />
        </div>

        {/* Centro: calendario grande */}
        <div className="xl:col-span-7">
          <div className="h-[72vh] rounded-lg border border-white/10 bg-rambla-surface p-2">
            <Calendar
              localizer={localizer}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              events={scheduleItems}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: (props) => (
                  <CalendarToolbar
                    label={props.label}
                    view={props.view}
                    onView={props.onView}
                    onNavigate={(action) => {
                      const map = { PREV: () => props.onNavigate('PREV'), NEXT: () => props.onNavigate('NEXT'), TODAY: () => props.onNavigate('TODAY') };
                      map[action]?.();
                    }}
                  />
                ),
              }}
            />
          </div>
        </div>

        {/* Derecha: chat con IA */}
        <div className="xl:col-span-3">
          <AIAssistant />
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-xl border border-rambla-border bg-rambla-surface p-6 shadow">
                  <Dialog.Title className="mb-2 text-lg font-semibold text-white">Nuevo evento</Dialog.Title>
                  <form onSubmit={handleCreateFromModal} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-rambla-text-secondary">Título</label>
                      <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-primary-500 focus:outline-none transition-colors duration-200" placeholder="Post para Instagram" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm text-rambla-text-secondary">Fecha</label>
                        <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors duration-200" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-rambla-text-secondary">Hora</label>
                        <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors duration-200" required />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-rambla-text-secondary">Estado</label>
                      <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors duration-200">
                        <option value="planificacion">📋 Planificación</option>
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="en-progreso">🚀 En Progreso</option>
                        <option value="en-diseño">🎨 En Diseño</option>
                        <option value="en-revision">👀 En Revisión</option>
                        <option value="esperando-aprobacion">⏰ Esperando Aprobación</option>
                        <option value="aprobado">✅ Aprobado</option>
                        <option value="requiere-cambios">🔄 Requiere Cambios</option>
                        <option value="listo-publicar">📤 Listo para Publicar</option>
                        <option value="publicado">📢 Publicado</option>
                        <option value="completado">🎉 Completado</option>
                        <option value="pausado">⏸️ Pausado</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={closeModal} className="rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-primary-500 hover:text-primary-400 transition-colors duration-200">Cancelar</button>
                      <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors duration-200 shadow-purple-subtle">Crear</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isEventDetailOpen}
        onClose={() => setIsEventDetailOpen(false)}
        event={selectedEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        clientId={clientId}
      />
    </div>
  );
};
