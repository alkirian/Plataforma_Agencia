import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentIcon, 
  DocumentArrowDownIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

export const DocumentCard = ({ 
  document, 
  columnId, 
  index, 
  onDelete, 
  onDownload 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState({ download: false, delete: false });

  // Obtener icono según tipo de archivo
  const getFileIcon = (fileType) => {
    if (!fileType) return DocumentIcon;
    
    if (fileType.includes('image')) return PhotoIcon;
    if (fileType.includes('pdf') || fileType.includes('document')) return DocumentTextIcon;
    return DocumentIcon;
  };

  const FileIcon = getFileIcon(document.file_type);

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    const dragData = {
      documentId: document.id,
      sourceColumnId: columnId
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Action handlers
  const handleDownload = async () => {
    if (!onDownload) return;
    
    setIsLoading(prev => ({ ...prev, download: true }));
    try {
      await onDownload(document);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, download: false }));
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${document.file_name}"?`)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, delete: true }));
    try {
      await onDelete(document.id);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
  className={`group bg-surface-soft border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-surface-strong hover:border-white/20 ${
        isDragging ? 'opacity-50 scale-95 rotate-2' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {/* Header del documento */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <FileIcon className="h-4 w-4 text-primary-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-text-primary truncate" title={document.file_name}>
            {document.file_name}
          </h5>
          
          <div className="flex items-center space-x-2 mt-1 text-xs text-text-muted">
            {document.file_size && (
              <span>{formatFileSize(document.file_size)}</span>
            )}
            {document.created_at && (
              <>
                <span>•</span>
                <span>{formatDate(document.created_at)}</span>
              </>
            )}
          </div>

          {/* Badge de estado AI si existe */}
          {document.ai_status && (
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                document.ai_status === 'ready'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : document.ai_status === 'processing'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-surface-soft text-text-muted border border-white/20'
              }`}>
                {document.ai_status === 'ready' ? 'Listo' : 
                 document.ai_status === 'processing' ? 'Procesando' : 'Pendiente'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end space-x-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          disabled={isLoading.download}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-text-muted hover:text-primary-400"
          title="Descargar"
        >
          {isLoading.download ? (
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <DocumentArrowDownIcon className="h-4 w-4" />
          )}
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isLoading.delete}
          className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors text-text-muted hover:text-red-400"
          title="Eliminar"
        >
          {isLoading.delete ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
};