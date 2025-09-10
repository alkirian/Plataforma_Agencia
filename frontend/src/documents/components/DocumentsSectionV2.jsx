// DocumentsSectionV2.jsx - Enhanced Documents Section with V2 Components
// Features: Modern drag & drop, enhanced document management, better UX
// Refactored: Component broken down into smaller, focused components

import React, { useState, useCallback } from 'react'
import { useDocumentsV2 } from './hooks/useDocumentsV2'
import DocumentErrorBoundary from './ErrorBoundary.jsx'

// Extracted components for better maintainability
import DocumentsHeader from './v2/DocumentsHeader.jsx'
import DocumentsStatsPanel from './v2/DocumentsStatsPanel.jsx'
import DocumentsUploadSection from './v2/DocumentsUploadSection.jsx'
import DocumentsMainContent from './v2/DocumentsMainContent.jsx'
import DocumentsSelectionActions from './v2/DocumentsSelectionActions.jsx'

const DocumentsSectionV2Component = ({ clientId, clientName = 'Cliente' }) => {
  // Handle missing or invalid clientId
  if (!clientId || clientId === 'undefined') {
    return (
      <div className='flex items-center justify-center h-64 bg-surface-soft border border-border-muted rounded-xl'>
        <div className='text-center text-text-muted'>
          <p className='text-lg font-medium'>No se pudo cargar los documentos</p>
          <p className='text-sm mt-2'>ID de cliente no válido</p>
        </div>
      </div>
    )
  }

  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'folders'
  const [isUploadExpanded, setIsUploadExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)

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
    uploadDocuments,
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
    clearUploadProgress,
  } = useDocumentsV2(clientId)

  // Handle file upload from UploadZone
  const handleFilesSelected = useCallback(
    async files => {
      try {
        await uploadDocuments(files)
        // Clear upload zone queue after successful upload
        clearUploadProgress()
      } catch (error) {
        console.error('Upload failed:', error)
      }
    },
    [uploadDocuments, clearUploadProgress]
  )

  // Handle document actions
  const handleDocumentAction = useCallback(
    async (action, document) => {
      try {
        switch (action) {
          case 'preview':
            await previewDocument(document)
            break
          case 'download':
            await downloadDocument(document)
            break
          case 'toggle-pin':
            await togglePin(document?.id)
            break
          case 'rename':
            const newName = prompt(
              'Enter new filename:',
              document?.filenameOriginal || 'Unknown file'
            )
            if (newName && newName !== document?.filenameOriginal) {
              await renameDocument({ documentId: document?.id, newName })
            }
            break
          case 'delete':
            if (
              confirm(
                `Are you sure you want to delete "${document?.filenameOriginal || 'this document'}"?`
              )
            ) {
              await deleteDocument(document?.id)
            }
            break
          case 'restore':
            await restoreDocument(document?.id)
            break
          case 'copy-link':
            // This would copy a shareable link to the document
            navigator.clipboard.writeText(
              `${window.location.origin}/documents/${document?.id || 'unknown'}`
            )
            break
          default:
            console.warn('Unknown action:', action)
        }
      } catch (error) {
        console.error(`Action ${action} failed:`, error)
      }
    },
    [togglePin, deleteDocument, restoreDocument, renameDocument, downloadDocument, previewDocument]
  )

  // Handle search
  const handleSearch = useCallback(
    e => {
      const value = e.target.value
      setSearchQuery(value)
      search(value)
    },
    [search]
  )

  // Handle sort change
  const handleSortChange = useCallback(
    sortBy => {
      const currentOrder = queryParams.sortOrder
      const newOrder = queryParams.sortBy === sortBy && currentOrder === 'desc' ? 'asc' : 'desc'
      changeSort(sortBy, newOrder)
    },
    [queryParams.sortBy, queryParams.sortOrder, changeSort]
  )

  // Handle pagination
  const handlePageChange = useCallback(
    page => {
      changePage(page)
    },
    [changePage]
  )

  // Calculate upload stats from progress
  const activeUploads = Object.values(uploadProgress).filter(p => p.status === 'uploading').length
  const completedUploads = Object.values(uploadProgress).filter(p => p.status === 'done').length
  const failedUploads = Object.values(uploadProgress).filter(p => p.status === 'error').length
  const hasActiveUploads = activeUploads > 0

  // Header event handlers
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    search('')
  }, [search])

  return (
    <div className='space-y-6'>
      {/* Header with Search, Stats, and Actions */}
      <DocumentsHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onClearSearch={handleClearSearch}
        showStats={showStats}
        onToggleStats={() => setShowStats(!showStats)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onToggleUpload={() => setIsUploadExpanded(!isUploadExpanded)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={stats}
        selectedDocuments={selectedDocuments}
        isLoadingStats={isLoadingStats}
        uploadProgress={uploadProgress}
        hasActiveUploads={hasActiveUploads}
        activeUploads={activeUploads}
        completedUploads={completedUploads}
        failedUploads={failedUploads}
      />

      {/* Storage Stats Panel */}
      <DocumentsStatsPanel showStats={showStats} stats={stats} isLoadingStats={isLoadingStats} />

      {/* Upload Zone - Expandable with Error Boundary */}
      <DocumentsUploadSection
        isUploadExpanded={isUploadExpanded}
        onFilesSelected={handleFilesSelected}
        clearUploadProgress={clearUploadProgress}
        setIsUploadExpanded={setIsUploadExpanded}
      />

      {/* Main Content - Document Grid or Folders with Error Boundaries */}
      <DocumentsMainContent
        documents={documents}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        searchQuery={searchQuery}
        selectedDocuments={selectedDocuments}
        pagination={pagination}
        clientId={clientId}
        onDocumentSelect={selectDocument}
        onDocumentAction={handleDocumentAction}
        onPreview={previewDocument}
        onPageChange={handlePageChange}
        onToggleUpload={() => setIsUploadExpanded(true)}
      />

      {/* Selection Actions */}
      <DocumentsSelectionActions
        selectedDocuments={selectedDocuments}
        documents={documents}
        onDownloadAll={downloadDocument}
        onClearSelection={clearSelection}
      />
    </div>
  )
}

// Wrap the entire component with Error Boundary
export const DocumentsSectionV2 = props => (
  <DocumentErrorBoundary
    componentName='Documents Section V2'
    fallbackType='default'
    showDetails={process.env.NODE_ENV === 'development'}
  >
    <DocumentsSectionV2Component {...props} />
  </DocumentErrorBoundary>
)
