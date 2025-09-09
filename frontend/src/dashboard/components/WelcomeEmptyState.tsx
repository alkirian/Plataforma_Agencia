import React from 'react'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'
import { Plus } from 'lucide-react'
import { Button } from '@components/ui/Button'
import type { WelcomeEmptyStateProps } from '../../shared/types'

export const WelcomeEmptyState: React.FC<WelcomeEmptyStateProps> = ({
  onCreateClient,
  userName,
}) => {
  return (
    <div className='text-center rounded-xl border border-dashed border-white/20 bg-surface-strong p-12'>
      <RocketLaunchIcon className='mx-auto h-12 w-12 text-rambla-text-secondary' />
      <h2 className='mt-4 text-xl font-semibold text-white'>
        {userName ? `¡Bienvenido a Cadence, ${userName}!` : '¡Bienvenido a Cadence!'}
      </h2>
      <p className='mt-2 text-rambla-text-secondary'>
        Estás a un solo paso de empezar a organizar tu flujo de trabajo.
      </p>
      <Button
        onClick={onCreateClient}
        variant='primary'
        size='lg'
        icon={<Plus className='w-5 h-5' />}
        aria-label='Crear mi primer cliente'
        className='mt-6 rounded-full font-semibold text-black
                   bg-gradient-to-r from-cyan-300 to-violet-400
                   shadow-[0_10px_30px_rgba(99,102,241,0.18)] hover:-translate-y-1 active:translate-y-0
                   focus:ring-4 focus:ring-cyan-200 transition-transform duration-150 glow-gold
                   hover:bg-none focus:bg-none'
        cyber={false}
      >
        Crear mi primer cliente
      </Button>
    </div>
  )
}
