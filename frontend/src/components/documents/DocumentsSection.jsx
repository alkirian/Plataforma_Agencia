import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpTrayIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { DocumentList } from './DocumentList';
import { DocumentUploader } from './DocumentUploader';
import { DocumentBoard } from './DocumentBoard';
import { useDocuments } from '../../hooks/useDocuments';
import { Tooltip } from '../ui/Tooltip';

export const DocumentsSection = ({ clientId, clientName = 'Cliente' }) => {
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);

  // Hooks
  const { documents, isLoading, error, upload, remove, download } = useDocuments(clientId);

  // Document upload 
  const handleUpload = async (file) => {
    await upload({ file });
  };

  return (
    <div className='space-y-6'>
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
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Subir</span>
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
            <Tooltip content="Vista de tablero">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'board' 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-text-muted hover:text-text-primary hover:bg-white/10'
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
                    : 'text-text-muted hover:text-text-primary hover:bg-white/10'
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
          className="bg-white/5 border border-white/10 rounded-xl p-6"
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
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
