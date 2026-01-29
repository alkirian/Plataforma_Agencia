/**
 * Comprehensive Monitoring and Observability Service
 * Tracks errors, performance, component usage, and code quality metrics
 */

import React from 'react'

interface ErrorReport {
  readonly errorId: string
  readonly message: string
  readonly stack?: string
  readonly componentStack?: string
  readonly level: 'app' | 'page' | 'feature' | 'component'
  readonly component?: string
  readonly timestamp: string
  readonly url: string
  readonly userAgent: string
  readonly userId?: string
  readonly sessionId: string
  readonly buildVersion?: string
  readonly additional?: Record<string, string | number | boolean>
}

interface PerformanceMetric {
  readonly metricId: string
  readonly name: string
  readonly value: number
  readonly unit: 'ms' | 'bytes' | 'count' | 'percentage'
  readonly timestamp: string
  readonly url: string
  readonly component?: string
  readonly tags?: Record<string, string>
}

interface ComponentUsageMetric {
  readonly componentName: string
  readonly action: 'render' | 'error' | 'unmount' | 'interaction'
  readonly timestamp: string
  readonly props?: Record<string, string | number | boolean>
  readonly renderTime?: number
  readonly errorInfo?: string
}

interface CodeQualityMetric {
  metric: 'component_duplication' | 'type_error' | 'lint_warning' | 'build_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  file: string
  line?: number
  message: string
  rule?: string
  timestamp: string
}

interface BuildMetric {
  buildId: string
  duration: number
  success: boolean
  errors: string[]
  warnings: string[]
  bundleSize: number
  chunkSizes: Record<string, number>
  dependencies: Record<string, string>
  timestamp: string
}

/**
 * Main Monitoring Service Class
 */
class MonitoringService {
  private readonly sessionId: string
  private readonly buildVersion: string
  private userId?: string
  private readonly isEnabled: boolean
  private queue: Array<ErrorReport | PerformanceMetric | ComponentUsageMetric | CodeQualityMetric> =
    []
  private flushTimer: NodeJS.Timeout | null = null
  private isDestroyed = false
  private retryCount = 0
  private readonly maxRetries = 3
  private cleanup?: () => void
  private performanceObserver?: PerformanceObserver

  constructor() {
    this.sessionId = this.generateSessionId()
    this.buildVersion = import.meta.env.VITE_APP_VERSION || 'unknown'
    this.isEnabled = this.shouldEnableMonitoring()

    if (this.isEnabled) {
      this.initializeMonitoring()
    }
  }

