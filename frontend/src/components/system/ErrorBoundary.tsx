import type { ComponentType, ReactNode } from 'react'
import { Component, type ErrorInfo } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

/**
 * Enhanced Error Boundary System with Graceful Degradation
 * Provides multiple levels of error handling and recovery
 */

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  retryCount: number
  isRecovering: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  isolate?: boolean
  maxRetries?: number
  enableRecovery?: boolean
  level?: 'component' | 'feature' | 'page' | 'app'
  component?: string
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

interface ErrorFallbackProps {
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  retry: () => void
  reset: () => void
  level: string
  component?: string
  canRetry: boolean
}

/**
 * Core Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private readonly resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, component, level = 'component' } = this.props
    const { errorId } = this.state

    // Enhanced error logging
    console.group(`🚨 Error Boundary Caught Error [${level.toUpperCase()}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component:', component || 'Unknown')
    console.error('Error ID:', errorId)
    console.error('Stack Trace:', error.stack)
    console.groupEnd()

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call custom error handler
    if (onError && errorId) {
      onError(error, errorInfo, errorId)
    }

    // Report to monitoring service
    this.reportError(error, errorInfo, errorId || 'unknown', level, component)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary()
      }
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  /**
   * Report error to monitoring service
   */
  private readonly reportError = (
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    level: string,
    component?: string
  ) => {
    // In a real app, this would send to error monitoring service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
      component,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Error Report:', errorReport)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error monitoring service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport),
        }).catch(err => {
          console.error('Failed to report error:', err)
        })
      } catch (reportingError) {
        console.error('Error reporting failed:', reportingError)
      }
    }
  }

  /**
   * Retry the component with exponential backoff
   */
  private readonly handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      console.warn('Max retries exceeded, not retrying')
      return
    }

    this.setState({ isRecovering: true })

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: retryCount + 1,
        isRecovering: false,
      })
    }, delay)
  }

  /**
   * Reset error boundary to initial state
   */
  private readonly resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0,
      isRecovering: false,
    })
  }

  override render() {
    const { hasError, error, errorInfo, errorId, retryCount, isRecovering } = this.state
    const {
      children,
      fallback: CustomFallback,
      maxRetries = 3,
      enableRecovery = true,
      level = 'component',
      component,
    } = this.props

    if (hasError) {
      const canRetry = enableRecovery && retryCount < maxRetries

      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        errorId,
        retry: this.handleRetry,
        reset: this.resetErrorBoundary,
        level,
        component,
        canRetry,
      }

      if (isRecovering) {
        return <ErrorRecoveryFallback level={level} retryCount={retryCount} />
      }

      if (CustomFallback) {
        return <CustomFallback {...fallbackProps} />
      }

      // Default fallback based on level
      switch (level) {
        case 'app':
          return <AppErrorFallback {...fallbackProps} />
        case 'page':
          return <PageErrorFallback {...fallbackProps} />
        case 'feature':
          return <FeatureErrorFallback {...fallbackProps} />
        case 'component':
        default:
          return <ComponentErrorFallback {...fallbackProps} />
      }
    }

    return children
  }
}

/**
 * Recovery Loading State
 */
const ErrorRecoveryFallback = ({ level, retryCount }: { level: string; retryCount: number }) => (
  <div className='flex items-center justify-center p-4'>
    <div className='flex items-center gap-3 text-text-muted'>
      <LoadingSpinner size='sm' variant='primary' />
      <span>
        Recovering {level}... (Attempt {retryCount + 1})
      </span>
    </div>
  </div>
)

/**
 * App-Level Error Fallback
 */
