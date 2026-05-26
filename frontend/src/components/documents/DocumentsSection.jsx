import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpTrayIcon, 
  BookOpenIcon, 
  XMarkIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { DocumentList } from './DocumentList';
import { DocumentUploader } from './DocumentUploader';
import { GlobalDropZone } from './GlobalDropZone';
import { UploadQueue } from './UploadQueue';
import { DeliverableGallery } from './DeliverableGallery';
import { useDocuments } from '../../hooks/useDocuments';
import { useGlobalDragDrop } from '../../hooks/useGlobalDragDrop';

export const DocumentsSection = ({ clientId, clientName = 'Cliente' }) => {
  const [isBriefsOpen, setIsBriefsOpen] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [showUploadQueue, setShowUploadQueue] = useState(false);

  // Hooks para documentos de Briefing (RAG IA)
  const { documents, isLoading, error, upload, remove, download } = useDocuments(clientId);

  // Global drag & drop hook (activo cuando el panel lateral de Briefs está abierto)
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

  // Configurar listeners de arrastrar y soltar globales
  useEffect(() => {
    if (!isBriefsOpen) return;

    const handleDragEnter = (e) => {
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
  }, [handleWindowDragEnter, handleWindowDragLeave, handleWindowDragOver, handleWindowDrop, isBriefsOpen]);

  // Mostrar queue automáticamente cuando hay uploads
  useEffect(() => {
    if (totalUploads > 0) {
      setShowUploadQueue(true);
    }
  }, [totalUploads]);

  // Subir documento
  const handleUpload = async (file) => {
    await upload({ file });
  };

  // Callback de subida exitosa via drag & drop
  async function handleFileUploaded(uploadItem) {
    try {
      await upload({ file: uploadItem.file });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  return (
    <div className="space-y-6 relative min-h-screen pb-24">
      
      {/* 1. SECCIÓN PRINCIPAL: GALERÍA DE ENTREGABLES (VISTA DIRECTA DE POSTS) */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <span>🖼️ Entregables y Posteos a Subir</span>
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Visualiza y descarga todo el historial de imágenes, videos y piezas IA adjuntas en tu cronograma.
          </p>
        </div>

        {/* Botón Prémium para abrir la Biblioteca de Briefing */}
        <motion.button
          onClick={() => setIsBriefsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-primary-500/10 text-xs font-semibold tracking-wide border border-white/10 focus:outline-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <SparklesIcon className="h-4 w-4 text-primary-200 animate-pulse" />
          <span>🧠 Biblioteca Briefs (Contexto IA)</span>
        </motion.button>
      </div>

      {/* Renderizado de la Galería Multimedia del Cronograma */}
      <DeliverableGallery clientId={clientId} />


      {/* 2. PANEL LATERAL DESLIZABLE (DRAWER) - BIBLIOTECA DE BRIEFS (CONTEXTO IA) */}
      <AnimatePresence>
        {isBriefsOpen && (
          <>
            {/* Fondo Oscuro Semi-transparente */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBriefsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 cursor-pointer"
            />

            {/* Panel Deslizable */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-neutral-950/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                
                {/* Cabecera del Panel */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2 text-primary-400">
                    <BookOpenIcon className="h-5 w-5" />
                    <h3 className="font-bold text-text-primary text-base">Biblioteca de Briefing</h3>
                  </div>
                  <button
                    onClick={() => setIsBriefsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Explicación de IA Semántica */}
                <div className="bg-primary-950/20 border border-primary-500/30 rounded-xl p-4 flex items-start space-x-3">
                  <InformationCircleIcon className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-primary-300">¿Cómo lo procesa la IA?</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Al subir PDFs, Word o TXT con manuales de marca o briefs, la web los lee y extrae su significado semántico de forma automática.
                    </p>
                    <p className="text-[11px] text-primary-300 font-semibold leading-relaxed pt-1">
                      💡 La IA buscará automáticamente en estos documentos cada vez que le pidas ideas de posts o escribas copys en el chat.
                    </p>
                  </div>
                </div>

                {/* Drag zone global para el drawer */}
                <AnimatePresence>
                  {isGlobalDragActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mb-4"
                    >
                      <GlobalDropZone
                        onFilesDropped={handleFilesDropped}
                        isVisible={isGlobalDragActive}
                        className="w-full border-primary-500/50 bg-primary-500/10 text-primary-300"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón de Carga de Archivos */}
                <div className="space-y-3">
                  <motion.button
                    onClick={() => setIsUploadExpanded(!isUploadExpanded)}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-colors font-semibold text-xs border border-white/5 ${
                      hasActiveUploads 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-surface-soft hover:bg-surface-strong text-text-primary'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowUpTrayIcon className={`h-4 w-4 ${hasActiveUploads ? 'animate-bounce' : ''}`} />
                    <span>{hasActiveUploads ? 'Subiendo archivos...' : 'Subir manuales / briefs'}</span>
                  </motion.button>

                  {isUploadExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-surface-soft border border-white/10 rounded-xl p-4"
                    >
                      <DocumentUploader
                        clientId={clientId}
                        onUpload={handleUpload}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Cola de subidas flotante local */}
                {showUploadQueue && totalUploads > 0 && (
                  <div className="bg-surface-soft border border-white/10 rounded-xl p-4">
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
                  </div>
                )}

                {/* Listado de Documentos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-text-muted tracking-wider uppercase">Documentos Cargados ({documents.length})</h4>

                  {isLoading ? (
                    <div className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                      <p className="text-xs text-text-muted">Cargando biblioteca...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-red-400">Error: {error.message || String(error)}</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                      <BookOpenIcon className="h-10 w-10 text-text-muted/40 mx-auto mb-2" />
                      <p className="text-xs text-text-muted font-medium">Aún no hay briefs o manuales</p>
                      <p className="text-[10px] text-text-muted/60 max-w-xs mx-auto mt-1">
                        Sube las guías de tu marca para que la IA genere ideas y copies súper personalizados.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-surface-soft/50 border border-white/5 rounded-xl px-4 py-2 max-h-[350px] overflow-y-auto divide-y divide-white/5">
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
                    </div>
                  )}
                </div>

              </div>

              {/* Pie del Panel */}
              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <p className="text-[10px] text-text-muted">
                  Plataforma Cadence • Entrenamiento de IA Semántica en tiempo real
                </p>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
