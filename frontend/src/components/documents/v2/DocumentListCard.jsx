// DocumentListCard.jsx - Document card component for list view
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

const DocumentListCard = ({
  document,
  isSelected,
  hasVersions,
  versionCount,
  onSelect,
  onContextMenu,
  onPreview,
  onAction,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getFileIcon = () => {
    if (document?.isImage && document.isImage()) {
      return <PhotoIcon className='h-8 w-8' />
    }
    if (document?.isVideo && document.isVideo()) {
      return <VideoCameraIcon className='h-8 w-8' />
    }
    if (document?.isPdf && document.isPdf()) {
      return <DocumentIcon className='h-8 w-8 text-red-500' />
    }
    const extension = document?.getExtension
      ? document.getExtension()
      : document?.filenameOriginal?.split('.').pop()?.toLowerCase()
    if (extension === 'zip' || extension === 'rar') {
      return <ArchiveBoxIcon className='h-8 w-8' />
    }
    return <DocumentIcon className='h-8 w-8' />
  }

  const formatDate = date => {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <motion.div
      layout
      className={`
        flex items-center p-4 bg-surface-soft rounded-lg border transition-all
        ${
          isSelected
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-border-muted hover:border-border-primary'
        }
        ${document?.isPinned && document.isPinned() ? 'ring-2 ring-yellow-400/30' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
      whileHover={{ scale: 1.01 }}
    >
      <DocumentListCardContent
        document={document}
        isSelected={isSelected}
        hasVersions={hasVersions}
        versionCount={versionCount}
        onSelect={onSelect}
        getFileIcon={getFileIcon}
        formatDate={formatDate}
        formatFileSize={formatFileSize}
      />
      
      <DocumentListCardActions
        isHovered={isHovered}
        onPreview={onPreview}
        onAction={onAction}
        onContextMenu={onContextMenu}
        document={document}
      />
    </motion.div>
  )
}

const DocumentListCardContent = ({
  document,
  isSelected,
  hasVersions,
  versionCount,
  onSelect,
  getFileIcon,
  formatDate,
  formatFileSize,
}) => (
  <>
    {/* Selection checkbox */}
    <input type='checkbox' checked={isSelected} onChange={onSelect} className='mr-4' />

    {/* Icon */}
    <div className='flex-shrink-0 mr-4'>{getFileIcon()}</div>

    {/* File info */}
    <div className='flex-1 min-w-0'>
      <div className='flex items-center space-x-2'>
        <h4 className='text-sm font-medium text-text-primary truncate'>
          {document?.filenameOriginal || 'Unknown file'}
        </h4>

        {document?.isPinned && document.isPinned() && (
          <StarIconSolid className='h-4 w-4 text-yellow-400' />
        )}

        {hasVersions && (
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800'>
            v{versionCount}
          </span>
        )}

        {document?.isDuplicate && document.isDuplicate() && (
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800'>
            Duplicate
          </span>
        )}
      </div>

      <div className='flex items-center space-x-4 mt-1 text-xs text-text-muted'>
        <span>{formatFileSize(document?.sizeBytes)}</span>
        <span>{formatDate(document?.createdAt)}</span>
        <span className='flex items-center'>
          <UserIcon className='h-3 w-3 mr-1' />
          {document?.uploadedBy || 'Unknown'}
        </span>
      </div>
    </div>
  </>
)

const DocumentListCardActions = ({
  isHovered,
  onPreview,
  onAction,
  onContextMenu,
  document,
}) => (
  <div className='flex-shrink-0 flex items-center space-x-1'>
    {isHovered && (
      <>
        <button
          onClick={onPreview}
          className='p-2 text-text-muted hover:text-primary-400 transition-colors'
          title='Preview'
        >
          <EyeIcon className='h-4 w-4' />
        </button>

        <button
          onClick={() => onAction('download', document)}
          className='p-2 text-text-muted hover:text-primary-400 transition-colors'
          title='Download'
        >
          <ArrowDownTrayIcon className='h-4 w-4' />
        </button>
      </>
    )}

    <button
      onClick={onContextMenu}
      className='p-2 text-text-muted hover:text-primary-400 transition-colors'
    >
      <EllipsisVerticalIcon className='h-4 w-4' />
    </button>
  </div>
)

export default DocumentListCard