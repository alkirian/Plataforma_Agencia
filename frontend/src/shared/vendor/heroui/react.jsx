import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react'
import clsx from 'clsx'

const DropdownContext = createContext(null)

function useDropdownContext(component) {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error(`${component} must be used within a Dropdown`)
  }
  return context
}

export function Dropdown({
  children,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-end',
  closeOnSelect = true,
  className,
  ...rest
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen

  const setOpen = useCallback(
    next => {
      if (typeof isOpen !== 'boolean') {
        setInternalOpen(next)
      }
      if (typeof onOpenChange === 'function') {
        onOpenChange(next)
      }
    },
    [isOpen, onOpenChange]
  )

  const containerRef = useRef(null)

  const contextValue = useMemo(
    () => ({ open, setOpen, closeOnSelect }),
    [open, setOpen, closeOnSelect]
  )

  useEffect(() => {
    if (!open) return
    const handlePointerDown = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen])

  return (
    <DropdownContext.Provider value={contextValue}>
      <div ref={containerRef} className={clsx('relative inline-flex', className)} data-placement={placement} {...rest}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownTrigger({ children }) {
  const { open, setOpen } = useDropdownContext('DropdownTrigger')

  if (!isValidElement(children)) {
    return null
  }

  const handleClick = event => {
    if (typeof children.props.onClick === 'function') {
      children.props.onClick(event)
    }
    if (event.defaultPrevented) return
    setOpen(!open)
  }

  return cloneElement(children, {
    'aria-haspopup': true,
    'aria-expanded': open,
    onClick: handleClick,
  })
}

export function DropdownMenu({ children, className, closeOnSelect, ...rest }) {
  const context = useDropdownContext('DropdownMenu')
  const shouldCloseOnSelect =
    typeof closeOnSelect === 'boolean' ? closeOnSelect : context.closeOnSelect

  const menuClassName = clsx(
    'absolute z-30 mt-2 min-w-[12rem] rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft/95 shadow-xl backdrop-blur-sm focus:outline-none',
    !context.open && 'hidden',
    className
  )

  return (
    <DropdownContext.Provider value={{ ...context, closeOnSelect: shouldCloseOnSelect }}>
      <div role='menu' className={menuClassName} {...rest}>
        {Children.map(children, child =>
          isValidElement(child)
            ? cloneElement(child, {
                __herouiCloseMenu: () => context.setOpen(false),
              })
            : child
        )}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownItem({
  children,
  startContent,
  className,
  color = 'default',
  isReadOnly = false,
  onClick,
  onPress,
  __herouiCloseMenu,
  ...rest
}) {
  const { closeOnSelect } = useDropdownContext('DropdownItem')

  const handleClick = event => {
    if (typeof onClick === 'function') {
      onClick(event)
    }
    if (event.defaultPrevented) return
    if (typeof onPress === 'function') {
      onPress(event)
    }
    if (event.defaultPrevented) return
    if (!isReadOnly && closeOnSelect !== false && typeof __herouiCloseMenu === 'function') {
      __herouiCloseMenu()
    }
  }

  const colorClass =
    color === 'danger'
      ? 'text-[color:var(--theme-status-error)] hover:bg-[color:var(--theme-status-error)]/10'
      : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'

  return (
    <button
      type='button'
      role='menuitem'
      className={clsx(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        colorClass,
        isReadOnly && 'cursor-default opacity-70',
        className
      )}
      onClick={handleClick}
      disabled={isReadOnly}
      {...rest}
    >
      {startContent && <span className='inline-flex items-center'>{startContent}</span>}
      <span className='flex-1 text-left'>{children}</span>
    </button>
  )
}

export default {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
}
