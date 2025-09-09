import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AUTH_ANIMATIONS } from '../constants/auth.constants'

/**
 * Props for AuthFormContainer component
 */
export interface AuthFormContainerProps {
  children: React.ReactNode
  title: string
  subtitle: string
  animationKey?: string
  className?: string
}

/**
 * Reusable Auth Form Container Component
 * Provides consistent layout and animations for auth forms
 */
export const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  children,
  title,
  subtitle,
  animationKey,
  className = '',
}) => {
  const content = (
    <div className={className}>
      {/* Header */}
      <div className='mb-6 text-center'>
        <h1 className='text-2xl font-bold text-text-primary mb-2'>{title}</h1>
        <p className='text-text-muted'>{subtitle}</p>
      </div>

      {/* Form Content */}
      {children}
    </div>
  )

  // If animationKey is provided, wrap in motion.div
  if (animationKey) {
    return (
      <AnimatePresence mode='wait'>
        <motion.div
          key={animationKey}
          initial={AUTH_ANIMATIONS.FORM_TRANSITION.initial}
          animate={AUTH_ANIMATIONS.FORM_TRANSITION.animate}
          exit={AUTH_ANIMATIONS.FORM_TRANSITION.exit}
          transition={AUTH_ANIMATIONS.FORM_TRANSITION.transition}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  return content
}

export default AuthFormContainer
