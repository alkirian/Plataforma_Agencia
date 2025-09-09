// FolderCategoryHeader.jsx - Individual folder category header component
import React from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRightIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  ArchiveBoxIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

const getCategoryIcon = categoryKey => {
  const iconMap = {
    documents: DocumentTextIcon,
    images: PhotoIcon,
    videos: FilmIcon,
    spreadsheets: TableCellsIcon,
    presentations: PresentationChartBarIcon,
    archives: ArchiveBoxIcon,
    others: FolderIcon,
  }

  const IconComponent = iconMap[categoryKey] || FolderIcon
  return <IconComponent className='h-4 w-4' />
}

const FolderCategoryHeader = ({
  categoryKey,
  categoryConfig,
  stats,
  hasDocuments,
  isExpanded,
  searchQuery,
  onToggle,
  onKeyDown,
}) => {
  const headerVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
    tap: { scale: 0.99 },
  }

  return (
    <motion.div
      variants={headerVariants}
      initial='rest'
      whileHover='hover'
      whileTap='tap'
      className={`
        flex items-center justify-between p-3 cursor-pointer transition-all
        ${hasDocuments ? 'hover:bg-surface-muted/30' : 'opacity-50 cursor-not-allowed'}
        bg-surface-muted/10 border-l-2 ${categoryConfig.borderColor}
      `}
      onClick={hasDocuments ? onToggle : undefined}
      onKeyDown={hasDocuments ? onKeyDown : undefined}
      tabIndex={hasDocuments ? 0 : -1}
      role='button'
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryConfig.label} folder`}
    >
      <FolderCategoryInfo
        categoryKey={categoryKey}
        categoryConfig={categoryConfig}
        stats={stats}
        hasDocuments={hasDocuments}
        isExpanded={isExpanded}
      />
      <FolderStatusIndicators
        hasDocuments={hasDocuments}
        searchQuery={searchQuery}
        isExpanded={isExpanded}
      />
    </motion.div>
  )
}

const FolderCategoryInfo = ({
  categoryKey,
  categoryConfig,
  stats,
  hasDocuments,
  isExpanded,
}) => (
  <div className='flex items-center space-x-2'>
    {/* Expand/Collapse Icon */}
    <motion.div
      animate={{ rotate: isExpanded ? 90 : 0 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {hasDocuments ? (
        <ChevronRightIcon className='h-3.5 w-3.5 text-text-muted' />
      ) : (
        <div className='h-3.5 w-3.5' />
      )}
    </motion.div>

    {/* Category Icon */}
    <div className='flex items-center' aria-label={categoryConfig.label}>
      {getCategoryIcon(categoryKey)}
    </div>

    {/* Category Info */}
    <div className='flex items-center space-x-2'>
      <h3 className={`text-sm font-medium ${categoryConfig.textColor}`}>
        {categoryConfig.label}
      </h3>

      <div className='flex items-center space-x-1.5 text-xs text-text-muted'>
        <span>({stats?.count || 0})</span>
        {stats?.formattedSize && (
          <>
            <span>•</span>
            <span>{stats.formattedSize}</span>
          </>
        )}
      </div>
    </div>
  </div>
)

const FolderStatusIndicators = ({ hasDocuments, searchQuery, isExpanded }) => (
  <div className='flex items-center space-x-2'>
    {!hasDocuments && !searchQuery && (
      <span className='text-xs text-text-muted bg-surface-muted px-1.5 py-0.5 rounded-sm'>
        Empty
      </span>
    )}

    {searchQuery && !hasDocuments && (
      <span className='text-xs text-text-muted bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-sm'>
        No matches
      </span>
    )}

    {hasDocuments && (
      <motion.div
        className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-green-400' : 'bg-gray-300'}`}
        animate={{
          scale: isExpanded ? [1, 1.1, 1] : 1,
          backgroundColor: isExpanded ? '#4ade80' : '#d1d5db',
        }}
        transition={{ duration: 0.2 }}
      />
    )}
  </div>
)

export default FolderCategoryHeader