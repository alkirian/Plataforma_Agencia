/**
 * Enhanced TypeScript Loading Component System
 *
 * A comprehensive loading component system that provides consistent
 * loading states and indicators across the application.
 */

import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type {
  LoadingSpinnerProps,
  LoadingCardProps,
  LoadingOverlayProps,
} from '../../types/components'
import { cn } from '@lib/utils'

// ============================================================================
// LOADING SPINNER CONFIGURATIONS
// ============================================================================

const sizeStyles = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const

const variantStyles = {
  primary: 'border-[var(--color-accent-blue)] border-t-transparent',
  secondary: 'border-text-muted border-t-transparent',
  white: 'border-white border-t-transparent',
  success: 'border-green-500 border-t-transparent',
  danger: 'border-red-500 border-t-transparent',
  warning: 'border-yellow-500 border-t-transparent',
} as const

// ============================================================================
// LOADING SPINNER ANIMATIONS
// ============================================================================

const spinnerVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear' as any,
    },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as any,
    },
  },
}

const dotsVariants = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
}

const dotVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as any,
      repeat: Infinity,
    },
  },
}

// ============================================================================
// BASIC LOADING SPINNER
// ============================================================================

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      size = 'md',
      variant = 'primary',
      className,
      label = 'Cargando...',
      'data-testid': testId,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className='flex items-center justify-center'
      role='status'
      aria-live='polite'
      data-testid={testId}
      {...props}
    >
      <motion.div
        className={cn('rounded-full border-2', sizeStyles[size], variantStyles[variant], className)}
        variants={spinnerVariants}
        animate='spin'
        aria-hidden='true'
      />
      <span className='sr-only'>{label}</span>
    </div>
  )
)

LoadingSpinner.displayName = 'LoadingSpinner'

// ============================================================================
// LOADING DOTS
// ============================================================================

export const LoadingDots: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}> = ({ size = 'md', variant = 'primary', className, label = 'Cargando...' }) => {
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'
  const dotColor =
    variant === 'primary'
      ? 'bg-[var(--color-accent-blue)]'
      : variant === 'white'
        ? 'bg-white'
        : 'bg-text-muted'

  return (
    <div className={cn('flex items-center justify-center space-x-1', className)} role='status'>
      <motion.div className='flex space-x-1' variants={dotsVariants} animate='animate'>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={cn('rounded-full', dotSize, dotColor)}
            variants={dotVariants}
          />
        ))}
      </motion.div>
      <span className='sr-only'>{label}</span>
    </div>
  )
}

// ============================================================================
// LOADING PULSE
// ============================================================================

export const LoadingPulse: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}> = ({ size = 'md', variant = 'primary', className, label = 'Cargando...' }) => {
  const pulseSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
  const pulseColor =
    variant === 'primary'
      ? 'bg-[var(--color-accent-blue)]'
      : variant === 'white'
        ? 'bg-white'
        : 'bg-text-muted'

  return (
    <div className={cn('flex items-center justify-center', className)} role='status'>
      <motion.div
        className={cn('rounded-full opacity-75', pulseSize, pulseColor)}
        variants={pulseVariants}
        animate='pulse'
      />
      <span className='sr-only'>{label}</span>
    </div>
  )
}

// ============================================================================
// LOADING CARD
// ============================================================================

export const LoadingCard = forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ title = 'Cargando...', description, className, 'data-testid': testId, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-surface-soft border border-[color:var(--color-border-subtle)] rounded-xl p-6 text-center space-y-4',
        className
      )}
      data-testid={testId}
      {...props}
    >
      <LoadingSpinner size='lg' />
      <div className='space-y-1'>
        <h3 className='text-lg font-medium text-text-primary'>{title}</h3>
        {description && <p className='text-sm text-text-muted'>{description}</p>}
      </div>
    </motion.div>
  )
)

LoadingCard.displayName = 'LoadingCard'

// ============================================================================
// LOADING PAGE
// ============================================================================

export const LoadingPage: React.FC<{
  title?: string
  description?: string
  className?: string
}> = ({
  title = 'Cargando página...',
  description = 'Por favor espera mientras cargamos el contenido.',
  className,
}) => (
  <div className={cn('min-h-screen flex items-center justify-center p-6', className)}>
    <LoadingCard title={title} description={description} />
  </div>
)

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    { isVisible, children, label = 'Cargando...', className, 'data-testid': testId, ...props },
    ref
  ) => (
    <div ref={ref} className='relative' data-testid={testId} {...props}>
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center z-10',
            className
          )}
        >
          <div className='bg-surface-strong/90 border border-[color:var(--color-border-subtle)] rounded-lg p-4 flex items-center space-x-3 shadow-lg backdrop-blur-xl'>
            <LoadingSpinner size='sm' />
            <span className='text-sm text-text-primary font-medium'>{label}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
)

LoadingOverlay.displayName = 'LoadingOverlay'

// ============================================================================
// SKELETON LOADERS
// ============================================================================

export const SkeletonLine: React.FC<{
  width?: string
  height?: string
  className?: string
}> = ({ width = 'w-full', height = 'h-4', className }) => (
  <motion.div
    className={cn(
      'bg-gradient-to-r from-surface-soft via-surface-strong to-surface-soft rounded',
      width,
      height,
      className
    )}
    animate={{
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    }}
    style={{
      backgroundSize: '200% 100%',
    }}
  />
)

export const SkeletonCard: React.FC<{
  lines?: number
  showAvatar?: boolean
  className?: string
}> = ({ lines = 3, showAvatar = false, className }) => (
  <div
    className={cn(
      'p-4 border border-[color:var(--color-border-subtle)] rounded-xl space-y-3',
      className
    )}
  >
    {showAvatar && (
      <div className='flex items-center space-x-3'>
        <SkeletonLine width='w-10' height='h-10' className='rounded-full' />
        <div className='space-y-2 flex-1'>
          <SkeletonLine width='w-1/3' height='h-3' />
          <SkeletonLine width='w-1/4' height='h-2' />
        </div>
      </div>
    )}

    <div className='space-y-2'>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} height='h-3' />
      ))}
    </div>
  </div>
)

// ============================================================================
// LOADING HOOKS
// ============================================================================

/**
 * Hook for managing loading states
 */
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)

  const startLoading = React.useCallback(() => setIsLoading(true), [])
  const stopLoading = React.useCallback(() => setIsLoading(false), [])
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), [])

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  }
}

/**
 * Hook for async operations with loading state
 */
export function useAsyncOperation<T = any>() {
  const [state, setState] = React.useState<{
    isLoading: boolean
    data: T | null
    error: string | null
  }>({
    isLoading: false,
    data: null,
    error: null,
  })

  const execute = React.useCallback(async (asyncFn: () => Promise<T>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await asyncFn()
      setState({ isLoading: false, data: result, error: null })
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      setState({ isLoading: false, data: null, error })
      throw err
    }
  }, [])

  const reset = React.useCallback(() => {
    setState({ isLoading: false, data: null, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

export default LoadingSpinner
