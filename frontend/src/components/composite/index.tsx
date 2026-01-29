/**
 * Composite Component Library
 *
 * This module provides higher-level composite components that combine
 * multiple base components to create complex UI patterns while maintaining
 * type safety and design consistency.
 */

import React, { forwardRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  FormModalProps,
  ConfirmButtonProps,
  DataCardProps,
  SearchInputProps,
  ComponentVariant,
} from '../../types/components'
import { Modal, useModal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAsyncButton } from '../../hooks/useAsyncButton'
import { LoadingSpinner, LoadingOverlay } from '../ui/LoadingSpinner'
import { cn } from '@lib/utils'

// ============================================================================
// FORM MODAL COMPONENT
// ============================================================================

export const FormModal = forwardRef<HTMLDivElement, FormModalProps>(
  (
    {
      children,
      onSubmit,
      formLoading = false,
      formErrors = {},
      submitText = 'Guardar',
      cancelText = 'Cancelar',
      actions,
      ...modalProps
    },
    ref
  ) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault()
        if (!onSubmit) return

        try {
          setIsSubmitting(true)
          await onSubmit(new FormData(e.target as HTMLFormElement))
        } catch (error) {
          console.error('Form submission error:', error)
        } finally {
          setIsSubmitting(false)
        }
      },
      [onSubmit]
    )

    const defaultActions = [
      {
        id: 'cancel',
        label: cancelText,
        variant: 'ghost' as ComponentVariant,
        closeOnClick: true,
      },
      {
        id: 'submit',
        label: submitText,
        variant: 'primary' as ComponentVariant,
        loading: isSubmitting || formLoading,
        disabled: Object.keys(formErrors).length > 0,
        onClick: () => {
          // Form submission is handled by the form's onSubmit
          const form = document.querySelector('form')
          if (form) form.requestSubmit()
        },
      },
    ]

    return (
      <Modal ref={ref} actions={actions || defaultActions} closeOnBackdrop={false} {...modalProps}>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {children}

          {/* Display form-level errors */}
          {Object.keys(formErrors).length > 0 && (
            <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
              <h4 className='text-sm font-medium text-red-400 mb-2'>Errores en el formulario:</h4>
              <ul className='text-xs text-red-300 space-y-1'>
                {Object.entries(formErrors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </Modal>
    )
  }
)

FormModal.displayName = 'FormModal'

// ============================================================================
// CONFIRMATION BUTTON COMPONENT
// ============================================================================

export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  (
    {
      confirmTitle = '¿Estás seguro?',
      confirmMessage = '¿Deseas continuar con esta acción?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      onConfirm,
      skipConfirmation = false,
      children,
      variant = 'danger',
      ...buttonProps
    },
    ref
  ) => {
    const { open, openModal, closeModal } = useModal()
    const { loading, handleClick: handleAsyncConfirm } = useAsyncButton(onConfirm)

    const handleClick = useCallback(() => {
      if (skipConfirmation) {
        handleAsyncConfirm()
      } else {
        openModal()
      }
    }, [skipConfirmation, handleAsyncConfirm, openModal])

    const handleConfirm = useCallback(async () => {
      await handleAsyncConfirm()
      closeModal()
    }, [handleAsyncConfirm, closeModal])

    return (
      <>
        <Button
          ref={ref}
          variant={variant}
          loading={loading}
          onClick={handleClick}
          {...buttonProps}
        >
          {children}
        </Button>

        <Modal
          open={open}
          onClose={closeModal}
          title={confirmTitle}
          variant='danger'
          size='sm'
          actions={[
            {
              id: 'cancel',
              label: cancelText,
              variant: 'ghost',
              closeOnClick: true,
            },
            {
              id: 'confirm',
              label: confirmText,
              variant: 'danger',
              onClick: handleConfirm,
              loading,
            },
          ]}
        >
          <p className='text-text-primary'>{confirmMessage}</p>
        </Modal>
      </>
    )
  }
)

ConfirmButton.displayName = 'ConfirmButton'

// ============================================================================
// DATA CARD COMPONENT
// ============================================================================

export const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  (
    {
      title,
      subtitle,
      children,
      actions,
      variant = 'primary',
      selectable = false,
      selected = false,
      onSelect,
      isLoading = false,
      error,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const handleClick = useCallback(() => {
      if (selectable && onSelect) {
        onSelect()
      }
    }, [selectable, onSelect])

    const cardContent = (
      <div
        ref={ref}
        className={cn(
          'bg-surface-soft border border-[color:var(--color-border-subtle)] rounded-xl p-6 transition-all duration-200',
          selectable &&
            'cursor-pointer hover:border-[color:var(--color-accent-blue)] hover:shadow-lg',
          selected &&
            'border-[color:var(--color-accent-blue)] bg-[color:var(--color-accent-blue)]/5',
          error && 'border-red-500/40 bg-red-500/5',
          className
        )}
        onClick={handleClick}
        data-testid={testId}
        role={selectable ? 'button' : undefined}
        tabIndex={selectable ? 0 : undefined}
        {...props}
      >
        {/* Header */}
        {(title || subtitle || actions) && (
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1 min-w-0'>
              {title && (
                <h3 className='text-lg font-semibold text-text-primary truncate'>{title}</h3>
              )}
              {subtitle && <p className='text-sm text-text-muted mt-1'>{subtitle}</p>}
            </div>
            {actions && <div className='flex items-center gap-2 ml-4'>{actions}</div>}
          </div>
        )}

        {/* Content */}
        {error ? (
          <div className='flex items-center gap-3 text-red-400'>
            <span className='text-lg'>⚠️</span>
            <div>
              <p className='font-medium'>Error cargando datos</p>
              <p className='text-sm text-red-300'>
                {typeof error === 'string' ? error : 'Ha ocurrido un error'}
              </p>
            </div>
          </div>
        ) : (
          <div className='text-text-primary'>{children}</div>
        )}
      </div>
    )

    return (
      <LoadingOverlay isVisible={isLoading} label='Cargando datos...'>
        {cardContent}
      </LoadingOverlay>
    )
  }
)

DataCard.displayName = 'DataCard'

// ============================================================================
// ENHANCED SEARCH INPUT COMPONENT
// ============================================================================

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      suggestions = [],
      onSuggestionSelect,
      debounceMs = 300,
      onSearch,
      showResults = false,
      renderResults,
      placeholder = 'Buscar...',
      ...inputProps
    },
    ref
  ) => {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const timeoutRef = React.useRef<NodeJS.Timeout>()

    // Debounced search
    React.useEffect(() => {
      if (onSearch) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          onSearch(query)
        }, debounceMs)
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [query, onSearch, debounceMs])

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)
        setIsOpen(value.length > 0 && (suggestions.length > 0 || showResults))
        setHighlightedIndex(-1)
      },
      [suggestions.length, showResults]
    )

    const handleSuggestionSelect = useCallback(
      (suggestion: string, index: number) => {
        setQuery(suggestion)
        setIsOpen(false)
        setHighlightedIndex(-1)
        onSuggestionSelect?.(suggestion)
      },
      [onSuggestionSelect]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!isOpen) return

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
            break
          case 'ArrowUp':
            e.preventDefault()
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
            break
          case 'Enter':
            e.preventDefault()
            if (highlightedIndex >= 0) {
              handleSuggestionSelect(suggestions[highlightedIndex], highlightedIndex)
            }
            break
          case 'Escape':
            setIsOpen(false)
            setHighlightedIndex(-1)
            break
        }
      },
      [isOpen, suggestions, highlightedIndex, handleSuggestionSelect]
    )

    return (
      <div className='relative'>
        <Input
          ref={ref}
          type='search'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay to allow clicks
          placeholder={placeholder}
          icon={<span>🔍</span>}
          {...inputProps}
        />

        {/* Results dropdown */}
        <AnimatePresence>
          {isOpen && (suggestions.length > 0 || renderResults) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='absolute top-full left-0 right-0 z-50 mt-1 bg-surface-soft border border-[color:var(--color-border-subtle)] rounded-xl shadow-xl max-h-60 overflow-y-auto'
            >
              {suggestions.length > 0 ? (
                <div className='py-1'>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      className={cn(
                        'w-full px-4 py-2 text-left text-text-primary hover:bg-surface-strong transition-colors',
                        index === highlightedIndex && 'bg-[color:var(--color-accent-blue)]/10'
                      )}
                      onClick={() => handleSuggestionSelect(suggestion, index)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : renderResults ? (
                <div className='p-4'>{renderResults(query)}</div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

// ============================================================================
// ACTION BUTTON COMPONENT
// ============================================================================

export const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode
    onAction: () => Promise<void>
    confirmMessage?: string
    loadingText?: string
    successText?: string
    errorText?: string
    variant?: ComponentVariant
    requireConfirmation?: boolean
  }
>((props, ref) => {
  const {
    children,
    onAction,
    confirmMessage = '¿Estás seguro?',
    loadingText = 'Procesando...',
    successText = 'Completado',
    errorText = 'Error',
    variant = 'primary',
    requireConfirmation = false,
    ...buttonProps
  } = props

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const { open, openModal, closeModal } = useModal()

  const handleAction = useCallback(async () => {
    try {
      setStatus('loading')
      await onAction()
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [onAction])

  const handleClick = useCallback(() => {
    if (requireConfirmation) {
      openModal()
    } else {
      handleAction()
    }
  }, [requireConfirmation, openModal, handleAction])

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <LoadingSpinner size='sm' variant='white' />
            {loadingText}
          </>
        )
      case 'success':
        return (
          <>
            <span>✅</span>
            {successText}
          </>
        )
      case 'error':
        return (
          <>
            <span>❌</span>
            {errorText}
          </>
        )
      default:
        return children
    }
  }

  const getButtonVariant = (): ComponentVariant => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'danger'
      default:
        return variant
    }
  }

  return (
    <>
      <Button
        ref={ref}
        variant={getButtonVariant()}
        disabled={status === 'loading'}
        onClick={handleClick}
        {...buttonProps}
      >
        {getButtonContent()}
      </Button>

      {requireConfirmation && (
        <Modal
          open={open}
          onClose={closeModal}
          title='Confirmación'
          size='sm'
          actions={[
            {
              id: 'cancel',
              label: 'Cancelar',
              variant: 'ghost',
              closeOnClick: true,
            },
            {
              id: 'confirm',
              label: 'Confirmar',
              variant: 'primary',
              onClick: handleAction,
              loading: status === 'loading',
            },
          ]}
        >
          <p>{confirmMessage}</p>
        </Modal>
      )}
    </>
  )
})

ActionButton.displayName = 'ActionButton'

// Remove duplicate exports - components are exported inline
/*
export {
  FormModal,
  ConfirmButton,
  DataCard,
  SearchInput,
  ActionButton
*/
