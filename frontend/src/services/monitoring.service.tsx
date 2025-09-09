/**
 * Comprehensive Monitoring and Observability Service
 * Tracks errors, performance, component usage, and code quality metrics
 */

import React from 'react'

interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  level: 'app' | 'page' | 'feature' | 'component'
  component?: string
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  buildVersion?: string
  additional?: Record<string, unknown>
}

interface PerformanceMetric {
  metricId: string
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: string
  url: string
  component?: string
  tags?: Record<string, string>
}

interface ComponentUsageMetric {
  componentName: string
  action: 'render' | 'error' | 'unmount' | 'interaction'
  timestamp: string
  props?: Record<string, unknown>
  renderTime?: number
  errorInfo?: string
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
  private sessionId: string
  private buildVersion: string
  private userId?: string
  private isEnabled: boolean
  private queue: Array<ErrorReport | PerformanceMetric | ComponentUsageMetric | CodeQualityMetric>
  private flushTimer?: NodeJS.Timeout

  constructor() {
    this.sessionId = this.generateSessionId()
    this.buildVersion = import.meta.env.VITE_APP_VERSION || 'unknown'
    this.isEnabled = this.shouldEnableMonitoring()
    this.queue = []

    if (this.isEnabled) {
      this.initializeMonitoring()
    }
  }

  /**
   * Initialize monitoring systems
   */
  private initializeMonitoring(): void {
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
    this.flushTimer = setInterval(() => this.flush(), 30000)

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush())

    console.log(`📊 Monitoring service initialized (Session: ${this.sessionId})`)
  }

  /**
   * Track application errors
   */
  reportError(
    error: Error,
    errorInfo?: { componentStack?: string },
    level: ErrorReport['level'] = 'component',
    component?: string,
    additional?: Record<string, unknown>
  ): string {
    if (!this.isEnabled) return ''

    const errorId = this.generateErrorId()

    const errorReport: ErrorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      level,
      component,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
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
   * Initialize performance observer
   */
  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.reportPerformance(
              'page_load_time',
              navEntry.loadEventEnd - navEntry.loadEventStart
            )
            this.reportPerformance(
              'dom_content_loaded',
              navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            )
            this.reportPerformance('first_paint', navEntry.responseEnd - navEntry.requestStart)
          }

          if (entry.entryType === 'paint') {
            this.reportPerformance(entry.name.replace('-', '_'), entry.startTime)
          }

          if (entry.entryType === 'layout-shift') {
            const layoutShiftEntry = entry as PerformanceEntry & { value: number }
            this.reportPerformance('cumulative_layout_shift', layoutShiftEntry.value, 'count')
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'paint', 'layout-shift'] })
      } catch (error) {
        console.warn('Performance observer initialization failed:', error)
      }
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
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor fetch calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start

        this.reportPerformance('api_request', duration, 'ms', undefined, {
          url: typeof args[0] === 'string' ? args[0] : args[0].url,
          method: typeof args[1]?.method === 'string' ? args[1].method : 'GET',
          status: String(response.status),
          ok: String(response.ok),
        })

        return response
      } catch (error) {
        const duration = performance.now() - start
        this.reportError(error as Error, undefined, 'app', 'network', {
          url: typeof args[0] === 'string' ? args[0] : args[0].url,
          duration,
        })
        throw error
      }
    }
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.reportPerformance('memory_used', memory.usedJSHeapSize, 'bytes')
        this.reportPerformance('memory_total', memory.totalJSHeapSize, 'bytes')
        this.reportPerformance('memory_limit', memory.jsHeapSizeLimit, 'bytes')
      }, 60000) // Every minute
    }
  }

  /**
   * Flush queued metrics to backend
   */
  private flush(): void {
    if (this.queue.length === 0) return

    const metrics = [...this.queue]
    this.queue = []

    this.sendMetrics(metrics)
  }

  /**
   * Send metrics to monitoring backend
   */
  private sendMetrics(
    metrics: Array<
      ErrorReport | PerformanceMetric | ComponentUsageMetric | CodeQualityMetric | BuildMetric
    >
  ): void {
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

    // Send to monitoring endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(error => {
        console.warn('Failed to send monitoring data:', error)
      })
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
   * Clean up monitoring service
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
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
 * Hook for manual performance tracking
 */
export const usePerformanceTracking = (componentName: string) => {
  const startTime = React.useRef<number>()

  const startTracking = React.useCallback((operationName: string) => {
    startTime.current = performance.now()
    return operationName
  }, [])

  const endTracking = React.useCallback(
    (operationName: string) => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current
        monitoringService.reportPerformance(operationName, duration, 'ms', componentName)
      }
    },
    [componentName]
  )

  const trackOperation = React.useCallback(
    async <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      const start = performance.now()
      try {
        const result = await operation()
        const duration = performance.now() - start
        monitoringService.reportPerformance(operationName, duration, 'ms', componentName)
        return result
      } catch (error) {
        const duration = performance.now() - start
        monitoringService.reportError(error as Error, undefined, 'component', componentName, {
          operationName,
          duration,
        })
        throw error
      }
    },
    [componentName]
  )

  return { startTracking, endTracking, trackOperation }
}

/**
 * Development-only monitoring dashboard
 */
export const MonitoringDashboard = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const [isOpen, setIsOpen] = React.useState(false)
  const [metrics, setMetrics] = React.useState([])

  React.useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would fetch metrics from the monitoring service
      setMetrics([])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-4 right-4 bg-accent-blue text-white px-3 py-2 rounded-lg text-sm z-50'
      >
        📊 Monitoring
      </button>
    )
  }

  return (
    <div className='fixed bottom-4 right-4 bg-surface-soft border border-border-subtle rounded-lg p-4 max-w-md w-full max-h-96 overflow-auto z-50'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='font-semibold text-text-primary'>Monitoring Dashboard</h3>
        <button
          onClick={() => setIsOpen(false)}
          className='text-text-muted hover:text-text-primary'
        >
          ✕
        </button>
      </div>
      <div className='text-sm text-text-muted'>
        <p>Session: {monitoringService['sessionId']}</p>
        <p>Queue: {monitoringService['queue'].length} events</p>
        <p>Build: {monitoringService['buildVersion']}</p>
      </div>
    </div>
  )
}

export default monitoringService
