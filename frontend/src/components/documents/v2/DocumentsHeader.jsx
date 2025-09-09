// DocumentsHeader.jsx - Header component for Documents Section
import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  XMarkIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

const DocumentsHeader = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  showStats,
  onToggleStats,
  showFilters,
  onToggleFilters,
  onToggleUpload,
  viewMode,
  onViewModeChange,
  stats,
  selectedDocuments,
  isLoadingStats,
  uploadProgress,
  hasActiveUploads,
  activeUploads,
  completedUploads,
  failedUploads,
}) => {
  return (
    <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
      {/* Search and Stats */}
      <div className='flex items-center space-x-4 flex-1'>
        {/* Search */}
        <div className='relative flex-1 max-w-md'>
          <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted' />
          <input
            type='text'
            placeholder='Search documents...'
            value={searchQuery}
            onChange={onSearchChange}
            className='w-full pl-10 pr-4 py-2 bg-surface-soft border border-gray-200/15 rounded-lg focus:outline-none focus:border-primary-500 text-text-primary'
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className='absolute right-3 top-1/2 transform -translate-y-1/2'
            >
              <XMarkIcon className='h-4 w-4 text-text-muted hover:text-text-primary' />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {!isLoadingStats && stats.totalDocuments > 0 && (
          <div className='hidden md:flex items-center space-x-4 text-sm text-text-muted'>
            <span>{stats.totalDocuments} documents</span>
            <span>•</span>
            <span>{formatFileSize(stats.totalSize)}</span>
            {selectedDocuments.length > 0 && (
              <>
                <span>•</span>
                <span className='text-primary-400'>{selectedDocuments.length} selected</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='flex items-center space-x-2'>
        {/* Stats Toggle */}
        <button
          onClick={onToggleStats}
          className={`p-2 rounded-lg transition-colors ${
            showStats
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
          }`}
          title='Storage stats'
          aria-label='Mostrar estadísticas de almacenamiento'
        >
          <ChartBarIcon className='h-4 w-4' />
        </button>

        {/* Filters Toggle */}
        <button
          onClick={onToggleFilters}
          className={`p-2 rounded-lg transition-colors ${
            showFilters
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
          }`}
          title='Filters'
          aria-label='Mostrar filtros'
        >
          <AdjustmentsHorizontalIcon className='h-4 w-4' />
        </button>

        {/* Upload Button */}
        <motion.button
          onClick={onToggleUpload}
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
              className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold'
            >
              {activeUploads + completedUploads + failedUploads}
            </motion.div>
          )}
        </motion.button>

        {/* View Toggle */}
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
    </div>
  )
}

const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className='flex items-center space-x-1 bg-surface-soft rounded-lg p-1'>
      <button
        onClick={() => onViewModeChange('folders')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'folders'
            ? 'bg-primary-500/20 text-primary-400'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
        }`}
        title='Folders view'
        aria-label='Vista de carpetas'
      >
        <FolderIcon className='h-4 w-4' />
      </button>

      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-primary-500/20 text-primary-400'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
        }`}
        title='Grid view'
        aria-label='Vista de cuadrícula'
      >
        <Squares2X2Icon className='h-4 w-4' />
      </button>

      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-primary-500/20 text-primary-400'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
        }`}
        title='List view'
        aria-label='Vista de lista'
      >
        <ListBulletIcon className='h-4 w-4' />
      </button>
    </div>
  )
}

// Utility function
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default DocumentsHeader