import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { WelcomeEmptyState } from '../components/dashboard/WelcomeEmptyState.jsx';
import { ClientCreationModal } from '../components/dashboard/ClientCreationModal.jsx';
import { ActivityFeed } from '../components/dashboard/ActivityFeed.jsx';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // useQuery ahora devuelve un objeto, accedemos a la propiedad .data para el array
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Extraemos el array de clientes desde la respuesta
  const clients = response?.data || [];

  const createClientMutation = useMutation({
    mutationFn: payload =>
      toast.promise(createClient(payload), {
        loading: 'Creando cliente…',
        success: 'Cliente creado',
        error: e => e.message || 'No se pudo crear el cliente',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  if (isLoading)
    return <div className='text-center text-rambla-text-secondary'>Cargando clientes...</div>;
  if (isError) return <div className='text-center text-red-500'>Error: {error.message}</div>;

  return (
    <div className='space-y-8'>
      {/* Hero */}
      <section className='flex flex-col items-center text-center gap-4 py-4'>
        <div className='h-16 w-16 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-2xl font-bold text-white'>
          R
        </div>
        <div className='flex justify-center'>
          <button
            id='add-client-button'
            onClick={() => setIsModalOpen(true)}
            className='rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90'
          >
            + Añadir Cliente
          </button>
        </div>
      </section>

      {/* Separador */}
      <div className='relative'>
        <div className='mx-auto mb-6 h-px w-full border-t border-white/10' />
        <div className='-mt-4 mb-2 flex justify-center'>
          <span className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-rambla-text-secondary'>
            CLIENTES RECIENTES
          </span>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {clients.length === 0 ? (
        <WelcomeEmptyState onActionClick={() => setIsModalOpen(true)} />
      ) : (
        <motion.div
          layout
          className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        >
          <AnimatePresence>
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/clients/${client.id}`} className='group block'>
                  <div className='rounded-xl border border-white/10 bg-glow-card-bg p-5 backdrop-blur-lg shadow-lg transition-all duration-300 ease-in-out hover:!border-glow-cyan hover:scale-105 hover:shadow-glow-cyan/20'>
                    <div className='mb-2 text-[10px] uppercase tracking-wider text-white/60'>
                      Team
                    </div>
                    <h3 className='font-bold text-white'>{client.name}</h3>
                    <p className='text-sm text-rambla-text-secondary'>
                      {client.industry || 'Sin industria'}
                    </p>
                    <div className='mt-3 flex -space-x-2'>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className='h-6 w-6 rounded-full border border-white/10 bg-white/10'
                        />
                      ))}
                      {clients.length > 4 && (
                        <div className='ml-2 text-xs text-white/60'>
                          +{Math.max(0, clients.length - 4)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ClientCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={payload => createClientMutation.mutate(payload)}
        isSubmitting={createClientMutation.isPending}
      />

      {/* Activity feed under the clients section */}
      <ActivityFeed />
    </div>
  );
};
