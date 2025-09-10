import React from 'react'
import { motion } from 'framer-motion'
import { SOURCE_TYPE_CONFIG, SOURCE_TYPES } from '../../api/contextSources.api'

const colorVariants = {
  blue: {
    card: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
    icon: 'text-blue-400',
    title: 'text-blue-300',
    description: 'text-blue-200/70',
  },
  green: {
    card: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
    icon: 'text-green-400',
    title: 'text-green-300',
    description: 'text-green-200/70',
  },
  orange: {
    card: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
    icon: 'text-orange-400',
    title: 'text-orange-300',
    description: 'text-orange-200/70',
  },
  purple: {
    card: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
    icon: 'text-purple-400',
    title: 'text-purple-300',
    description: 'text-purple-200/70',
  },
}

export const SourceTypeSelector = ({
  onTypeSelect,
  selectedType,
  sourceCounts = {},
  disabled = false,
}) => {
  const sourceTypes = Object.values(SOURCE_TYPES)

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {sourceTypes.map(sourceType => {
        const config = SOURCE_TYPE_CONFIG[sourceType]
        const colors = colorVariants[config.color]
        const count = sourceCounts[sourceType] || 0
        const isSelected = selectedType === sourceType

        return (
          <motion.button
            key={sourceType}
            onClick={() => !disabled && onTypeSelect(sourceType)}
            disabled={disabled}
            className={`
              relative p-6 rounded-xl border transition-all duration-200
              ${colors.card} 
              ${isSelected ? 'ring-2 ring-primary-500/50 scale-[1.02]' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              text-left w-full
            `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Badge con contador */}
            {count > 0 && (
              <div className='absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold'>
                {count}
              </div>
            )}

            {/* Icono */}
            <div className={`text-3xl mb-3 ${colors.icon}`}>{config.icon}</div>

            {/* Título */}
            <h3 className={`font-semibold text-lg mb-2 ${colors.title}`}>{config.name}</h3>

            {/* Descripción */}
            <p className={`text-sm ${colors.description} leading-relaxed`}>{config.description}</p>

            {/* Indicador de selección */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='absolute top-3 right-3 w-3 h-3 bg-primary-500 rounded-full'
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export default SourceTypeSelector
