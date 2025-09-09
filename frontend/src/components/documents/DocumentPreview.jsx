import React, { useState } from 'react'
import {
  DocumentArrowDownIcon,
  EyeIcon,
  PhotoIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { Modal } from '../ui/Modal'

export const DocumentPreview = ({ isOpen, onClose, document, onDownload }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!document) return null

  const getFileIcon = fileType => {
    if (fileType?.toLowerCase().includes('pdf')) {
      return <DocumentTextIcon className='h-16 w-16 text-red-400' />
    }
    if (fileType?.toLowerCase().includes('image')) {
      return <PhotoIcon className='h-16 w-16 text-gray-400' />
    }
    return <DocumentTextIcon className='h-16 w-16 text-gray-400' />
  }

  const getPreviewContent = () => {
    const fileType = document?.file_type?.toLowerCase() || ''

    // Para PDFs, mostrar mensaje de que se puede abrir
    if (fileType.includes('pdf')) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <DocumentTextIcon className='h-24 w-24 text-red-400 mb-4' />
          <h3 className='text-lg font-medium text-white mb-2'>Documento PDF</h3>
          <p className='text-gray-400 text-center mb-6 max-w-sm'>
            Para ver el contenido completo, descarga el archivo.
          </p>
          <motion.button
            onClick={() => onDownload?.(document)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                       text-white rounded-lg transition-colors'
          >
            <DocumentArrowDownIcon className='h-4 w-4' />
            <span>Descargar PDF</span>
          </motion.button>
        </div>
      )
    }

    // Para imágenes, intentar mostrar preview
    if (fileType.includes('image')) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <PhotoIcon className='h-24 w-24 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-white mb-2'>Imagen</h3>
          <p className='text-gray-400 text-center mb-6 max-w-sm'>
            Vista previa de imagen disponible después de descarga.
          </p>
          <motion.button
            onClick={() => onDownload?.(document)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center space-x-2 px-4 py-2 bg-surface-strong hover:bg-surface-soft 
                       text-white rounded-lg transition-colors border border-white/10'
          >
            <DocumentArrowDownIcon className='h-4 w-4' />
            <span>Descargar Imagen</span>
          </motion.button>
        </div>
      )
    }

    // Para otros tipos de archivo
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <DocumentTextIcon className='h-24 w-24 text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-white mb-2'>Documento</h3>
        <p className='text-gray-400 text-center mb-6 max-w-sm'>
          Vista previa no disponible para este tipo de archivo.
        </p>
        <motion.button
          onClick={() => onDownload?.(document)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 
                     text-white rounded-lg transition-colors'
        >
          <DocumentArrowDownIcon className='h-4 w-4' />
          <span>Descargar</span>
        </motion.button>
      </div>
    )
  }

  const formatFileSize = bytes => {
    if (!bytes) return 'Tamaño desconocido'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const actions = [
    {
      id: 'close',
      label: 'Cerrar',
      variant: 'ghost',
      closeOnClick: true,
    },
    {
      id: 'download',
      label: 'Descargar',
      variant: 'primary',
      icon: <DocumentArrowDownIcon className='h-4 w-4' />,
      onClick: () => onDownload?.(document),
    },
  ]

  const title = (
    <div className='flex items-center space-x-3'>
      {getFileIcon(document?.file_type)}
      <div>
        <h3 className='text-lg font-medium text-white'>{document?.file_name || 'Unknown file'}</h3>
        <p className='text-sm text-gray-400 mt-1'>
          {formatFileSize(document?.file_size)} • {document?.file_type || 'Unknown type'}
        </p>
        {document?.created_at && (
          <p className='text-xs text-gray-500 mt-1'>
            Subido el {new Date(document.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      size='lg'
      maxHeight='90vh'
      actions={actions}
    >
      {/* AI Status */}
      {document?.ai_status && (
        <div className='mb-6 flex items-center justify-center'>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              document.ai_status === 'ready'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : document.ai_status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-surface-soft text-white/70 border border-white/20'
            }`}
          >
            Estado IA:{' '}
            {document.ai_status === 'ready'
              ? 'Procesado'
              : document.ai_status === 'processing'
                ? 'Procesando...'
                : 'Pendiente'}
          </span>
        </div>
      )}

      {/* Preview Area */}
      <div className='bg-black/20 rounded-lg border border-white/10 min-h-[400px]'>
        {getPreviewContent()}
      </div>
    </Modal>
  )
}
