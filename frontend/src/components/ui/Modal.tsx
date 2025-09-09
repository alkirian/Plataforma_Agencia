import React, { useEffect, useCallback, useRef, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { ModalProps, ModalAction } from '../../shared/types'
import { Button } from '.'

/**
 * Reusable, accessible modal component.
 *
 * Props:
 *  - open (bool)
 *  - onClose () => void
 *  - title (string | ReactNode)
 *  - description (string | ReactNode)
 *  - icon (ReactNode)
 *  - children (content/body)
 *  - actions: array of { id, label, onClick, variant, icon, closeOnClick }
 *  - secondaryActions: same shape (rendered left side)
 *  - size: 'sm' | 'md' | 'lg' | 'xl' | 'fit'
 *  - maxHeight: css value (default '85vh')
 *  - initialFocusRef: ref for first focusable element
 *  - closeOnBackdrop (default true)
 *  - showClose (default true)
 *  - preventScroll (default true)
 *  - variant: 'default' | 'danger' | 'success' | 'info'
 *  - footer (ReactNode) override: if provided replaces default action layout
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  actions = [],
  secondaryActions = [],
  size = 'md',
  maxHeight = '85vh',
  initialFocusRef,
  closeOnBackdrop = true,
  showClose = true,
  preventScroll = true,
  variant = 'default',
  footer,
  className = '',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Lock scroll
  useEffect(() => {
    if (open && preventScroll) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open, preventScroll])

  // Focus management
  useEffect(() => {
    if (open) {
      const target =
        initialFocusRef?.current ||
        contentRef.current?.querySelector('[data-autofocus]') ||
        contentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      if (target && target instanceof HTMLElement) {
        setTimeout(() => target.focus(), 10)
      }
    }
  }, [open, initialFocusRef])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
      if (e.key === 'Tab') {
        // Basic focus trap
        const focusable = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [open, handleKeyDown])

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fit: 'w-full max-w-none mx-4',
  } as const

  const variantClasses = {
    default: 'bg-gray-800',
    danger: 'bg-red-900/20 border-red-500/30',
    success: 'bg-green-900/20 border-green-500/30',
    info: 'bg-blue-900/20 border-blue-500/30',
  } as const

  const renderAction = (a: ModalAction) => {
    // Map old modal variants to valid button variants
    const validVariants = {
      primary: 'primary',
      secondary: 'secondary',
      ghost: 'ghost',
      danger: 'danger',
      outline: 'ghost', // Map outline to ghost as fallback
    } as const

    const buttonVariant = validVariants[a.variant as keyof typeof validVariants] || 'primary'

    return (
      <Button
        key={a.id || a.label}
        type={a.type || 'button'}
        variant={buttonVariant}
        size='md'
        onClick={e => {
          a.onClick?.(e)
          if (a.closeOnClick) onClose?.()
        }}
        disabled={a.disabled}
        loading={a.loading}
        icon={a.icon}
        data-autofocus={a.autoFocus || undefined}
        aria-label={a.label}
      >
        {a.label}
      </Button>
    )
  }

  const modalNode = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className='fixed inset-0 z-[1000] flex items-center justify-center p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className='absolute inset-0 bg-[var(--palette-primary-bg)]/80'
            onClick={() => {
              if (closeOnBackdrop) onClose?.()
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            role='dialog'
            aria-modal='true'
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            className={`relative w-full ${sizeClasses[size]} ${className}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div
              ref={contentRef}
              style={{ maxHeight }}
              className={`flex flex-col border border-[var(--palette-secondary-accent)]/30 rounded-2xl shadow-2xl overflow-hidden bg-[var(--palette-secondary-bg)]`}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className='flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-700'>
                  {icon && (
                    <div
                      className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--palette-primary-bg)] text-[var(--palette-primary-text)] ${variant !== 'default' ? variantClasses[variant] : ''}`}
                    >
                      {icon}
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    {title && (
                      <h2
                        id='modal-title'
                        className='text-base font-semibold text-[var(--palette-primary-text)] leading-tight truncate'
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id='modal-desc'
                        className='mt-1 text-sm text-[var(--palette-primary-text)]/70 leading-snug'
                      >
                        {description}
                      </p>
                    )}
                  </div>
                  {showClose && (
                    <Button
                      onClick={onClose}
                      variant='ghost'
                      size='sm'
                      className='p-2 text-[var(--palette-primary-text)]/70 hover:text-[var(--palette-primary-text)] hover:bg-[var(--palette-primary-bg)]'
                      aria-label='Cerrar'
                      icon={<XMarkIcon className='w-5 h-5' />}
                    />
                  )}
                </div>
              )}

              {/* Body */}
              <div className='px-5 pb-6 pt-2 overflow-y-auto custom-scrollbar text-sm text-[var(--palette-primary-text)]'>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className='p-6 pt-0 border-t border-gray-700 flex justify-end gap-3'>
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalNode, document.body)
}

/**
 * Simple hook wrapper to manage open state
 */
export interface UseModalReturn {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  openModal: () => void
  closeModal: () => void
  toggleModal: () => void
}

export const useModal = (initial = false): UseModalReturn => {
  const [open, setOpen] = React.useState(initial)
  const openModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])
  const toggleModal = useCallback(() => setOpen(o => !o), [])
  return { open, setOpen, openModal, closeModal, toggleModal }
}

export default Modal
