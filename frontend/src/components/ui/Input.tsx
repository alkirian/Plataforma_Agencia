/**
 * Enhanced TypeScript Input Component System
 *
 * A comprehensive, type-safe input component system that provides consistent
 * styling, validation, and accessibility across all form inputs.
 */

import React, { forwardRef, useMemo, useId } from 'react'
import { motion } from 'framer-motion'
import { type InputProps, type TextareaProps, BaseInputProps } from '../../types/components'
import { cn } from '@lib/utils'

// ============================================================================
// INPUT SIZE CONFIGURATIONS
// ============================================================================

const sizeStyles = {
  xs: 'px-3 py-1.5 text-xs rounded-md min-h-[32px]',
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-3 text-sm rounded-xl min-h-[44px]',
  lg: 'px-5 py-4 text-base rounded-xl min-h-[48px]',
  xl: 'px-6 py-5 text-lg rounded-2xl min-h-[52px]',
} as const

// ============================================================================
// SHARED INPUT COMPONENTS
// ============================================================================

/**
 * Input field wrapper with label and error display
 */
const InputFieldWrapper: React.FC<{
  children: React.ReactNode
  label?: string
  required?: boolean
  error?: string | boolean
  helpText?: string
  cyber?: boolean
  id: string
}> = ({ children, label, required, error, helpText, cyber = true, id }) => {
  const errorMessage = typeof error === 'string' ? error : undefined
  const hasError = Boolean(error)

  return (
    <div className='space-y-2'>
      {label && (
        <motion.label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium',
            cyber ? 'text-text-primary' : 'text-surface-200',
            required && "after:content-['*'] after:text-red-400 after:ml-1"
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}

      <div className='relative group'>
        {children}

        {/* Cyber theme glow effect */}
        {cyber && (
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-accent-blue)]/0 via-[var(--color-accent-blue)]/10 to-[var(--color-accent-violet)]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none' />
        )}
      </div>

      {/* Error message */}
      {hasError && errorMessage && (
        <motion.p
          className='text-sm text-red-400 flex items-start gap-1'
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role='alert'
          aria-live='polite'
        >
          <span className='text-red-400 text-xs mt-0.5'>⚠</span>
          {errorMessage}
        </motion.p>
      )}

      {/* Help text */}
      {helpText && !hasError && <p className='text-xs text-text-muted'>{helpText}</p>}
    </div>
  )
}

/**
 * Icon wrapper for input fields
 */
const InputIcon: React.FC<{
  icon: React.ReactNode
  position: 'left' | 'right'
  cyber?: boolean
}> = ({ icon, position, cyber = true }) => (
  <div
    className={cn(
      'absolute top-1/2 transform -translate-y-1/2 z-10 pointer-events-none',
      position === 'left' ? 'left-3' : 'right-3',
      cyber ? 'text-[var(--color-accent-blue)]' : 'text-surface-400',
      'group-focus-within:text-[var(--color-accent-violet)] transition-colors duration-200'
    )}
  >
    {icon}
  </div>
)

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required = false,
      placeholder = '',
      disabled = false,
      error,
      helpText,
      icon,
      iconPosition = 'left',
      size = 'md',
      cyber = true,
      className,
      'data-testid': testId,
      // Extract HTML drag events to prevent conflicts with framer-motion
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragExit,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
      ...props
    },
    ref
  ) => {
    const id = useId()
    const hasError = Boolean(error)

    // Memoize input classes for performance
    const inputClasses = useMemo(() => {
      return cn(
        // Base styles
        'w-full border transition-all duration-200 placeholder:text-text-muted/60',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/50',

        // Theme-specific styles
        cyber
          ? 'input-cyber bg-surface-soft/50 border-[color:var(--color-border-subtle)] text-text-primary focus:border-[var(--color-accent-blue)] focus:bg-surface-soft'
          : 'input-modern bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20',

        // Size styles
        sizeStyles[size],

        // Icon padding
        icon && iconPosition === 'left' && 'pl-10',
        icon && iconPosition === 'right' && 'pr-10',

        // Error styles
        hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',

        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed bg-surface-800/30',

        // Custom classes
        className
      )
    }, [cyber, size, icon, iconPosition, hasError, disabled, className])

    return (
      <InputFieldWrapper
        label={label}
        required={required}
        error={error}
        helpText={helpText}
        cyber={cyber}
        id={id}
      >
        {icon && <InputIcon icon={icon} position={iconPosition} cyber={cyber} />}

        <motion.input
          ref={ref}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          data-testid={testId}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 },
          }}
          {...props}
        />
      </InputFieldWrapper>
    )
  }
)

