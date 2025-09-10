// DocumentGridCard.jsx - Document card component for grid view
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

const DocumentGridCard = ({
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
        group relative bg-surface-soft rounded-lg border cursor-pointer transition-all
        ${
          isSelected
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-border-muted hover:border-border-primary hover:shadow-md'
        }
        ${document?.isPinned && document.isPinned() ? 'ring-2 ring-yellow-400/30' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <DocumentGridCardPreview
        document={document}
        isHovered={isHovered}
        hasVersions={hasVersions}
        versionCount={versionCount}
        onPreview={onPreview}
        onAction={onAction}
        getFileIcon={getFileIcon}
      />

      <DocumentGridCardInfo
        document={document}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
      />

      <DocumentGridCardContextButton onContextMenu={onContextMenu} />
    </motion.div>
  )
}

const DocumentGridCardPreview = ({
  document,
  isHovered,
  hasVersions,
  versionCount,
  onPreview,
  onAction,
  getFileIcon,
}) => (
  <div className='aspect-square relative overflow-hidden rounded-t-lg bg-surface-muted'>
    {document?.isImage && document.isImage() ? (
      <img
        src={`/api/documents/${document?.id || 'unknown'}/preview`}
        alt={document?.filenameOriginal || 'Document preview'}
        className='w-full h-full object-cover'
        loading='lazy'
      />
    ) : (
      <div className='w-full h-full flex items-center justify-center'>{getFileIcon()}</div>
    )}

    <DocumentGridCardOverlay
      isHovered={isHovered}
      onPreview={onPreview}
      onAction={onAction}
      document={document}
    />

    <DocumentGridCardIndicators
      document={document}
      hasVersions={hasVersions}
      versionCount={versionCount}
    />
  </div>
)

const DocumentGridCardOverlay = ({ isHovered, onPreview, onAction, document }) => (
  <AnimatePresence>
    {isHovered && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='absolute inset-0 bg-black/50 flex items-center justify-center space-x-2'
      >
        <button
          onClick={e => {
            e.stopPropagation()
            onPreview()
          }}
          className='p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors'
        >
          <EyeIcon className='h-4 w-4' />
        </button>

        <button
          onClick={e => {
            e.stopPropagation()
            onAction('download', document)
          }}
          className='p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors'
        >
          <ArrowDownTrayIcon className='h-4 w-4' />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
)

const DocumentGridCardIndicators = ({ document, hasVersions, versionCount }) => (
  <>
    {/* Pin indicator */}
    {document?.isPinned && document.isPinned() && (
      <div className='absolute top-2 right-2'>
        <StarIconSolid className='h-4 w-4 text-yellow-400' />
      </div>
    )}

    {/* Version indicator */}
    {hasVersions && (
      <div className='absolute top-2 left-2'>
        <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-500 text-white'>
          v{versionCount}
        </span>
      </div>
    )}
  </>
)

const DocumentGridCardInfo = ({ document, formatFileSize, formatDate }) => (
  <div className='p-3'>
    <h4 className='text-sm font-medium text-text-primary truncate mb-1'>
      {document?.filenameOriginal || 'Unknown file'}
    </h4>

    <div className='flex items-center justify-between text-xs text-text-muted'>
      <span>{formatFileSize(document?.sizeBytes)}</span>
      <span>{formatDate(document?.createdAt)}</span>
    </div>
  </div>
)

const DocumentGridCardContextButton = ({ onContextMenu }) => (
  <button
    onClick={e => {
      e.stopPropagation()
      onContextMenu(e)
    }}
    className='absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-white/80 rounded transition-opacity'
  >
    <EllipsisVerticalIcon className='h-4 w-4 text-text-primary' />
  </button>
)

export default DocumentGridCard
