// FolderCategoryContent.jsx - Content area for folder categories
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DocumentGrid from './DocumentGrid'

const FolderCategoryContent = ({
  isExpanded,
  hasDocuments,
  documents,
  viewMode,
  selectedIds,
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  showVersions,
  searchQuery,
}) => {
  const contentVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  }

  return (
    <AnimatePresence>
      {isExpanded && hasDocuments && (
        <motion.div
          variants={contentVariants}
          initial='collapsed'
          animate='expanded'
          exit='collapsed'
          className='overflow-hidden'
        >
          <div className='p-3 pt-0 border-t border-gray-200/8'>
            {/* Document Grid */}
            <DocumentGrid
              documents={documents}
              viewMode={viewMode}
              isLoading={false}
              selectedIds={selectedIds}
              onDocumentSelect={onDocumentSelect}
              onDocumentAction={onDocumentAction}
              onPreview={onPreview}
              showVersions={showVersions}
              className='transition-all duration-300'
            />

            {/* Folder Footer with additional info */}
            <FolderFooter documents={documents} searchQuery={searchQuery} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const FolderFooter = ({ documents, searchQuery }) => {
  if (documents.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className='mt-3 pt-2 border-t border-gray-200/8 text-xs text-text-muted'
    >
      <div className='flex items-center justify-between'>
        <span>
          Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>

        <div className='flex items-center space-x-3'>
          <span>
            Last updated:{' '}
            {new Date(
              Math.max(...documents.map(d => new Date(d?.createdAt || 0)))
            ).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default FolderCategoryContent
