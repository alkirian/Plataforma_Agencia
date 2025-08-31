import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon, 
  ExclamationTriangleIcon,
  TagIcon,
  StarIcon,
  ChatBubbleBottomCenterIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export const NoteSourceForm = ({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: '',
    tags: []
  });
  const [error, setError] = useState('');

  const priorities = [
    { value: 'low', label: 'Baja', color: 'text-gray-400', icon: '📝' },
    { value: 'medium', label: 'Media', color: 'text-yellow-400', icon: '📄' },
    { value: 'high', label: 'Alta', color: 'text-orange-400', icon: '⚡' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400', icon: '🔥' }
  ];

  const categories = [
    { value: '', label: 'Sin categoría' },
    { value: 'reminder', label: '📅 Recordatorio' },
    { value: 'context', label: '🧠 Contexto importante' },
    { value: 'instruction', label: '📋 Instrucción' },
    { value: 'warning', label: '⚠️ Advertencia' },
    { value: 'tip', label: '💡 Consejo' },
    { value: 'contact', label: '👤 Contacto' },
    { value: 'resource', label: '🔗 Recurso' },
    { value: 'other', label: '📌 Otro' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!formData.content.trim()) {
      setError('El contenido es requerido');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        category: '',
        tags: []
      });
    } catch (err) {
      setError(err.message || 'Error al agregar nota');
    }
  };

  const getPriorityStars = (priority) => {
    const levels = { low: 1, medium: 2, high: 3, urgent: 4 };
    const level = levels[priority] || 2;
    
    return Array.from({ length: 4 }, (_, i) => (
      <span key={i}>
        {i < level ? (
          <StarIconSolid className="h-4 w-4 text-yellow-400 inline" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-500 inline" />
        )}
      </span>
    ));
  };

  const currentPriority = priorities.find(p => p.value === formData.priority);
  const wordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            <PencilIcon className="inline h-4 w-4 mr-1" />
            Título de la nota
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="ej: Recordar política de cancelaciones"
            disabled={disabled}
            className="w-full px-4 py-3 bg-surface-strong border border-purple-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
          />
        </div>

        {/* Priority and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Prioridad
            </label>
            <div className="space-y-2">
              {priorities.map(priority => (
                <label key={priority.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                    formData.priority === priority.value
                      ? 'border-purple-400 bg-purple-400'
                      : 'border-purple-500/30 bg-transparent'
                  }`}>
                    {formData.priority === priority.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm">{priority.icon}</span>
                  <span className={`text-sm ${priority.color}`}>{priority.label}</span>
                  <div className="flex space-x-0.5">
                    {getPriorityStars(priority.value)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 bg-surface-strong border border-purple-500/30 
                       rounded-lg text-white
                       focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            <ChatBubbleBottomCenterIcon className="inline h-4 w-4 mr-1" />
            Contenido de la nota
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Escribe tu nota aquí...

Ejemplos:
• Recordar: Los clientes VIP tienen descuento especial
• Contexto: Esta empresa maneja datos sensibles
• Advertencia: No procesar solicitudes después de las 18:00"
            disabled={disabled}
            rows={8}
            className="w-full px-4 py-3 bg-surface-strong border border-purple-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none
                     leading-relaxed"
          />
          <div className="flex justify-between text-xs text-purple-200/50 mt-1">
            <span>{wordCount} palabras</span>
            <span className={`${currentPriority?.color}`}>
              {currentPriority?.icon} Prioridad: {currentPriority?.label}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            <TagIcon className="inline h-4 w-4 mr-1" />
            Tags (opcional)
          </label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="ej: importante, vip, horarios"
            disabled={disabled}
            className="w-full px-4 py-3 bg-surface-strong border border-purple-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-purple-200/50">
            Separa los tags con comas
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <motion.button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                priority: 'medium',
                category: '',
                tags: []
              });
              setError('');
            }}
            disabled={disabled}
            className="px-6 py-3 text-text-muted hover:text-text-primary transition-colors
                     disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancelar
          </motion.button>
          
          <motion.button
            type="submit"
            disabled={disabled || !formData.title || !formData.content}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 
                     disabled:cursor-not-allowed text-white rounded-lg transition-colors
                     font-medium"
            whileHover={!disabled && formData.title && formData.content ? { scale: 1.02 } : {}}
            whileTap={!disabled && formData.title && formData.content ? { scale: 0.98 } : {}}
          >
            <PencilIcon className="inline h-4 w-4 mr-2" />
            Agregar nota
          </motion.button>
        </div>
      </form>

      {/* Priority Preview */}
      {formData.priority && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            formData.priority === 'urgent' ? 'bg-red-500/5 border-red-500/20' :
            formData.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
            formData.priority === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
            'bg-gray-500/5 border-gray-500/20'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentPriority?.icon}</span>
            <div>
              <p className={`font-medium ${currentPriority?.color}`}>
                Prioridad {currentPriority?.label}
              </p>
              <div className="flex space-x-0.5 mt-1">
                {getPriorityStars(formData.priority)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info box */}
      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <ChatBubbleBottomCenterIcon className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-200/70">
            <p className="font-medium text-purple-300 mb-1">📝 Notas rápidas:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ideales para recordatorios, contexto importante y advertencias</li>
              <li>Las notas de alta prioridad aparecerán destacadas en el chat</li>
              <li>Organiza con categorías para encontrar información rápidamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteSourceForm;