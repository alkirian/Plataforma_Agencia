import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('q') || '';
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'date', 'industry'
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const sortRef = React.useRef(null);

  React.useEffect(() => {
    const onClickOutside = (e) => {
      if (isSortOpen && sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isSortOpen]);

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
  <div className='h-16 w-16 rounded-full border border-[color:var(--color-border-subtle)] bg-surface-soft flex items-center justify-center text-2xl font-bold text-text-primary'>
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
          {/* Nota: la búsqueda ahora está en el header (modal). */}

          {/* Contador (el control de orden ahora vive junto al grid) */}
          <div className='text-sm text-text-muted text-center'>
            {filteredAndSortedClients.length} de {allClients.length} clientes
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

      {/* Barra del grid: ordenación sutil */}
      {allClients.length > 0 && (
        <div className='mx-auto max-w-7xl flex items-center justify-end px-4 sm:px-0'>
          <div className='relative' ref={sortRef}>
            <button
              type='button'
              onClick={() => setIsSortOpen(v => !v)}
              className='inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors'
              aria-haspopup='listbox'
              aria-expanded={isSortOpen}
              aria-label='Cambiar orden de clientes'
            >
              <ArrowsUpDownIcon className='h-4 w-4' />
              <span className='hidden sm:inline'>Ordenar: {sortBy === 'name' ? 'Nombre' : sortBy === 'date' ? 'Fecha' : 'Industria'}</span>
              <span className='sm:hidden'>Orden</span>
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className='absolute right-0 z-10 mt-2 w-44 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-strong shadow-xl overflow-hidden'
                  role='listbox'
                >
                  {[
                    { value: 'name', label: 'Nombre' },
                    { value: 'date', label: 'Fecha agregado' },
                    { value: 'industry', label: 'Industria' },
                  ].map(opt => (
                    <li key={opt.value}>
                      <button
                        type='button'
                        onClick={() => { setSortBy(opt.value); setIsSortOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          sortBy === opt.value ? 'bg-surface-soft text-text-primary' : 'text-text-muted hover:bg-surface-soft hover:text-text-primary'
                        }`}
                        role='option'
                        aria-selected={sortBy === opt.value}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

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
            onClick={() => navigate('/dashboard')}
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
                  <div className='card-cyber rounded-xl p-6 transition-all duration-300 ease-in-out hover:-translate-y-0.5'>
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
                          <span className='text-gray-400'>
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
