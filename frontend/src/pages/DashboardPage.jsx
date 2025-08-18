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
import { LoadingCard, ErrorCard, Tooltip, HelpTooltip } from '../components/ui/index.js';
import { useUIState } from '../hooks/useUIState.js';

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

  // Obtener estadísticas de todos los clientes - memoizar clientIds
  const clientIds = React.useMemo(() => 
    allClients.map(client => client.id), 
    [allClients]
  );
  const { statsMap } = useMultipleClientStats(clientIds);

  // Filtrar y ordenar clientes - memoizado
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
    return <LoadingCard title="Cargando clientes..." description="Obteniendo la lista de tus clientes" />;
  if (isError) 
    return <ErrorCard title="Error al cargar clientes" message={error.message} onRetry={() => window.location.reload()} />;

  return (
    <div className='space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      {/* Hero */}
      <section className='flex flex-col items-center text-center gap-4 py-4 px-4 sm:px-0'>
        <div className='h-16 w-16 rounded-full border border-[color:var(--color-border-subtle)] bg-surface-soft backdrop-blur flex items-center justify-center text-2xl font-bold text-text-primary'>
          R
        </div>
        <div className='flex justify-center'>
          <Tooltip content="Crear un nuevo cliente para gestionar sus proyectos (Ctrl+N)" side="bottom">
            <button
              id='add-client-button'
              onClick={() => setIsModalOpen(true)}
              className='btn-cyber px-6 py-3 text-sm font-semibold hover-cyber-glow min-h-[44px] touch-target'
              aria-label="Abrir modal para añadir nuevo cliente"
            >
              + Añadir Cliente
            </button>
          </Tooltip>
        </div>
      </section>

      {/* Búsqueda y filtros */}
  {allClients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mx-auto max-w-2xl space-y-4 px-4 sm:px-0'
        >
          {/* Barra de búsqueda */}
          <div className='relative'>
            <MagnifyingGlassIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
            <Tooltip content="Busca por nombre de cliente o industria. Usa '/' para enfocar rápidamente" side="top">
              <input
                type='text'
                placeholder='Buscar clientes por nombre o industria...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft py-3 pl-10 pr-4 text-text-primary placeholder-text-muted backdrop-blur-sm transition-all focus:border-[color:var(--color-border-strong)] focus:outline-none min-h-[44px] text-base sm:text-sm'
                aria-label="Buscar clientes por nombre o industria"
                role="searchbox"
              />
            </Tooltip>
          </div>

          {/* Filtros */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'>
            <div className='flex items-center space-x-2'>
              <FunnelIcon className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-400'>Ordenar por:</span>
              <Tooltip content="Cambia el orden de visualización de los clientes" side="top">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className='rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary backdrop-blur-sm focus:border-[color:var(--color-border-strong)] focus:outline-none min-h-[44px]'
                  aria-label="Ordenar clientes por"
                >
                  <option value='name'>Nombre</option>
                  <option value='date'>Fecha agregado</option>
                  <option value='industry'>Industria</option>
                </select>
              </Tooltip>
            </div>
            
            <div className='text-sm text-text-muted'>
              {filteredAndSortedClients.length} de {allClients.length} clientes
            </div>
          </div>
        </motion.div>
      )}

      {/* Separador */}
      <div className='relative'>
        <div className='mx-auto max-w-7xl mb-6 h-px w-full border-t border-[color:var(--color-border-subtle)]' />
        <div className='-mt-4 mb-2 flex justify-center'>
          <span className='rounded-full border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-1 text-xs tracking-wide text-text-muted'>
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
            className='text-[color:var(--color-accent-blue)] hover:underline text-sm'
          >
            Limpiar búsqueda
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto max-w-7xl justify-center'
          role="list"
          aria-label="Lista de clientes"
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
                role="listitem"
              >
                <Link 
                  to={`/clients/${client.id}`} 
                  className='group block'
                  aria-label={`Ver detalles del cliente ${client.name}${client.industry ? ` - ${client.industry}` : ''}`}
                >
                  <div className='card rounded-xl p-5 transition-all duration-300 ease-in-out hover:scale-105'>
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='text-[10px] uppercase tracking-wider text-text-muted'>
                        Cliente
                      </div>
                      {statsMap[client.id] && (
                        <Tooltip content={`Progreso: ${statsMap[client.id].stats.completed} completadas de ${statsMap[client.id].stats.total} tareas`}>
                          <div>
                            <ProgressBadge 
                              percentage={statsMap[client.id].stats.percentage}
                              total={statsMap[client.id].stats.total}
                            />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                    
                    <h3 className='font-bold text-text-primary mb-1'>{client.name}</h3>
                    <p className='text-sm text-text-muted mb-3'>
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
                          <span className='text-text-muted'>
                          {statsMap[client.id].stats.total} tareas
                        </span>
                      </div>
                    ) : (
                      <div className='text-xs text-text-muted italic'>
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
