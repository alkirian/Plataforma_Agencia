import React from 'react';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

export const WelcomeEmptyState = ({ onActionClick }) => {
  return (
    <div className="text-center rounded-xl border border-dashed border-white/20 bg-glow-card-bg p-12 backdrop-blur-lg">
      <RocketLaunchIcon className="mx-auto h-12 w-12 text-rambla-text-secondary" />
      <h2 className="mt-4 text-xl font-semibold text-white">¡Bienvenido a Rambla!</h2>
      <p className="mt-2 text-rambla-text-secondary">Estás a un solo paso de empezar a organizar tu flujo de trabajo.</p>
      <button onClick={onActionClick} className="mt-6 rounded-md bg-glow-cyan px-4 py-2 font-semibold text-black transition hover:opacity-90">
        Crear mi primer cliente
      </button>
    </div>
  );
};
