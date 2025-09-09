import React from 'react'
import { AUTH_STYLES, AUTH_UI_TEXT } from '../constants/auth.constants'

/**
 * Props for EmailDisplay component
 */
export interface EmailDisplayProps {
  email: string
  onChangeEmail?: () => void
  showChangeButton?: boolean
  label?: string
  className?: string
}

/**
 * Reusable Email Display Component
 * Shows a non-editable email field with optional change button
 */
export const EmailDisplay: React.FC<EmailDisplayProps> = ({
  email,
  onChangeEmail,
  showChangeButton = true,
  label = AUTH_UI_TEXT.EMAIL_LABEL,
  className = '',
}) => {
  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-2'>
        <span className={AUTH_STYLES.LABEL_TEXT}>{label}</span>
        {showChangeButton && onChangeEmail && (
          <button
            type='button'
            onClick={onChangeEmail}
            className='text-xs text-[color:var(--color-accent-blue)] hover:underline focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30 rounded px-1'
            aria-label='Change email address'
          >
            {AUTH_UI_TEXT.CHANGE_EMAIL}
          </button>
        )}
      </div>
      <div
        className={AUTH_STYLES.DISABLED_FIELD}
        aria-label='Current email address'
        role='textbox'
        aria-readonly='true'
      >
        {email}
      </div>
    </div>
  )
}

export default EmailDisplay
