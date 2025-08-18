import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpTrayIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Zona global de drag & drop que aparece en la parte superior
 * Maneja archivos arrastrados desde el escritorio hacia la aplicación
 */
export const GlobalDropZone = ({ 
  onFilesDropped, 
  isVisible = true, 
  className = "" 
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragErrors, setDragErrors] = useState([]);
  const dragCounterRef = useRef(0);

  // Tipos de archivo permitidos (muy flexible)
  const allowedTypes = [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'text/xml',
    'application/xml',
    'text/csv',
    'application/rtf',
    // Imágenes
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    // Audio/Video
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    // Comprimidos
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Otros comunes
    'application/octet-stream'
  ];

  // Validar archivos arrastrados
  const validateFiles = useCallback((files) => {
    const maxSize = 50 * 1024 * 1024; // 50MB por archivo
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      // Verificar tamaño
      if (file.size > maxSize) {
        errors.push(`${file.name} es muy grande (máx. 50MB)`);
        return;
      }

      // Verificar tipo (más flexible)
      const isAllowedType = allowedTypes.includes(file.type) || 
                           file.type.startsWith('image/') ||
                           file.type.startsWith('text/') ||
                           file.type.startsWith('application/');
      
      if (!isAllowedType) {
        errors.push(`${file.name} tipo no soportado`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  }, []);

  // Manejar drag enter
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  // Manejar drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
      setDragErrors([]);
    }
  }, []);

  // Manejar drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cambiar cursor para indicar que se puede soltar
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Manejar drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const { validFiles, errors } = validateFiles(files);
      
      if (errors.length > 0) {
        setDragErrors(errors);
        // Limpiar errores después de 5 segundos
        setTimeout(() => setDragErrors([]), 5000);
      }
      
      if (validFiles.length > 0) {
        onFilesDropped?.(validFiles);
      }
    }
  }, [validateFiles, onFilesDropped]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative ${className}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Zona de drop principal */}
        <motion.div
          animate={{
            scale: isDragActive ? 1.02 : 1,
            borderColor: isDragActive ? '#10b981' : '#374151'
          }}
          transition={{ duration: 0.2 }}
          className={`
            relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200
            ${isDragActive 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30'
            }
          `}
        >
          <div className="px-6 py-8">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Icono principal */}
              <motion.div
                animate={{
                  scale: isDragActive ? 1.2 : 1,
                  rotate: isDragActive ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                {isDragActive ? (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  >
                    <ArrowUpTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </motion.div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </motion.div>

              {/* Texto principal */}
              <motion.div
                animate={{
                  color: isDragActive ? '#059669' : '#6b7280'
                }}
              >
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive 
                    ? '¡Suelta los archivos aquí!' 
                    : 'Arrastra archivos desde tu PC'
                  }
                </h3>
                <p className="text-sm">
                  {isDragActive
                    ? 'Los archivos aparecerán en "Sin clasificar"'
                    : 'Soporta documentos, imágenes, PDFs y más • Máximo 50MB por archivo'
                  }
                </p>
              </motion.div>

              {/* Estadísticas rápidas */}
              {!isDragActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span>📄 Documentos</span>
                  <span>🖼️ Imágenes</span>
                  <span>📊 Hojas de cálculo</span>
                  <span>🎥 Multimedia</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Overlay de errores */}
        <AnimatePresence>
          {dragErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Algunos archivos no se pudieron procesar:
                  </p>
                  <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                    {dragErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalDropZone;