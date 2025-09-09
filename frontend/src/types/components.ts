/**
 * Comprehensive TypeScript Component System
 *
 * This file defines the core type system for our optimized component architecture
 * that eliminates duplication and provides type safety across all UI components.
 */

import {
  type ReactNode,
  type ReactElement,
  HTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import type { MotionProps } from 'framer-motion'

// ============================================================================
// BASE COMPONENT INTERFACES
// ============================================================================

/**
 * Base props that all components should extend
 */
export interface BaseComponentProps {
  /** Custom CSS classes */
  className?: string
  /** Unique identifier for the component */
  id?: string
  /** Test identifier for automated testing */
  'data-testid'?: string
  /** Whether to use cyber theme styling */
  cyber?: boolean
}

/**
 * Component size variants used across the system
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Component variant types for theming
 */
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'

/**
 * Loading states for components
 */
export interface LoadingState {
  isLoading?: boolean
  loadingText?: string
}

/**
 * Error states for components
 */
export interface ErrorState {
  error?: string | boolean
  errorMessage?: string
}

// ============================================================================
// BUTTON COMPONENT TYPES
// ============================================================================

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    BaseComponentProps,
    LoadingState {
  /** Button content */
  children: ReactNode
  /** Visual variant of the button */
  variant?: ComponentVariant
  /** Size of the button */
  size?: ComponentSize
  /** Icon to display in the button */
  icon?: ReactNode
  /** Position of the icon relative to text */
  iconPosition?: 'left' | 'right'
  /** Whether the button is in loading state */
  loading?: boolean
  /** Full width button */
  fullWidth?: boolean
  /** Custom click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Button factory configuration
 */
export interface ButtonConfig {
  variant: ComponentVariant
  size: ComponentSize
  cyber: boolean
  className: string
}

// ============================================================================
// MODAL COMPONENT TYPES
// ============================================================================

export interface ModalAction {
  id: string
  label: string
  variant?: ComponentVariant
  icon?: ReactNode
  onClick?: (event: React.MouseEvent) => void
  disabled?: boolean
  loading?: boolean
  closeOnClick?: boolean
  autoFocus?: boolean
}

export interface ModalProps extends BaseComponentProps {
  /** Whether the modal is open */
  open: boolean
  /** Function to call when modal should close */
  onClose: () => void
  /** Modal title */
  title?: ReactNode
  /** Modal description */
  description?: ReactNode
  /** Icon for the modal header */
  icon?: ReactNode
  /** Modal content */
  children: ReactNode
  /** Primary actions (right side) */
  actions?: ModalAction[]
  /** Secondary actions (left side) */
  secondaryActions?: ModalAction[]
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fit'
  /** Maximum height of modal */
  maxHeight?: string
  /** Whether to close on backdrop click */
  closeOnBackdrop?: boolean
  /** Whether to show close button */
  showClose?: boolean
  /** Whether to prevent body scroll */
  preventScroll?: boolean
  /** Modal variant for theming */
  variant?: 'default' | 'danger' | 'success' | 'info'
  /** Custom footer content */
  footer?: ReactNode
  /** Initial focus target */
  initialFocusRef?: React.RefObject<HTMLElement>
}

// ============================================================================
// INPUT COMPONENT TYPES
// ============================================================================

export interface BaseInputProps extends BaseComponentProps, ErrorState {
  /** Input label */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Input placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Icon to display in input */
  icon?: ReactNode
  /** Icon position */
  iconPosition?: 'left' | 'right'
  /** Input size */
  size?: ComponentSize
  /** Help text */
  helpText?: string
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseInputProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  /** Current input value */
  value?: string
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    BaseInputProps {
  /** Current textarea value */
  value?: string
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  /** Number of visible text lines */
  rows?: number
  /** Whether textarea can be resized */
  resizable?: boolean
}

// ============================================================================
// LOADING COMPONENT TYPES
// ============================================================================

export interface LoadingSpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: ComponentSize
  /** Spinner variant */
  variant?: 'primary' | 'secondary' | 'white'
  /** Accessible label for screen readers */
  label?: string
}

export interface LoadingCardProps extends BaseComponentProps {
  /** Loading card title */
  title?: string
  /** Loading card description */
  description?: string
}

export interface LoadingOverlayProps extends BaseComponentProps {
  /** Whether overlay is visible */
  isVisible: boolean
  /** Content to overlay */
  children: ReactNode
  /** Loading message */
  label?: string
}

// ============================================================================
// FORM COMPONENT TYPES
// ============================================================================

export interface FormFieldProps extends BaseComponentProps, ErrorState {
  /** Field label */
  label: string
  /** Whether field is required */
  required?: boolean
  /** Help text */
  helpText?: string
  /** Field content */
  children: ReactNode
}

export interface FormProps extends BaseComponentProps {
  /** Form content */
  children: ReactNode
  /** Form submit handler */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  /** Whether form is in loading state */
  loading?: boolean
  /** Form validation errors */
  errors?: Record<string, string>
}

// ============================================================================
// COMPOSITE COMPONENT TYPES
// ============================================================================

/**
 * Modal with form integration
 */
export interface FormModalProps extends Omit<ModalProps, 'children'> {
  /** Form fields */
  children: ReactNode
  /** Form submit handler */
  onSubmit?: (data: any) => void | Promise<void>
  /** Form loading state */
  formLoading?: boolean
  /** Form validation errors */
  formErrors?: Record<string, string>
  /** Submit button text */
  submitText?: string
  /** Cancel button text */
  cancelText?: string
}

/**
 * Button with confirmation dialog
 */
export interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Confirmation dialog title */
  confirmTitle?: string
  /** Confirmation dialog message */
  confirmMessage?: string
  /** Confirmation button text */
  confirmText?: string
  /** Cancel button text */
  cancelText?: string
  /** Handler called after confirmation */
  onConfirm: () => void | Promise<void>
  /** Skip confirmation dialog */
  skipConfirmation?: boolean
}

/**
 * Data card with loading and error states
 */
export interface DataCardProps extends BaseComponentProps, LoadingState, ErrorState {
  /** Card title */
  title?: ReactNode
  /** Card subtitle */
  subtitle?: ReactNode
  /** Card content */
  children?: ReactNode
  /** Card actions */
  actions?: ReactNode
  /** Card variant */
  variant?: ComponentVariant
  /** Whether card is selectable */
  selectable?: boolean
  /** Whether card is selected */
  selected?: boolean
  /** Selection handler */
  onSelect?: () => void
}

/**
 * Search input with suggestions
 */
export interface SearchInputProps extends Omit<InputProps, 'type'> {
  /** Search suggestions */
  suggestions?: string[]
  /** Suggestion select handler */
  onSuggestionSelect?: (suggestion: string) => void
  /** Debounce delay in ms */
  debounceMs?: number
  /** Search handler */
  onSearch?: (query: string) => void
  /** Whether to show search results */
  showResults?: boolean
  /** Custom search results renderer */
  renderResults?: (query: string) => ReactNode
}

// ============================================================================
// COMPONENT FACTORY TYPES
// ============================================================================

/**
 * Generic component factory interface
 */
export interface ComponentFactory<TProps, TVariants = {}> {
  /** Create component with props */
  create: (props: TProps) => ReactElement
  /** Predefined variant configurations */
  variants: TVariants
  /** Create component with variant */
  withVariant: <K extends keyof TVariants>(
    variant: K
  ) => (props: Omit<TProps, keyof TVariants[K]>) => ReactElement
}

/**
 * Button factory variants
 */
export interface ButtonVariants {
  primaryCyber: Partial<ButtonProps>
  secondaryCyber: Partial<ButtonProps>
  danger: Partial<ButtonProps>
  success: Partial<ButtonProps>
  ghost: Partial<ButtonProps>
}

/**
 * Modal factory variants
 */
export interface ModalVariants {
  confirmation: Partial<ModalProps>
  alert: Partial<ModalProps>
  form: Partial<ModalProps>
  fullscreen: Partial<ModalProps>
}

// ============================================================================
// ERROR BOUNDARY TYPES
// ============================================================================

export interface ErrorBoundaryProps {
  /** Content to render */
  children: ReactNode
  /** Fallback UI when error occurs */
  fallback?: ReactNode
  /** Error handler */
  onError?: (error: Error, errorInfo: any) => void
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

export interface A11yProps {
  /** ARIA label */
  'aria-label'?: string
  /** ARIA described by */
  'aria-describedby'?: string
  /** ARIA labeled by */
  'aria-labelledby'?: string
  /** ARIA expanded */
  'aria-expanded'?: boolean
  /** ARIA pressed */
  'aria-pressed'?: boolean
  /** ARIA selected */
  'aria-selected'?: boolean
  /** Tab index */
  tabIndex?: number
  /** Role */
  role?: string
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export interface AnimatedComponentProps extends MotionProps {
  /** Whether animations are enabled */
  animated?: boolean
  /** Animation preset */
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounce'
}

// ============================================================================
// THEME TYPES
// ============================================================================

export interface ThemeContextValue {
  /** Current theme */
  theme: 'light' | 'dark' | 'cyber'
  /** Toggle theme */
  toggleTheme: () => void
  /** Set specific theme */
  setTheme: (theme: 'light' | 'dark' | 'cyber') => void
}

// ============================================================================
// COMPONENT STATE MANAGEMENT
// ============================================================================

export interface ComponentState<T = any> {
  data?: T
  loading: boolean
  error?: string
  lastUpdated?: Date
}

export interface AsyncComponentProps<T = any> {
  /** Async data loader */
  loader: () => Promise<T>
  /** Loading component */
  loadingComponent?: ReactNode
  /** Error component */
  errorComponent?: ReactNode
  /** Success component renderer */
  children: (data: T) => ReactNode
  /** Dependencies that trigger reload */
  dependencies?: any[]
}
