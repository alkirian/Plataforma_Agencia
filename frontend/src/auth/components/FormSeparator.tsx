import React from 'react'
import { AUTH_STYLES, AUTH_UI_TEXT } from '../constants/auth.constants'

/**
 * Props for FormSeparator component
 */
export interface FormSeparatorProps {
  text?: string
  className?: string
}

/**
 * Reusable Form Separator Component
 * Shows a horizontal line with centered text
 */
export const FormSeparator: React.FC<FormSeparatorProps> = ({
  text = AUTH_UI_TEXT.OR_SEPARATOR,
  className = 'my-6',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className='absolute inset-0 flex items-center'>
        <span className={AUTH_STYLES.SEPARATOR_LINE} />
      </div>
      <div className='relative flex justify-center text-xs'>
        <span className='bg-surface-strong px-3 text-text-muted'>{text}</span>
      </div>
    </div>
  )
}

export default FormSeparator
