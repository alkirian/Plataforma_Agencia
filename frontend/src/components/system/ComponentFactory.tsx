/**
 * Component Factory System
 *
 * This module provides a factory pattern for creating consistent, type-safe components
 * that eliminate duplication and ensure design system compliance.
 */

import React, { type ReactElement, type ComponentType } from 'react'
import {
  type ComponentFactory,
  ButtonProps,
  type ButtonVariants,
  ModalProps,
  type ModalVariants,
} from '../../types/components'

// ============================================================================
// GENERIC COMPONENT FACTORY
// ============================================================================

/**
 * Creates a generic component factory with variant support
 */
export function createComponentFactory<TProps, TVariants = {}>(
  BaseComponent: ComponentType<TProps>,
  variants: TVariants = {} as TVariants
): ComponentFactory<TProps, TVariants> {
  return {
    create: (props: TProps): ReactElement => React.createElement(BaseComponent, props),

    variants,

    withVariant: <K extends keyof TVariants>(variantKey: K) => {
      return (props: Omit<TProps, keyof TVariants[K]>): ReactElement => {
        const variantProps = variants[variantKey] as Partial<TProps>
        const mergedProps = { ...variantProps, ...props } as TProps
        return React.createElement(BaseComponent, mergedProps)
      }
    },
  }
}

// ============================================================================
// COMPONENT COMPOSITION PATTERNS
// ============================================================================

/**
 * Higher-order component for adding loading states
 */
export function withLoadingState<T extends object>(WrappedComponent: ComponentType<T>) {
  return (props: T & { isLoading?: boolean; loadingComponent?: ReactElement }) => {
    const { isLoading, loadingComponent, ...restProps } = props

    if (isLoading && loadingComponent) {
      return loadingComponent
    }

    return <WrappedComponent {...(restProps as T)} />
  }
}

/**
 * Higher-order component for adding error boundaries
 */
export function withErrorBoundary<T extends object>(WrappedComponent: ComponentType<T>) {
  return class extends React.Component<T, { hasError: boolean; error?: Error }> {
    constructor(props: T) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    override componentDidCatch(error: Error, errorInfo: any) {
      console.error('Component Error Boundary:', error, errorInfo)
    }

    override render() {
      if (this.state.hasError) {
        return (
          <div className='p-4 border border-red-500/20 bg-red-500/10 rounded-lg'>
            <h3 className='text-red-400 font-medium'>Component Error</h3>
            <p className='text-red-300 text-sm mt-1'>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        )
      }

      return <WrappedComponent {...this.props} />
    }
  }
}

/**
 * Higher-order component for adding accessibility features
 */
export function withA11y<T extends object>(WrappedComponent: ComponentType<T>) {
  return (
    props: T & {
      'aria-label'?: string
      'aria-describedby'?: string
      role?: string
    }
  ) => {
    const enhancedProps = {
      ...props,
      // Add default ARIA attributes if not provided
      role: props.role || 'button',
    }

    return <WrappedComponent {...enhancedProps} />
  }
}

// ============================================================================
// COMPOSITION UTILITIES
// ============================================================================

/**
 * Composes multiple higher-order components
 */
export function compose<T>(...hocs: Array<(component: ComponentType<any>) => ComponentType<any>>) {
  return (WrappedComponent: ComponentType<T>) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), WrappedComponent)
  }
}

/**
 * Creates a compound component system
 */
export function createCompoundComponent<
  TMainProps,
  TSubComponents extends Record<string, ComponentType<any>>,
>(MainComponent: ComponentType<TMainProps>, subComponents: TSubComponents) {
  const CompoundComponent = MainComponent as ComponentType<TMainProps> & TSubComponents

  Object.keys(subComponents).forEach(key => {
    CompoundComponent[key as keyof TSubComponents] = subComponents[key as keyof TSubComponents]
  })

  return CompoundComponent
}

// ============================================================================
// BUTTON FACTORY IMPLEMENTATION
// ============================================================================

