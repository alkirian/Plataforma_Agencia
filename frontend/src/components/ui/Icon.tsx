import React, { forwardRef } from 'react'
import { cn } from '@lib/utils'

// Type definition for icon component prop
export type IconComponent = React.ComponentType<{
  size?: number | string
  className?: string
  [key: string]: any
}>

// Icon props interface
export interface IconProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The icon component to render (from lucide-react, heroicons, etc.) */
  icon: IconComponent
  /** Size of the icon in pixels */
  size?: number | string
  /** Additional CSS classes */
  className?: string
}

/**
 * Icon - A universal icon wrapper component that standardizes icon rendering
 *
 * Supports icons from popular libraries like Lucide React, Heroicons, etc.
 * Provides consistent sizing and styling across the application.
 *
 * @example
 * ```tsx
 * import { Search, User } from 'lucide-react'
 *
 * // Basic usage
 * <Icon icon={Search} />
 *
 * // With custom size and styling
 * <Icon icon={User} size={24} className="text-blue-500" />
 * ```
 */
export const Icon = forwardRef<HTMLElement, IconProps>(
  ({ icon: IconCmp, size = 20, className, ...props }, ref) => {
    if (!IconCmp) {
      // Return null for missing icons to avoid crashes
      return null
    }

    // Type assertion needed because ref forwarding with generic icon components
    // is complex in TypeScript
    return (
      <IconCmp
        ref={ref as any}
        size={size}
        className={cn('text-text-muted', className)}
        {...props}
      />
    )
  }
)

Icon.displayName = 'Icon'

// Type exports
export type { IconComponent }
