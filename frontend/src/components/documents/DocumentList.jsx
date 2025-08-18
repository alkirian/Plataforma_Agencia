import React, { useState } from 'react';
import { DocumentArrowDownIcon, TrashIcon, EyeIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import {
  deleteDocument as deleteDocumentApi,
  downloadDocument as downloadDocumentApi,
} from '../../api/documents.js';
import { DocumentPreview } from './DocumentPreview';

export const DocumentList = ({
  documents = [],
  clientId,
  onDocumentDeleted,
  onDelete,
  onDownload,
}) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [draggedDocument, setDraggedDocument] = useState(null);

  const handleDownload = async docData => {
    setDownloadingId(docData.id);

    try {
      if (onDownload) {
        await onDownload(docData);
      } else {
        await downloadDocumentApi(docData);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al descargar documento:', error);
      }
      alert('Error al descargar el documento. Por favor, intenta de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async docData => {
    if (!clientId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ No clientId provided to DocumentList');
      }
      alert('Error: No se puede identificar el cliente');
      return;
    }

    if (!docData.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Document has no id:', docData);
      }
      alert('Error: No se puede identificar el documento');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar "${docData.file_name}"?`)) {
      return;
    }

    const docId = docData.id;
    setDeletingId(docId);

    try {
      if (onDelete) {
        await onDelete(docId);
      } else {
        await deleteDocumentApi(clientId, docId);
      }

      if (onDocumentDeleted) {
        onDocumentDeleted(docId);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting document:', error);
      }
      alert(`Error al eliminar el documento: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, doc) => {
    setDraggedDocument(doc);
    e.dataTransfer.setData('text/plain', JSON.stringify(doc));
    e.dataTransfer.effectAllowed = 'move';
    
    // Crear una imagen de arrastre personalizada
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(3deg)';
    dragImage.style.opacity = '0.8';
    e.dataTransfer.setDragImage(dragImage, 20, 20);
  };

  const handleDragEnd = () => {
    setDraggedDocument(null);
  };

  return (
    <div className='mt-6 flow-root'>
      <ul role='list' className='-my-4 divide-y divide-[color:var(--color-border-subtle)]'>
        {documents.length === 0 && (
          <li className='py-4 text-text-muted'>No hay documentos aún.</li>
        )}
        {documents.map(doc => (
          <motion.li 
            key={doc.id} 
            className={`flex items-center justify-between py-4 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing ${
              draggedDocument?.id === doc.id 
                ? 'opacity-50 scale-95 bg-cyan-500/10 border border-cyan-400/30' 
                : 'hover:bg-white/5'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, doc)}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.01 }}
            whileDrag={{ scale: 1.05, rotate: 2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className='flex items-center space-x-4'>
              {/* Drag handle */}
              <div className="flex-shrink-0 text-text-muted opacity-50 hover:opacity-100 transition-opacity">
                <Bars3Icon className="h-4 w-4" />
              </div>
              
              <div className='h-10 w-10 flex-shrink-0 rounded-lg bg-surface-soft flex items-center justify-center border border-[color:var(--color-border-subtle)]'>
                <span className='text-xs font-bold text-text-muted'>
                  {(doc.file_type || '').toUpperCase().includes('PDF') ? 'PDF' : 'DOC'}
                </span>
              </div>
              <div>
                <p className='font-semibold text-text-primary'>{doc.file_name}</p>
                <p className='text-sm text-text-muted'>
                  {doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                  {doc.created_at ? ' - ' + new Date(doc.created_at).toLocaleDateString() : ''}
                </p>
              </div>
              {doc.ai_status && (
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.ai_status === 'ready'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : doc.ai_status === 'processing'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-white/5 text-text-muted border border-[color:var(--color-border-subtle)]'
                  }`}
                >
                  {doc.ai_status === 'ready'
                    ? 'Listo'
                    : doc.ai_status === 'processing'
                      ? 'Procesando'
                      : 'Pendiente'}
                </span>
              )}
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => setPreviewDocument(doc)}
                className='text-text-muted hover:text-[color:var(--color-accent-blue)] transition-colors duration-200'
                title='Vista previa'
              >
                <EyeIcon className='h-5 w-5' />
              </button>
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className='text-text-muted hover:text-[color:var(--color-accent-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                title='Descargar'
              >
                {downloadingId === doc.id ? (
                  <div className='w-5 h-5 border-2 border-[color:var(--color-accent-blue)] border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  <DocumentArrowDownIcon className='h-5 w-5' />
                )}
              </button>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deletingId === doc.id}
                className='text-text-muted hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                title='Eliminar'
              >
                {deletingId === doc.id ? (
                  <div className='w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  <TrashIcon className='h-5 w-5' />
                )}
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
      
      {/* Modal de vista previa */}
      <DocumentPreview
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
        onDownload={onDownload || handleDownload}
      />
    </div>
  );
};