export const buttonVariants: ButtonVariants = {
  primaryCyber: {
    variant: 'primary',
    cyber: true,
    className:
      'btn-cyber bg-gradient-to-r from-[var(--color-accent-blue)]/20 to-[var(--color-accent-violet)]/20',
  },
  secondaryCyber: {
    variant: 'secondary',
    cyber: true,
    className: 'btn-cyber bg-surface-soft border-[color:var(--color-border-subtle)]',
  },
  danger: {
    variant: 'danger',
    className:
      'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
  },
  success: {
    variant: 'success',
    className:
      'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
  },
  ghost: {
    variant: 'ghost',
    className: 'bg-transparent hover:bg-surface-800/50',
  },
}

// ============================================================================
// MODAL FACTORY IMPLEMENTATION
// ============================================================================

export const modalVariants: ModalVariants = {
  confirmation: {
    variant: 'default',
    size: 'sm',
    showClose: true,
    closeOnBackdrop: true,
    actions: [
      { id: 'cancel', label: 'Cancelar', variant: 'ghost', closeOnClick: true },
      { id: 'confirm', label: 'Confirmar', variant: 'primary' },
    ],
  },
  alert: {
    variant: 'info',
    size: 'sm',
    showClose: true,
    closeOnBackdrop: true,
    actions: [{ id: 'ok', label: 'OK', variant: 'primary', closeOnClick: true }],
  },
  form: {
    variant: 'default',
    size: 'md',
    showClose: true,
    closeOnBackdrop: false,
    preventScroll: true,
  },
  fullscreen: {
    variant: 'default',
    size: 'xl',
    showClose: true,
    closeOnBackdrop: true,
    maxHeight: '95vh',
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merges component props with variant defaults
 */
export function mergeVariantProps<T>(baseProps: Partial<T>, variantProps: Partial<T>): T {
  return {
    ...variantProps,
    ...baseProps,
    // Special handling for className merging
    ...(baseProps.hasOwnProperty('className') &&
      variantProps.hasOwnProperty('className') && {
        className: `${(variantProps as any).className} ${(baseProps as any).className}`.trim(),
      }),
  } as T
}

/**
 * Creates a typed event handler wrapper
 */
export function createEventHandler<TEvent = React.MouseEvent>(
  handler?: (event: TEvent) => void,
  preventDefault = false,
  stopPropagation = false
) {
  return (event: TEvent) => {
    if (preventDefault && 'preventDefault' in event) {
      ;(event as any).preventDefault()
    }
    if (stopPropagation && 'stopPropagation' in event) {
      ;(event as any).stopPropagation()
    }
    handler?.(event)
  }
}

/**
 * Validates required props at runtime
 */
export function validateRequiredProps<T extends object>(
  props: T,
  requiredKeys: Array<keyof T>
): void {
  const missingKeys = requiredKeys.filter(key => props[key] === undefined)

  if (missingKeys.length > 0) {
    throw new Error(`Missing required props: ${missingKeys.map(k => String(k)).join(', ')}`)
  }
}

/**
 * Creates a memoized component factory for performance optimization
 */
export function createMemoizedFactory<TProps, TVariants = {}>(
  BaseComponent: ComponentType<TProps>,
  variants: TVariants = {} as TVariants,
  areEqual?: (prevProps: TProps, nextProps: TProps) => boolean
): ComponentFactory<TProps, TVariants> {
  const MemoizedComponent = React.memo(BaseComponent, areEqual)

  return {
    create: (props: TProps): ReactElement => React.createElement(MemoizedComponent, props),
    variants,
    withVariant: <K extends keyof TVariants>(variantKey: K) => {
      const VariantComponent = React.memo((props: Omit<TProps, keyof TVariants[K]>) => {
        const variantProps = variants[variantKey] as Partial<TProps>
        const mergedProps = { ...variantProps, ...props } as TProps
        return React.createElement(MemoizedComponent, mergedProps)
      }, areEqual as any)

      return (props: Omit<TProps, keyof TVariants[K]>): ReactElement =>
        React.createElement(VariantComponent, props)
    },
  }
}
