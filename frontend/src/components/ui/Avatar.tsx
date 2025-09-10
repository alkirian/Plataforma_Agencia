import React, { forwardRef } from 'react'
import { cn } from '@lib/utils'

// Avatar size type
export type AvatarSize = number | string

// Avatar props interface
export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Image source URL */
  src?: string
  /** Name of the person (used for initials and alt text) */
  name?: string
  /** Size of the avatar in pixels or CSS unit */
  size?: AvatarSize
  /** Additional CSS classes */
  className?: string
}

/**
 * Generates initials from a name string
 * @param name - The full name
 * @returns Initials (up to 2 characters)
 */
function getInitials(name: string | undefined): string {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
}

/**
 * Avatar - A flexible avatar component with image fallback to initials
 *
 * Features:
 * - Image with lazy loading and error handling
 * - Automatic initials generation from name
 * - Customizable size (numeric pixels or CSS units)
 * - Accessible with proper ARIA labels
 * - Responsive and optimized for performance
 *
 * @example
 * ```tsx
 * // With image
 * <Avatar src="/user.jpg" name="John Doe" />
 *
 * // Fallback to initials
 * <Avatar name="John Doe" />
 *
 * // Custom size
 * <Avatar name="John Doe" size={48} />
 * <Avatar name="John Doe" size="3rem" />
 * ```
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name = '', size = 32, className, ...props }, ref) => {
    const dimension = typeof size === 'number' ? `${size}px` : size
    const initials = getInitials(name)

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full overflow-hidden border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-primary',
          className
        )}
        style={{ width: dimension, height: dimension }}
        aria-label={name ? `Avatar de ${name}` : 'Avatar'}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name ? `Foto de ${name}` : 'Foto de usuario'}
            className='w-full h-full object-cover'
            referrerPolicy='no-referrer'
            loading='lazy'
            onError={e => {
              // Hide image on error, fallback to initials will show
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <span className='text-xs font-semibold select-none' aria-hidden='true'>
            {initials}
          </span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

// Type exports
export type { AvatarSize }
