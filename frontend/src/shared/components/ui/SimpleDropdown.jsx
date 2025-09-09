import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const SimpleDropdown = ({
  trigger,
  children,
  className = '',
  align = 'left',
  offset = 8,
  autoPosition = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ direction: 'down', align })
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)

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

  const calculatePosition = () => {
    if (!triggerRef.current || !autoPosition) {
      setPosition({ direction: 'down', align })
      return
    }

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Calculate available space below and above
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    // Calculate available space left and right
    const spaceRight = viewportWidth - triggerRect.right
    const spaceLeft = triggerRect.left

    // Determine vertical direction (need at least 200px for dropdown)
    const direction = spaceBelow >= 200 ? 'down' : spaceAbove >= 200 ? 'up' : 'down'

    // Determine horizontal alignment
    let horizontalAlign = align
    if (align === 'left' && spaceRight < 280) {
      horizontalAlign = 'right'
    } else if (align === 'right' && spaceLeft < 280) {
      horizontalAlign = 'left'
    }

    setPosition({ direction, align: horizontalAlign })
  }

  const toggleDropdown = () => {
    if (!isOpen) {
      calculatePosition()
    }
    setIsOpen(!isOpen)
  }

  const closeDropdown = () => {
    setIsOpen(false)
  }

  return (
    <div className='relative inline-block'>
      <div ref={triggerRef} onClick={toggleDropdown} className='cursor-pointer'>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 ${
              position.direction === 'up' ? `mb-${offset} bottom-full` : `mt-${offset} top-full`
            } ${position.align === 'right' ? 'right-0' : 'left-0'} ${className}`}
            style={{
              minWidth: '280px',
              maxWidth: '400px',
              maxHeight: '500px',
            }}
          >
            <div className='bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden'>
              {typeof children === 'function' ? children({ onClose: closeDropdown }) : children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
