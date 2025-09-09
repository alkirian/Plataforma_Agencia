import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilSquareIcon,
  ExclamationTriangleIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@components/ui/Button'

export const ManualSourceForm = ({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    tags: [],
    category: '',
  })
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const categories = [
    { value: '', label: 'Sin categoría' },
    { value: 'policy', label: 'Políticas' },
    { value: 'procedure', label: 'Procedimientos' },
    { value: 'guideline', label: 'Guías' },
    { value: 'faq', label: 'FAQ' },
    { value: 'knowledge', label: 'Base de conocimiento' },
    { value: 'training', label: 'Material de entrenamiento' },
    { value: 'other', label: 'Otro' },
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleTagsChange = value => {
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)
    setFormData(prev => ({ ...prev, tags }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('El título es requerido')
      return
    }

    if (!formData.content.trim()) {
      setError('El contenido es requerido')
      return
    }

    if (formData.content.length < 10) {
      setError('El contenido debe tener al menos 10 caracteres')
      return
    }

    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        title: '',
        content: '',
        description: '',
        tags: [],
        category: '',
      })
      setShowPreview(false)
    } catch (err) {
      setError(err.message || 'Error al agregar contenido manual')
    }
  }

  const wordCount = formData.content
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
  const charCount = formData.content.length

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Title */}
        <div>
          <label className='block text-sm font-medium text-orange-300 mb-2'>
            <PencilSquareIcon className='inline h-4 w-4 mr-1' />
            Título
          </label>
          <input
            type='text'
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder='Título del contenido'
            disabled={disabled}
            className='w-full px-4 py-3 bg-surface-strong border border-orange-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-orange-500/50 focus:border-transparent'
          />
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-medium text-orange-300 mb-2'>Categoría</label>
          <select
            value={formData.category}
            onChange={e => handleInputChange('category', e.target.value)}
            disabled={disabled}
            className='w-full px-4 py-3 bg-surface-strong border border-orange-500/30 
                     rounded-lg text-white
                     focus:ring-2 focus:ring-orange-500/50 focus:border-transparent'
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-sm font-medium text-orange-300'>
              <DocumentTextIcon className='inline h-4 w-4 mr-1' />
              Contenido
            </label>
            <Button
              type='button'
              onClick={() => setShowPreview(!showPreview)}
              variant='ghost'
              size='sm'
              className='text-xs text-orange-400 hover:text-orange-300 p-1 h-auto'
            >
              {showPreview ? (
                <>
                  <EyeSlashIcon className='h-4 w-4' />
                  <span>Ocultar vista previa</span>
                </>
              ) : (
                <>
                  <EyeIcon className='h-4 w-4' />
                  <span>Ver vista previa</span>
                </>
              )}
            </Button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Editor */}
            <div className={showPreview ? 'lg:col-span-1' : 'lg:col-span-2'}>
              <textarea
                value={formData.content}
                onChange={e => handleInputChange('content', e.target.value)}
                placeholder='Escribe tu contenido aquí... 

Puedes incluir:
• Información importante de políticas
• Procedimientos paso a paso
• Preguntas frecuentes
• Guías de referencia
• Cualquier información contextual relevante'
                disabled={disabled}
                rows={showPreview ? 12 : 16}
                className='w-full px-4 py-3 bg-surface-strong border border-orange-500/30 
                         rounded-lg text-white placeholder-text-muted
                         focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none
                         font-mono text-sm leading-relaxed'
              />

              {/* Word/Character count */}
              <div className='flex justify-between text-xs text-orange-200/50 mt-1'>
                <span>{wordCount} palabras</span>
                <span>{charCount} caracteres</span>
              </div>
            </div>

            {/* Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className='lg:col-span-1'
                >
                  <div className='p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg h-full'>
                    <h4 className='text-sm font-medium text-orange-300 mb-3'>Vista previa</h4>
                    <div className='prose prose-invert prose-sm max-w-none'>
                      {formData.title && (
                        <h3 className='text-orange-200 font-semibold mb-3'>{formData.title}</h3>
                      )}
                      <div className='text-orange-100/80 whitespace-pre-wrap text-sm leading-relaxed'>
                        {formData.content || (
                          <span className='text-orange-200/50 italic'>
                            El contenido aparecerá aquí...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-medium text-orange-300 mb-2'>
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder='Breve descripción de qué información contiene este contenido...'
            disabled={disabled}
            rows={2}
            className='w-full px-4 py-3 bg-surface-strong border border-orange-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none'
          />
        </div>

        {/* Tags */}
        <div>
          <label className='block text-sm font-medium text-orange-300 mb-2'>
            <TagIcon className='inline h-4 w-4 mr-1' />
            Tags (opcional)
          </label>
          <input
            type='text'
            value={formData.tags.join(', ')}
            onChange={e => handleTagsChange(e.target.value)}
            placeholder='ej: política, procedimiento, importante'
            disabled={disabled}
            className='w-full px-4 py-3 bg-surface-strong border border-orange-500/30 
                     rounded-lg text-white placeholder-text-muted
                     focus:ring-2 focus:ring-orange-500/50 focus:border-transparent'
          />
          <p className='mt-1 text-xs text-orange-200/50'>Separa los tags con comas</p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg'
            >
              <ExclamationTriangleIcon className='h-5 w-5 text-red-400 flex-shrink-0' />
              <p className='text-sm text-red-400'>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className='flex justify-end space-x-3'>
          <Button
            type='button'
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                description: '',
                tags: [],
                category: '',
              })
              setError('')
              setShowPreview(false)
            }}
            disabled={disabled}
            variant='ghost'
            size='md'
          >
            Cancelar
          </Button>

          <Button
            type='submit'
            disabled={disabled || !formData.title || !formData.content}
            variant='primary'
            size='md'
            icon={<PencilSquareIcon className='h-4 w-4' />}
            className='font-medium bg-orange-600 hover:bg-orange-700'
          >
            Agregar contenido
          </Button>
        </div>
      </form>

      {/* Info box */}
      <div className='p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg'>
        <div className='flex items-start space-x-2'>
          <DocumentTextIcon className='h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-orange-200/70'>
            <p className='font-medium text-orange-300 mb-1'>✍️ Contenido manual:</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>Ideal para políticas, procedimientos y guías internas</li>
              <li>El contenido estará disponible inmediatamente para el chat</li>
              <li>Usa categorías y tags para organizar mejor la información</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManualSourceForm
