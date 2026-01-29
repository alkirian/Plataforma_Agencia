import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import StatusPills from '../ui/StatusPills'
import AIGenerateButton from '../ui/AIGenerateButton'
import LinksAccordion from '../ui/LinksAccordion'
import useAIGenerationStore from '@stores/useAIGenerationStore'

const TaskForm = ({
  mode = 'create',
  formData,
  onChange,
  onSubmit,
  selectedDate,
  isLoading = false,
  modeConfig,
}) => {
  const titleRef = useRef(null)
  const { openBulkGenerator } = useAIGenerationStore()

  // Auto-focus en el título cuando se abre, sin scroll
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus({ preventScroll: true })
    }
  }, [])

  const handleInputChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!formData.title?.trim()) return
    onSubmit(formData)
  }

  const handleKeyDown = e => {
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const handleAIGenerate = () => {
    // Abrir modal de generación IA
    openBulkGenerator()
  }

  const formatDate = date => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 p-1'>
      {/* Header con fecha */}
      <div className='flex items-center gap-2 pb-3 border-b border-gray-700'>
        <div className='w-1.5 h-1.5 bg-purple-500 rounded-full' />
        <h3 className='text-xs font-medium text-gray-200'>
          {modeConfig?.title || 'Nuevo contenido'} - {formatDate(selectedDate)}
        </h3>
      </div>

      {/* Campo Título */}
      <div>
        <input
          ref={titleRef}
          type='text'
          value={formData.title || ''}
          onChange={e => handleInputChange('title', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Título del contenido...'
          className='purple-glow-focus w-full px-4 py-3 bg-gray-800/60 border-2 border-transparent rounded-xl text-white text-base placeholder-gray-400 focus:outline-none transition-all'
          required
        />
      </div>

      {/* Campo Media (Idea visual/audiovisual) */}
      <div>
        <label className='block text-xs font-medium text-gray-400 mb-2'>
          Idea visual/audiovisual
        </label>
        <textarea
          value={formData.media || ''}
          onChange={e => handleInputChange('media', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Describe la idea visual...'
          rows={2}
          className='purple-glow-focus w-full px-4 py-2.5 bg-gray-800/60 border-2 border-transparent rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none transition-all resize-none'
        />
      </div>

      {/* Campo Copy */}
      <div>
        <label className='block text-xs font-medium text-gray-400 mb-2'>Copy</label>
        <textarea
          value={formData.copy || ''}
          onChange={e => handleInputChange('copy', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Texto para la red social...'
          rows={3}
          maxLength={2000}
          className='purple-glow-focus w-full px-4 py-2.5 bg-gray-800/60 border-2 border-transparent rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none transition-all resize-none'
        />
        <div className='text-xs text-gray-500 mt-1'>{(formData.copy || '').length}/2000</div>
      </div>

      {/* Estado Pills */}
      <div>
        <label className='block text-xs font-medium text-gray-400 mb-2'>Estado</label>
        <StatusPills
          value={formData.status || 'pendiente'}
          onChange={value => handleInputChange('status', value)}
        />
      </div>

      {/* Botón IA Prominente */}
      <AIGenerateButton onClick={handleAIGenerate} disabled={isLoading} />

      {/* Links & Recursos */}
      <LinksAccordion
        links={formData.links || []}
        onChange={links => handleInputChange('links', links)}
      />

      {/* Botón de envío */}
      <motion.button
        type='submit'
        disabled={!formData.title?.trim() || isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className='w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2'
      >
        {isLoading ? (
          <>
            <LoadingSpinner size='sm' variant='white' />
            {modeConfig?.loadingText || 'Creando...'}
          </>
        ) : (
          <>
            {modeConfig?.icon || (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
            )}
            {modeConfig?.buttonText || 'Crear Contenido'}
          </>
        )}
      </motion.button>

      {/* Shortcut hint */}
      <p className='text-xs text-gray-500 text-center'>
        <kbd className='px-1.5 py-0.5 bg-gray-700 rounded text-xs'>Ctrl</kbd> +
        <kbd className='px-1.5 py-0.5 bg-gray-700 rounded text-xs ml-1'>Enter</kbd> para{' '}
        {mode === 'edit' ? 'actualizar' : 'crear'}
      </p>
    </form>
  )
}

export default TaskForm
