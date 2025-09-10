// FolderHeader.jsx - Header component for Document Folder system
import React from 'react'
import { motion } from 'framer-motion'
import { FolderOpenIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const FolderHeader = ({ overallStats, allExpanded, onToggleAllFolders }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-surface-soft rounded-lg border border-gray-200/8 p-3 mb-4'
    >
      <div className='flex items-center justify-between'>
        <FolderInfo overallStats={overallStats} />
        <FolderControls allExpanded={allExpanded} onToggleAllFolders={onToggleAllFolders} />
      </div>
    </motion.div>
  )
}

const FolderInfo = ({ overallStats }) => (
  <div className='flex items-center space-x-4'>
    <div className='flex items-center space-x-2'>
      <FolderOpenIcon className='h-4 w-4 text-primary-500' />
      <h2 className='text-base font-medium text-text-primary'>Document Folders</h2>
    </div>

    <div className='flex items-center space-x-3 text-xs text-text-muted'>
      <span>
        {overallStats.totalDocuments} document{overallStats.totalDocuments !== 1 ? 's' : ''}
      </span>
      <span>•</span>
      <span>{overallStats.formattedSize}</span>
      <span>•</span>
      <span>
        {overallStats.categoriesWithDocs} categor
        {overallStats.categoriesWithDocs !== 1 ? 'ies' : 'y'}
      </span>
    </div>
  </div>
)

const FolderControls = ({ allExpanded, onToggleAllFolders }) => (
  <div className='flex items-center space-x-2'>
    <motion.button
      onClick={onToggleAllFolders}
      className='flex items-center space-x-1.5 px-2 py-1 text-xs bg-surface-muted hover:bg-surface-pressed rounded transition-colors'
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {allExpanded ? (
        <>
          <EyeSlashIcon className='h-4 w-4' />
          <span>Collapse All</span>
        </>
      ) : (
        <>
          <EyeIcon className='h-4 w-4' />
          <span>Expand All</span>
        </>
      )}
    </motion.button>
  </div>
)

export default FolderHeader
