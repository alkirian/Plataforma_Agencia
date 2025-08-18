import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XMarkIcon,
  ArrowPathIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

/**
 * Componente que muestra la cola de uploads con progress y estados
 */
export const UploadQueue = ({
  uploadQueue = [],
  uploadProgress = {},
  onRetry,
  onCancel,
  onClear,
  className = ""
}) => {
  if (uploadQueue.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5"
          >
            <ArrowPathIcon className="w-5 h-5 text-blue-500" />
          </motion.div>
        );
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400'; 
      case 'uploading': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'error': return 'Error';
      case 'uploading': return 'Subiendo...';
      case 'pending': return 'En cola';
      default: return 'Desconocido';
    }
  };

  const hasActiveUploads = uploadQueue.some(item => 
    item.status === 'uploading' || item.status === 'pending'
  );
  
  const completedUploads = uploadQueue.filter(item => item.status === 'completed').length;
  const errorUploads = uploadQueue.filter(item => item.status === 'error').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowPathIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Cola de Subidas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {completedUploads > 0 && `${completedUploads} completados`}
              {completedUploads > 0 && errorUploads > 0 && ' • '}
              {errorUploads > 0 && `${errorUploads} errores`}
            </p>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {!hasActiveUploads && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar completados"
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Lista de uploads */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {uploadQueue.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {/* Icono de estado */}
                <div className="flex-shrink-0">
                  {getStatusIcon(item.status)}
                </div>

                {/* Info del archivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(item.size)}</span>
                    {item.status === 'uploading' && (
                      <span>{Math.round(uploadProgress[item.id] || 0)}%</span>
                    )}
                  </div>

                  {/* Progress bar para uploads activos */}
                  {item.status === 'uploading' && (
                    <motion.div 
                      className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="bg-blue-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress[item.id] || 0}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  )}

                  {/* Mensaje de error */}
                  {item.status === 'error' && item.error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-1 text-xs text-red-600 dark:text-red-400"
                    >
                      {item.error}
                    </motion.p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  {item.status === 'error' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRetry?.(item.id)}
                      className="p-1.5 text-orange-500 hover:text-orange-600 transition-colors"
                      title="Reintentar"
                    >
                      <ArrowPathIcon className="w-3 h-3" />
                    </motion.button>
                  )}
                  
                  {(item.status === 'pending' || item.status === 'error') && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onCancel?.(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Cancelar"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer con estadísticas */}
      {uploadQueue.length > 1 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <span>{uploadQueue.length} archivos total</span>
            {hasActiveUploads && (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-blue-500 font-medium"
              >
                Procesando...
              </motion.span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UploadQueue;