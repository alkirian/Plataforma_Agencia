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
        ? 'btn-cyber bg-gradient-to-r from-[var(--theme-interactive-primary)]/20 to-[var(--theme-interactive-secondary)]/20 text-[var(--theme-text-primary)] border-[var(--theme-border-interactive)]'
        : 'bg-gradient-to-r from-[var(--theme-interactive-primary)] to-[var(--theme-interactive-secondary)] text-[var(--theme-text-inverse)] hover:from-[var(--theme-interactive-primaryHover)] hover:to-[var(--theme-interactive-secondaryHover)] shadow-lg shadow-[var(--theme-shadows-medium)]',
      secondary: cyber
        ? 'btn-cyber bg-[var(--theme-surface-strong)] text-[var(--theme-text-primary)] border-[var(--theme-border-default)] hover:border-[var(--theme-border-interactive)]'
        : 'bg-[var(--theme-surface-strong)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-default)] border border-[var(--theme-border-default)] hover:border-[var(--theme-border-strong)]',
      ghost: cyber
        ? 'bg-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-soft)] border border-transparent hover:border-[var(--theme-border-subtle)]'
        : 'bg-transparent text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-text-primary)]',
      danger: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--theme-status-error)]/20 to-[var(--theme-status-error)]/30 text-[var(--theme-status-error)] border-[var(--theme-status-error)]/40'
        : 'bg-gradient-to-r from-[var(--theme-status-error)] to-[var(--theme-status-error)] text-[var(--theme-text-inverse)] hover:opacity-90',
      success: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--theme-status-success)]/20 to-[var(--theme-status-success)]/30 text-[var(--theme-status-success)] border-[var(--theme-status-success)]/40'
        : 'bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-status-success)] text-[var(--theme-text-inverse)] hover:opacity-90',
      warning: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--theme-status-warning)]/20 to-[var(--theme-status-warning)]/30 text-[var(--theme-status-warning)] border-[var(--theme-status-warning)]/40'
        : 'bg-gradient-to-r from-[var(--theme-status-warning)] to-[var(--theme-status-warning)] text-[var(--theme-text-inverse)] hover:opacity-90',
      info: cyber
        ? 'btn-cyber bg-gradient-to-r from-[var(--theme-status-info)]/20 to-[var(--theme-interactive-tertiary)]/20 text-[var(--theme-interactive-tertiary)] border-[var(--theme-status-info)]/40'
        : 'bg-gradient-to-r from-[var(--theme-status-info)] to-[var(--theme-interactive-tertiary)] text-[var(--theme-text-inverse)] hover:from-[var(--theme-interactive-tertiary)] hover:to-[var(--theme-status-info)]',
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
          'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-interactive)]/50 focus:ring-offset-2 focus:ring-offset-[var(--theme-background-primary)]',
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
