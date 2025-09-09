import React from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { AnchorPopover } from '@shared/components/ui'
import { UserProfileContent } from './UserProfileContent'

export const SettingsMenu = ({ userEmail, profile }) => {
  return (
    <AnchorPopover
      trigger={
        <button
          className='icon-btn p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
          title='Ajustes rápidos'
          aria-label='Ajustes rápidos'
        >
          <SettingsIcon className='h-5 w-5' aria-hidden='true' />
        </button>
      }
      placement='bottom-end'
    >
      {({ close }) => (
        <UserProfileContent userEmail={userEmail} profile={profile} onClose={close} />
      )}
    </AnchorPopover>
  )
}

export default SettingsMenu
