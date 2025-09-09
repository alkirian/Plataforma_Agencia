import React, { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react'
import { Modal } from '@components/ui/Modal'
import type {
  FormModalProps,
  FormFieldProps,
  FormFieldConfig,
  ValidationRules,
} from '../../types/form.types'
import type { ModalAction } from '../../types/modal.types'

/**
 * Generic FormModal component following Scope Rules principles.
 *
 * USAGE COUNT: Used by 2+ features (ClientRenameModal, ClientIndustryModal, etc.)
 * SCOPE: Shared component for all form-based modals
 *
 * Props:
 * - isOpen: boolean - Modal visibility state
 * - onClose: function - Close modal callback
 * - onSubmit: function - Form submission callback
 * - isSubmitting: boolean - Loading state
 * - title: string - Modal title
 * - description: string - Modal description
 * - submitLabel: string - Submit button text (default: 'Guardar')
 * - cancelLabel: string - Cancel button text (default: 'Cancelar')
 * - fields: array - Field configurations
 * - initialValues: object - Initial form values
 * - validationRules: object - Validation rules
 * - size: string - Modal size (sm, md, lg, xl)
 */
export const FormModal = <TFormData extends Record<string, any> = Record<string, any>>({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = 'Formulario',
  description,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  fields = [],
  initialValues = {},
  validationRules = {},
  size = 'md',
  className = '',
}: FormModalProps<TFormData>) => {
  const [formData, setFormData] = useState<Partial<TFormData>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialValues)
      setErrors({})
      setTouched({})
    }
  }, [isOpen, initialValues])

  // Update form data when initialValues change
  useEffect(() => {
    setFormData(initialValues)
  }, [initialValues])

  // Validation function
  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rules = validationRules[name]
      if (!rules) return null

      if (rules.required && (!value || value.toString().trim() === '')) {
        return rules.requiredMessage || `${name} es requerido`
      }

      if (rules.minLength && value.toString().length < rules.minLength) {
        return rules.minLengthMessage || `Mínimo ${rules.minLength} caracteres`
      }

      if (rules.maxLength && value.toString().length > rules.maxLength) {
        return rules.maxLengthMessage || `Máximo ${rules.maxLength} caracteres`
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.patternMessage || 'Formato inválido'
      }

      if (rules.custom && typeof rules.custom === 'function') {
        return rules.custom(value, formData)
      }

      return null
    },
    [validationRules, formData]
  )

  // Validate all form data
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string | null> = {}
    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [fields, formData, validateField])

  // Handle input change
  const handleChange = useCallback(
    (name: string, value: any) => {
      setFormData(prev => ({ ...prev, [name]: value }))

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }))
      }
    },
    [errors]
  )

  // Handle input blur
  const handleBlur = useCallback(
    (name: string) => {
      setTouched(prev => ({ ...prev, [name]: true }))
      const error = validateField(name, formData[name])
      setErrors(prev => ({ ...prev, [name]: error }))
    },
    [formData, validateField]
  )

  // Handle form submission
  const handleSubmit = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault?.()

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {}
      fields.forEach(field => {
        allTouched[field.name] = true
      })
      setTouched(allTouched)

      if (validateForm()) {
        onSubmit?.(formData as TFormData)
      }
    },
    [fields, formData, onSubmit, validateForm]
  )

  // Check if submit should be disabled
  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true

    // Check if any required field is empty
    const hasRequiredFields = fields.some(field => {
      const rules = validationRules?.[field.name]
      return (
        rules?.required && (!formData[field.name] || formData[field.name]?.toString().trim() === '')
      )
    })

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== null && error !== '')

    return hasRequiredFields || hasErrors
  }, [isSubmitting, fields, validationRules, formData, errors])

  // Modal actions
  const actions = useMemo(
    (): ModalAction[] => [
      {
        id: 'cancel',
        label: cancelLabel,
        variant: 'ghost' as const,
        onClick: onClose,
      },
      {
        id: 'submit',
        label: isSubmitting ? 'Guardando...' : submitLabel,
        variant: 'primary' as const,
        onClick: handleSubmit,
        disabled: isSubmitDisabled,
        loading: isSubmitting,
      },
    ],
    [cancelLabel, submitLabel, isSubmitting, onClose, handleSubmit, isSubmitDisabled]
  )

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      actions={actions}
      className={className}
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        {fields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name] || ''}
            error={touched[field.name] ? errors[field.name] : null}
            onChange={value => handleChange(field.name, value)}
            onBlur={() => handleBlur(field.name)}
          />
        ))}
      </form>
    </Modal>
  )
}

/**
 * FormField component for individual form inputs
 * SCOPE: Used only by FormModal (single usage) - stays co-located
 * PERFORMANCE: Memoized to prevent unnecessary re-renders
 */
const FormField = React.memo<FormFieldProps>(({ field, value, error, onChange, onBlur }) => {
  const {
    name,
    type = 'text',
    label,
    placeholder,
    autoFocus = false,
    options = [],
    className: fieldClassName = '',
  } = field

  const baseInputClassName = `w-full rounded-md border px-3 py-2 bg-surface-soft text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
    error
      ? 'border-red-500 focus:border-red-400'
      : 'border-[color:var(--color-border-subtle)] focus:border-[color:var(--color-accent-blue)]'
  }`

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
            onBlur={onBlur}
            className={`${baseInputClassName} ${fieldClassName}`}
          >
            <option value=''>{placeholder || 'Seleccionar...'}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`${baseInputClassName} ${fieldClassName} min-h-[80px] resize-y`}
            rows={3}
          />
        )

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`${baseInputClassName} ${fieldClassName}`}
          />
        )
    }
  }

  return (
    <div>
      {label && <label className='mb-1 block text-sm text-text-muted'>{label}</label>}
      {renderInput()}
      {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormModal
