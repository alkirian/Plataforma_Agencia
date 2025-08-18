import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TaskForm = ({ 
  formData, 
  onChange, 
  onSubmit, 
  selectedDate,
  isLoading = false 
}) => {
  const titleRef = useRef(null);

  // Auto-focus en el título cuando se abre, sin scroll
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus({ preventScroll: true });
    }
  }, []);

  const handleInputChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    onSubmit(formData);
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Header con fecha - más compacto */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        <h3 className="text-xs font-medium text-gray-200">
          Nueva tarea - {formatDate(selectedDate)}
        </h3>
      </div>

      {/* Campo Título */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Título
        </label>
        <input
          ref={titleRef}
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Post sobre fitness matutino"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
          required
        />
      </div>

      {/* Campo Copy */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Copy del post
        </label>
        <textarea
          value={formData.copy || ''}
          onChange={(e) => handleInputChange('copy', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Texto del post, hashtags, emojis..."
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all resize-none"
        />
        <div className="text-xs text-gray-500 mt-0.5">
          {(formData.copy || '').length}/2000
        </div>
      </div>

      {/* Estados y Canal en fila */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Estado
          </label>
          <select
            value={formData.status || 'pendiente'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
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
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Canal
          </label>
          <select
            value={formData.channel || 'IG'}
            onChange={(e) => handleInputChange('channel', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
          >
            <option value="IG">Instagram</option>
            <option value="FB">Facebook</option>
            <option value="TikTok">TikTok</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Botón de envío */}
      <motion.button
        type="submit"
        disabled={!formData.title?.trim() || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Tarea
          </>
        )}
      </motion.button>

      {/* Shortcut hint */}
      <p className="text-xs text-gray-500 text-center">
        <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl</kbd> + 
        <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs ml-1">Enter</kbd> para crear
      </p>
    </form>
  );
};

export default TaskForm;