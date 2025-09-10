import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@lib/utils'
import type {
  BadgeProps,
  StatusBadgeProps,
  NotificationBadgeProps,
  CountBadgeProps,
} from '../../types/component.types'

/**
 * Badge - A versatile, accessible badge component for status indicators
 *
 * Replaces 103+ custom badge implementations throughout the application.
 * Supports multiple variants, sizes, styles, and specialized use cases.
 *
 * @example Basic Usage
 * ```tsx
 * <Badge variant="success" size="md">
 *   Active
 * </Badge>
 * ```
 *
 * @example With Icon and Animation
 * ```tsx
 * <Badge variant="warning" icon={<AlertIcon />} animated pulse>
 *   Pending Review
 * </Badge>
 * ```
 *
 * @example Different Styles
 * ```tsx
 * <Badge variant="info" badgeStyle="outline">Outlined</Badge>
 * <Badge variant="success" badgeStyle="soft">Soft</Badge>
 * <Badge variant="danger" badgeStyle="ghost">Ghost</Badge>
 * ```
 *
 * @example Removable Badge
 * ```tsx
 * <Badge variant="info" removable onRemove={() => console.log('removed')}>
 *   Filter Tag
 * </Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'neutral',
      size = 'md',
      badgeStyle = 'solid',
      icon,
      cyber = true,
      animated = false,
      pulse = false,
      dot = false,
      removable = false,
      onRemove,
      count,
      className,
      ...props
    },
    ref
  ) => {
    // Variant styles for both cyber and standard themes
    const variants = {
      success: cyber
        ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-100 border-green-500/40'
        : 'bg-green-100 text-green-800 border border-green-200',
      warning: cyber
        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-100 border-yellow-500/40'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      danger: cyber
        ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-100 border-red-500/40'
        : 'bg-red-100 text-red-800 border border-red-200',
      info: cyber
        ? 'bg-gradient-to-r from-[var(--palette-cold-alt)]/20 to-[var(--palette-soft-alt)]/20 text-[var(--palette-soft-alt)] border-[var(--palette-cold-alt)]/40'
        : 'bg-blue-100 text-blue-800 border border-blue-200',
      neutral: cyber
        ? 'bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] border-[var(--palette-secondary-accent)]/40'
        : 'bg-gray-100 text-gray-800 border border-gray-200',
      primary: cyber
        ? 'bg-gradient-to-r from-[var(--palette-primary-accent)]/20 to-[var(--palette-secondary-accent)]/20 text-[var(--palette-primary-text)] border-[var(--palette-primary-accent)]/40'
        : 'bg-[var(--palette-primary-accent)] text-white border border-[var(--palette-primary-accent)]',
      secondary: cyber
        ? 'bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] border-[var(--palette-secondary-accent)]/60'
        : 'bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] border border-[var(--palette-secondary-accent)]/60',
    } as const

    // Style variations
    const styleVariants = {
      solid: variants[variant],
      outline: cyber
        ? `bg-transparent border-2 ${variants[variant].split('border-')[1] ? `border-${variants[variant].split('border-')[1]}` : 'border-current'} ${variants[variant].split(' ')[variants[variant].split(' ').length - 1]}`
        : `bg-transparent border-2 ${variants[variant].replace('bg-', 'border-').replace('text-', 'text-').replace('border border-', 'border-')}`,
      soft: cyber
        ? variants[variant].replace('/20', '/10').replace('/40', '/20')
        : variants[variant].replace('100', '50').replace('800', '700'),
      ghost: cyber
        ? `bg-transparent ${variants[variant].split(' ').pop()} hover:${variants[variant].split('bg-')[1]?.split(' ')[0] || 'bg-current/10'}`
        : `bg-transparent ${variants[variant].split(' ').pop()} hover:bg-current/10`,
    } as const

    // Size variations
    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs rounded-sm min-h-[16px]',
      sm: 'px-2 py-0.5 text-xs rounded-md min-h-[20px]',
      md: 'px-2.5 py-1 text-sm rounded-md min-h-[24px]',
      lg: 'px-3 py-1.5 text-sm rounded-lg min-h-[28px]',
    } as const

    // Animation variants
    const motionVariants = {
      initial: animated ? { opacity: 0, scale: 0.8, y: -10 } : {},
      animate: animated ? { opacity: 1, scale: 1, y: 0 } : {},
      exit: animated ? { opacity: 0, scale: 0.8, y: -10 } : {},
    }

    const pulseAnimation = pulse
      ? {
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
        }
      : {}

    const badgeContent = (
      <span
        ref={animated ? undefined : ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          cyber && 'backdrop-blur-sm',
          cyber && badgeStyle === 'solid' && 'shadow-sm',
          styleVariants[badgeStyle],
          sizes[size],
          removable && 'pr-1',
          className
        )}
        role='status'
        aria-label={typeof children === 'string' ? children : 'Badge'}
        {...props}
      >
        {/* Dot indicator */}
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-yellow-500',
              variant === 'danger' && 'bg-red-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'neutral' && 'bg-gray-500',
              variant === 'primary' && 'bg-[var(--palette-primary-accent)]',
              variant === 'secondary' && 'bg-[var(--palette-secondary-accent)]'
            )}
            aria-hidden='true'
          />
        )}

        {/* Icon */}
        {icon && (
          <span className='flex items-center justify-center' aria-hidden='true'>
            {icon}
          </span>
        )}

        {/* Content */}
        <span className='flex items-center'>{count !== undefined ? count : children}</span>

        {/* Remove button */}
        {removable && onRemove && (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            className={cn(
              'ml-0.5 h-3.5 w-3.5 rounded-sm flex items-center justify-center',
              'hover:bg-current/20 focus:bg-current/20 transition-colors duration-150',
              'focus:outline-none focus:ring-1 focus:ring-current'
            )}
            aria-label='Remove badge'
          >
            <X className='h-2.5 w-2.5' />
          </button>
        )}
      </span>
    )

    if (animated || pulse) {
      return (
        <motion.span
          ref={ref}
          initial={motionVariants.initial}
          animate={{
            ...motionVariants.animate,
            ...(pulse && pulseAnimation),
          }}
          exit={motionVariants.exit}
          transition={{
            duration: 0.2,
            ...(pulse && {
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }),
          }}
        >
          {badgeContent}
        </motion.span>
      )
    }

    return badgeContent
  }
)