  /**
   * Initialize monitoring systems with proper error handling
   */
  private initializeMonitoring(): void {
    try {
      // Performance monitoring
      this.initializePerformanceObserver()

      // Global error handling
      this.initializeGlobalErrorHandling()

      // Component performance tracking
      this.initializeReactProfiler()

      // Network monitoring
      this.initializeNetworkMonitoring()

      // Memory usage monitoring
      this.initializeMemoryMonitoring()

      // Batch flush events every 30 seconds
      this.flushTimer = setInterval(() => {
        if (!this.isDestroyed) {
          this.flush()
        }
      }, 30000)

      // Flush on page unload with proper cleanup
      const handleBeforeUnload = () => {
        this.flush()
        this.destroy()
      }
      window.addEventListener('beforeunload', handleBeforeUnload)

      // Store cleanup function for proper disposal
      this.cleanup = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }

      console.log(`📊 Monitoring service initialized (Session: ${this.sessionId})`)
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error)
      this.isDestroyed = true
    }
  }

  /**
   * Track application errors
   */
  reportError(
    error: Error,
    errorInfo?: { componentStack?: string },
    level: ErrorReport['level'] = 'component',
    component?: string,
    additional?: Record<string, string | number | boolean>
  ): string {
    if (!this.isEnabled || this.isDestroyed) return ''

    try {
      const errorId = this.generateErrorId()

      const errorReport: ErrorReport = {
        errorId,
        message: error.message || 'Unknown error',
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        level,
        component,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        userId: this.userId,
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        additional,
      }

      this.queue.push(errorReport)

      // Immediate flush for critical errors
      if (level === 'app') {
        this.flush()
      }

      console.error('Error reported:', errorReport)
      return errorId
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
      return ''
    }
  }

  /**
   * Track performance metrics
   */
  reportPerformance(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    component?: string,
    tags?: Record<string, string>
  ): void {
    if (!this.isEnabled) return

    const metric: PerformanceMetric = {
      metricId: this.generateMetricId(),
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      component,
      tags,
    }

    this.queue.push(metric)
  }

  /**
   * Track component usage
   */
  reportComponentUsage(
    componentName: string,
    action: ComponentUsageMetric['action'],
    props?: Record<string, unknown>,
    renderTime?: number,
    errorInfo?: string
  ): void {
    if (!this.isEnabled) return

    // Sample component usage to avoid overwhelming data
    if (Math.random() > 0.1) return // 10% sampling rate

    const metric: ComponentUsageMetric = {
      componentName,
      action,
      timestamp: new Date().toISOString(),
      props,
      renderTime,
      errorInfo,
    }

    this.queue.push(metric)
  }

  /**
   * Track code quality issues
   */
  reportCodeQuality(
    metric: CodeQualityMetric['metric'],
    severity: CodeQualityMetric['severity'],
    file: string,
    message: string,
    line?: number,
    rule?: string
  ): void {
    if (!this.isEnabled) return

    const qualityMetric: CodeQualityMetric = {
      metric,
      severity,
      file,
      line,
      message,
      rule,
      timestamp: new Date().toISOString(),
    }

    this.queue.push(qualityMetric)
  }

  /**
   * Track build metrics
   */
  reportBuildMetrics(metrics: Omit<BuildMetric, 'timestamp'>): void {
    if (!this.isEnabled) return

    const buildMetric: BuildMetric = {
      ...metrics,
      timestamp: new Date().toISOString(),
    }

    // Send build metrics immediately
    this.sendMetrics([buildMetric])
  }

  /**
   * Set user context
   */
  setUser(userId: string, additionalInfo?: Record<string, unknown>): void {
    this.userId = userId
    if (additionalInfo) {
      this.reportPerformance('user_context_set', 1, 'count', undefined, {
        userId,
        ...additionalInfo,
      } as Record<string, string>)
    }
  }

  /**
   * Initialize performance observer with proper cleanup
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Core Web Vitals
      this.performanceObserver = new PerformanceObserver(list => {
        if (this.isDestroyed) return

        list.getEntries().forEach(entry => {
          try {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart
              const domTime =
                navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
              const firstPaint = navEntry.responseEnd - navEntry.requestStart

              if (loadTime > 0) {
                this.reportPerformance('page_load_time', loadTime)
              }
              if (domTime > 0) {
                this.reportPerformance('dom_content_loaded', domTime)
              }
              if (firstPaint > 0) {
                this.reportPerformance('first_paint', firstPaint)
              }
            }

            if (entry.entryType === 'paint') {
              const metricName = entry.name.replace(/-/g, '_')
              this.reportPerformance(metricName, entry.startTime)
            }

            if (entry.entryType === 'layout-shift') {
              const layoutShiftEntry = entry as PerformanceEntry & { value: number }
              if ('value' in layoutShiftEntry && typeof layoutShiftEntry.value === 'number') {
                this.reportPerformance('cumulative_layout_shift', layoutShiftEntry.value, 'count')
              }
            }
          } catch (entryError) {
            console.warn('Error processing performance entry:', entryError)
          }
        })
      })

      // Observe with proper error handling
      const entryTypes = ['navigation', 'paint']

      // Check if layout-shift is supported before adding it
      if ('PerformanceEventTiming' in window) {
        entryTypes.push('layout-shift')
      }

      this.performanceObserver.observe({ entryTypes })
    } catch (error) {
      console.warn('Performance observer initialization failed:', error)
    }
  }

  /**
   * Initialize global error handling
   */
  private initializeGlobalErrorHandling(): void {
    // Unhandled JavaScript errors
    window.addEventListener('error', event => {
      this.reportError(
        new Error(event.message),
        { componentStack: event.filename },
        'app',
        'global',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )
    })

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.reportError(
        new Error(`Unhandled Promise rejection: ${event.reason}`),
        undefined,
        'app',
        'promise',
        {
          reason: String(event.reason),
        }
      )
    })
  }

  /**
   * Initialize React Profiler for component performance
   */
  private initializeReactProfiler(): void {
    // This would be used with React.Profiler in components
    // Example usage will be shown in the component wrapper
  }

  /**
   * Initialize network monitoring with proper cleanup
   */
  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined' || !window.fetch) {
      return
    }

    // Store original fetch to restore on cleanup
    const originalFetch = window.fetch

    // Enhanced fetch wrapper with better error handling
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      if (this.isDestroyed) {
        return originalFetch(...args)
      }

      const start = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown'
      const method = args[1]?.method || 'GET'

      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start

        // Only report if monitoring is still active
        if (!this.isDestroyed && duration > 0) {
          this.reportPerformance('api_request', duration, 'ms', undefined, {
            url: url.split('?')[0], // Remove query params for privacy
            method,
            status: String(response.status),
            ok: String(response.ok),
          })
        }

        return response
      } catch (error) {
        const duration = performance.now() - start

        if (!this.isDestroyed) {
          this.reportError(error as Error, undefined, 'app', 'network', {
            url: url.split('?')[0],
            method,
            duration: String(duration),
          })
        }

        throw error
      }
    }

    // Store restore function for cleanup
    const originalCleanup = this.cleanup
    this.cleanup = () => {
      window.fetch = originalFetch
      originalCleanup?.()
    }
  }

  /**
   * Initialize memory monitoring with proper cleanup
   */
  private initializeMemoryMonitoring(): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return
    }

    // Check for memory API support
    const hasMemoryAPI = 'memory' in performance && typeof (performance as any).memory === 'object'

    if (!hasMemoryAPI) {
      return
    }

    const memoryInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(memoryInterval)
        return
      }

      try {
        const memory = (performance as any).memory
        if (memory && typeof memory === 'object') {
          if (typeof memory.usedJSHeapSize === 'number') {
            this.reportPerformance('memory_used', memory.usedJSHeapSize, 'bytes')
          }
          if (typeof memory.totalJSHeapSize === 'number') {
            this.reportPerformance('memory_total', memory.totalJSHeapSize, 'bytes')
          }
          if (typeof memory.jsHeapSizeLimit === 'number') {
            this.reportPerformance('memory_limit', memory.jsHeapSizeLimit, 'bytes')
          }
        }
      } catch (error) {
        console.warn('Memory monitoring error:', error)
        clearInterval(memoryInterval)
      }
    }, 60000) // Every minute

    // Store cleanup function
    const originalCleanup = this.cleanup
    this.cleanup = () => {
      clearInterval(memoryInterval)
      originalCleanup?.()
    }
  }

  /**
   * Flush queued metrics to backend
   */
  private flush(): void {
    if (this.queue.length === 0 || this.isDestroyed) return

    const metrics = [...this.queue]
    this.queue = []

    // Use void to explicitly ignore the promise in fire-and-forget scenarios
    void this.sendMetrics(metrics)
  }

  /**
   * Send metrics to monitoring backend with retry logic
   */
  private async sendMetrics(
    metrics: Array<
      ErrorReport | PerformanceMetric | ComponentUsageMetric | CodeQualityMetric | BuildMetric
    >
  ): Promise<void> {
    if (this.isDestroyed || metrics.length === 0) {
      return
    }

    const payload = {
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      metrics,
    }

    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Monitoring Data')
      console.log('Payload:', payload)
      console.groupEnd()
    }

    // Send to monitoring endpoint in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendWithRetry('/api/monitoring', payload)
    }
  }

  /**
   * Send data with exponential backoff retry
   */
  private async sendWithRetry(url: string, data: object, attempt = 1): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Reset retry count on success
      this.retryCount = 0
    } catch (error) {
      console.warn(`Failed to send monitoring data (attempt ${attempt}):`, error)

      if (attempt < this.maxRetries && !this.isDestroyed) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        await this.sendWithRetry(url, data, attempt + 1)
      } else {
        this.retryCount = attempt
      }
    }
  }

  /**
   * Check if monitoring should be enabled
   */
  private shouldEnableMonitoring(): boolean {
    // Enable in production, or in development if explicitly enabled
    return (
      process.env.NODE_ENV === 'production' || import.meta.env.VITE_ENABLE_MONITORING === 'true'
    )
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up monitoring service with proper resource cleanup
   */
  destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true

    // Clear timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = undefined
    }

    // Run custom cleanup functions
    if (this.cleanup) {
      try {
        this.cleanup()
      } catch (error) {
        console.warn('Error during monitoring cleanup:', error)
      }
    }

    // Final flush of remaining data
    this.flush()

    // Clear queue
    this.queue = []
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService()

