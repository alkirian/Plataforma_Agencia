import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { fetchClientById } from '../../api/clients';
import { fetchScheduleItems, createScheduleItem } from '../../api/schedule';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

const localizer = momentLocalizer(moment);

const eventStyleGetter = (event) => {
  const statusStyles = {
    'Pendiente': { backgroundColor: '#f0ad4e' },
    'En Diseño': { backgroundColor: '#5bc0de' },
    'Aprobado': { backgroundColor: '#5cb85c' },
    'Publicado': { backgroundColor: '#337ab7' },
    'Cancelado': { backgroundColor: '#d9534f' },
  };
  return {
    style: statusStyles[event.resource?.status] || {},
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
  const [formStatus, setFormStatus] = useState('Pendiente');
  const [isEditMode, setIsEditMode] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientData, scheduleData] = await Promise.all([
        fetchClientById(clientId),
        fetchScheduleItems(clientId)
      ]);

      setClient(clientData);
      const formattedEvents = scheduleData.map(item => ({
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
    setFormStatus('Pendiente');
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
          className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Nuevo evento
        </button>
      </div>
      <div className="h-[75vh]">
        <Calendar
          localizer={localizer}
          events={scheduleItems}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
        />
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
                      <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none" placeholder="Post para Instagram" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm text-rambla-text-secondary">Fecha</label>
                        <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-rambla-accent focus:outline-none" required />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-rambla-text-secondary">Hora</label>
                        <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-rambla-accent focus:outline-none" required />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-rambla-text-secondary">Estado</label>
                      <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-rambla-accent focus:outline-none">
                        <option>Pendiente</option>
                        <option>En Diseño</option>
                        <option>Aprobado</option>
                        <option>Publicado</option>
                        <option>Cancelado</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={closeModal} className="rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent">Cancelar</button>
                      <button type="submit" className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Crear</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
