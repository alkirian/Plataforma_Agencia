// Shared UI Components - Following Scope Rules Architecture
// These components are reusable across all features and maintain design system consistency

// Dropdown components
export { SimpleDropdown } from './SimpleDropdown'
export { AnchorPopover } from './AnchorPopover'

// Re-export base UI components from the main ui directory for backward compatibility
// This ensures gradual migration without breaking existing imports
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  StatCard,
} from '../../../components/ui/Card'

export { Button, CyberButton } from '../../../components/ui/Button'

export { Input, Textarea } from '../../../components/ui/Input'

export { AnimatedText, useStaggerDelay } from '../../../components/ui/AnimatedText'

export { ClientSelector } from '../../../components/ui/ClientSelector'

export { ProgressIndicator, ProgressBadge } from '../../../components/ui/ProgressIndicator'

export { KeyboardShortcutsModal } from '../../../components/ui/KeyboardShortcutsModal'

export { Icon } from '../../../components/ui/Icon'

export {
  LoadingSpinner,
  LoadingCard,
  LoadingPage,
  LoadingOverlay,
} from '../../../components/ui/LoadingSpinner'

export {
  ErrorBoundary,
  ErrorFallback,
  ErrorCard,
  NetworkError,
  NotFoundError,
} from '../../../components/ui/ErrorBoundary'

export { Tooltip, HelpTooltip, ShortcutTooltip } from '../../../components/ui/Tooltip'

export { Avatar } from '../../../components/ui/Avatar'

// Utility re-exports
export { cn } from '../../../lib/utils'
