import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpTrayIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { DocumentList } from './DocumentList';
import { DocumentUploader } from './DocumentUploader';
import { DocumentBoard } from './DocumentBoard';
import { GlobalDropZone } from './GlobalDropZone';
import { UploadQueue } from './UploadQueue';
import { useDocuments } from '../../hooks/useDocuments';
import { useGlobalDragDrop } from '../../hooks/useGlobalDragDrop';
import { Tooltip } from '../ui/Tooltip';

export const DocumentsSection = ({ clientId, clientName = 'Cliente' }) => {
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [showUploadQueue, setShowUploadQueue] = useState(false);

  // Hooks
  const { documents, isLoading, error, upload, remove, download } = useDocuments(clientId);

  // Global drag & drop hook
  const {
    isGlobalDragActive,
    uploadQueue,
    uploadProgress,
    handleWindowDragEnter,
    handleWindowDragLeave,
    handleWindowDragOver,
    handleWindowDrop,
    handleFilesDropped,
    retryUpload,
    cancelUpload,
    clearCompletedUploads,
    hasActiveUploads,
    hasErrors,
    totalUploads
  } = useGlobalDragDrop(handleFileUploaded);

  // Setup window drag & drop listeners
  useEffect(() => {
    const handleDragEnter = (e) => {
      // Solo activar para archivos desde el sistema operativo
      if (e.dataTransfer.types?.includes('Files')) {
        handleWindowDragEnter(e);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleWindowDragLeave);
    document.addEventListener('dragover', handleWindowDragOver);
    document.addEventListener('drop', handleWindowDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleWindowDragLeave);
      document.removeEventListener('dragover', handleWindowDragOver);
      document.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleWindowDragEnter, handleWindowDragLeave, handleWindowDragOver, handleWindowDrop]);

  // Mostrar queue automáticamente cuando hay uploads
  useEffect(() => {
    if (totalUploads > 0) {
      setShowUploadQueue(true);
    }
  }, [totalUploads]);

  // Document upload (método existente)
  const handleUpload = async (file) => {
    await upload({ file });
  };

  // Callback cuando un archivo se sube exitosamente via drag & drop
  async function handleFileUploaded(uploadItem) {
    try {
      await upload({ file: uploadItem.file });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  return (
    <div className='space-y-6 relative'>
      {/* Global Drop Zone - visible cuando se arrastra desde escritorio */}
      <AnimatePresence>
        {isGlobalDragActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <GlobalDropZone
              onFilesDropped={handleFilesDropped}
              isVisible={isGlobalDragActive}
              className="max-w-4xl mx-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue - flotante en la esquina */}
      <AnimatePresence>
        {showUploadQueue && totalUploads > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 z-40 w-80"
          >
            <UploadQueue
              uploadQueue={uploadQueue}
              uploadProgress={uploadProgress}
              onRetry={retryUpload}
              onCancel={cancelUpload}
              onClear={() => {
                clearCompletedUploads();
                setShowUploadQueue(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with View Toggle and Upload */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          
          
          {/* Estadísticas */}
          {documents.length > 0 && (
            <div className="text-sm text-text-muted">
             
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Upload Button */}
          <motion.button
            onClick={() => setIsUploadExpanded(!isUploadExpanded)}
            className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              hasActiveUploads 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            } text-white`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowUpTrayIcon className={`h-5 w-5 ${hasActiveUploads ? 'animate-bounce' : ''}`} />
            <span>{hasActiveUploads ? 'Subiendo...' : 'Subir'}</span>
            
            {/* Badge de uploads activos */}
            {totalUploads > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              >
                {totalUploads}
              </motion.div>
            )}
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-surface-soft rounded-lg p-1">
            <Tooltip content="Vista de tablero">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'board' 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </Tooltip>
            
            <Tooltip content="Vista de lista">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Upload Section - Expandible */}
      {isUploadExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-surface-soft border border-white/10 rounded-xl p-6"
        >
          <DocumentUploader
            clientId={clientId}
            onUpload={handleUpload}
          />
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className='text-text-muted'>Cargando documentos...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className='text-red-400'>Error: {error.message || String(error)}</p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          {/* Document Board View */}
          {viewMode === 'board' && (
            <DocumentBoard
              documents={documents}
              clientId={clientId}
              onDocumentDelete={async documentId => {
                await remove(documentId);
              }}
              onDocumentDownload={async doc => {
                await download(doc);
              }}
            />
          )}

          {/* Simple List View */}
          {viewMode === 'list' && (
            <div className="bg-surface-soft border border-white/10 rounded-xl p-6">
              <h3 className='text-lg font-semibold text-text-primary mb-4'>
                📄 Todos los documentos ({documents.length})
              </h3>
              
              {documents.length > 0 ? (
                <DocumentList
                  documents={documents}
                  clientId={clientId}
                  onDelete={async documentId => {
                    await remove(documentId);
                  }}
                  onDownload={async doc => {
                    await download(doc);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <ListBulletIcon className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    No hay documentos
                  </h3>
                  <p className="text-text-muted mb-6">
                    Sube tu primer documento para comenzar
                  </p>
                  <button
                    onClick={() => setIsUploadExpanded(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    <span>Subir documento</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
