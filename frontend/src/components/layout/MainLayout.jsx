import React from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MainLayout = ({ children, userEmail, profile, onLogout }) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts();

  return (
    // Estructura de pantalla completa con Sidebar lateral izquierdo (look Cadence)
    <div className='flex h-screen w-screen overflow-hidden bg-app text-text-primary font-sans keyboard-nav'>
      {/* Sidebar de navegación y lista de clientes de Supabase */}
      <Sidebar userEmail={userEmail} profile={profile} onLogout={onLogout} />

      {/* Área del contenedor principal y vistas */}
      <div className='flex-1 flex flex-col h-screen overflow-hidden relative'>
        <Toaster
          position='bottom-right'
          toastOptions={{
            style: {
              background: 'var(--color-surface-soft)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '14px',
              fontFamily: 'inherit',
              fontSize: '13px',
            },
          }}
        />
        <main id='main-content' className='flex-1 overflow-y-auto w-full'>
          {children}
        </main>
      </div>
    </div>
  );
};
