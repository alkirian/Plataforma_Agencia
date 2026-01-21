declare module '@heroui/react' {
  import type { ReactNode, ReactElement, MouseEvent } from 'react'

  export interface DropdownProps {
    children: ReactNode
    isOpen?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    placement?: string
    closeOnSelect?: boolean
    className?: string
  }

  export interface DropdownTriggerProps {
    children: ReactElement
  }

  export interface DropdownMenuProps {
    children: ReactNode
    className?: string
    closeOnSelect?: boolean
  }

  export type DropdownItemColor = 'default' | 'danger'

  export interface DropdownItemProps {
    children: ReactNode
    startContent?: ReactNode
    className?: string
    color?: DropdownItemColor
    isReadOnly?: boolean
    onClick?: (event: MouseEvent<HTMLElement>) => void
    onPress?: (event: MouseEvent<HTMLElement>) => void
  }

  export const Dropdown: (props: DropdownProps) => ReactElement
  export const DropdownTrigger: (props: DropdownTriggerProps) => ReactElement | null
  export const DropdownMenu: (props: DropdownMenuProps) => ReactElement
  export const DropdownItem: (props: DropdownItemProps) => ReactElement

  const _default: {
    Dropdown: typeof Dropdown
    DropdownTrigger: typeof DropdownTrigger
    DropdownMenu: typeof DropdownMenu
    DropdownItem: typeof DropdownItem
  }

  export default _default
}