/**
 * React component performance wrapper
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const MonitoredComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'UnknownComponent'

    return (
      <React.Profiler
        id={name}
        onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
          monitoringService.reportComponentUsage(
            id,
            'render',
            props as Record<string, unknown>,
            actualDuration
          )

          if (actualDuration > 16) {
            // More than one frame
            monitoringService.reportPerformance('slow_component_render', actualDuration, 'ms', id, {
              phase,
            })
          }
        }}
      >
        <Component {...props} />
      </React.Profiler>
    )
  }

  MonitoredComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`
  return MonitoredComponent
}

/**
 * Hook for manual performance tracking with proper cleanup
 */
export const usePerformanceTracking = (componentName: string) => {
  const startTimeRef = React.useRef<Map<string, number>>(new Map())
  const isMountedRef = React.useRef(true)

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false
      startTimeRef.current.clear()
    }
  }, [])

  const startTracking = React.useCallback((operationName: string) => {
    if (!isMountedRef.current) return operationName

    const now = performance.now()
    startTimeRef.current.set(operationName, now)
    return operationName
  }, [])

  const endTracking = React.useCallback(
    (operationName: string) => {
      if (!isMountedRef.current) return

      const startTime = startTimeRef.current.get(operationName)
      if (startTime !== undefined) {
        const duration = performance.now() - startTime
        startTimeRef.current.delete(operationName)

        if (duration > 0) {
          monitoringService.reportPerformance(operationName, duration, 'ms', componentName)
        }
      }
    },
    [componentName]
  )

  const trackOperation = React.useCallback(
    async <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      if (!isMountedRef.current) {
        return operation() // Just execute without tracking if unmounted
      }

      const start = performance.now()
      try {
        const result = await operation()

        if (isMountedRef.current) {
          const duration = performance.now() - start
          if (duration > 0) {
            monitoringService.reportPerformance(operationName, duration, 'ms', componentName)
          }
        }

        return result
      } catch (error) {
        if (isMountedRef.current) {
          const duration = performance.now() - start
          monitoringService.reportError(error as Error, undefined, 'component', componentName, {
            operationName,
            duration: String(duration),
          })
        }
        throw error
      }
    },
    [componentName]
  )

  return { startTracking, endTracking, trackOperation }
}

