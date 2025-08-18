import React from 'react';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from 'react-hot-toast';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MainLayout = ({ children, userEmail, onLogout }) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts();

  return (
    // El fondo y el texto principal se definen aquí
  <div className='min-h-screen bg-app text-text-primary keyboard-nav'>
      {/* Skip links for accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#navigation" className="skip-link">
        Saltar a la navegación
      </a>
      
      <Header userEmail={userEmail} onLogout={onLogout} />
      <Toaster
        position='bottom-right'
        toastOptions={{
          style: {
      background: 'rgba(15,23,42,0.85)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-subtle)',
          },
        }}
      />
    <main id="main-content" className='w-full py-8 px-6'>
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
};
