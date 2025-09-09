import { useState, useCallback, useRef } from 'react'

// Upload item status types
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error'

// Upload item interface
export interface UploadItem {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: UploadStatus
  progress: number
  error: string | null
}

// Progress callback type
export type ProgressCallback = (progress: number) => void

// Upload function type that components can provide
export type UploadFunction = (file: File, onProgress?: ProgressCallback) => Promise<any>

// Callback types
export type FilesUploadedCallback = (uploadItem: UploadItem) => void
export type FileUploadCallback = (file: File, uploadItem: UploadItem) => Promise<void>

// Hook options
interface UseGlobalDragDropOptions {
  onFilesUploaded?: FilesUploadedCallback
  onFileUpload?: FileUploadCallback
  uploadFunction?: UploadFunction
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
  maxFiles?: number
  autoCleanupDelay?: number // milliseconds
  enableBatchUploads?: boolean
}

// Upload queue statistics
interface UploadQueueStats {
  total: number
  pending: number
  uploading: number
  completed: number
  error: number
  hasActiveUploads: boolean
  hasErrors: boolean
}

// Hook return type
interface UseGlobalDragDropReturn {
  // State
  isGlobalDragActive: boolean
  uploadQueue: UploadItem[]
  uploadProgress: Record<string, number>
  stats: UploadQueueStats

  // Window drag handlers
  handleWindowDragEnter: (e: DragEvent) => void
  handleWindowDragLeave: (e: DragEvent) => void
  handleWindowDragOver: (e: DragEvent) => void
  handleWindowDrop: (e: DragEvent) => void

  // File handling
  handleFilesDropped: (files: FileList | File[]) => Promise<void>
  handleSingleFile: (file: File) => Promise<void>
  retryUpload: (uploadId: string) => void
  cancelUpload: (uploadId: string) => void
  clearCompletedUploads: () => void
  clearAllUploads: () => void

  // Utilities
  isFileAccepted: (file: File) => boolean
  getUploadById: (uploadId: string) => UploadItem | undefined
  getUploadsByStatus: (status: UploadStatus) => UploadItem[]
}

/**
 * Enhanced hook for managing global drag & drop functionality with TypeScript support
 *
 * Features:
 * - TypeScript support with comprehensive typing
 * - Configurable file type and size validation
 * - Batch upload support
 * - Progress tracking for individual files
 * - Automatic cleanup of completed uploads
 * - Retry and cancel functionality
 * - Comprehensive upload statistics
 * - Debounced drag counter for better UX
 * - Custom upload function support
 */
