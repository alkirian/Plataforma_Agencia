import React, { Suspense, lazy } from 'react'
import { LoadingPage } from '@components/ui/LoadingSpinner'

/**
 * Lazy load the AuthPage component for better performance
 */
const AuthPage = lazy(() => import('./AuthPage'))

/**
 * Props for WelcomePage component
 */
export interface WelcomePageProps {
  onAuthSuccess?: () => void
  redirectTo?: string
}

/**
 * WelcomePage Component
 *
 * A wrapper component that lazy loads the AuthPage.
 * Provides a loading state while the auth component is being loaded.
 *
 * This separation allows for:
 * - Better code splitting
 * - Improved initial load performance
 * - Clean separation of concerns
 */
export const WelcomePage: React.FC<WelcomePageProps> = ({ onAuthSuccess, redirectTo }) => {
  return (
    <Suspense
      fallback={
        <LoadingPage
          title='Cargando página...'
          description='Preparando la experiencia de bienvenida'
        />
      }
    >
      <AuthPage onSuccess={onAuthSuccess} redirectTo={redirectTo} />
    </Suspense>
  )
}

export default WelcomePage
