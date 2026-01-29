// Enhanced Upload Zone with Drag & Drop
// Modern UX with queue management and progress tracking

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

const UploadZone = ({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = null, // null = accept all (except dangerous)
  className = '',
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadQueue, setUploadQueue] = useState([])
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)
  const processingRef = useRef(false)

  // Dangerous file extensions
  const dangerousExtensions = ['exe', 'msi', 'dll', 'bat', 'cmd', 'sh', 'scr', 'js']

  const validateFile = useCallback(
    file => {
      const errors = []

      // Size validation
      if (file.size > maxFileSize) {
        errors.push(`File size exceeds ${formatFileSize(maxFileSize)} limit`)
      }

      // Extension validation
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension && dangerousExtensions.includes(extension)) {
        errors.push(`File type .${extension} is not allowed`)
      }

      // Type validation (if specified)
      if (acceptedTypes && !acceptedTypes.includes(file.type)) {
        errors.push('File type not supported')
      }

      return errors
    },
    [maxFileSize, acceptedTypes]
  )

  const processFiles = useCallback(
    async files => {
      // Evitar procesamiento concurrente
      if (processingRef.current) {
        return
      }

      processingRef.current = true

      try {
        // Cancelar procesamiento anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Crear nuevo controller
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        const fileArray = Array.from(files)

        // Validate file count
        if (uploadQueue.length + fileArray.length > maxFiles) {
          // Toast notification would go here
          return
        }

        // Verificar si fue cancelado
        if (signal.aborted) return

        const processedFiles = fileArray.map(file => {
          const errors = validateFile(file)
          return {
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: errors.length > 0 ? 'error' : 'queued',
            progress: 0,
            speed: 0,
            errors,
            startTime: null,
          }
        })

        // Verificar si fue cancelado antes de actualizar estado
        if (signal.aborted) return

        setUploadQueue(prev => [...prev, ...processedFiles])

        // Start processing valid files
        const validFiles = processedFiles.filter(f => f.status === 'queued')
        if (validFiles.length > 0 && !signal.aborted) {
          onFilesSelected(validFiles, { signal })
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error processing files:', error)
        }
      } finally {
        processingRef.current = false
      }
    },
    [uploadQueue.length, maxFiles, validateFile, onFilesSelected]
  )

  const handleDragEnter = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragActive(false)
    }
  }, [])

  const handleDragOver = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const files = e.dataTransfer.files
      if (files?.length > 0) {
        processFiles(files)
      }
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    e => {
      const files = e.target.files
      if (files?.length > 0) {
        processFiles(files)
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [processFiles]
  )

  const removeFromQueue = useCallback(id => {
    setUploadQueue(prev => prev.filter(item => item.id !== id))
  }, [])

  const retryUpload = useCallback(id => {
    setUploadQueue(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'queued', progress: 0, errors: [] } : item
      )
    )
  }, [])

  // Update progress from parent
  const updateProgress = useCallback((id, progress, status, speed = 0) => {
    setUploadQueue(prev =>
      prev.map(item => (item.id === id ? { ...item, progress, status, speed } : item))
    )
  }, [])

  // Expose methods to parent via callback
  React.useEffect(() => {
    if (typeof onFilesSelected === 'function' && onFilesSelected._setMethods) {
      onFilesSelected._setMethods({
        updateProgress,
        clearQueue: () => setUploadQueue([]),
      })
    }
  }, [updateProgress, onFilesSelected])

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-all duration-200 cursor-pointer
          ${
            isDragActive
              ? 'border-[color:var(--palette-primary-accent)] bg-[color:var(--palette-primary-accent)]/5'
              : 'border-border-muted hover:border-[color:var(--palette-hover-state)] hover:bg-surface-soft'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type='file'
          multiple
          onChange={handleFileSelect}
          className='hidden'
          accept={acceptedTypes ? acceptedTypes.join(',') : undefined}
        />

        <motion.div animate={{ scale: isDragActive ? 1.1 : 1 }} className='mx-auto mb-4'>
          <CloudArrowUpIcon className='h-12 w-12 mx-auto text-text-muted' />
        </motion.div>

        <div className='space-y-2'>
          <p className='text-lg font-medium text-text-primary'>
            {isDragActive ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
          <p className='text-sm text-text-muted'>
            Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
          </p>
          {acceptedTypes && (
            <p className='text-xs text-text-muted'>Supported: {acceptedTypes.join(', ')}</p>
          )}
        </div>
      </motion.div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='space-y-2'
          >
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium text-text-primary'>
                Upload Queue ({uploadQueue.length})
              </h4>
              <button
                onClick={() => setUploadQueue([])}
                className='text-xs text-text-muted hover:text-text-primary'
              >
                Clear All
              </button>
            </div>

            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {uploadQueue.map(item => (
                <UploadQueueItem
                  key={item.id}
                  item={item}
                  onRemove={removeFromQueue}
                  onRetry={retryUpload}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Individual queue item component
const UploadQueueItem = ({ item, onRemove, onRetry }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'queued':
        return <ArrowPathIcon className='h-4 w-4 text-[color:var(--palette-cold-alt)]' />
      case 'uploading':
        return <LoadingSpinner size='sm' variant='primary' />
      case 'done':
        return <CheckCircleIcon className='h-4 w-4 text-[color:var(--palette-soft-alt)]' />
      case 'error':
        return (
          <ExclamationTriangleIcon className='h-4 w-4 text-[color:var(--palette-primary-accent)]' />
        )
      case 'duplicate':
        return <CheckCircleIcon className='h-4 w-4 text-[color:var(--palette-secondary-accent)]' />
      default:
        return <DocumentIcon className='h-4 w-4 text-text-muted' />
    }
  }

  const getStatusColor = () => {
    switch (item.status) {
      case 'uploading':
        return 'bg-[color:var(--palette-cold-alt)]'
      case 'done':
        return 'bg-[color:var(--palette-soft-alt)]'
      case 'error':
        return 'bg-[color:var(--palette-primary-accent)]'
      case 'duplicate':
        return 'bg-[color:var(--palette-secondary-accent)]'
      default:
        return 'bg-surface-soft'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='flex items-center space-x-3 p-3 bg-surface-soft rounded-lg border border-border-muted'
    >
      <div className='flex-shrink-0'>{getStatusIcon()}</div>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between mb-1'>
          <p className='text-sm font-medium text-text-primary truncate'>{item.name}</p>
          <span className='text-xs text-text-muted'>{formatFileSize(item.size)}</span>
        </div>

        {/* Progress bar */}
        {(item.status === 'uploading' || item.status === 'done') && (
          <div className='w-full bg-surface-muted rounded-full h-1.5 mb-1'>
            <div
              className={`h-1.5 rounded-full transition-all ${getStatusColor()}`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        {/* Status text */}
        <div className='flex items-center justify-between text-xs text-text-muted'>
          <span>
            {item.status === 'uploading' && item.speed > 0 && `${formatFileSize(item.speed)}/s`}
            {item.status === 'done' && 'Upload complete'}
            {item.status === 'duplicate' && 'Duplicate detected'}
            {item.status === 'error' && item.errors[0]}
            {item.status === 'queued' && 'Waiting...'}
          </span>
          {item.status === 'uploading' && <span>{item.progress}%</span>}
        </div>
      </div>

      <div className='flex-shrink-0 flex space-x-1'>
        {item.status === 'error' && (
          <button
            onClick={() => onRetry(item.id)}
            className='p-1 text-text-muted hover:text-[color:var(--palette-primary-accent)]'
            title='Retry upload'
          >
            <ArrowPathIcon className='h-4 w-4' />
          </button>
        )}

        {item.status !== 'uploading' && (
          <button
            onClick={() => onRemove(item.id)}
            className='p-1 text-text-muted hover:text-[color:var(--palette-primary-accent)]'
            title='Remove from queue'
          >
            <XMarkIcon className='h-4 w-4' />
          </button>
        )}
      </div>
    </motion.div>
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

export default UploadZone
