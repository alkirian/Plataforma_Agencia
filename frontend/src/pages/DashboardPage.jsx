import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { WelcomeEmptyState } from '../components/dashboard/WelcomeEmptyState.jsx';
import { ClientCreationModal } from '../components/dashboard/ClientCreationModal.jsx';
import { ActivityFeed } from '../components/dashboard/ActivityFeed.jsx';
import { useMultipleClientStats } from '../hooks/useClientStats.js';
import { ProgressBadge } from '../components/ui/ProgressIndicator.jsx';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'date', 'industry'

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
  const allClients = response?.data || [];

  // Obtener estadísticas de todos los clientes
  const clientIds = allClients.map(client => client.id);
  const { statsMap } = useMultipleClientStats(clientIds);

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = React.useMemo(() => {
    let filtered = allClients;

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client => 
        client.name?.toLowerCase().includes(term) ||
        client.industry?.toLowerCase().includes(term)
      );
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'industry':
          return (a.industry || '').localeCompare(b.industry || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [allClients, searchTerm, sortBy]);

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

      {/* Búsqueda y filtros */}
      {allClients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mx-auto max-w-2xl space-y-4'
        >
          {/* Barra de búsqueda */}
          <div className='relative'>
            <MagnifyingGlassIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Buscar clientes por nombre o industria...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-rambla-accent focus:outline-none focus:ring-1 focus:ring-rambla-accent'
            />
          </div>

          {/* Filtros */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <FunnelIcon className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-400'>Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className='rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white backdrop-blur-sm focus:border-rambla-accent focus:outline-none'
              >
                <option value='name'>Nombre</option>
                <option value='date'>Fecha agregado</option>
                <option value='industry'>Industria</option>
              </select>
            </div>
            
            <div className='text-sm text-gray-400'>
              {filteredAndSortedClients.length} de {allClients.length} clientes
            </div>
          </div>
        </motion.div>
      )}

      {/* Separador */}
      <div className='relative'>
        <div className='mx-auto mb-6 h-px w-full border-t border-white/10' />
        <div className='-mt-4 mb-2 flex justify-center'>
          <span className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-rambla-text-secondary'>
            {searchTerm ? 'RESULTADOS DE BÚSQUEDA' : 'CLIENTES RECIENTES'}
          </span>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {allClients.length === 0 ? (
        <WelcomeEmptyState onActionClick={() => setIsModalOpen(true)} />
      ) : filteredAndSortedClients.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center py-12'
        >
          <MagnifyingGlassIcon className='mx-auto h-12 w-12 text-gray-400 mb-4' />
          <p className='text-gray-400 text-lg mb-2'>No se encontraron clientes</p>
          <p className='text-gray-500 text-sm mb-4'>
            Intenta con un término de búsqueda diferente
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className='text-rambla-accent hover:underline text-sm'
          >
            Limpiar búsqueda
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        >
          <AnimatePresence>
            {filteredAndSortedClients.map((client, index) => (
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
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='text-[10px] uppercase tracking-wider text-white/60'>
                        Cliente
                      </div>
                      {statsMap[client.id] && (
                        <ProgressBadge 
                          percentage={statsMap[client.id].stats.percentage}
                          total={statsMap[client.id].stats.total}
                        />
                      )}
                    </div>
                    
                    <h3 className='font-bold text-white mb-1'>{client.name}</h3>
                    <p className='text-sm text-rambla-text-secondary mb-3'>
                      {client.industry || 'Sin industria'}
                    </p>

                    {/* Estadísticas rápidas */}
                    {statsMap[client.id]?.hasEvents ? (
                      <div className='flex items-center justify-between text-xs'>
                        <div className='flex space-x-3'>
                          <span className='text-green-400'>
                            ✓ {statsMap[client.id].stats.completed}
                          </span>
                          <span className='text-blue-400'>
                            ⟳ {statsMap[client.id].stats.inProgress}
                          </span>
                          <span className='text-orange-400'>
                            ◯ {statsMap[client.id].stats.pending}
                          </span>
                        </div>
                        <span className='text-gray-500'>
                          {statsMap[client.id].stats.total} tareas
                        </span>
                      </div>
                    ) : (
                      <div className='text-xs text-gray-500 italic'>
                        Sin tareas programadas
                      </div>
                    )}
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
