import React from 'react';

export const SettingsPage = () => {
  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold text-white'>Configuración</h1>
      <div className='rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg'>
        <h2 className='text-xl font-semibold text-white'>Perfil de Usuario</h2>
        <p className='mt-2 text-rambla-text-secondary'>
          Próximamente: Aquí podrás editar tu nombre y otros detalles de tu perfil.
        </p>
      </div>
      <div className='rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg'>
        <h2 className='text-xl font-semibold text-white'>Gestión de la Agencia</h2>
        <p className='mt-2 text-rambla-text-secondary'>
          Próximamente: Aquí podrás cambiar el nombre de tu agencia e invitar a nuevos miembros.
        </p>
      </div>
    </div>
  );
};