export const useGlobalDragDrop = (
  options: UseGlobalDragDropOptions = {}
): UseGlobalDragDropReturn => {
  const {
    onFilesUploaded,
    onFileUpload,
    uploadFunction,
    acceptedFileTypes = [],
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    maxFiles = 10,
    autoCleanupDelay = 3000,
    enableBatchUploads = true,
  } = options

  // State with proper typing
  const [isGlobalDragActive, setIsGlobalDragActive] = useState<boolean>(false)
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Refs for tracking
  const dragCounterRef = useRef<number>(0)
  const activeUploadsRef = useRef<Set<string>>(new Set())

  // File validation
  const isFileAccepted = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxFileSize) {
        return false
      }

      // Check file type if specified
      if (acceptedFileTypes.length > 0) {
        const isTypeAccepted = acceptedFileTypes.some(type => {
          if (type.endsWith('/*')) {
            // Handle wildcards like "image/*"
            const baseType = type.slice(0, -2)
            return file.type.startsWith(baseType)
          }
          return file.type === type || file.name.toLowerCase().endsWith(type.toLowerCase())
        })

        if (!isTypeAccepted) {
          return false
        }
      }

      return true
    },
    [acceptedFileTypes, maxFileSize]
  )

  // Window drag event handlers with proper typing
  const handleWindowDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++

    // Only activate if dragging files from the system
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsGlobalDragActive(true)
    }
  }, [])

  const handleWindowDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--

    if (dragCounterRef.current === 0) {
      setIsGlobalDragActive(false)
    }
  }, [])

  const handleWindowDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
  }, [])

  const handleWindowDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsGlobalDragActive(false)
  }, [])

  // Upload progress handler
  const createProgressHandler = useCallback((uploadId: string): ProgressCallback => {
    return (progress: number) => {
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: Math.min(progress, 100),
      }))
    }
  }, [])

  // Default upload function with progress simulation
  const defaultUploadFunction = useCallback(
    async (file: File, onProgress?: ProgressCallback): Promise<void> => {
      return new Promise((resolve, reject) => {
        let progress = 0
        const interval = setInterval(
          () => {
            progress += Math.random() * 20
            if (progress >= 100) {
              progress = 100
              onProgress?.(100)
              clearInterval(interval)
              resolve()
            } else {
              onProgress?.(Math.min(progress, 100))
            }
          },
          200 + Math.random() * 300
        ) // Realistic variable speed
      })
    },
    []
  )

  // Process single file upload
  const processFileUpload = useCallback(
    async (uploadItem: UploadItem): Promise<void> => {
      const progressHandler = createProgressHandler(uploadItem.id)

      try {
        // Update status to uploading
        setUploadQueue(prev =>
          prev.map(item => (item.id === uploadItem.id ? { ...item, status: 'uploading' } : item))
        )

        activeUploadsRef.current.add(uploadItem.id)

        // Use custom upload function if provided, otherwise use default
        const uploadFunc = uploadFunction || defaultUploadFunction

        if (onFileUpload) {
          await onFileUpload(uploadItem.file, uploadItem)
        } else {
          await uploadFunc(uploadItem.file, progressHandler)
        }

        // Mark as completed
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadItem.id ? { ...item, status: 'completed', progress: 100 } : item
          )
        )

        // Notify completion
        onFilesUploaded?.(uploadItem)
      } catch (error) {
        // Mark as error
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadItem.id ? { ...item, status: 'error', error: errorMessage } : item
          )
        )
      } finally {
        activeUploadsRef.current.delete(uploadItem.id)
      }
    },
    [uploadFunction, onFileUpload, onFilesUploaded, createProgressHandler, defaultUploadFunction]
  )

  // Handle single file
  const handleSingleFile = useCallback(
    async (file: File): Promise<void> => {
      if (!isFileAccepted(file)) {
        throw new Error(`File ${file.name} is not accepted`)
      }

      const uploadItem: UploadItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        error: null,
      }

      // Add to queue
      setUploadQueue(prev => [...prev, uploadItem])

      // Process upload
      await processFileUpload(uploadItem)
    },
    [isFileAccepted, processFileUpload]
  )

  // Handle multiple files dropped
  const handleFilesDropped = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const fileArray = Array.from(files)

      // Validate file count
      if (fileArray.length > maxFiles) {
        throw new Error(`Too many files. Maximum allowed: ${maxFiles}`)
      }

      // Filter accepted files
      const acceptedFiles = fileArray.filter(file => {
        if (!isFileAccepted(file)) {
          console.warn(`File ${file.name} was rejected`)
          return false
        }
        return true
      })

      if (acceptedFiles.length === 0) {
        throw new Error('No valid files to upload')
      }

      // Create upload items
      const uploadItems: UploadItem[] = acceptedFiles.map((file, index) => ({
        id: `upload-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        error: null,
      }))

      // Add to queue
      setUploadQueue(prev => [...prev, ...uploadItems])

      // Process uploads
      if (enableBatchUploads) {
        // Process all files in parallel
        await Promise.allSettled(uploadItems.map(item => processFileUpload(item)))
      } else {
        // Process files one by one
        for (const item of uploadItems) {
          await processFileUpload(item)
        }
      }

      // Auto cleanup after delay
      if (autoCleanupDelay > 0) {
        setTimeout(() => {
          setUploadQueue(prev =>
            prev.filter(
              item => item.status !== 'completed' || activeUploadsRef.current.has(item.id)
            )
          )
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            uploadItems.forEach(item => {
              if (item.status === 'completed' && !activeUploadsRef.current.has(item.id)) {
                delete newProgress[item.id]
              }
            })
            return newProgress
          })
        }, autoCleanupDelay)
      }
    },
    [maxFiles, isFileAccepted, processFileUpload, enableBatchUploads, autoCleanupDelay]
  )

  // Retry failed upload
  const retryUpload = useCallback(
    (uploadId: string) => {
      const failedItem = uploadQueue.find(item => item.id === uploadId)
      if (failedItem && failedItem.status === 'error') {
        // Reset the item and retry
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadId ? { ...item, status: 'pending', progress: 0, error: null } : item
          )
        )

        processFileUpload(failedItem)
      }
    },
    [uploadQueue, processFileUpload]
  )

  // Cancel upload
  const cancelUpload = useCallback((uploadId: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== uploadId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[uploadId]
      return newProgress
    })
    activeUploadsRef.current.delete(uploadId)
  }, [])

  // Clear completed uploads
  const clearCompletedUploads = useCallback(() => {
    setUploadQueue(prev =>
      prev.filter(item => item.status !== 'completed' && item.status !== 'error')
    )
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      Object.keys(newProgress).forEach(id => {
        const item = uploadQueue.find(i => i.id === id)
        if (item && (item.status === 'completed' || item.status === 'error')) {
          delete newProgress[id]
        }
      })
      return newProgress
    })
  }, [uploadQueue])

  // Clear all uploads
  const clearAllUploads = useCallback(() => {
    setUploadQueue([])
    setUploadProgress({})
    activeUploadsRef.current.clear()
  }, [])

  // Utility functions
  const getUploadById = useCallback(
    (uploadId: string): UploadItem | undefined => {
      return uploadQueue.find(item => item.id === uploadId)
    },
    [uploadQueue]
  )

  const getUploadsByStatus = useCallback(
    (status: UploadStatus): UploadItem[] => {
      return uploadQueue.filter(item => item.status === status)
    },
    [uploadQueue]
  )

  // Calculate statistics
  const stats: UploadQueueStats = {
    total: uploadQueue.length,
    pending: uploadQueue.filter(item => item.status === 'pending').length,
    uploading: uploadQueue.filter(item => item.status === 'uploading').length,
    completed: uploadQueue.filter(item => item.status === 'completed').length,
    error: uploadQueue.filter(item => item.status === 'error').length,
    hasActiveUploads: uploadQueue.some(item => item.status === 'uploading'),
    hasErrors: uploadQueue.some(item => item.status === 'error'),
  }

  return {
    // State
    isGlobalDragActive,
    uploadQueue,
    uploadProgress,
    stats,

    // Window drag handlers
    handleWindowDragEnter,
    handleWindowDragLeave,
    handleWindowDragOver,
    handleWindowDrop,

    // File handling
    handleFilesDropped,
    handleSingleFile,
    retryUpload,
    cancelUpload,
    clearCompletedUploads,
    clearAllUploads,

    // Utilities
    isFileAccepted,
    getUploadById,
    getUploadsByStatus,
  }
}

export default useGlobalDragDrop
