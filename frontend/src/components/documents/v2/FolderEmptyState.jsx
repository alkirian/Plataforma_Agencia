// FolderEmptyState.jsx - Empty state components for Document Folder
import React from 'react'
import { motion } from 'framer-motion'
import {
  FolderIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'

const FolderEmptyState = ({ searchQuery, documents, overallStats }) => {
  if (documents.length === 0 && !searchQuery) {
    return <NoDocumentsState />
  }

  if (searchQuery && overallStats.totalDocuments === 0) {
    return <NoSearchResultsState />
  }

  return null
}

const NoDocumentsState = () => (
  <div className='text-center py-8'>
    <FolderIcon className='h-12 w-12 text-text-muted mx-auto mb-3' />
    <h3 className='text-base font-medium text-text-primary mb-2'>No documents yet</h3>
    <p className='text-sm text-text-muted'>Upload documents to organize them into folders</p>
  </div>
)

const NoSearchResultsState = () => (
  <div className='text-center py-8'>
    <DocumentIcon className='h-12 w-12 text-text-muted mx-auto mb-3' />
    <h3 className='text-base font-medium text-text-primary mb-2'>No documents found</h3>
    <p className='text-sm text-text-muted'>Try adjusting your search terms</p>
  </div>
)

const FolderSkeleton = () => (
  <div className='bg-surface-soft rounded-lg border border-gray-200/8'>
    <div className='flex items-center justify-between p-3'>
      <div className='flex items-center space-x-2'>
        <div className='h-3.5 w-3.5 bg-surface-muted rounded animate-pulse' />
        <div className='h-4 w-4 bg-surface-muted rounded animate-pulse' />
        <div className='h-4 w-24 bg-surface-muted rounded animate-pulse' />
        <div className='h-3 w-12 bg-surface-muted rounded animate-pulse' />
      </div>
      <div className='h-2 w-2 bg-surface-muted rounded-full animate-pulse' />
    </div>
  </div>
)

const FolderLoadingState = ({ searchQuery, visibleCategories }) => {
  if (visibleCategories.length === 0 && searchQuery) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <FolderSkeleton key={i} />
        ))}
      </motion.div>
    )
  }

  return null
}

export { FolderEmptyState, FolderLoadingState, FolderSkeleton }
export default FolderEmptyState