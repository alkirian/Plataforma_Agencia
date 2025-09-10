import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@lib/utils'

// Type definitions for tooltip positioning
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
export type TooltipAlign = 'start' | 'center' | 'end'
export type TooltipMaxWidth = 'max-w-xs' | 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl'

// Base interface for tooltip props
export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: TooltipSide
  align?: TooltipAlign
  className?: string
  disabled?: boolean
  delay?: number
  maxWidth?: TooltipMaxWidth
}

// Interface for help tooltip props
export interface HelpTooltipProps extends Omit<TooltipProps, 'content'> {
  content: React.ReactNode
  children?: React.ReactNode
}

// Interface for shortcut tooltip props
export interface ShortcutTooltipProps extends Omit<TooltipProps, 'content'> {
  shortcut: string
  description: string
  children: React.ReactNode
  maxWidth?: TooltipMaxWidth
}

// Internal position interface
interface Position {
  x: number
  y: number
}

/**
 * Tooltip - A sophisticated tooltip component with multiple positioning options and animations
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip" side="top" align="center">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      side = 'top',
      align = 'center',
      className,
      disabled = false,
      delay = 300,
      maxWidth = 'max-w-xs',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const showTooltip = () => {
      if (disabled || !content) return

      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
        updatePosition()
      }, delay)
    }

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsVisible(false)
    }

    const updatePosition = () => {
      if (!triggerRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipElement = tooltipRef.current

      if (!tooltipElement) return

      const tooltipRect = tooltipElement.getBoundingClientRect()
      const spacing = 8

      let x = 0
      let y = 0

      // Calculate base position based on side
      switch (side) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2
          y = triggerRect.top - spacing
          break
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2
          y = triggerRect.bottom + spacing
          break
        case 'left':
          x = triggerRect.left - spacing
          y = triggerRect.top + triggerRect.height / 2
          break
        case 'right':
          x = triggerRect.right + spacing
          y = triggerRect.top + triggerRect.height / 2
          break
      }

      // Adjust based on alignment
      if (side === 'top' || side === 'bottom') {
        switch (align) {
          case 'start':
            x = triggerRect.left
            break
          case 'end':
            x = triggerRect.right
            break
          case 'center':
          default:
            x = x - tooltipRect.width / 2
            break
        }

        if (side === 'top') {
          y = y - tooltipRect.height
        }
      } else {
        switch (align) {
          case 'start':
            y = triggerRect.top
            break
          case 'end':
            y = triggerRect.bottom
            break
          case 'center':
          default:
            y = y - tooltipRect.height / 2
            break
        }

        if (side === 'left') {
          x = x - tooltipRect.width
        }
      }

      // Keep tooltip within viewport
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }

      x = Math.max(spacing, Math.min(x, viewport.width - tooltipRect.width - spacing))
      y = Math.max(spacing, Math.min(y, viewport.height - tooltipRect.height - spacing))

      setPosition({ x, y })
    }

    useEffect(() => {
      if (isVisible) {
        updatePosition()

        const handleResize = () => updatePosition()
        const handleScroll = () => hideTooltip()

        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
          window.removeEventListener('resize', handleResize)
          window.removeEventListener('scroll', handleScroll, true)
        }
      }
    }, [isVisible])

    const getAnimationProps = () => {
      const baseProps = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2, ease: 'easeOut' },
      }

      switch (side) {
        case 'top':
          return { ...baseProps, initial: { ...baseProps.initial, y: 10 } }
        case 'bottom':
          return { ...baseProps, initial: { ...baseProps.initial, y: -10 } }
        case 'left':
          return { ...baseProps, initial: { ...baseProps.initial, x: 10 } }
        case 'right':
          return { ...baseProps, initial: { ...baseProps.initial, x: -10 } }
        default:
          return baseProps
      }
    }

    const tooltipContent = (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className={cn(
              'fixed z-50 px-3 py-2 text-sm font-medium text-[var(--palette-primary-text)] bg-[var(--palette-secondary-bg)] rounded-lg shadow-lg pointer-events-none border border-[var(--palette-secondary-accent)]/30',
              maxWidth,
              className
            )}
            style={{
              left: position.x,
              top: position.y,
            }}
            {...getAnimationProps()}
            role='tooltip'
            aria-hidden={!isVisible}
          >
            {content}

            {/* Arrow */}
            <div
              className={cn('absolute w-2 h-2 bg-[var(--palette-secondary-bg)] rotate-45', {
                'bottom-[-4px] left-1/2 transform -translate-x-1/2': side === 'top',
                'top-[-4px] left-1/2 transform -translate-x-1/2': side === 'bottom',
                'right-[-4px] top-1/2 transform -translate-y-1/2': side === 'left',
                'left-[-4px] top-1/2 transform -translate-y-1/2': side === 'right',
              })}
              aria-hidden='true'
            />
          </motion.div>
        )}
      </AnimatePresence>
    )

    return (
      <>
        <div
          ref={triggerRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className='inline-block'
          aria-describedby={isVisible ? 'tooltip' : undefined}
        >
          {children}
        </div>
        {createPortal(tooltipContent, document.body)}
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

/**
 * HelpTooltip - Convenience wrapper for help tooltips with a default question mark icon
 *
 * @example
 * ```tsx
 * <HelpTooltip content="This explains the feature">
 *   <button>Feature</button>
 * </HelpTooltip>
 *
 * // Or with default question mark
 * <HelpTooltip content="Help text" />
 * ```
 */
export const HelpTooltip = forwardRef<HTMLDivElement, HelpTooltipProps>(
  ({ content, children, ...props }, ref) => (
    <Tooltip ref={ref} content={content} side='top' maxWidth='max-w-sm' {...props}>
      {children || (
        <span
          className='inline-flex items-center justify-center w-4 h-4 text-xs bg-[var(--palette-secondary-bg)] text-[var(--palette-primary-text)] rounded-full cursor-help transition-colors hover:bg-[var(--palette-secondary-accent)]/20'
          aria-label='Help'
        >
          ?
        </span>
      )}
    </Tooltip>
  )
)

HelpTooltip.displayName = 'HelpTooltip'

/**
 * ShortcutTooltip - Specialized tooltip for keyboard shortcut hints
 *
 * @example
 * ```tsx
 * <ShortcutTooltip
 *   shortcut="Ctrl+S"
 *   description="Save document"
 * >
 *   <button>Save</button>
 * </ShortcutTooltip>
 * ```
 */
export const ShortcutTooltip = forwardRef<HTMLDivElement, ShortcutTooltipProps>(
  ({ shortcut, description, children, maxWidth = 'max-w-sm', ...props }, ref) => (
    <Tooltip
      ref={ref}
      content={
        <div className='space-y-1'>
          <div>{description}</div>
          <div className='text-xs text-[var(--palette-primary-text)]/70'>
            Atajo:{' '}
            <kbd className='px-1 py-0.5 bg-[var(--palette-primary-bg)] rounded text-xs font-mono'>
              {shortcut}
            </kbd>
          </div>
        </div>
      }
      maxWidth={maxWidth}
      {...props}
    >
      {children}
    </Tooltip>
  )
)

ShortcutTooltip.displayName = 'ShortcutTooltip'

// Type exports for external consumption
export type {
  TooltipProps,
  HelpTooltipProps,
  ShortcutTooltipProps,
  TooltipSide,
  TooltipAlign,
  TooltipMaxWidth,
}
