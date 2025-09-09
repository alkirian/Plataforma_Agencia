import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const AnchorPopover = ({
  trigger,
  children,
  className = '',
  placement = 'bottom-start',
  offset: offsetValue = 8,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Determine position classes based on placement
  const getPositionClasses = () => {
    switch (placement) {
      case 'bottom-start':
        return 'top-full left-0 mt-1'
      case 'bottom-end':
        return 'top-full right-0 mt-1'
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1'
      case 'top-start':
        return 'bottom-full left-0 mb-1'
      case 'top-end':
        return 'bottom-full right-0 mb-1'
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1'
      default:
        return 'top-full left-0 mt-1'
    }
  }

  return (
    <div className='relative inline-block'>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className='cursor-pointer'>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 ${getPositionClasses()} ${className}`}
            style={{ minWidth: '200px' }}
            {...props}
          >
            <div className='bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden'>
              {typeof children === 'function'
                ? children({ close: () => setIsOpen(false) })
                : children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
