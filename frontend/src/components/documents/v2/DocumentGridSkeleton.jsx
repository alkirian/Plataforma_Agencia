// DocumentGridSkeleton.jsx - Loading skeleton components for DocumentGrid
import React from 'react'

const DocumentGridSkeleton = ({ viewMode, count = 12, className = '' }) => {
  return (
    <div
      className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'} gap-4 ${className}`}
    >
      {[...Array(count)].map((_, i) => (
        <DocumentSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}

const DocumentSkeleton = ({ viewMode }) => {
  if (viewMode === 'list') {
    return <DocumentListSkeleton />
  }

  return <DocumentGridCardSkeleton />
}

const DocumentListSkeleton = () => (
  <div className='flex items-center p-4 bg-surface-soft rounded-lg border border-border-muted'>
    <div className='w-4 h-4 bg-surface-muted rounded mr-4 animate-pulse' />
    <div className='w-8 h-8 bg-surface-muted rounded mr-4 animate-pulse' />
    <div className='flex-1'>
      <div className='h-4 bg-surface-muted rounded mb-2 animate-pulse' />
      <div className='h-3 bg-surface-muted rounded w-1/2 animate-pulse' />
    </div>
  </div>
)

const DocumentGridCardSkeleton = () => (
  <div className='bg-surface-soft rounded-lg border border-border-muted'>
    <div className='aspect-square bg-surface-muted rounded-t-lg animate-pulse' />
    <div className='p-3'>
      <div className='h-4 bg-surface-muted rounded mb-2 animate-pulse' />
      <div className='h-3 bg-surface-muted rounded w-1/2 animate-pulse' />
    </div>
  </div>
)

export { DocumentGridSkeleton, DocumentSkeleton, DocumentListSkeleton, DocumentGridCardSkeleton }
export default DocumentGridSkeleton