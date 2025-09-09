import React, { useRef, useState, useEffect } from 'react'
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export const DocumentSourceUploader = ({ onUpload, disabled = false }) => {
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [metadata, setMetadata] = useState({})

  const validateFile = file => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (file.size > maxSize) {
      return `${file.name} es muy grande. Máximo 10MB permitido.`
    }

    if (!allowedTypes.includes(file.type)) {
      return `${file.name} no es un tipo de archivo permitido.`
    }

    return null
  }

  const handleFiles = files => {
    const fileArray = Array.from(files)
    const validFiles = []
    const errors = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        const fileId = Date.now() + Math.random()
        validFiles.push({
          file,
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
        })

        // Inicializar metadata para cada archivo
        setMetadata(prev => ({
          ...prev,
          [fileId]: {
            title: file.name.replace(/\.[^/.]+$/, ''), // nombre sin extensión
            description: '',
            tags: [],
          },
        }))
      }
    })

    if (errors.length > 0) {
      setError(errors.join(', '))
    } else {
      setError(null)
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = fileId => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
    setMetadata(prev => {
      const newMeta = { ...prev }
      delete newMeta[fileId]
      return newMeta
    })
  }

  const updateFileMetadata = (fileId, field, value) => {
    setMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value,
      },
    }))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    // Cancelar upload anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Crear nuevo controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setUploading(true)
    setError(null)

    try {
      // Crear promesas de upload con abort signal
      const uploadPromises = selectedFiles.map(async fileItem => {
        if (signal.aborted) {
          throw new Error('Upload cancelled')
        }

        const fileMetadata = metadata[fileItem.id] || {}
        await onUpload(fileItem.file, fileMetadata, { signal })
      })

      await Promise.all(uploadPromises)

      // Solo limpiar estado si no fue cancelado
      if (!signal.aborted) {
        setSelectedFiles([])
        setMetadata({})
      }
    } catch (err) {
      if (err.message !== 'Upload cancelled' && err.name !== 'AbortError') {
        setError(err.message || 'Error al subir archivos')
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onInputChange = e => handleFiles(e.target.files)

  const onDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  const onDragOver = e => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const onDragLeave = e => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const formatFileSize = bytes => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const getFileIcon = type => {
    if (type.includes('image')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('sheet')) return '📊'
    return '📎'
  }

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className='space-y-6'>
      {/* Área de drag & drop */}
      <motion.div
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 ${
          isDragOver && !disabled
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-blue-500/30 hover:border-blue-500/50'
        } ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className='px-6 py-10 text-center'>
          <motion.div
            animate={{
              scale: isDragOver && !disabled ? 1.1 : 1,
              rotate: isDragOver && !disabled ? 5 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <DocumentIcon
              className={`mx-auto h-12 w-12 ${
                isDragOver && !disabled ? 'text-blue-400' : 'text-blue-300'
              }`}
            />
          </motion.div>

          <div className='mt-4'>
            <label
              htmlFor='document-upload'
              className={`cursor-pointer rounded-md font-semibold text-blue-400 
                         hover:text-blue-300 transition-colors ${
                           disabled ? 'pointer-events-none' : ''
                         }`}
            >
              <span className='text-lg'>
                {uploading
                  ? 'Subiendo documentos...'
                  : isDragOver && !disabled
                    ? '¡Suelta los documentos aquí!'
                    : 'Seleccionar documentos'}
              </span>
              <input
                id='document-upload'
                name='document-upload'
                type='file'
                multiple
                ref={inputRef}
                className='sr-only'
                onChange={onInputChange}
                disabled={disabled || uploading}
                accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx'
              />
            </label>
            <p className='mt-2 text-sm text-blue-200/70'>o arrastra y suelta documentos aquí</p>
          </div>

          <p className='mt-4 text-xs text-blue-200/50'>
            PDF, DOC, DOCX, TXT, Imágenes, Excel hasta 10MB
          </p>

          {isDragOver && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='mt-4 text-blue-400 font-medium'
            >
              📄 Documentos listos para agregar
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Lista de archivos seleccionados con metadata */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='space-y-4'
          >
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium text-blue-300'>
                Documentos seleccionados ({selectedFiles.length})
              </h4>
              <div className='flex space-x-2'>
                <motion.button
                  onClick={() => {
                    setSelectedFiles([])
                    setMetadata({})
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='text-xs text-text-muted hover:text-red-400 transition-colors'
                  disabled={uploading}
                >
                  Limpiar todo
                </motion.button>
                <motion.button
                  onClick={uploadFiles}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={uploading || selectedFiles.length === 0}
                  className='px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                             text-white text-xs rounded-md transition-colors'
                >
                  {uploading ? 'Agregando...' : 'Agregar como fuentes'}
                </motion.button>
              </div>
            </div>

            <div className='max-h-96 overflow-y-auto space-y-4'>
              {selectedFiles.map(fileItem => {
                const fileMeta = metadata[fileItem.id] || {}

                return (
                  <motion.div
                    key={fileItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className='p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center space-x-3'>
                        <span className='text-lg'>{getFileIcon(fileItem.type)}</span>
                        <div>
                          <p className='text-sm font-medium text-blue-300 truncate max-w-xs'>
                            {fileItem.name}
                          </p>
                          <p className='text-xs text-blue-200/50'>
                            {formatFileSize(fileItem.size)}
                          </p>
                        </div>
                      </div>

                      {!uploading && (
                        <motion.button
                          onClick={() => removeFile(fileItem.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className='p-1 text-text-muted hover:text-red-400 transition-colors'
                        >
                          <XMarkIcon className='h-4 w-4' />
                        </motion.button>
                      )}
                    </div>

                    {/* Metadata fields */}
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-xs font-medium text-blue-300 mb-1'>
                          Título
                        </label>
                        <input
                          type='text'
                          value={fileMeta.title || ''}
                          onChange={e => updateFileMetadata(fileItem.id, 'title', e.target.value)}
                          placeholder='Título del documento'
                          disabled={uploading}
                          className='w-full px-3 py-2 bg-surface-strong border border-blue-500/30 
                                   rounded-md text-white placeholder-text-muted text-sm
                                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-blue-300 mb-1'>
                          Descripción (opcional)
                        </label>
                        <textarea
                          value={fileMeta.description || ''}
                          onChange={e =>
                            updateFileMetadata(fileItem.id, 'description', e.target.value)
                          }
                          placeholder='Descripción del contenido'
                          disabled={uploading}
                          rows={2}
                          className='w-full px-3 py-2 bg-surface-strong border border-blue-500/30 
                                   rounded-md text-white placeholder-text-muted text-sm
                                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-blue-300 mb-1'>
                          <TagIcon className='inline h-3 w-3 mr-1' />
                          Tags (opcional)
                        </label>
                        <input
                          type='text'
                          value={(fileMeta.tags || []).join(', ')}
                          onChange={e =>
                            updateFileMetadata(
                              fileItem.id,
                              'tags',
                              e.target.value
                                .split(',')
                                .map(t => t.trim())
                                .filter(t => t)
                            )
                          }
                          placeholder='ej: manual, política, procedimiento'
                          disabled={uploading}
                          className='w-full px-3 py-2 bg-surface-strong border border-blue-500/30 
                                   rounded-md text-white placeholder-text-muted text-sm
                                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent'
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensajes de error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg'
          >
            <p className='text-sm text-red-400'>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DocumentSourceUploader
