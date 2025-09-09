/**
 * Auth Flow Types - Specific types for the authentication flow state machine
 */

/**
 * Authentication flow states
 */
export type AuthFlowState = 'enterEmail' | 'login' | 'register'

/**
 * Form data for email step
 */
export interface EmailStepData {
  email: string
}

/**
 * Form data for login step
 */
export interface LoginStepData {
  email: string
  password: string
}

/**
 * Form data for registration step
 */
export interface RegisterStepData {
  email: string
  fullName: string
  agencyName: string
  password: string
}

/**
 * Combined form data type
 */
export type AuthFormData = EmailStepData | LoginStepData | RegisterStepData

/**
 * Auth page props
 */
export interface AuthPageProps {
  onSuccess?: () => void
  redirectTo?: string
}

/**
 * Auth flow context
 */
export interface AuthFlowContext {
  flowState: AuthFlowState
  userEmail: string
  isLoading: boolean
  error: string | null
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  name: string
  type: 'text' | 'email' | 'password'
  placeholder: string
  label?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  errorMessage?: string
  autoComplete?: string
  autoFocus?: boolean
}

/**
 * Validation rules for form fields
 */
export interface ValidationRules {
  required?: boolean | string
  minLength?: {
    value: number
    message: string
  }
  maxLength?: {
    value: number
    message: string
  }
  pattern?: {
    value: RegExp
    message: string
  }
  validate?: Record<string, (value: any) => boolean | string>
}

/**
 * Auth form configuration
 */
export interface AuthFormConfig {
  fields: FormFieldConfig[]
  submitLabel: string
  loadingLabel: string
  showGoogleLogin?: boolean
  showForgotPassword?: boolean
  onBack?: () => void
  backLabel?: string
}

/**
 * Auth step configuration
 */
export interface AuthStepConfig {
  title: string
  subtitle: string
  form: AuthFormConfig
}

/**
 * Auth flow configuration map
 */
export type AuthFlowConfig = Record<AuthFlowState, AuthStepConfig>
