import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient, updateClientCardColor, updateClient, deleteClient } from '../api/clients.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ArrowsUpDownIcon, 
  SwatchIcon, 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon, 
  FolderIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { WelcomeEmptyState } from '../components/dashboard/WelcomeEmptyState.jsx';
import { ClientCreationModal } from '../components/dashboard/ClientCreationModal.jsx';
import { MemberInvitationModal } from '../components/dashboard/MemberInvitationModal.jsx';
import { ActivityFeed } from '../components/dashboard/ActivityFeed.jsx';
import { useMultipleClientStats } from '../hooks/useClientStats.js';
import { ProgressBadge } from '../components/ui/ProgressIndicator.jsx';
import { LoadingCard, ErrorCard, Tooltip, HelpTooltip, ClientCardSkeleton } from '../components/ui/index.js';
import { useUIState } from '../hooks/useUIState.js';


const CARD_COLOR_OPTIONS = [
  '#8FA89B',
  '#9BA1BA',
  '#BA9B9D',
  '#BAAFA1',
  '#7FA7C7',
  '#A7A37A',
  '#C18C72',
  '#8D86B8',
];

const DEFAULT_CARD_COLOR = '#222024';

const hexToRgba = (hex, alpha) => {
  const normalized = hex?.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized || '')) return `rgba(34, 32, 36, ${alpha})`;

  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getClientCardColor = client => client.brand_info?.card_color || DEFAULT_CARD_COLOR;

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = React.useState(false);
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('q') || '';
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'date', 'industry'
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [colorPickerClientId, setColorPickerClientId] = React.useState(null);
  const [activeMenuClientId, setActiveMenuClientId] = React.useState(null);
  const [editingClient, setEditingClient] = React.useState(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = React.useState(null);
  const sortRef = React.useRef(null);

  React.useEffect(() => {
    const onClickOutside = (e) => {
      if (activeMenuClientId && !e.target.closest('.client-menu-container')) {
        setActiveMenuClientId(null);
        setColorPickerClientId(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [activeMenuClientId]);


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

  // Obtener estadísticas de todos los clientes de forma instantánea en memoria
  const { statsMap } = useMultipleClientStats(allClients);

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

  const updateCardColorMutation = useMutation({
    mutationFn: ({ clientId, color }) => updateClientCardColor(clientId, color),
    onMutate: async ({ clientId, color }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData(['clients']);

      queryClient.setQueryData(['clients'], old => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(client => {
            if (client.id !== clientId) return client;
            const brandInfo = { ...(client.brand_info || {}) };
            if (color) {
              brandInfo.card_color = color;
            } else {
              delete brandInfo.card_color;
            }
            return { ...client, brand_info: brandInfo };
          }),
        };
      });

      return { previousClients };
    },
    onError: (error, _variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      toast.error(error.message || 'No se pudo cambiar el color');
    },
    onSuccess: () => {
      toast.success('Color actualizado');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleCardColorChange = (clientId, color) => {
    setColorPickerClientId(null);
    updateCardColorMutation.mutate({ clientId, color });
  };

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, payload }) =>
      toast.promise(updateClient(clientId, payload), {
        loading: 'Actualizando cliente…',
        success: 'Cliente actualizado',
        error: e => e.message || 'No se pudo actualizar el cliente',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId) =>
      toast.promise(deleteClient(clientId), {
        loading: 'Eliminando cliente…',
        success: 'Cliente eliminado',
        error: e => e.message || 'No se pudo eliminar el cliente',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setConfirmDeleteClient(null);
    },
  });


  if (isError) 
    return <ErrorCard title="Error al cargar clientes" message={error.message} onRetry={() => window.location.reload()} />;

  return (
    <div className='space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      {/* Hero */}
      <section className='flex flex-col items-center text-center gap-4 py-4 px-4 sm:px-0'>
        <div className='h-16 w-16 rounded-full border border-[color:var(--color-border-subtle)] bg-surface-soft flex items-center justify-center text-2xl font-bold text-text-primary'>
          R
        </div>
        <div className='flex justify-center items-center gap-4 flex-wrap'>
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

          <Tooltip content="Invitar a un nuevo colaborador o administrador a la agencia" side="bottom">
            <button
              id='add-member-button'
              onClick={() => setIsMemberModalOpen(true)}
              className='btn-cyber px-6 py-3 text-sm font-semibold hover-cyber-glow min-h-[44px] touch-target bg-surface-soft border border-[color:var(--color-border-subtle)] text-text-primary transition duration-200'
              aria-label="Abrir modal para invitar nuevo miembro"
            >
              + Añadir Miembro
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

      {/* Grid de tarjetas o esqueletos */}
      {isLoading ? (
        <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto max-w-7xl justify-center'>
          {[...Array(6)].map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      ) : allClients.length === 0 ? (
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
            {filteredAndSortedClients.map((client, index) => {
              const cardColor = getClientCardColor(client);
              const hasCustomColor = Boolean(client.brand_info?.card_color);

              return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                role="listitem"
              >
                <div
                  className='card-cyber rounded-xl transition-all duration-300 ease-in-out hover:-translate-y-0.5 !overflow-visible'
                  style={{
                    backgroundColor: hasCustomColor ? hexToRgba(cardColor, 0.18) : undefined,
                    borderColor: hasCustomColor ? hexToRgba(cardColor, 0.55) : undefined,
                  }}
                >
                  {hasCustomColor && (
                    <div
                      className='absolute inset-x-0 top-0 h-1 rounded-t-xl'
                      style={{ backgroundColor: cardColor }}
                      aria-hidden='true'
                    />
                  )}

                  {/* Contenedor del menú para evitar clics fuera accidentales y posicionar */}
                  <div className="client-menu-container absolute right-3 top-3 z-20">
                    <Tooltip content="Opciones del cliente" side="top">
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setActiveMenuClientId(openId => openId === client.id ? null : client.id);
                          setColorPickerClientId(null);
                        }}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted transition-all hover:bg-surface-strong hover:text-text-primary hover:scale-105 active:scale-95'
                        aria-label={`Opciones de ${client.name}`}
                        aria-expanded={activeMenuClientId === client.id}
                      >
                        <EllipsisVerticalIcon className='h-4 w-4' />
                      </button>
                    </Tooltip>

                    <AnimatePresence>
                      {activeMenuClientId === client.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className='absolute right-0 mt-1 w-56 origin-top-right rounded-xl border border-[color:var(--color-border-subtle)] bg-[#1A181C] p-1.5 shadow-2xl z-30'
                          onClick={(e) => e.stopPropagation()} // Evitar navegar al hacer clic en el menú
                        >
                          {/* Sección: Accesos Rápidos */}
                          <div className='px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted/80 border-b border-[color:var(--color-border-subtle)]/30 mb-1'>
                            Accesos rápidos
                          </div>
                          
                          <Link
                            to={`/clients/${client.id}?tab=schedule`}
                            className='flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
                          >
                            <CalendarIcon className='h-3.5 w-3.5 text-blue-400' />
                            Ir a Calendario
                          </Link>

                          <Link
                            to={`/clients/${client.id}?tab=documents`}
                            className='flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
                          >
                            <FolderIcon className='h-3.5 w-3.5 text-amber-400' />
                            Ir a Documentos
                          </Link>

                          <Link
                            to={`/clients/${client.id}?tab=identity`}
                            className='flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
                          >
                            <SparklesIcon className='h-3.5 w-3.5 text-purple-400' />
                            Ir a Identidad de Marca
                          </Link>

                          {/* Sección: Gestión */}
                          <div className='px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted/80 border-t border-[color:var(--color-border-subtle)]/30 my-1 pt-1.5'>
                            Gestión
                          </div>

                          <button
                            type='button'
                            onClick={() => {
                              setEditingClient({ id: client.id, name: client.name, industry: client.industry });
                              setActiveMenuClientId(null);
                            }}
                            className='flex items-center gap-2 w-full text-left rounded-lg px-2.5 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
                          >
                            <PencilIcon className='h-3.5 w-3.5 text-emerald-400' />
                            Editar Información
                          </button>

                          {/* Opción Cambiar Color que despliega la paleta */}
                          <button
                            type='button'
                            onClick={() => setColorPickerClientId(openId => openId === client.id ? null : client.id)}
                            className='flex items-center justify-between gap-2 w-full text-left rounded-lg px-2.5 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
                          >
                            <span className='flex items-center gap-2'>
                              <SwatchIcon className='h-3.5 w-3.5 text-indigo-400' />
                              Cambiar Color
                            </span>
                            <span className='h-2 w-2 rounded-full border border-white/20' style={{ backgroundColor: cardColor }} />
                          </button>

                          {/* Subpanel de colores colapsable */}
                          <AnimatePresence>
                            {colorPickerClientId === client.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className='overflow-hidden px-2 py-1.5 bg-surface-soft/40 rounded-lg mt-1 border border-[color:var(--color-border-subtle)]/20'
                              >
                                <div className='grid grid-cols-4 gap-1.5 mb-2'>
                                  {CARD_COLOR_OPTIONS.map(color => (
                                    <button
                                      key={color}
                                      type='button'
                                      onClick={() => handleCardColorChange(client.id, color)}
                                      className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 active:scale-90 ${
                                        cardColor === color ? 'border-white' : 'border-white/20'
                                      }`}
                                      style={{ backgroundColor: color }}
                                      aria-label={`Usar color ${color}`}
                                    />
                                  ))}
                                </div>
                                <div className='flex items-center justify-between gap-1.5 pt-1 border-t border-[color:var(--color-border-subtle)]/10'>
                                  <input
                                    type='color'
                                    value={hasCustomColor ? cardColor : CARD_COLOR_OPTIONS[0]}
                                    onChange={event => handleCardColorChange(client.id, event.target.value)}
                                    className='h-6 w-8 cursor-pointer rounded border border-[color:var(--color-border-subtle)]/30 bg-transparent'
                                    aria-label={`Elegir color personalizado`}
                                  />
                                  <button
                                    type='button'
                                    onClick={() => handleCardColorChange(client.id, null)}
                                    className='rounded-md px-1.5 py-0.5 text-[10px] text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary'
                                  >
                                    Quitar color
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Eliminar (Acción Destructiva) */}
                          <div className='border-t border-[color:var(--color-border-subtle)]/30 my-1 pt-1' />
                          <button
                            type='button'
                            onClick={() => {
                              setConfirmDeleteClient(client);
                              setActiveMenuClientId(null);
                            }}
                            className='flex items-center gap-2 w-full text-left rounded-lg px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors'
                          >
                            <TrashIcon className='h-3.5 w-3.5' />
                            Eliminar Cliente
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link 
                    to={`/clients/${client.id}`} 
                    className='group block p-6'
                    aria-label={`Ver detalles del cliente ${client.name}${client.industry ? ` - ${client.industry}` : ''}`}
                  >
                    <div className='mb-2 flex items-center justify-between pr-9'>
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
                  </Link>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <ClientCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <MemberInvitationModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />

      {/* Modal para Editar Nombre e Industria del Cliente */}
      <AnimatePresence>
        {editingClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[#1A181C] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <PencilIcon className="h-5 w-5 text-[color:var(--color-accent-blue)]" />
                Editar Cliente
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('name')?.trim();
                  const industry = formData.get('industry')?.trim();

                  if (!name) {
                    toast.error('El nombre es requerido');
                    return;
                  }

                  updateClientMutation.mutate({
                    clientId: editingClient.id,
                    payload: { name, industry: industry || null }
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    defaultValue={editingClient.name}
                    className="w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary outline-none focus:border-[color:var(--color-accent-blue)]"
                    placeholder="Ej. Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-industry" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Industria / Categoría
                  </label>
                  <input
                    type="text"
                    id="edit-industry"
                    name="industry"
                    defaultValue={editingClient.industry || ''}
                    className="w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary outline-none focus:border-[color:var(--color-accent-blue)]"
                    placeholder="Ej. Tecnología, Marketing, etc."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface-soft rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateClientMutation.isPending}
                    className="btn-cyber px-4 py-2 text-sm font-semibold hover-cyber-glow"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Confirmar Eliminación del Cliente */}
      <AnimatePresence>
        {confirmDeleteClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-[#1A181C] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                <TrashIcon className="h-5 w-5" />
                ¿Eliminar cliente?
              </h3>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                Estás a punto de eliminar permanentemente a <span className="font-semibold text-text-primary">{confirmDeleteClient.name}</span>. 
                <br />
                <span className="text-red-400/90 font-medium">⚠️ Esta acción eliminará automáticamente todas sus tareas, calendarios, documentos y archivos cargados. Esto no se puede deshacer.</span>
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteClient(null)}
                  className="px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface-soft rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => deleteClientMutation.mutate(confirmDeleteClient.id)}
                  disabled={deleteClientMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  Eliminar permanentemente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity feed under the clients section */}
      <ActivityFeed />
    </div>
  );
};
