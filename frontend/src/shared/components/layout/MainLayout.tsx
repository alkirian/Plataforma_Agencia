import React from 'react'
import { Header } from './Header'
import { Toaster } from 'react-hot-toast'
import { useAppKeyboardShortcuts } from '@shared/hooks/useKeyboardShortcuts'
import { AIAssistantDock } from '@components/ai/AIAssistantDock.jsx'
import { ScheduleSidebar } from './ScheduleSidebar'

interface MainLayoutProps {
  children: React.ReactNode
  userEmail?: string
  onLogout?: () => void
  profile?: {
    id?: string
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  userEmail,
  onLogout,
  profile,
}) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts()

  return (
    // El fondo y el texto principal se definen aquÃ­
    <div className='min-h-screen use-new-palette keyboard-nav'>
      {/* Skip links for accessibility */}
      <a href='#main-content' className='skip-link'>
        Saltar al contenido principal
      </a>
      <a href='#navigation' className='skip-link'>
        Saltar a la navegaciÃ³n
      </a>

      <Header userEmail={userEmail} onLogout={onLogout} profile={profile} />
      <Toaster
        position='bottom-right'
        toastOptions={{
          style: {
            background: 'var(--palette-primary-bg)',
            color: 'var(--palette-primary-text)',
            border: '1px solid var(--palette-secondary-accent)',
          },
        }}
      />
      {/* Global content area: keep .app-content for AI dock margin adjustments, but move horizontal padding into an inner responsive container.
        This lets us increase side margins (centering) without affecting header/footer full width. */}
      <main id='main-content' className='app-content w-full py-8 px-0'>
        <div className='w-full mx-auto max-w-[1900px] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-8'>
          {children}
        </div>
      </main>

      <AIAssistantDock />
      <ScheduleSidebar />
    </div>
  )
}
