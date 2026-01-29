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
      return <DocumentIcon className='h-8 w-8 text-[color:var(--palette-primary-accent)]' />
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
        ${document?.isPinned && document.isPinned() ? 'ring-2 ring-[color:var(--palette-secondary-accent)]/30' : ''}
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
}) => {
  const [imgError, setImgError] = React.useState(false)

  // Generar URL del thumbnail
  const getThumbnailUrl = () => {
    if (!document) return null
    // Si tiene storage_path, usar la URL pública de Supabase
    if (document.storagePath) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${document.storagePath}`
    }
    // Fallback a API local
    return `/api/documents/${document?.id || 'unknown'}/preview`
  }

  const isImageFile = document?.isImage
    ? document.isImage()
    : document?.mimeType?.startsWith('image/') || document?.fileType?.startsWith('image/')

  return (
    <div className='aspect-square relative overflow-hidden rounded-t-lg bg-surface-muted'>
      {isImageFile && !imgError ? (
        <img
          src={getThumbnailUrl()}
          alt={document?.filenameOriginal || 'Document preview'}
          className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
          loading='lazy'
          onError={() => setImgError(true)}
        />
      ) : (
        <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-muted to-surface-soft'>
          <div className='text-text-muted opacity-50'>{getFileIcon()}</div>
        </div>
      )}

      {/* Extension badge */}
      <div className='absolute bottom-2 left-2'>
        <span className='px-2 py-1 text-[10px] font-bold uppercase bg-surface-strong/80 text-text-primary rounded backdrop-blur-sm'>
          {document?.extension || document?.getExtension?.() || 'FILE'}
        </span>
      </div>

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
}

const DocumentGridCardOverlay = ({ isHovered, onPreview, onAction, document }) => (
  <AnimatePresence>
    {isHovered && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='absolute inset-0 bg-surface-strong/80 flex items-center justify-center space-x-2'
      >
        <button
          onClick={e => {
            e.stopPropagation()
            onPreview()
          }}
          className='p-2 bg-surface-soft/40 rounded-full text-text-primary hover:bg-surface-soft/60 transition-colors'
        >
          <EyeIcon className='h-4 w-4' />
        </button>

        <button
          onClick={e => {
            e.stopPropagation()
            onAction('download', document)
          }}
          className='p-2 bg-surface-soft/40 rounded-full text-text-primary hover:bg-surface-soft/60 transition-colors'
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
        <StarIconSolid className='h-4 w-4 text-[color:var(--palette-secondary-accent)]' />
      </div>
    )}

    {/* Version indicator */}
    {hasVersions && (
      <div className='absolute top-2 left-2'>
        <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[color:var(--palette-cold-alt)] text-white'>
          v{versionCount}
        </span>
      </div>
    )}
  </>
)

const DocumentGridCardInfo = ({ document, formatFileSize, formatDate }) => (
  <div className='p-3'>
    <h4
      className='text-sm font-medium text-text-primary truncate mb-1'
      title={document?.filenameOriginal}
    >
      {document?.filenameOriginal || 'Unknown file'}
    </h4>

    <div className='flex items-center gap-2 text-xs text-text-muted mb-2'>
      <span className='font-mono bg-surface-muted px-1.5 py-0.5 rounded text-[10px]'>
        {document?.mimeType?.split('/')[1]?.toUpperCase() ||
          document?.extension?.toUpperCase() ||
          'FILE'}
      </span>
      <span>•</span>
      <span>{formatFileSize(document?.sizeBytes)}</span>
    </div>

    <div className='flex items-center justify-between text-xs text-text-muted'>
      <span
        className='truncate max-w-[60%]'
        title={document?.uploadedByName || document?.uploadedBy}
      >
        {document?.uploadedByName || 'Usuario'}
      </span>
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
    className='absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-surface-soft/80 rounded transition-opacity'
  >
    <EllipsisVerticalIcon className='h-4 w-4 text-text-primary' />
  </button>
)

export default DocumentGridCard
