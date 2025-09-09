// DocumentContextMenu.jsx - Context menu component for documents
import React from 'react'
import { motion } from 'framer-motion'
import {
  EyeIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  StarIcon,
  PencilIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

const DocumentContextMenu = ({ x, y, document, onAction, onClose }) => {
  const menuRef = React.useRef()

  React.useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const menuItems = [
    { icon: EyeIcon, label: 'Preview', action: 'preview' },
    { icon: ArrowDownTrayIcon, label: 'Download', action: 'download' },
    { icon: LinkIcon, label: 'Copy Link', action: 'copy-link' },
    { divider: true },
    {
      icon: document?.isPinned && document.isPinned() ? StarIcon : StarIconSolid,
      label: document?.isPinned && document.isPinned() ? 'Unpin' : 'Pin',
      action: 'toggle-pin',
    },
    { icon: PencilIcon, label: 'Rename', action: 'rename' },
    { icon: ClockIcon, label: 'View Versions', action: 'versions' },
    { divider: true },
    {
      icon: document?.deletedAt ? ArrowPathIcon : TrashIcon,
      label: document?.deletedAt ? 'Restore' : 'Delete',
      action: document?.deletedAt ? 'restore' : 'delete',
      danger: !document?.deletedAt,
    },
  ]

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='fixed z-50 bg-white rounded-lg shadow-lg border border-border-muted py-1 min-w-[160px]'
      style={{
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 300),
      }}
    >
      {menuItems.map((item, index) =>
        item.divider ? (
          <MenuDivider key={index} />
        ) : (
          <MenuItem
            key={index}
            item={item}
            document={document}
            onAction={onAction}
          />
        )
      )}
    </motion.div>
  )
}

const MenuDivider = () => (
  <div className='border-t border-border-muted my-1' />
)

const MenuItem = ({ item, document, onAction }) => (
  <button
    onClick={() => onAction(item.action, document)}
    className={`
      w-full flex items-center px-3 py-2 text-sm text-left hover:bg-surface-soft transition-colors
      ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-text-primary'}
    `}
  >
    <item.icon className='h-4 w-4 mr-3' />
    {item.label}
  </button>
)

export default DocumentContextMenu