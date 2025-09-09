/**
 * Form-specific TypeScript interfaces
 * Used by FormModal and form components
 */

import { ReactNode } from 'react'

// Form field configuration
export interface FormFieldOption {
  value: string
  label: string
}

export interface FormFieldConfig {
  name: string
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'password' | 'number'
  label?: string
  placeholder?: string
  autoFocus?: boolean
  options?: FormFieldOption[]
  className?: string
}

// Validation rules
export interface ValidationRule {
  required?: boolean
  requiredMessage?: string
  minLength?: number
  minLengthMessage?: string
  maxLength?: number
  maxLengthMessage?: string
  pattern?: RegExp
  patternMessage?: string
  custom?: (value: any, formData?: any) => string | null
}

export type ValidationRules = Record<string, ValidationRule>

// Form state
export interface FormState<T = any> {
  formData: T
  errors: Record<string, string | null>
  touched: Record<string, boolean>
}

// FormModal props
export interface FormModalProps<TFormData = Record<string, any>> {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: TFormData) => void | Promise<void>
  isSubmitting?: boolean
  title?: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  fields: FormFieldConfig[]
  initialValues: Partial<TFormData>
  validationRules?: ValidationRules
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// FormField props
export interface FormFieldProps {
  field: FormFieldConfig
  value: any
  error: string | null
  onChange: (value: any) => void
  onBlur: () => void
}

// Hook types
export interface UseFormReturn<TFormData> {
  formData: TFormData
  errors: Record<string, string | null>
  touched: Record<string, boolean>
  setFormData: (data: Partial<TFormData>) => void
  handleChange: (name: keyof TFormData, value: any) => void
  handleBlur: (name: keyof TFormData) => void
  handleSubmit: (e?: Event) => void
  validateForm: () => boolean
  validateField: (name: keyof TFormData, value: any) => string | null
  isSubmitDisabled: boolean
  reset: () => void
}
