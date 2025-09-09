import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode, MouseEvent } from 'react'
import { forwardRef } from 'react'
import { cn } from '@lib/utils'
import type { ButtonProps } from '../../types/component.types'

/**
 * Reusable, type-safe Button component with consistent styling and animations
 *
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   size="md"
 *   loading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Save Changes
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      disabled = false,
      loading = false,
      icon,
      cyber = true,
      onClick,
      'aria-label': ariaLabel,
      type = 'button',
      // Extract HTML drag events to prevent conflicts with framer-motion
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragExit,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--palette-primary-accent)]/20 to-[var(--palette-secondary-accent)]/20 text-[var(--palette-primary-text)] border-[var(--palette-primary-accent)]/40'
        : 'bg-gradient-to-r from-[var(--palette-primary-accent)] to-[var(--palette-secondary-accent)] text-white hover:from-[var(--palette-secondary-accent)] hover:to-[var(--palette-hover-state)] shadow-lg shadow-[var(--palette-primary-accent)]/25',
      secondary: cyber
        ? 'btn-cyber bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] border-[var(--palette-secondary-accent)]/60 hover:border-[var(--palette-primary-accent)]/60'
        : 'bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] hover:bg-[var(--palette-primary-bg)] border border-[var(--palette-secondary-accent)]/60',
      ghost: cyber
        ? 'bg-transparent text-[var(--palette-primary-text)]/70 hover:text-[var(--palette-primary-text)] hover:bg-[var(--palette-secondary-bg)]/50 border border-transparent hover:border-[var(--palette-secondary-accent)]/40'
        : 'bg-transparent text-[var(--palette-primary-text)]/70 hover:bg-[var(--palette-secondary-bg)]/50 hover:text-[var(--palette-primary-text)]',
      danger: cyber
        ? 'btn-cyber bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-100 border-red-500/40'
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
      success: cyber
        ? 'btn-cyber bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-100 border-green-500/40'
        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
      warning: cyber
        ? 'btn-cyber bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-100 border-yellow-500/40'
        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700',
      info: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--palette-cold-alt)]/20 to-[var(--palette-soft-alt)]/20 text-[var(--palette-soft-alt)] border-[var(--palette-cold-alt)]/40'
        : 'bg-gradient-to-r from-[var(--palette-cold-alt)] to-[var(--palette-soft-alt)] text-white hover:from-[var(--palette-soft-alt)] hover:to-[var(--palette-cold-alt)]',
    } as const

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-lg min-h-[44px] sm:min-h-auto sm:px-3 sm:py-1.5',
      md: 'px-6 py-3 rounded-xl min-h-[44px] sm:min-h-auto sm:px-5 sm:py-2.5',
      lg: 'px-8 py-4 text-lg rounded-xl min-h-[48px] sm:min-h-auto sm:px-7 sm:py-3',
      xl: 'px-10 py-5 text-xl rounded-2xl min-h-[52px] sm:min-h-auto sm:px-8 sm:py-4',
    } as const

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
      if (disabled || loading) return
      onClick?.(event)
    }

    const motionProps = {
      whileHover: {
        scale: disabled ? 1 : 1.02,
        boxShadow: !disabled && cyber ? '0 0 25px -5px rgba(96,165,250,0.3)' : undefined,
      },
      whileTap: { scale: disabled ? 1 : 0.98 },
    }

    return (
      <motion.button
        ref={ref}
        {...motionProps}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--palette-primary-bg)]',
          !cyber && 'btn-modern',
          variants[variant],
          sizes[size],
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        type={type}
        aria-label={ariaLabel || (loading ? 'Cargando...' : undefined)}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.div
            className='w-4 h-4 border-2 border-current border-t-transparent rounded-full'
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-label='Loading indicator'
          />
        ) : icon ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className='flex items-center justify-center'
          >
            {icon}
          </motion.span>
        ) : null}
        <span>{children}</span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

/**
 * Specialized cyber-styled button variant
 */
export const CyberButton = (props: Omit<ButtonProps, 'cyber'>): JSX.Element => (
  <Button {...props} cyber={true} />
)

/**
 * Modern-styled button variant (non-cyber)
 */
export const ModernButton = (props: Omit<ButtonProps, 'cyber'>): JSX.Element => (
  <Button {...props} cyber={false} />
)

export default Button
