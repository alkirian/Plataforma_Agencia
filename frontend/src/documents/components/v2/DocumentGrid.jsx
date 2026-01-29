// Document Grid Component - Enhanced with preview, versioning, actions
// Supports both grid and list views
// Refactored: Component broken down into smaller, focused components

import React, { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DocumentIcon } from '@heroicons/react/24/outline'

// Extracted components for better maintainability
import DocumentErrorBoundary from '../ErrorBoundary'
import DocumentListCard from './DocumentListCard.jsx'
import DocumentGridCard from './DocumentGridCard.jsx'
import DocumentContextMenu from './DocumentContextMenu.jsx'
import { DocumentGridSkeleton } from './DocumentGridSkeleton.jsx'

const DocumentGrid = ({
  documents = [],
  viewMode = 'grid', // 'grid' | 'list'
  isLoading = false,
  selectedIds = [],
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  showVersions = true,
  className = '',
}) => {
  const [contextMenu, setContextMenu] = useState(null)

  // Group documents by version if needed
  const groupedDocuments = useMemo(() => {
    if (!showVersions) return documents

    const groups = {}
    documents.forEach(doc => {
      const versionGroup = doc?.versionGroup || 'default'
      if (!groups[versionGroup]) {
        groups[versionGroup] = []
      }
      groups[versionGroup].push(doc)
    })

    // Convert to array and sort versions within each group
    return Object.values(groups).map(versions => {
      const sorted = versions.sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      )
      return {
        latest: sorted[0],
        versions: sorted,
        hasMultipleVersions: sorted.length > 1,
      }
    })
  }, [documents, showVersions])

  const handleContextMenu = (e, document) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      document,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const handleAction = (action, document) => {
    onDocumentAction?.(action, document)
    closeContextMenu()
  }

  if (isLoading) {
    return <DocumentGridSkeleton viewMode={viewMode} count={12} className={className} />
  }

  if (documents.length === 0) {
    return (
      <div className='text-center py-12'>
        <DocumentIcon className='h-12 w-12 text-text-muted mx-auto mb-4' />
        <p className='text-text-muted'>No documents found</p>
      </div>
    )
  }

  return (
    <DocumentErrorBoundary
      componentName='Document Grid'
      fallbackType='grid'
      onRetry={() => window.location.reload()}
    >
      <div
        className={`
        grid gap-4 ${className}
        ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'}
      `}
      >
        {groupedDocuments.map((group, index) => {
          const CardComponent = viewMode === 'list' ? DocumentListCard : DocumentGridCard

          return (
            <DocumentErrorBoundary
              key={group.latest.id}
              componentName='Document Card'
              fallbackType='default'
              onRetry={() => {}}
              showDetails={false}
            >
              <CardComponent
                document={group.latest}
                isSelected={selectedIds.includes(group.latest.id)}
                hasVersions={group.hasMultipleVersions}
                versionCount={group.versions?.length || 1}
                onSelect={() => onDocumentSelect?.(group.latest)}
                onContextMenu={e => handleContextMenu(e, group.latest)}
                onPreview={() => onPreview?.(group.latest)}
                onAction={handleAction}
              />
            </DocumentErrorBoundary>
          )
        })}
      </div>

      {/* Context Menu */}
      <DocumentErrorBoundary
        componentName='Context Menu'
        fallbackType='default'
        onRetry={() => setContextMenu(null)}
        showDetails={false}
      >
        <AnimatePresence>
          {contextMenu && (
            <DocumentContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              document={contextMenu.document}
              onAction={handleAction}
              onClose={closeContextMenu}
            />
          )}
        </AnimatePresence>
      </DocumentErrorBoundary>
    </DocumentErrorBoundary>
  )
}

export default DocumentGrid
