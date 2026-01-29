// Shared UI Components - Following Scope Rules Architecture
// These components are reusable across all features and maintain design system consistency

// Dropdown components
export { SimpleDropdown } from './SimpleDropdown'
export { AnchorPopover } from './AnchorPopover'
export { CalendarViewDropdown } from './CalendarViewDropdown'

// Re-export base UI components from the main ui directory for backward compatibility
// This ensures gradual migration without breaking existing imports
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  StatCard,
} from '../../../components/ui/Card.tsx'

export { Button, CyberButton } from '../../../components/ui/Button'

export { Input, Textarea } from '../../../components/ui/Input'

export { AnimatedText, useStaggerDelay } from '../../../components/ui/AnimatedText'

export { ClientSelector } from '../../../components/ui/ClientSelector'

export { ProgressIndicator, ProgressBadge } from '../../../components/ui/ProgressIndicator'

export { KeyboardShortcutsModal } from '../../../components/ui/KeyboardShortcutsModal'

export { Icon } from '../../../components/ui/Icon.tsx'

export {
  LoadingSpinner,
  LoadingCard,
  LoadingPage,
  LoadingOverlay,
} from '../../../components/ui/LoadingSpinner'

export {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  catchAsyncErrors,
  AppErrorBoundary,
  PageErrorBoundary,
  FeatureErrorBoundary,
  ComponentErrorBoundary,
} from '../../../components/system/ErrorBoundary'

export { Tooltip, HelpTooltip, ShortcutTooltip } from '../../../components/ui/Tooltip.tsx'

export { Avatar } from '../../../components/ui/Avatar.tsx'

// Badge Components - Comprehensive status indicator system
export {
  Badge,
  StatusBadge,
  NotificationBadge,
  CountBadge,
  CyberBadge,
  ModernBadge,
} from '../../../components/ui/Badge.tsx'

// Utility re-exports
export { cn } from '../../../lib/utils'
