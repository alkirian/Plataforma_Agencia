import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@lib/utils'

// Base interfaces
interface BaseCardProps {
  children: React.ReactNode
  className?: string
  cyber?: boolean
}

interface MotionCardProps extends BaseCardProps {
  hover?: boolean
  animate?: boolean
  delay?: number
}

// Card component props
export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    MotionCardProps {}

// Sub-component props
export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    BaseCardProps {}
export interface CardTitleProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'>,
    BaseCardProps {}
export interface CardContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode
  className?: string
}
export interface CardFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    BaseCardProps {}

// StatCard specific props
export interface StatCardProps extends Omit<CardProps, 'children'> {
  title: string
  value: string | number
  subvalue?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: React.ReactNode
}

/**
 * Card - A versatile card component with optional animation and cyber styling
 *
 * @example
 * ```tsx
 * <Card hover animate cyber>
 *   <CardHeader>
 *     <CardTitle>My Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className, hover = true, animate = true, delay = 0, cyber = true, ...props },
    ref
  ) => {
    const cardContent = (
      <div
        ref={animate ? undefined : ref}
        className={cn(
          cyber ? 'card-cyber' : 'card p-6',
          'transition-all duration-300 focus-visible:focus-visible',
          hover && 'hover-cyber-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay,
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }}
          whileHover={{ scale: hover ? 1.01 : 1 }}
        >
          {cardContent}
        </motion.div>
      )
    }

    return cardContent
  }
)

Card.displayName = 'Card'

/**
 * CardHeader - Header section with optional border
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, cyber = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mb-6 pb-4',
        cyber
          ? 'border-b border-[color:var(--color-border-subtle)]'
          : 'border-b border-[color:var(--color-border-subtle)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

/**
 * CardTitle - Animated title with gradient text
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, cyber = true, ...props }, ref) => (
    <motion.h3
      ref={ref}
      className={cn(
        'text-lg font-semibold',
        cyber ? 'text-cyber-gradient' : 'text-gradient',
        className
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      {...props}
    >
      {children}
    </motion.h3>
  )
)

CardTitle.displayName = 'CardTitle'

/**
 * CardContent - Main content area with fade-in animation
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn('space-y-4', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)

CardContent.displayName = 'CardContent'

/**
 * CardFooter - Footer section with optional border
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, cyber = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-6 pt-4',
        cyber
          ? 'border-t border-[color:var(--color-border-subtle)]'
          : 'border-t border-[color:var(--color-border-subtle)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

/**
 * StatCard - Specialized card for displaying statistics with optional icon and trend
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Users"
 *   value="1,234"
 *   subvalue="+12%"
 *   icon={UsersIcon}
 *   trend="↗ 12% from last month"
 * />
 * ```
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, subvalue, icon: Icon, trend, className, ...props }, ref) => (
    <Card ref={ref} className={cn('p-5 md:p-6 group', className)} {...props}>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-text-muted'>{title}</p>
          <div className='mt-2 flex items-baseline gap-2'>
            <span className='text-2xl md:text-3xl font-semibold text-text-primary'>{value}</span>
            {subvalue && <span className='text-sm text-text-muted'>{subvalue}</span>}
          </div>
        </div>
        {Icon && (
          <div className='h-10 w-10 rounded-xl flex items-center justify-center bg-surface-soft border border-[color:var(--color-border-subtle)] shadow-glass'>
            <Icon className='h-5 w-5 text-[var(--color-accent-blue)]' />
          </div>
        )}
      </div>
      {trend && <div className='mt-3 text-xs text-text-muted'>{trend}</div>}
    </Card>
  )
)

StatCard.displayName = 'StatCard'

// Type exports for external consumption
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardContentProps,
  CardFooterProps,
  StatCardProps,
}
