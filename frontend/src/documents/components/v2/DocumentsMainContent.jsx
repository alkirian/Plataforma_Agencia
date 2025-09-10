// DocumentsMainContent.jsx - Main content area for Documents Section
import React from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import DocumentGrid from './DocumentGrid.jsx'
import DocumentFolder from './DocumentFolder.jsx'
import DocumentErrorBoundary from './ErrorBoundary.jsx'

const DocumentsMainContent = ({
  documents,
  isLoading,
  error,
  viewMode,
  searchQuery,
  selectedDocuments,
  pagination,
  clientId,
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  onPageChange,
  onToggleUpload,
}) => {
  if (error) {
    return (
      <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center'>
        <p className='text-red-400'>Error: {error.message || String(error)}</p>
      </div>
    )
  }

  return (
    <div className='bg-surface-soft border border-gray-200/10 rounded-xl p-6'>
      {isLoading ? (
        <LoadingContent viewMode={viewMode} searchQuery={searchQuery} clientId={clientId} />
      ) : documents.length === 0 ? (
        <EmptyState searchQuery={searchQuery} onToggleUpload={onToggleUpload} />
      ) : (
        <DocumentContent
          documents={documents}
          viewMode={viewMode}
          searchQuery={searchQuery}
          selectedDocuments={selectedDocuments}
          pagination={pagination}
          clientId={clientId}
          onDocumentSelect={onDocumentSelect}
          onDocumentAction={onDocumentAction}
          onPreview={onPreview}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

const LoadingContent = ({ viewMode, searchQuery, clientId }) => {
  return viewMode === 'folders' ? (
    <DocumentErrorBoundary
      componentName='Document Folder (Loading)'
      fallbackType='folder'
      showDetails={false}
    >
      <DocumentFolder
        documents={[]}
        viewMode='grid'
        searchQuery={searchQuery}
        selectedIds={[]}
        onDocumentSelect={() => {}}
        onDocumentAction={() => {}}
        onPreview={() => {}}
        showVersions={true}
        clientId={clientId}
        className='w-full'
        isLoading={true}
      />
    </DocumentErrorBoundary>
  ) : (
    <DocumentErrorBoundary
      componentName='Document Grid (Loading)'
      fallbackType='grid'
      showDetails={false}
    >
      <DocumentGrid documents={[]} viewMode={viewMode} isLoading={true} />
    </DocumentErrorBoundary>
  )
}

const EmptyState = ({ searchQuery, onToggleUpload }) => (
  <div className='text-center py-12'>
    <ArrowUpTrayIcon className='h-16 w-16 text-text-muted mx-auto mb-4 opacity-50' />
    <h3 className='text-lg font-medium text-text-primary mb-2'>No documents found</h3>
    <p className='text-text-muted mb-6'>
      {searchQuery
        ? 'No documents match your search criteria'
        : 'Upload your first document to get started'}
    </p>
    <button
      onClick={onToggleUpload}
      className='inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors'
    >
      <ArrowUpTrayIcon className='h-4 w-4' />
      <span>Upload Document</span>
    </button>
  </div>
)

const DocumentContent = ({
  documents,
  viewMode,
  searchQuery,
  selectedDocuments,
  pagination,
  clientId,
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  onPageChange,
}) => {
  return (
    <>
      {viewMode === 'folders' ? (
        <FoldersView
          documents={documents}
          searchQuery={searchQuery}
          selectedDocuments={selectedDocuments}
          clientId={clientId}
          onDocumentSelect={onDocumentSelect}
          onDocumentAction={onDocumentAction}
          onPreview={onPreview}
        />
      ) : (
        <GridListView
          documents={documents}
          viewMode={viewMode}
          selectedDocuments={selectedDocuments}
          pagination={pagination}
          onDocumentSelect={onDocumentSelect}
          onDocumentAction={onDocumentAction}
          onPreview={onPreview}
          onPageChange={onPageChange}
        />
      )}
    </>
  )
}

const FoldersView = ({
  documents,
  searchQuery,
  selectedDocuments,
  clientId,
  onDocumentSelect,
  onDocumentAction,
  onPreview,
}) => (
  <DocumentErrorBoundary componentName='Document Folder' fallbackType='folder' showDetails={false}>
    <DocumentFolder
      documents={documents}
      viewMode='grid'
      searchQuery={searchQuery}
      selectedIds={selectedDocuments}
      onDocumentSelect={document =>
        onDocumentSelect(document, !selectedDocuments.includes(document?.id))
      }
      onDocumentAction={onDocumentAction}
      onPreview={onPreview}
      showVersions={true}
      clientId={clientId}
      className='w-full'
      isLoading={false}
    />
  </DocumentErrorBoundary>
)

const GridListView = ({
  documents,
  viewMode,
  selectedDocuments,
  pagination,
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  onPageChange,
}) => (
  <>
    <DocumentErrorBoundary componentName='Document Grid' fallbackType='grid' showDetails={false}>
      <DocumentGrid
        documents={documents}
        viewMode={viewMode}
        selectedIds={selectedDocuments}
        onDocumentSelect={document =>
          onDocumentSelect(document, !selectedDocuments.includes(document?.id))
        }
        onDocumentAction={onDocumentAction}
        onPreview={onPreview}
        showVersions={true}
      />
    </DocumentErrorBoundary>

    {/* Pagination */}
    {pagination.totalPages > 1 && (
      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    )}
  </>
)

const PaginationControls = ({ pagination, onPageChange }) => (
  <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200/10'>
    <div className='text-sm text-text-muted'>
      Showing {pagination.offset + 1}-
      {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}{' '}
      documents
    </div>

    <DocumentErrorBoundary componentName='Pagination' fallbackType='default' showDetails={false}>
      <div className='flex items-center space-x-2'>
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage <= 1}
          className='px-3 py-2 text-sm bg-surface-strong border border-gray-200/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors'
        >
          Previous
        </button>

        <span className='px-3 py-2 text-sm text-text-primary'>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>

        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage >= pagination.totalPages}
          className='px-3 py-2 text-sm bg-surface-strong border border-gray-200/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors'
        >
          Next
        </button>
      </div>
    </DocumentErrorBoundary>
  </div>
)

export default DocumentsMainContent