const AppErrorFallback = ({ error, errorId, retry, reset, canRetry }: ErrorFallbackProps) => (
  <div className='min-h-screen flex items-center justify-center p-4 bg-app-bg'>
    <Card className='max-w-md w-full text-center space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-text-primary mb-2'>Application Error</h1>
        <p className='text-text-muted'>
          Something went wrong with the application. Please try refreshing the page.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details className='text-left text-sm bg-surface-soft p-3 rounded-lg'>
          <summary className='cursor-pointer font-medium text-text-primary mb-2'>
            Error Details
          </summary>
          <pre className='whitespace-pre-wrap text-red-400 overflow-auto'>{error.message}</pre>
        </details>
      )}

      <div className='flex gap-3 justify-center'>
        <Button onClick={() => window.location.reload()} variant='primary'>
          Reload Page
        </Button>
        {canRetry && (
          <Button onClick={retry} variant='secondary'>
            Try Again
          </Button>
        )}
      </div>

      {errorId && <p className='text-xs text-text-subtle'>Error ID: {errorId}</p>}
    </Card>
  </div>
)

/**
 * Page-Level Error Fallback
 */
const PageErrorFallback = ({
  error,
  errorId,
  retry,
  reset,
  canRetry,
  component,
}: ErrorFallbackProps) => (
  <div className='flex items-center justify-center p-8'>
    <Card className='max-w-lg w-full text-center space-y-4'>
      <div>
        <h2 className='text-xl font-semibold text-text-primary mb-2'>Page Error</h2>
        <p className='text-text-muted'>
          {component ? `The ${component} page` : 'This page'} encountered an error and couldn't load
          properly.
        </p>
      </div>

      <div className='flex gap-3 justify-center'>
        {canRetry && (
          <Button onClick={retry} variant='primary'>
            Retry
          </Button>
        )}
        <Button onClick={reset} variant='secondary'>
          Reset
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && errorId && (
        <p className='text-xs text-text-subtle'>Error ID: {errorId}</p>
      )}
    </Card>
  </div>
)

/**
 * Feature-Level Error Fallback
 */
const FeatureErrorFallback = ({
  error,
  errorId,
  retry,
  reset,
  canRetry,
  component,
}: ErrorFallbackProps) => (
  <div className='p-4 border border-border-subtle rounded-lg bg-surface-soft'>
    <div className='text-center space-y-3'>
      <div>
        <h3 className='font-medium text-text-primary'>Feature Unavailable</h3>
        <p className='text-sm text-text-muted'>
          {component || 'This feature'} is temporarily unavailable.
        </p>
      </div>

      <div className='flex gap-2 justify-center'>
        {canRetry && (
          <Button onClick={retry} variant='secondary' size='sm'>
            Retry
          </Button>
        )}
        <Button onClick={reset} variant='ghost' size='sm'>
          Skip
        </Button>
      </div>
    </div>
  </div>
)

/**
 * Component-Level Error Fallback
 */
const ComponentErrorFallback = ({
  errorId,
  retry,
  reset,
  canRetry,
  component,
}: ErrorFallbackProps) => (
  <div className='p-3 border border-border-subtle rounded-lg bg-surface-soft/50'>
    <div className='flex items-center justify-between text-sm'>
      <span className='text-text-muted'>{component || 'Component'} failed to load</span>
      <div className='flex gap-1'>
        {canRetry && (
          <Button onClick={retry} variant='ghost' size='sm'>
            Retry
          </Button>
        )}
      </div>
    </div>
  </div>
)

/**
 * Higher-order component for easy error boundary wrapping
 */
export const withErrorBoundary = <P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook for programmatic error boundaries
 */
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: { componentStack?: string }) => {
    // This will trigger the nearest error boundary
    throw error
  }

  return { handleError }
}

/**
 * Utility for async error handling
 */
export const catchAsyncErrors = async <T,>(asyncFn: () => Promise<T>, fallback?: T): Promise<T> => {
  try {
    return await asyncFn()
  } catch (error) {
    console.error('Async error caught:', error)

    if (fallback !== undefined) {
      return fallback
    }

    throw error
  }
}

/**
 * Error boundary presets for different use cases
 */
export const AppErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level='app' />
)

export const PageErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level='page' />
)

export const FeatureErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level='feature' />
)

export const ComponentErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level='component' />
)
