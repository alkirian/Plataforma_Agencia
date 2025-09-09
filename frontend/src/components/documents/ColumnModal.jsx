import React, { useState, useEffect } from 'react'
import { FolderPlusIcon, FolderIcon } from '@heroicons/react/24/outline'
import { Modal, Button } from '../ui'

const COLUMN_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#6b7280', // gray
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // violet
]

export const ColumnModal = ({ isOpen, onClose, onSave, column = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (isEditing && column) {
        setFormData({
          name: column.name || '',
          color: column.color || '#3b82f6',
        })
      } else {
        setFormData({
          name: '',
          color: '#3b82f6',
        })
      }
      setErrors({})
    }
  }, [isOpen, column, isEditing])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length > 30) {
      newErrors.name = 'El nombre no puede tener más de 30 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) return

    const columnData = {
      id: isEditing ? column.id : formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: formData.name.trim(),
      color: formData.color,
      order: isEditing ? column.order : Date.now(), // Usar timestamp para orden
      documentIds: isEditing ? column.documentIds : [],
    }

    try {
      await onSave(columnData)
      onClose()
    } catch (error) {
      console.error('Error saving column:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const actions = [
    {
      id: 'cancel',
      label: 'Cancelar',
      variant: 'ghost',
      onClick: onClose,
    },
    {
      id: 'save',
      label: `${isEditing ? 'Actualizar' : 'Crear'} Columna`,
      variant: 'primary',
      onClick: handleSubmit,
      disabled: !formData.name.trim(),
    },
  ]

  const icon = isEditing ? (
    <FolderIcon className='h-6 w-6 text-primary-400' />
  ) : (
    <FolderPlusIcon className='h-6 w-6 text-primary-400' />
  )

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Columna' : 'Nueva Columna'}
      icon={icon}
      size='md'
      actions={actions}
    >
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Preview */}
        <div className='text-center'>
          <div
            className='inline-flex items-center space-x-2 px-4 py-2 rounded-lg mb-2'
            style={{ backgroundColor: `${formData.color}20`, borderColor: `${formData.color}40` }}
          >
            <div className='w-3 h-3 rounded-full' style={{ backgroundColor: formData.color }} />
            <span className='font-medium text-text-primary'>
              {formData.name || 'Nombre de columna'}
            </span>
          </div>
          <p className='text-sm text-text-muted'>Vista previa</p>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor='column-name' className='block text-sm font-medium text-text-primary mb-2'>
            Nombre de la columna *
          </label>
          <input
            id='column-name'
            type='text'
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder='Ej: En progreso, Completado, Revisión...'
            className={`w-full px-3 py-2 bg-surface-soft border rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)] ${
              errors.name ? 'border-red-500' : 'border-white/20 focus:border-primary-500'
            }`}
            autoFocus
          />
          {errors.name && <p className='text-red-400 text-xs mt-1'>{errors.name}</p>}
        </div>

        {/* Color */}
        <div>
          <label className='block text-sm font-medium text-text-primary mb-2'>Color</label>
          <div className='grid grid-cols-6 gap-2'>
            {COLUMN_COLORS.map(color => (
              <Button
                key={color}
                variant='ghost'
                size='sm'
                onClick={() => handleInputChange('color', color)}
                className={`w-8 h-8 p-0 rounded-lg transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-strong scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
