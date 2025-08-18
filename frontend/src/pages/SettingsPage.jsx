import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal';
import { CyberButton } from '../components/ui/Button';

export const SettingsPage = () => {
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold text-white'>Configuración</h1>
      
      {/* Perfil de Usuario */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <h2 className='text-xl font-semibold text-white'>Perfil de Usuario</h2>
        <p className='mt-2 text-rambla-text-secondary'>
          Próximamente: Aquí podrás editar tu nombre y otros detalles de tu perfil.
        </p>
      </div>

      {/* Atajos de Teclado */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <div className="flex items-center justify-between">
          <div>
            <h2 className='text-xl font-semibold text-white flex items-center gap-3'>
              <CommandLineIcon className="h-6 w-6 text-primary-400" />
              Atajos de Teclado
            </h2>
            <p className='mt-2 text-rambla-text-secondary'>
              Consulta y aprende todos los atajos de teclado disponibles para navegar más rápidamente.
            </p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CyberButton
              onClick={() => setIsKeyboardModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <CommandLineIcon className="h-4 w-4" />
              Ver Atajos
            </CyberButton>
          </motion.div>
        </div>
      </div>

      {/* Gestión de la Agencia */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <h2 className='text-xl font-semibold text-white'>Gestión de la Agencia</h2>
        <p className='mt-2 text-rambla-text-secondary'>
          Próximamente: Aquí podrás cambiar el nombre de tu agencia e invitar a nuevos miembros.
        </p>
      </div>

      {/* Modal de Atajos de Teclado */}
      <KeyboardShortcutsModal 
        isOpen={isKeyboardModalOpen} 
        onClose={() => setIsKeyboardModalOpen(false)} 
      />
    </div>
  );
};
