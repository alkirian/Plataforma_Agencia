import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { TASK_STATES, STATE_ORDER, getNextStates } from '../../constants/taskStates';
import toast from 'react-hot-toast';

export const EventDetailModal = ({ 
  isOpen, 
  onClose, 
  event, 
  onUpdate, 
  onDelete,
  clientId 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.resource?.description || '',
    status: event?.resource?.status || 'pendiente',
    priority: event?.resource?.priority || 'media',
    scheduled_at: event?.start ? new Date(event.start).toISOString().slice(0, 16) : '',
  });

  const currentState = TASK_STATES[formData.status] || TASK_STATES.pendiente;
  const nextPossibleStates = getNextStates(formData.status);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
      };
      
      await onUpdate(event.id, updateData);
      toast.success('Evento actualizado correctamente');
      setIsEditing(false);
      onClose();
    } catch (error) {
      toast.error(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar "${event?.title}"?`)) return;
    
    setLoading(true);
    try {
      await onDelete(event.id);
      toast.success('Evento eliminado correctamente');
      onClose();
    } catch (error) {
      toast.error(`Error al eliminar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await onUpdate(event.id, { status: newStatus });
      toast.success(`Estado cambiado a ${TASK_STATES[newStatus].name}`);
      setFormData(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      toast.error(`Error al cambiar estado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-rambla-surface border border-primary-500/20 backdrop-blur-lg shadow-purple-glow transition-all">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-primary-500/20 p-6">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: currentState.color }}
                      />
                      <Dialog.Title className="text-xl font-semibold text-white">
                        {isEditing ? 'Editar Evento' : 'Detalles del Evento'}
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-rambla-text-secondary hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{currentState.icon}</span>
                        <div>
                          <div 
                            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border"
                            style={{ 
                              backgroundColor: currentState.bg,
                              color: currentState.color,
                              borderColor: currentState.color + '40'
                            }}
                          >
                            {currentState.name}
                          </div>
                          <p className="text-xs text-rambla-text-secondary mt-1">
                            {currentState.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="p-2 text-rambla-text-secondary hover:text-primary-400 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={loading}
                          className="p-2 text-rambla-text-secondary hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>

                    {/* Quick Status Change */}
                    {!isEditing && nextPossibleStates.length > 0 && (
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium text-rambla-text-secondary">
                          Cambio rápido de estado:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {nextPossibleStates.map(stateKey => {
                            const state = TASK_STATES[stateKey];
                            return (
                              <button
                                key={stateKey}
                                onClick={() => handleQuickStatusChange(stateKey)}
                                disabled={loading}
                                className="inline-flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                                style={{ 
                                  backgroundColor: state.bg,
                                  color: state.color,
                                  border: `1px solid ${state.color}40`
                                }}
                              >
                                <span>{state.icon}</span>
                                <span>{state.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {/* Title */}
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block text-sm font-medium text-rambla-text-secondary mb-2">
                          Título
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded-lg border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-primary-500 focus:outline-none transition-colors"
                          />
                        ) : (
                          <p className="text-white text-lg font-medium">{event.title}</p>
                        )}
                      </motion.div>

                      {/* Description */}
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <label className="block text-sm font-medium text-rambla-text-secondary mb-2">
                          Descripción
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full rounded-lg border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-primary-500 focus:outline-none transition-colors"
                            placeholder="Descripción del evento..."
                          />
                        ) : (
                          <p className="text-rambla-text-primary">
                            {event.resource?.description || 'Sin descripción'}
                          </p>
                        )}
                      </motion.div>

                      {/* Date and Time */}
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-rambla-text-secondary mb-2">
                            <CalendarIcon className="h-4 w-4 inline mr-1" />
                            Fecha y Hora
                          </label>
                          {isEditing ? (
                            <input
                              type="datetime-local"
                              value={formData.scheduled_at}
                              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                              className="w-full rounded-lg border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors"
                            />
                          ) : (
                            <p className="text-white">
                              {new Date(event.start).toLocaleString('es-ES', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                          )}
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-rambla-text-secondary mb-2">
                            <TagIcon className="h-4 w-4 inline mr-1" />
                            Prioridad
                          </label>
                          {isEditing ? (
                            <select
                              value={formData.priority}
                              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full rounded-lg border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors"
                            >
                              <option value="baja">🟢 Baja</option>
                              <option value="media">🟡 Media</option>
                              <option value="alta">🟠 Alta</option>
                              <option value="urgente">🔴 Urgente</option>
                            </select>
                          ) : (
                            <p className="text-white">
                              {formData.priority === 'baja' && '🟢 Baja'}
                              {formData.priority === 'media' && '🟡 Media'}
                              {formData.priority === 'alta' && '🟠 Alta'}
                              {formData.priority === 'urgente' && '🔴 Urgente'}
                            </p>
                          )}
                        </div>
                      </motion.div>

                      {/* Status (when editing) */}
                      {isEditing && (
                        <motion.div 
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          <label className="block text-sm font-medium text-rambla-text-secondary mb-2">
                            Estado
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded-lg border border-rambla-border bg-rambla-bg px-3 py-2 text-white focus:border-primary-500 focus:outline-none transition-colors"
                          >
                            {STATE_ORDER.map(stateKey => {
                              const state = TASK_STATES[stateKey];
                              return (
                                <option key={stateKey} value={stateKey}>
                                  {state.icon} {state.name}
                                </option>
                              );
                            })}
                          </select>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  {isEditing && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="border-t border-primary-500/20 px-6 py-4 flex justify-end space-x-3"
                    >
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-rambla-text-secondary hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading || !formData.title}
                        className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-purple-subtle"
                      >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};