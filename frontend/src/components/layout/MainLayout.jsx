import React from 'react';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MainLayout = ({ children, userEmail, profile, onLogout }) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts();

  return (
    // El fondo y el texto principal se definen aquí
    <div className='min-h-screen bg-app text-text-primary keyboard-nav'>
      <Header userEmail={userEmail} profile={profile} onLogout={onLogout} />
      <Toaster
        position='bottom-right'
        toastOptions={{
          style: {
            background: 'var(--color-surface-strong)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-subtle)',
          },
        }}
      />
      <main id="main-content" className='w-full py-3 px-4 md:px-6'>
        {children}
      </main>
    </div>
  );
};
