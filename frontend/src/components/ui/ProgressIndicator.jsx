import React from 'react'
import { motion } from 'framer-motion'

export const ProgressIndicator = ({
  percentage = 0,
  total = 0,
  completed = 0,
  inProgress = 0,
  pending = 0,
  size = 'md',
  showDetails = true,
}) => {
  const getColor = percentage => {
    if (percentage >= 80) return 'text-green-400'
    if (percentage >= 50) return 'text-gray-300'
    if (percentage >= 20) return 'text-orange-400'
    return 'text-gray-400'
  }

  const getBarColor = percentage => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-gray-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  const sizes = {
    sm: { bar: 'h-1', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-3', text: 'text-base' },
  }

  if (total === 0) {
    return (
      <div className='flex items-center space-x-2'>
        <div className='text-xs text-gray-500'>Sin tareas</div>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {/* Barra de progreso */}
      <div className='flex items-center space-x-2'>
        <div className='flex-1 bg-white/10 rounded-full overflow-hidden'>
          <motion.div
            className={`${getBarColor(percentage)} ${sizes[size].bar} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className={`${getColor(percentage)} ${sizes[size].text} font-medium min-w-[3rem]`}>
          {percentage}%
        </span>
      </div>

      {/* Detalles */}
      {showDetails && (
        <div className='flex items-center space-x-3 text-xs'>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-green-500 rounded-full' />
            <span className='text-gray-400'>{completed}</span>
          </div>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-gray-500 rounded-full' />
            <span className='text-gray-400'>{inProgress}</span>
          </div>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-orange-500 rounded-full' />
            <span className='text-gray-400'>{pending}</span>
          </div>
          <span className='text-gray-500'>de {total}</span>
        </div>
      )}
    </div>
  )
}

export const ProgressBadge = ({ percentage = 0, total = 0 }) => {
  // Si no hay tareas, no renderizamos el badge (evita el span "Sin tareas")
  if (!total || total === 0) return null

  const pct = Math.round(Math.max(0, Math.min(100, percentage || 0)))
  const color = pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
  return (
    <div className='inline-flex items-center gap-2'>
      <div className={`h-2 w-12 rounded-full ${color}`} style={{ opacity: 0.95 }} />
      <div className='text-xs font-medium text-text-primary'>{pct}%</div>
    </div>
  )
}

/**
 * StepProgressIndicator - For multi-step processes
 */
export const StepProgressIndicator = ({
  currentStep = 1,
  totalSteps = 1,
  steps = [],
  className = '',
}) => {
  const stepItems =
    steps.length > 0
      ? steps
      : Array(totalSteps)
          .fill()
          .map((_, i) => ({
            label: `Paso ${i + 1}`,
            icon: null,
          }))

  return (
    <div className={`w-full ${className}`}>
      <div className='flex items-center justify-between relative'>
        {/* Connection line */}
        <div className='absolute top-6 left-6 right-6 h-px bg-[color:var(--color-border-subtle)]' />

        {stepItems.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div key={index} className='flex flex-col items-center relative'>
              {/* Step circle */}
              <motion.div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[color:var(--color-accent-blue)] border-[color:var(--color-accent-blue)] text-white'
                    : isActive
                      ? 'bg-[color:var(--color-app-bg)] border-[color:var(--color-accent-blue)] text-[color:var(--color-accent-blue)]'
                      : 'bg-[color:var(--color-app-bg)] border-[color:var(--color-border-subtle)] text-text-muted'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {isCompleted ? (
                  <motion.svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </motion.svg>
                ) : step.icon ? (
                  <span className='w-5 h-5'>{step.icon}</span>
                ) : (
                  <span className='text-sm font-semibold'>{stepNumber}</span>
                )}
              </motion.div>

              {/* Step label */}
              <motion.div
                className='mt-2 text-center'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
              >
                <div
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
