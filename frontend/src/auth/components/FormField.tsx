import React from 'react'
import type { UseFormRegister, FieldError, RegisterOptions } from 'react-hook-form'
import type { AuthFormData } from '../types/auth-flow.types'
import { AUTH_STYLES } from '../constants/auth.constants'

/**
 * Props for FormField component
 */
export interface FormFieldProps {
  name: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  placeholder?: string
  label?: string
  error?: FieldError
  register: UseFormRegister<AuthFormData>
  rules?: RegisterOptions
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  inputClassName?: string
  showLabel?: boolean
  required?: boolean
}

/**
 * Reusable Form Field Component
 * Provides consistent styling and error handling for form inputs
 */
export const FormField: React.FC<FormFieldProps> = ({
  name,
  type = 'text',
  placeholder,
  label,
  error,
  register,
  rules,
  autoComplete,
  autoFocus = false,
  disabled = false,
  className = '',
  inputClassName,
  showLabel = false,
  required = false,
}) => {
  const inputClass = `${inputClassName ?? AUTH_STYLES.INPUT_BASE} ${
    error ? AUTH_STYLES.INPUT_ERROR : ''
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <div className={`${className}`}>
      {showLabel && label && (
        <label htmlFor={name} className={`block mb-1 ${AUTH_STYLES.LABEL_TEXT}`}>
          {label}
          {required && <span className='text-red-400 ml-1'>*</span>}
        </label>
      )}

      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        className={inputClass}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...register(name, rules)}
      />

      {error && (
        <p id={`${name}-error`} className={AUTH_STYLES.ERROR_TEXT} role='alert'>
          {error.message}
        </p>
      )}
    </div>
  )
}

export default FormField
