// DocumentsSectionV2.jsx - Enhanced Documents Section with V2 Components
// Features: Modern drag & drop, enhanced document management, better UX

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpTrayIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  XMarkIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

import UploadZone from './v2/UploadZone.jsx';
import DocumentGrid from './v2/DocumentGrid.jsx';
import DocumentFolder from './v2/DocumentFolder.jsx';
import { useDocumentsV2 } from '../../hooks/useDocumentsV2.js';

export const DocumentsSectionV2 = ({ clientId, clientName = 'Cliente' }) => {
  // Handle missing or invalid clientId
  if (!clientId || clientId === 'undefined') {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-soft border border-border-muted rounded-xl">
        <div className="text-center text-text-muted">
          <p className="text-lg font-medium">No se pudo cargar los documentos</p>
          <p className="text-sm mt-2">ID de cliente no válido</p>
        </div>
      </div>
    );
  }

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'folders'
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Use the new V2 hook
  const {
    documents,
    pagination,
    stats,
    selectedDocuments,
    uploadProgress,
    isLoading,
    isLoadingStats,
    isUploading,
    error,
    upload,
    togglePin,
    deleteDocument,
    restoreDocument,
    renameDocument,
    downloadDocument,
    previewDocument,
    selectDocument,
    selectAllDocuments,
    clearSelection,
    search,
    changePage,
    changeSort,
    updateQueryParams,
    queryParams,
    clearUploadProgress
  } = useDocumentsV2(clientId);

  // Handle file upload from UploadZone
  const handleFilesSelected = useCallback(async (files) => {
    try {
      await upload({ files });
      // Clear upload zone queue after successful upload
      clearUploadProgress();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [upload, clearUploadProgress]);

  // Handle document actions
  const handleDocumentAction = useCallback(async (action, document) => {
    try {
      switch (action) {
        case 'preview':
          await previewDocument(document);
          break;
        case 'download':
          await downloadDocument(document);
          break;
        case 'toggle-pin':
          await togglePin(document.id);
          break;
        case 'rename':
          const newName = prompt('Enter new filename:', document.filenameOriginal);
          if (newName && newName !== document.filenameOriginal) {
            await renameDocument({ documentId: document.id, newName });
          }
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete "${document.filenameOriginal}"?`)) {
            await deleteDocument(document.id);
          }
          break;
        case 'restore':
          await restoreDocument(document.id);
          break;
        case 'copy-link':
          // This would copy a shareable link to the document
          navigator.clipboard.writeText(`${window.location.origin}/documents/${document.id}`);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  }, [togglePin, deleteDocument, restoreDocument, renameDocument, downloadDocument, previewDocument]);

  // Handle search
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    search(value);
  }, [search]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy) => {
    const currentOrder = queryParams.sortOrder;
    const newOrder = queryParams.sortBy === sortBy && currentOrder === 'desc' ? 'asc' : 'desc';
    changeSort(sortBy, newOrder);
  }, [queryParams.sortBy, queryParams.sortOrder, changeSort]);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    changePage(page);
  }, [changePage]);

  // Calculate upload stats from progress
  const activeUploads = Object.values(uploadProgress).filter(p => p.status === 'uploading').length;
  const completedUploads = Object.values(uploadProgress).filter(p => p.status === 'done').length;
  const failedUploads = Object.values(uploadProgress).filter(p => p.status === 'error').length;
  const hasActiveUploads = activeUploads > 0;

  return (
    <div className="space-y-6">
      {/* Header with Search, Stats, and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Stats */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-surface-soft border border-border-muted rounded-lg focus:outline-none focus:border-primary-500 text-text-primary"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  search('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className="h-4 w-4 text-text-muted hover:text-text-primary" />
              </button>
            )}
          </div>

          {/* Quick Stats */}
          {!isLoadingStats && stats.totalDocuments > 0 && (
            <div className="hidden md:flex items-center space-x-4 text-sm text-text-muted">
              <span>{stats.totalDocuments} documents</span>
              <span>•</span>
              <span>{formatFileSize(stats.totalSize)}</span>
              {selectedDocuments.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-primary-400">{selectedDocuments.length} selected</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition-colors ${
              showStats 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
            }`}
            title="Storage stats"
            aria-label="Mostrar estadísticas de almacenamiento"
          >
            <ChartBarIcon className="h-4 w-4" />
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
            }`}
            title="Filters"
            aria-label="Mostrar filtros"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>

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
            <span>{hasActiveUploads ? 'Uploading...' : 'Upload'}</span>
            
            {/* Upload progress badge */}
            {(activeUploads > 0 || completedUploads > 0 || failedUploads > 0) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              >
                {activeUploads + completedUploads + failedUploads}
              </motion.div>
            )}
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-surface-soft rounded-lg p-1">
            <button
              onClick={() => setViewMode('folders')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'folders' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
              }`}
              title="Folders view"
              aria-label="Vista de carpetas"
            >
              <FolderIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
              }`}
              title="Grid view"
              aria-label="Vista de cuadrícula"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
              }`}
              title="List view"
              aria-label="Vista de lista"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Storage Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-soft border border-border-muted rounded-xl p-4"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-3">Storage Statistics</h3>
            {isLoadingStats ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-surface-muted rounded w-1/3"></div>
                <div className="h-4 bg-surface-muted rounded w-1/4"></div>
                <div className="h-4 bg-surface-muted rounded w-1/2"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Total Documents</p>
                  <p className="text-xl font-semibold text-text-primary">{stats.totalDocuments || 0}</p>
                </div>
                <div>
                  <p className="text-text-muted">Total Size</p>
                  <p className="text-xl font-semibold text-text-primary">{formatFileSize(stats.totalSize || 0)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Pinned</p>
                  <p className="text-xl font-semibold text-text-primary">{stats.pinnedCount || 0}</p>
                </div>
                <div>
                  <p className="text-text-muted">Versions</p>
                  <p className="text-xl font-semibold text-text-primary">{stats.versionCount || 0}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone - Expandable */}
      <AnimatePresence>
        {isUploadExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-soft border border-border-muted rounded-xl p-6"
          >
            <UploadZone
              onFilesSelected={handleFilesSelected}
              maxFiles={10}
              maxFileSize={100 * 1024 * 1024} // 100MB
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">Error: {error.message || String(error)}</p>
        </div>
      )}

      {/* Main Content - Document Grid or Folders */}
      <div className="bg-surface-soft border border-border-muted rounded-xl p-6">
        {isLoading ? (
          viewMode === 'folders' ? (
            <DocumentFolder
              documents={[]}
              viewMode="grid"
              searchQuery={searchQuery}
              selectedIds={[]}
              onDocumentSelect={selectDocument}
              onDocumentAction={handleDocumentAction}
              onPreview={previewDocument}
              showVersions={true}
              clientId={clientId}
              className="w-full"
              isLoading={true}
            />
          ) : (
            <DocumentGrid
              documents={[]}
              viewMode={viewMode}
              isLoading={true}
            />
          )
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUpTrayIcon className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No documents found
            </h3>
            <p className="text-text-muted mb-6">
              {searchQuery ? 'No documents match your search criteria' : 'Upload your first document to get started'}
            </p>
            <button
              onClick={() => setIsUploadExpanded(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'folders' ? (
              /* Folder View */
              <DocumentFolder
                documents={documents}
                viewMode="grid"
                searchQuery={searchQuery}
                selectedIds={selectedDocuments}
                onDocumentSelect={(document) => selectDocument(document, !selectedDocuments.includes(document.id))}
                onDocumentAction={handleDocumentAction}
                onPreview={previewDocument}
                showVersions={true}
                clientId={clientId}
                className="w-full"
                isLoading={false}
              />
            ) : (
              /* Grid/List View */
              <>
                <DocumentGrid
                  documents={documents}
                  viewMode={viewMode}
                  selectedIds={selectedDocuments}
                  onDocumentSelect={(document) => selectDocument(document, !selectedDocuments.includes(document.id))}
                  onDocumentAction={handleDocumentAction}
                  onPreview={previewDocument}
                  showVersions={true}
                />

                {/* Pagination - Only show for grid/list view */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-muted">
                    <div className="text-sm text-text-muted">
                      Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} documents
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                        className="px-3 py-2 text-sm bg-surface-strong border border-border-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors"
                      >
                        Previous
                      </button>
                      
                      <span className="px-3 py-2 text-sm text-text-primary">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages}
                        className="px-3 py-2 text-sm bg-surface-strong border border-border-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Selection Actions */}
      <AnimatePresence>
        {selectedDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-surface-strong border border-border-muted rounded-xl p-4 shadow-lg z-40"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-primary">
                {selectedDocuments.length} document(s) selected
              </span>
              <button
                onClick={() => {
                  selectedDocuments.forEach(docId => {
                    const doc = documents.find(d => d.id === docId);
                    if (doc) downloadDocument(doc);
                  });
                }}
                className="px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Download All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm bg-surface-muted hover:bg-surface-soft text-text-primary rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility function
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};