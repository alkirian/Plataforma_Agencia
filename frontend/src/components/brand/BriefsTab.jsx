import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpTrayIcon,
  BookOpenIcon,
  SparklesIcon,
  InformationCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { DocumentList } from '../documents/DocumentList';
import { DocumentUploader } from '../documents/DocumentUploader';
import { LinkDownloader } from '../documents/LinkDownloader';
import { GlobalDropZone } from '../documents/GlobalDropZone';
import { UploadQueue } from '../documents/UploadQueue';
import { useDocuments } from '../../hooks/useDocuments';
import { useGlobalDragDrop } from '../../hooks/useGlobalDragDrop';

export const BriefsTab = ({ clientId }) => {
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [isDownloadExpanded, setIsDownloadExpanded] = useState(false);
  const [showUploadQueue, setShowUploadQueue] = useState(false);

  // Hooks para documentos de Briefing (RAG IA)
  const { documents, isLoading, error, upload, remove, download, refetch } = useDocuments(clientId);

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
    totalUploads,
  } = useGlobalDragDrop(handleFileUploaded);

  // Configurar listeners de arrastrar y soltar globales
  useEffect(() => {
    const handleDragEnter = e => {
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
  }, [
    handleWindowDragEnter,
    handleWindowDragLeave,
    handleWindowDragOver,
    handleWindowDrop,
  ]);

  // Mostrar queue automáticamente cuando hay uploads
  useEffect(() => {
    if (totalUploads > 0) {
      setShowUploadQueue(true);
    }
  }, [totalUploads]);

  // Subir documento
  const handleUpload = async file => {
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
    <div className='w-full max-w-[1600px] mx-auto px-4 pb-4 space-y-4 h-full overflow-hidden flex flex-col justify-start text-left relative'>
      {/* Drag zone global */}
      <AnimatePresence>
        {isGlobalDragActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm z-50 p-6 flex items-center justify-center'
          >
            <GlobalDropZone
              onFilesDropped={handleFilesDropped}
              isVisible={isGlobalDragActive}
              className='w-full max-w-2xl border-primary-500/50 bg-primary-500/10 text-primary-300 p-12'
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 overflow-hidden h-full'>
        {/* ================= COLUMNA IZQUIERDA: CONFIGURACIÓN Y SUBIDAS (5/12) ================= */}
        <div className='lg:col-span-5 space-y-3 overflow-y-auto max-h-full pr-1 pb-2 flex flex-col justify-start'>
          
          {/* Explicación de IA Semántica */}
          <div className='bg-[#7C5CFC]/5 border border-[#7C5CFC]/20 rounded-2xl p-4 flex items-start space-x-3 shadow-sm'>
            <InformationCircleIcon className='h-5 w-5 text-accent-lavender flex-shrink-0 mt-0.5' />
            <div className='space-y-1.5'>
              <h4 className='text-xs font-bold text-[#9b82ff] uppercase tracking-wider'>¿Cómo lo procesa la IA?</h4>
              <p className='text-[11px] text-text-secondary leading-relaxed'>
                Al subir PDFs, archivos de Word o texto (TXT) con manuales de marca o briefs, la plataforma extrae su significado semántico automáticamente.
              </p>
              <div className='flex items-center gap-1.5 text-[11.5px] text-white font-semibold pt-1'>
                <SparklesIcon className='h-4 w-4 text-accent-sage animate-pulse' />
                <span>La IA leerá esto para generar copys e ideas en el chat.</span>
              </div>
            </div>
          </div>

          {/* Caja de herramientas de carga */}
          <div className='bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-md'>
            <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
              <span>📥</span> Cargar Recursos de Contexto
            </h3>

            <div className='space-y-2'>
              {/* Botón de Carga Tradicional */}
              <motion.button
                onClick={() => {
                  setIsUploadExpanded(!isUploadExpanded);
                  if (isDownloadExpanded) setIsDownloadExpanded(false);
                }}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs border ${
                  hasActiveUploads
                    ? 'bg-orange-600 border-orange-500 text-white'
                    : isUploadExpanded
                    ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/30 text-[#9b82ff]'
                    : 'bg-surface-strong/50 hover:bg-surface-strong border-border-subtle text-text-primary'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ArrowUpTrayIcon
                  className={`h-4 w-4 ${hasActiveUploads ? 'animate-bounce' : ''}`}
                />
                <span>
                  {hasActiveUploads ? 'Subiendo archivos...' : 'Subir manuales / briefs'}
                </span>
              </motion.button>

              {isUploadExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className='bg-surface-strong/20 border border-border-subtle rounded-xl p-3'
                >
                  <DocumentUploader clientId={clientId} onUpload={handleUpload} />
                </motion.div>
              )}

              {/* Descargador de Enlaces Multimedia */}
              <motion.button
                onClick={() => {
                  setIsDownloadExpanded(!isDownloadExpanded);
                  if (isUploadExpanded) setIsUploadExpanded(false);
                }}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs border ${
                  isDownloadExpanded
                    ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/30 text-[#9b82ff]'
                    : 'bg-surface-strong/50 hover:bg-surface-strong border-border-subtle text-text-primary'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <LinkIcon className='h-4 w-4' />
                <span>Descargar desde Enlace (YouTube, Pinterest...)</span>
              </motion.button>

              {isDownloadExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className='bg-surface-strong/20 border border-border-subtle rounded-xl p-3'
                >
                  <LinkDownloader clientId={clientId} onDownloaded={refetch} />
                </motion.div>
              )}
            </div>

            {/* Cola de subidas */}
            {showUploadQueue && totalUploads > 0 && (
              <div className='bg-surface-strong/20 border border-border-subtle rounded-xl p-3'>
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
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: LISTADO DE DOCUMENTOS (7/12) ================= */}
        <div className='lg:col-span-7 h-full flex flex-col justify-start overflow-hidden bg-surface border border-border-subtle rounded-2xl p-4 shadow-md'>
          <div className='flex items-center justify-between border-b border-border-subtle pb-2 mb-3 flex-shrink-0 select-none'>
            <h4 className='text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1 py-1'>
              <span>📚</span> Documentos y Manuales Cargados ({documents.length})
            </h4>
          </div>

          <div className='flex-1 overflow-y-auto pr-1'>
            {isLoading ? (
              <div className='py-20 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2.5'></div>
                <p className='text-xs text-text-muted'>Cargando biblioteca...</p>
              </div>
            ) : error ? (
              <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center'>
                <p className='text-xs text-red-400'>
                  Error: {error.message || String(error)}
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className='text-center py-20 border-2 border-dashed border-border-subtle rounded-2xl'>
                <BookOpenIcon className='h-12 w-12 text-text-muted/30 mx-auto mb-3' />
                <p className='text-xs text-text-primary font-bold uppercase tracking-wider'>
                  Aún no hay briefs o manuales
                </p>
                <p className='text-[10px] text-text-muted max-w-xs mx-auto mt-1.5 leading-relaxed'>
                  Sube las guías o documentos de tu marca para que la IA genere copys personalizados.
                </p>
              </div>
            ) : (
              <div className='bg-surface-strong/10 border border-border-subtle/50 rounded-xl px-4 py-2 divide-y divide-white/5'>
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
      </div>
    </div>
  );
};
