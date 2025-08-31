import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LinkIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  TagIcon,
  EyeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export const UrlSourceForm = ({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    tags: []
  });
  const [isValidating, setIsValidating] = useState(false);
  const [urlStatus, setUrlStatus] = useState(null); // 'valid' | 'invalid' | 'loading'
  const [urlPreview, setUrlPreview] = useState(null);
  const [error, setError] = useState('');

  // Validar URL en tiempo real
  useEffect(() => {
    if (!formData.url || formData.url.length < 8) {
      setUrlStatus(null);
      setUrlPreview(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await validateUrl(formData.url);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.url]);

  const validateUrl = async (url) => {
    setIsValidating(true);
    setUrlStatus('loading');

    try {
      // Validación básica de formato
      const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/;
      
      if (!urlPattern.test(url)) {
        throw new Error('URL no válida');
      }

      // Simular validación del backend (esto normalmente haría una llamada a la API)
      // Por ahora, asumimos que todas las URLs válidas funcionan
      setUrlStatus('valid');
      
      // Simular preview de la página
      setUrlPreview({
        title: extractDomainName(url),
        description: `Contenido de ${extractDomainName(url)}`,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
      });

      // Auto-llenar título si está vacío
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: extractDomainName(url)
        }));
      }

    } catch (err) {
      setUrlStatus('invalid');
      setError(err.message);
      setUrlPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  const extractDomainName = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Página web';
    }
  };

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
    
    if (!formData.url.trim()) {
      setError('La URL es requerida');
      return;
    }

    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (urlStatus !== 'valid') {
      setError('Por favor ingresa una URL válida');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        url: '',
        title: '',
        description: '',
        tags: []
      });
      setUrlStatus(null);
      setUrlPreview(null);
    } catch (err) {
      setError(err.message || 'Error al agregar URL');
    }
  };

  const getStatusIcon = () => {
    if (isValidating) return <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full" />;
    if (urlStatus === 'valid') return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
    if (urlStatus === 'invalid') return <XCircleIcon className="h-4 w-4 text-red-400" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-green-300">
          <LinkIcon className="inline h-4 w-4 mr-1" />
          URL de la página
        </label>
        <div className="relative">
          <input
            type="url"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="https://ejemplo.com/articulo"
            disabled={disabled}
            className="w-full px-4 py-3 bg-surface-strong border border-green-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-green-500/50 focus:border-transparent
                     pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>

        {/* URL Status Messages */}
        <AnimatePresence>
          {urlStatus === 'valid' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 text-sm text-green-400"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>URL válida y accesible</span>
            </motion.div>
          )}
          {urlStatus === 'invalid' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 text-sm text-red-400"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>URL no válida o inaccesible</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* URL Preview */}
      <AnimatePresence>
        {urlPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src={urlPreview.favicon} 
                  alt="Favicon" 
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <GlobeAltIcon 
                  className="w-8 h-8 text-green-400" 
                  style={{ display: 'none' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-300 truncate">
                  {urlPreview.title}
                </p>
                <p className="text-xs text-green-200/70">
                  {urlPreview.description}
                </p>
                <p className="text-xs text-green-200/50 mt-1">
                  {formData.url}
                </p>
              </div>
              <EyeIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-green-300 mb-2">
          Título
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Título descriptivo de la fuente"
          disabled={disabled}
          className="w-full px-4 py-3 bg-surface-strong border border-green-500/30 
                   rounded-lg text-white placeholder-text-muted
                   focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-green-300 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe qué información contiene esta página..."
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-3 bg-surface-strong border border-green-500/30 
                   rounded-lg text-white placeholder-text-muted
                   focus:ring-2 focus:ring-green-500/50 focus:border-transparent resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-green-300 mb-2">
          <TagIcon className="inline h-4 w-4 mr-1" />
          Tags (opcional)
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="ej: documentación, API, tutorial"
          disabled={disabled}
          className="w-full px-4 py-3 bg-surface-strong border border-green-500/30 
                   rounded-lg text-white placeholder-text-muted
                   focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-green-200/50">
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
            setFormData({ url: '', title: '', description: '', tags: [] });
            setUrlStatus(null);
            setUrlPreview(null);
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
          disabled={disabled || !formData.url || !formData.title || urlStatus !== 'valid'}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 
                   disabled:cursor-not-allowed text-white rounded-lg transition-colors
                   font-medium"
          whileHover={!disabled && urlStatus === 'valid' ? { scale: 1.02 } : {}}
          whileTap={!disabled && urlStatus === 'valid' ? { scale: 0.98 } : {}}
        >
          <LinkIcon className="inline h-4 w-4 mr-2" />
          Agregar URL
        </motion.button>
      </div>

      {/* Info box */}
      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <GlobeAltIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-200/70">
            <p className="font-medium text-green-300 mb-1">💡 Tip:</p>
            <p>El sistema extraerá automáticamente el contenido de la página para que puedas hacer preguntas sobre él.</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default UrlSourceForm;