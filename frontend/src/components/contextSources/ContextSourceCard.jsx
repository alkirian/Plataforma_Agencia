import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { SOURCE_TYPE_CONFIG, PROCESSING_STATUS } from '../../api/contextSources.api'

export const ContextSourceCard = ({
  source,
  onEdit,
  onDelete,
  onDownload,
  onView,
  disabled = false,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const config = SOURCE_TYPE_CONFIG[source.source_type]

  if (!config) return null

  const colorVariants = {
    blue: {
      card: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
      text: 'text-blue-300',
      icon: 'text-blue-400',
      badge: 'bg-blue-500 text-white',
    },
    green: {
      card: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
      text: 'text-green-300',
      icon: 'text-green-400',
      badge: 'bg-green-500 text-white',
    },
    orange: {
      card: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
      text: 'text-orange-300',
      icon: 'text-orange-400',
      badge: 'bg-orange-500 text-white',
    },
    purple: {
      card: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
      text: 'text-purple-300',
      icon: 'text-purple-400',
      badge: 'bg-purple-500 text-white',
    },
  }

  const colors = colorVariants[config.color]

  const getStatusInfo = status => {
    switch (status) {
      case PROCESSING_STATUS.PENDING:
        return {
          icon: ClockIcon,
          text: 'Pendiente',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
        }
      case PROCESSING_STATUS.PROCESSING:
        return {
          icon: () => <LoadingSpinner size='sm' variant='warning' />,
          text: 'Procesando',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
        }
      case PROCESSING_STATUS.READY:
        return {
          icon: CheckCircleIcon,
          text: 'Listo',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
        }
      case PROCESSING_STATUS.ERROR:
        return {
          icon: ExclamationTriangleIcon,
          text: 'Error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
        }
      default:
        return {
          icon: CheckCircleIcon,
          text: 'Listo',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
        }
    }
  }

  const statusInfo = getStatusInfo(source.status)
  const StatusIcon = statusInfo.icon

  const formatFileSize = bytes => {
    if (!bytes) return ''
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPriorityStars = priority => {
    if (!priority || source.source_type !== 'note') return null

    const levels = { low: 1, medium: 2, high: 3, urgent: 4 }
    const level = levels[priority] || 2

    return (
      <div className='flex space-x-0.5'>
        {Array.from({ length: level }, (_, i) => (
          <StarIconSolid key={i} className='h-3 w-3 text-yellow-400' />
        ))}
        {Array.from({ length: 4 - level }, (_, i) => (
          <StarIcon key={i + level} className='h-3 w-3 text-gray-500' />
        ))}
      </div>
    )
  }

  const canDownload = source.source_type === 'document' && source.storage_path

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-xl border transition-all duration-200 ${colors.card}`}
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-start space-x-3 flex-1'>
          {/* Icon */}
          <div className={`text-2xl ${colors.icon} flex-shrink-0`}>{config.icon}</div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h3 className={`font-semibold ${colors.text} truncate`}>{source.title}</h3>

            {source.description && (
              <p className='text-sm text-text-muted mt-1 line-clamp-2'>{source.description}</p>
            )}

            {/* URL específico */}
            {source.source_type === 'url' && source.url && (
              <p className='text-xs text-text-muted/70 mt-1 truncate'>{source.url}</p>
            )}

            {/* File size para documentos */}
            {source.source_type === 'document' && source.file_size && (
              <p className='text-xs text-text-muted/70 mt-1'>{formatFileSize(source.file_size)}</p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className='relative'>
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            disabled={disabled}
            className='p-1 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-surface-strong'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <EllipsisHorizontalIcon className='h-5 w-5' />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className='absolute right-0 top-8 z-20 w-48 bg-surface-strong border border-white/10 rounded-lg shadow-lg py-2'
                onBlur={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    onView?.(source)
                    setShowMenu(false)
                  }}
                  className='w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-soft transition-colors'
                >
                  <EyeIcon className='h-4 w-4' />
                  <span>Ver detalles</span>
                </button>

                <button
                  onClick={() => {
                    onEdit?.(source)
                    setShowMenu(false)
                  }}
                  className='w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-soft transition-colors'
                >
                  <PencilIcon className='h-4 w-4' />
                  <span>Editar</span>
                </button>

                {canDownload && (
                  <button
                    onClick={() => {
                      onDownload?.(source)
                      setShowMenu(false)
                    }}
                    className='w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-soft transition-colors'
                  >
                    <ArrowDownTrayIcon className='h-4 w-4' />
                    <span>Descargar</span>
                  </button>
                )}

                <hr className='my-1 border-white/10' />

                <button
                  onClick={() => {
                    onDelete?.(source)
                    setShowMenu(false)
                  }}
                  className='w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors'
                >
                  <TrashIcon className='h-4 w-4' />
                  <span>Eliminar</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags */}
      {source.tags && source.tags.length > 0 && (
        <div className='flex flex-wrap gap-1 mb-3'>
          {source.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className='inline-flex items-center space-x-1 px-2 py-1 bg-surface-strong border border-white/10 rounded-md text-xs text-text-muted'
            >
              <TagIcon className='h-3 w-3' />
              <span>{tag}</span>
            </span>
          ))}
          {source.tags.length > 3 && (
            <span className='text-xs text-text-muted'>+{source.tags.length - 3} más</span>
          )}
        </div>
      )}

      {/* Priority (solo para notas) */}
      {source.source_type === 'note' && source.priority && (
        <div className='mb-3'>{getPriorityStars(source.priority)}</div>
      )}

      {/* Footer */}
      <div className='flex items-center justify-between text-xs'>
        {/* Status */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
          <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </div>

        {/* Date */}
        <span className='text-text-muted'>{formatDate(source.created_at)}</span>
      </div>

      {/* Source type badge */}
      <div
        className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}
      >
        {config.name.slice(0, 3)}
      </div>

      {/* Click overlay para cerrar menu */}
      {showMenu && <div className='fixed inset-0 z-10' onClick={() => setShowMenu(false)} />}
    </motion.div>
  )
}

export default ContextSourceCard
