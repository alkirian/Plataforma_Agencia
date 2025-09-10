import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from 'react'
import type { MotionProps } from 'framer-motion'

// Base component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

// Button Component Types
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    BaseComponentProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  cyber?: boolean
  type?: 'button' | 'submit' | 'reset'
}

// Modal Component Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fit'
export type ModalVariant = 'default' | 'danger' | 'success' | 'info'

export interface ModalAction {
  id?: string
  label: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  variant?: ButtonVariant
  icon?: ReactNode
  disabled?: boolean
  loading?: boolean
  closeOnClick?: boolean
  autoFocus?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actions?: ModalAction[]
  secondaryActions?: ModalAction[]
  size?: ModalSize
  maxHeight?: string
  initialFocusRef?: React.RefObject<HTMLElement>
  closeOnBackdrop?: boolean
  showClose?: boolean
  preventScroll?: boolean
  variant?: ModalVariant
  footer?: ReactNode
}

// Input Component Types
export type InputVariant = 'default' | 'error' | 'success'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseComponentProps {
  variant?: InputVariant
  size?: InputSize
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  leftElement?: ReactNode
  rightElement?: ReactNode
}

// Card Component Types
export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  cyber?: boolean
}

// Icon Component Types
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface IconProps extends BaseComponentProps {
  name?: string
  size?: IconSize
  color?: string
  icon?: ReactNode
}

// Tooltip Component Types
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode
  placement?: TooltipPlacement
  delay?: number
  disabled?: boolean
}

// Loading Spinner Types
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: IconSize
  color?: string
  text?: string
}

// Avatar Component Types
export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  name?: string
  size?: IconSize
  fallback?: ReactNode
}

// Progress Indicator Types
export interface ProgressIndicatorProps extends BaseComponentProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showValue?: boolean
  animated?: boolean
}

// Animation Props
export interface AnimatedComponentProps extends MotionProps {
  children: ReactNode
  className?: string
}

// Form Component Types
export interface FormFieldProps extends BaseComponentProps {
  name: string
  label?: string
  required?: boolean
  error?: string
  helperText?: string
}

// Client Selector Types
export interface ClientOption {
  id: string
  name: string
  company?: string
  avatar_url?: string
}

export interface ClientSelectorProps extends BaseComponentProps {
  value?: string
  onChange?: (clientId: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  clients?: ClientOption[]
  loading?: boolean
}

// Document Component Types
export interface DocumentItemProps extends BaseComponentProps {
  document: {
    id: string
    file_name: string
    file_type: string
    file_size: number
    created_at: string
    ai_status?: string
  }
  onDownload?: (document: any) => void
  onDelete?: (documentId: string) => void
  onPreview?: (document: any) => void
  loading?: boolean
}

// Error Boundary Types
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

// Layout Component Types
export interface HeaderProps extends BaseComponentProps {
  title?: string
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
  onLogout?: () => void
}

export interface SidebarProps extends BaseComponentProps {
  currentPath?: string
  collapsed?: boolean
  onToggle?: () => void
}

// Badge Component Types
export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'secondary'

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

export type BadgeStyle = 'solid' | 'outline' | 'soft' | 'ghost'

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'>,
    BaseComponentProps {
  variant?: BadgeVariant
  size?: BadgeSize
  badgeStyle?: BadgeStyle
  icon?: ReactNode
  cyber?: boolean
  animated?: boolean
  pulse?: boolean
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  count?: number | string
  style?: React.CSSProperties
}

// Specialized Badge Props
export interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'draft'
  showDot?: boolean
}

export interface NotificationBadgeProps extends Omit<BadgeProps, 'children' | 'variant'> {
  count?: number
  max?: number
  showZero?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  suffix?: string
  compact?: boolean
}

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
  children?: NavItem[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}