Input.displayName = 'Input'

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required = false,
      placeholder = '',
      disabled = false,
      error,
      helpText,
      size = 'md',
      cyber = true,
      rows = 4,
      resizable = true,
      className,
      'data-testid': testId,
      // Extract HTML drag events to prevent conflicts with framer-motion
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragExit,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
      ...props
    },
    ref
  ) => {
    const id = useId()
    const hasError = Boolean(error)

    // Memoize textarea classes for performance
    const textareaClasses = useMemo(() => {
      return cn(
        // Base styles
        'w-full border transition-all duration-200 placeholder:text-text-muted/60',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/50',

        // Theme-specific styles
        cyber
          ? 'input-cyber bg-surface-soft/50 border-[color:var(--color-border-subtle)] text-text-primary focus:border-[var(--color-accent-blue)] focus:bg-surface-soft'
          : 'input-modern bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20',

        // Size styles (using md as base for textareas)
        sizeStyles[size],

        // Resize behavior
        resizable ? 'resize-y' : 'resize-none',

        // Error styles
        hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',

        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed bg-surface-800/30',

        // Custom classes
        className
      )
    }, [cyber, size, hasError, disabled, resizable, className])

    return (
      <InputFieldWrapper
        label={label}
        required={required}
        error={error}
        helpText={helpText}
        cyber={cyber}
        id={id}
      >
        <motion.textarea
          ref={ref}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={textareaClasses}
          data-testid={testId}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 },
          }}
          {...props}
        />
      </InputFieldWrapper>
    )
  }
)

Textarea.displayName = 'Textarea'

// ============================================================================
// SPECIALIZED INPUT VARIANTS
// ============================================================================

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePassword = React.useCallback(() => {
      setShowPassword(prev => !prev)
    }, [])

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        iconPosition='right'
        icon={
          <button
            type='button'
            onClick={togglePassword}
            className='cursor-pointer hover:text-[var(--color-accent-violet)] transition-colors'
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export const SearchInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type'> & {
    onSearch?: (query: string) => void
    debounceMs?: number
  }
>((props, ref) => {
  const { onSearch, debounceMs = 300, ...inputProps } = props
  const [value, setValue] = React.useState('')
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    if (onSearch && value !== undefined) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        onSearch(value)
      }, debounceMs)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSearch, debounceMs])

  return (
    <Input
      ref={ref}
      type='search'
      value={value}
      onChange={e => setValue(e.target.value)}
      icon={<span>🔍</span>}
      {...inputProps}
    />
  )
})
SearchInput.displayName = 'SearchInput'

export const NumericInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type'> & {
    min?: number
    max?: number
    step?: number
  }
>((props, ref) => <Input ref={ref} type='number' {...props} />)
NumericInput.displayName = 'NumericInput'

// ============================================================================
// INPUT HOOKS
// ============================================================================

/**
 * Hook for managing input validation state
 */
export function useInputValidation(
  value: string,
  validators: Array<(value: string) => string | null>
) {
  const [error, setError] = React.useState<string | null>(null)
  const [touched, setTouched] = React.useState(false)

  const validate = React.useCallback(() => {
    for (const validator of validators) {
      const result = validator(value)
      if (result) {
        setError(result)
        return false
      }
    }
    setError(null)
    return true
  }, [value, validators])

  React.useEffect(() => {
    if (touched) {
      validate()
    }
  }, [value, touched, validate])

  const handleBlur = React.useCallback(() => {
    setTouched(true)
    validate()
  }, [validate])

  return {
    error: touched ? error : null,
    isValid: !error,
    touched,
    validate,
    handleBlur,
    setTouched,
  }
}

/**
 * Common validation functions
 */
export const validators = {
  required:
    (message = 'Este campo es requerido') =>
    (value: string) =>
      !value.trim() ? message : null,

  email:
    (message = 'Ingrese un email válido') =>
    (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return !emailRegex.test(value) ? message : null
    },

  minLength: (min: number, message?: string) => (value: string) => {
    const msg = message || `Debe tener al menos ${min} caracteres`
    return value.length < min ? msg : null
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    const msg = message || `No debe exceder ${max} caracteres`
    return value.length > max ? msg : null
  },

  pattern:
    (regex: RegExp, message = 'Formato inválido') =>
    (value: string) =>
      !regex.test(value) ? message : null,
}

export default Input
