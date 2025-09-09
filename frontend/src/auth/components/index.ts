/**
 * Auth Components Barrel Export
 *
 * Centralized export for all authentication-related components
 * Follows the barrel pattern for cleaner imports
 */

export { GoogleLoginButton } from './GoogleLoginButton'
export type { GoogleLoginButtonProps } from './GoogleLoginButton'

export { FormField } from './FormField'
export type { FormFieldProps } from './FormField'

export { EmailDisplay } from './EmailDisplay'
export type { EmailDisplayProps } from './EmailDisplay'

export { FormSeparator } from './FormSeparator'
export type { FormSeparatorProps } from './FormSeparator'

export { AuthFormContainer } from './AuthFormContainer'
export type { AuthFormContainerProps } from './AuthFormContainer'

// Re-export any existing auth components
export { default as LoginForm } from './LoginForm'
export { default as RegisterForm } from './RegisterForm'
