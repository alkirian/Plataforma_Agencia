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
            background: 'rgba(15,23,42,0.95)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-subtle)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          },
          // Configuración responsive
          className: 'smart-toast',
          duration: 4000,
          // Configuración por tipo
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
        // Nota: containerStyle no soporta @media; usamos estilos globales/Tailwind para responsive
      />
    <main id="main-content" className='w-full py-8 px-6'>
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
};
