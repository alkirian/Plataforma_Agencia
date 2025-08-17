import React from 'react';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from 'react-hot-toast';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MainLayout = ({ children, userEmail, onLogout }) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts();

  return (
    // El fondo y el texto principal se definen aquí
    <div className='min-h-screen bg-glow-bg-end text-rambla-text-primary'>
      <Header userEmail={userEmail} onLogout={onLogout} />
      <Toaster
        position='bottom-right'
        toastOptions={{
          style: {
            background: '#0b1220',
            color: '#c9d1d9',
            border: '1px solid #30363d',
          },
        }}
      />
      <main className='w-full py-6 px-5'>
        <Breadcrumbs />
        {children}
      </main>
      
      {/* Modal de atajos de teclado */}
      <KeyboardShortcutsModal />
    </div>
  );
};
