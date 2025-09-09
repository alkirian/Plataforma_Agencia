/**
 * Generic Modal and Form types for TypeScript
 * Based on the existing Modal component structure
 */

import type { ReactNode, RefObject } from 'react'

export interface ModalAction {
  id?: string
  label: string
  onClick?: (event?: any) => void
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'danger'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
  icon?: ReactNode
  closeOnClick?: boolean
  disabled?: boolean
  autoFocus?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string | ReactNode
  description?: string | ReactNode
  icon?: ReactNode
  children?: ReactNode
  actions?: ModalAction[]
  secondaryActions?: ModalAction[]
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fit'
  maxHeight?: string
  initialFocusRef?: RefObject<any>
  closeOnBackdrop?: boolean
  showClose?: boolean
  preventScroll?: boolean
  variant?: 'default' | 'danger' | 'success' | 'info'
  footer?: ReactNode
  className?: string
}

// Generic form modal types
export interface FormModalProps<TFormData = any> extends Omit<ModalProps, 'actions'> {
  isSubmitting?: boolean
  onSubmit?: (data: TFormData) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  canSubmit?: boolean
  formId?: string
}

// Validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormFieldConfig {
  name: string
  label?: string
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'datalist'
  placeholder?: string
  required?: boolean
  options?: string[] | Array<{ value: string; label: string }>
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
  }
}

// Step-based form types
export interface StepConfig {
  step: number
  title: string
  fields: FormFieldConfig[]
  canNext?: (formData: any) => boolean
  onNext?: (formData: any) => void | Promise<void>
}

export interface StepFormProps<TFormData = any> {
  steps: StepConfig[]
  currentStep: number
  onStepChange: (step: number) => void
  formData: TFormData
  onFormDataChange: (data: Partial<TFormData>) => void
  isSubmitting?: boolean
}