/**
 * Development-only monitoring dashboard with proper state management
 */
export const MonitoringDashboard = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const [isOpen, setIsOpen] = React.useState(false)
  const [metrics, setMetrics] = React.useState<{
    sessionId: string
    queueLength: number
    buildVersion: string
    retryCount: number
  }>({
    sessionId: '',
    queueLength: 0,
    buildVersion: '',
    retryCount: 0,
  })

  React.useEffect(() => {
    if (!isOpen) return

    const updateMetrics = () => {
      try {
        setMetrics({
          sessionId: (monitoringService as any).sessionId || 'unknown',
          queueLength: (monitoringService as any).queue?.length || 0,
          buildVersion: (monitoringService as any).buildVersion || 'unknown',
          retryCount: (monitoringService as any).retryCount || 0,
        })
      } catch (error) {
        console.warn('Failed to update monitoring dashboard:', error)
      }
    }

    // Update immediately
    updateMetrics()

    // Then update periodically
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-4 right-4 bg-accent-blue text-white px-3 py-2 rounded-lg text-sm z-50 hover:bg-accent-blue/90 transition-colors'
        type='button'
        aria-label='Open monitoring dashboard'
      >
        📊 Monitoring
      </button>
    )
  }

  return (
    <div className='fixed bottom-4 right-4 bg-surface-soft border border-border-subtle rounded-lg p-4 max-w-md w-full max-h-96 overflow-auto z-50 shadow-lg'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='font-semibold text-text-primary'>Monitoring Dashboard</h3>
        <button
          onClick={() => setIsOpen(false)}
          className='text-text-muted hover:text-text-primary transition-colors p-1'
          type='button'
          aria-label='Close monitoring dashboard'
        >
          ✕
        </button>
      </div>
      <div className='text-sm text-text-muted space-y-1'>
        <p>
          <span className='font-medium'>Session:</span> {metrics.sessionId}
        </p>
        <p>
          <span className='font-medium'>Queue:</span> {metrics.queueLength} events
        </p>
        <p>
          <span className='font-medium'>Build:</span> {metrics.buildVersion}
        </p>
        <p>
          <span className='font-medium'>Retries:</span> {metrics.retryCount}
        </p>
      </div>
    </div>
  )
}

export default monitoringService