Badge.displayName = 'Badge'

/**
 * StatusBadge - Specialized badge for status indicators
 *
 * @example
 * ```tsx
 * <StatusBadge status="active" showDot />
 * <StatusBadge status="pending" cyber={false} />
 * ```
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: 'Active' },
      inactive: { variant: 'neutral' as const, label: 'Inactive' },
      pending: { variant: 'warning' as const, label: 'Pending' },
      completed: { variant: 'success' as const, label: 'Completed' },
      failed: { variant: 'danger' as const, label: 'Failed' },
      draft: { variant: 'info' as const, label: 'Draft' },
    }

    const config = statusConfig[status]

    return (
      <Badge ref={ref} variant={config.variant} dot={showDot} {...props}>
        {config.label}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

/**
 * NotificationBadge - Badge for notification counts with positioning
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <BellIcon />
 *   <NotificationBadge count={5} position="top-right" />
 * </div>
 * ```
 */
export const NotificationBadge = forwardRef<HTMLSpanElement, NotificationBadgeProps>(
  (
    { count = 0, max = 99, showZero = false, position = 'top-right', size = 'sm', ...props },
    ref
  ) => {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count.toString()

    const positions = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1',
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1',
    }

    return (
      <Badge
        ref={ref}
        variant='danger'
        size={size}
        className={cn(
          'absolute z-10 min-w-[20px] h-5 rounded-full',
          'flex items-center justify-center',
          positions[position]
        )}
        animated
        pulse={count > 0}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)

NotificationBadge.displayName = 'NotificationBadge'

/**
 * CountBadge - Badge specifically for displaying counts and metrics
 *
 * @example
 * ```tsx
 * <CountBadge count={42} suffix="items" />
 * <CountBadge count={1250} max={999} compact />
 * ```
 */
export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max, suffix, compact = false, ...props }, ref) => {
    const formatCount = (num: number): string => {
      if (!max) return num.toString()

      if (compact && num >= 1000) {
        return num >= 1000000 ? `${Math.floor(num / 1000000)}M` : `${Math.floor(num / 1000)}K`
      }

      return num > max ? `${max}+` : num.toString()
    }

    const displayValue = `${formatCount(count)}${suffix ? ` ${suffix}` : ''}`

    return (
      <Badge ref={ref} variant='info' {...props}>
        {displayValue}
      </Badge>
    )
  }
)

CountBadge.displayName = 'CountBadge'

/**
 * Cyber-styled badge variant
 */
export const CyberBadge = (props: Omit<BadgeProps, 'cyber'>): JSX.Element => (
  <Badge {...props} cyber={true} />
)

/**
 * Modern-styled badge variant (non-cyber)
 */
export const ModernBadge = (props: Omit<BadgeProps, 'cyber'>): JSX.Element => (
  <Badge {...props} cyber={false} />
)

// Type exports for external usage
export type { BadgeProps, StatusBadgeProps, NotificationBadgeProps, CountBadgeProps }

export default Badge
