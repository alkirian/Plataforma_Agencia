import React from 'react';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

export const WelcomeEmptyState = ({ onActionClick }) => {
  return (
  <div className='text-center rounded-xl border border-dashed border-white/20 bg-surface-strong p-12'>
      <RocketLaunchIcon className='mx-auto h-12 w-12 text-rambla-text-secondary' />
  <h2 className='mt-4 text-xl font-semibold text-white'>¡Bienvenido a Cadence!</h2>
      <p className='mt-2 text-rambla-text-secondary'>
        Estás a un solo paso de empezar a organizar tu flujo de trabajo.
      </p>
      <button
        onClick={onActionClick}
        aria-label="Crear mi primer cliente"
        className="mt-6 inline-flex items-center gap-3 rounded-full px-5 py-3 font-semibold text-black
                   bg-gradient-to-r from-cyan-300 to-violet-400
                   shadow-[0_10px_30px_rgba(99,102,241,0.18)] hover:-translate-y-1 active:translate-y-0
                   focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-transform duration-150 glow-gold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Crear mi primer cliente</span>
      </button>
    </div>
  );
};
