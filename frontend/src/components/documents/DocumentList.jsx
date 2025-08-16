import React, { useState } from 'react';
import { DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { deleteDocument, downloadDocument } from '../../api/documents.js';

export const DocumentList = ({ documents = [], clientId, onDocumentDeleted }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const handleDownload = async (docData) => {
    const docId = docData.id;
    setLoadingStates(prev => ({ ...prev, [`download_${docId}`]: true }));
    
    try {
      await downloadDocument(docData);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      alert('Error al descargar el documento. Por favor, intenta de nuevo.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`download_${docId}`]: false }));
    }
  };

  const handleDelete = async (docData) => {
    if (!clientId) {
      console.error('❌ No clientId provided to DocumentList');
      alert('Error: No se puede identificar el cliente');
      return;
    }

    if (!docData.id) {
      console.error('❌ Document has no id:', docData);
      alert('Error: No se puede identificar el documento');
      return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar "${docData.file_name}"?`)) {
      return;
    }

    const docId = docData.id;
    setLoadingStates(prev => ({ ...prev, [`delete_${docId}`]: true }));
    
    try {
      console.log('🗑️ Deleting document:', { 
        clientId, 
        documentId: docId,
        fileName: docData.file_name 
      });
      
      await deleteDocument(clientId, docId);
      
      // Llamar callback para actualizar la lista en el componente padre
      if (onDocumentDeleted) {
        onDocumentDeleted(docId);
      }
      
      console.log('✅ Document deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      alert(`Error al eliminar el documento: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete_${docId}`]: false }));
    }
  };
  return (
    <div className="mt-6 flow-root">
      <ul role="list" className="-my-4 divide-y divide-rambla-border">
        {documents.length === 0 && (
          <li className="py-4 text-rambla-text-secondary">No hay documentos aún.</li>
        )}
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-rambla-bg flex items-center justify-center">
                <span className="text-xs font-bold text-rambla-accent">
                  {(doc.file_type || '').toUpperCase().includes('PDF') ? 'PDF' : 'DOC'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{doc.file_name}</p>
                <p className="text-sm text-rambla-text-secondary">
                  {doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                  {doc.created_at ? ' - ' + new Date(doc.created_at).toLocaleDateString() : ''}
                </p>
              </div>
              {doc.ai_status && (
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  doc.ai_status === 'ready' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  doc.ai_status === 'processing' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  {doc.ai_status === 'ready' ? 'Listo' : doc.ai_status === 'processing' ? 'Procesando' : 'Pendiente'}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleDownload(doc)}
                disabled={loadingStates[`download_${doc.id}`]}
                className="text-rambla-text-secondary hover:text-rambla-accent disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Descargar"
              >
                {loadingStates[`download_${doc.id}`] ? (
                  <div className="w-5 h-5 border-2 border-rambla-accent border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <DocumentArrowDownIcon className="h-5 w-5" />
                )}
              </button>
              <button 
                onClick={() => handleDelete(doc)}
                disabled={loadingStates[`delete_${doc.id}`]}
                className="text-rambla-text-secondary hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Eliminar"
              >
                {loadingStates[`delete_${doc.id}`] ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <TrashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
