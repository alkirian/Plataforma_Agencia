import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon, 
  EyeIcon,
  PhotoIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export const DocumentPreview = ({ 
  isOpen, 
  onClose, 
  document, 
  onDownload 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!document) return null;

  const getFileIcon = (fileType) => {
    if (fileType?.toLowerCase().includes('pdf')) {
      return <DocumentTextIcon className="h-16 w-16 text-red-400" />;
    }
    if (fileType?.toLowerCase().includes('image')) {
      return <PhotoIcon className="h-16 w-16 text-gray-400" />;
    }
    return <DocumentTextIcon className="h-16 w-16 text-gray-400" />;
  };

  const getPreviewContent = () => {
    const fileType = document.file_type?.toLowerCase() || '';
    
    // Para PDFs, mostrar mensaje de que se puede abrir
    if (fileType.includes('pdf')) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <DocumentTextIcon className="h-24 w-24 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Documento PDF</h3>
          <p className="text-gray-400 text-center mb-6 max-w-sm">
            Para ver el contenido completo, descarga el archivo.
          </p>
          <motion.button
            onClick={() => onDownload?.(document)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                       text-white rounded-lg transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Descargar PDF</span>
          </motion.button>
        </div>
      );
    }

    // Para imágenes, intentar mostrar preview
    if (fileType.includes('image')) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <PhotoIcon className="h-24 w-24 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Imagen</h3>
          <p className="text-gray-400 text-center mb-6 max-w-sm">
            Vista previa de imagen disponible después de descarga.
          </p>
          <motion.button
            onClick={() => onDownload?.(document)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-strong hover:bg-surface-soft 
                       text-white rounded-lg transition-colors border border-white/10"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Descargar Imagen</span>
          </motion.button>
        </div>
      );
    }

    // Para otros tipos de archivo
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <DocumentTextIcon className="h-24 w-24 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Documento</h3>
        <p className="text-gray-400 text-center mb-6 max-w-sm">
          Vista previa no disponible para este tipo de archivo.
        </p>
        <motion.button
          onClick={() => onDownload?.(document)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 
                     text-white rounded-lg transition-colors"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>Descargar</span>
        </motion.button>
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Tamaño desconocido';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

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
          <div className="fixed inset-0 bg-black/75" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl 
                                        bg-surface-900/95 border border-white/10 
                                        shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(document.file_type)}
                    <div>
                      <Dialog.Title className="text-lg font-medium text-white">
                        {document.file_name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(document.file_size)} • {document.file_type}
                      </p>
                      {document.created_at && (
                        <p className="text-xs text-gray-500">
                          Subido el {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-surface-soft 
                               transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* AI Status */}
                  {document.ai_status && (
                    <div className="mb-4 flex items-center justify-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                          document.ai_status === 'ready'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : document.ai_status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-surface-soft text-white/70 border border-white/20'
                        }`}
                      >
                        Estado IA: {document.ai_status === 'ready'
                          ? 'Procesado'
                          : document.ai_status === 'processing'
                            ? 'Procesando...'
                            : 'Pendiente'}
                      </span>
                    </div>
                  )}

                  {/* Preview Area */}
                  <div className="bg-black/20 rounded-lg border border-white/10 min-h-[400px]">
                    {getPreviewContent()}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cerrar
                  </motion.button>
                  <motion.button
                    onClick={() => onDownload?.(document)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 
                               text-white rounded-lg transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    <span>Descargar</span>
                  </motion.button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};