import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient } from '../api/clients.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, MoreVertical, Pencil, Tag, Palette, Trash2, ExternalLink, History, Link as LinkIcon } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { WelcomeEmptyState } from '../components/dashboard/WelcomeEmptyState.jsx';
import { ClientCreationModal } from '../components/dashboard/ClientCreationModal.jsx';
import { ActivityFeed } from '../components/dashboard/ActivityFeed.jsx';
import { useMultipleClientStats } from '../hooks/useClientStats.js';
import { ProgressBadge } from '../components/ui/ProgressIndicator.jsx';
import { LoadingCard, ErrorCard, Tooltip, HelpTooltip } from '../components/ui/index.js';
import { useUIState } from '../hooks/useUIState.js';
import { deleteClient as deleteClientApi, getClientPreferences, setClientPreference } from '../api/clients.js';
import { getMyAgency } from '../api/agencies.js';
import { apiFetch } from '../api/apiFetch.js';
import { ClientRenameModal } from '../components/dashboard/ClientRenameModal.jsx';
import { ClientIndustryModal } from '../components/dashboard/ClientIndustryModal.jsx';

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

  // Consultar rol del usuario desde la API de agencia
  const { data: myAgencyResp } = useQuery({ queryKey: ['my-agency'], queryFn: getMyAgency });
  const isAdmin = (myAgencyResp?.data?.user_role || '').toLowerCase() === 'admin';

  // Preferencias por usuario (colores de tarjeta por cliente)
  const { data: prefsResp } = useQuery({ queryKey: ['client-prefs'], queryFn: getClientPreferences });
  const clientColorMap = prefsResp?.data || {};

  const deleteClientMutation = useMutation({
    mutationFn: (clientId) =>
      toast.promise(deleteClientApi(clientId), {
        loading: 'Eliminando cliente…',
        success: 'Cliente eliminado',
        error: (e) => e.message || 'No se pudo eliminar el cliente',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const parseHex = (hex) => {
    if (!hex || hex === 'transparent') return null;
    const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    return { r, g, b, hex: `#${h}` };
  };

  const toHex2 = (n) => n.toString(16).padStart(2, '0');
  const clamp = (x) => Math.max(0, Math.min(255, x));
  const darken = ({ r, g, b }, pct = 0.16) => {
    const f = 1 - pct;
    return { r: clamp(Math.round(r * f)), g: clamp(Math.round(g * f)), b: clamp(Math.round(b * f)) };
  };

  const computeThemeFor = (hex) => {
    const rgb = parseHex(hex);
    if (!rgb) return null;
    const { r, g, b } = rgb;
    // Perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const useDarkText = brightness > 140; // threshold tuned for these tones
    const textPrimary = useDarkText ? '#0F172A' : '#FFFFFF';
    const textMuted = useDarkText ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)';
    const borderSubtle = useDarkText ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.25)';
    const bd = darken(rgb, 0.16);
    const borderTop = `#${toHex2(bd.r)}${toHex2(bd.g)}${toHex2(bd.b)}`;
    return { bg: rgb.hex, borderTop, textPrimary, textMuted, borderSubtle };
  };

  const setColorMutation = useMutation({
    mutationFn: async ({ clientId, color }) => {
      // if color is a special sentinel 'RESET' we call DELETE
      if (color === 'RESET') {
        return toast.promise(deleteClientPreference(clientId), {
          loading: 'Restableciendo color…',
          success: 'Color restablecido',
          error: (e) => e.message || 'No se pudo restablecer el color',
        });
      }
      return toast.promise(setClientPreference(clientId, { color }), {
        loading: 'Guardando color…',
        success: 'Color guardado',
        error: (e) => e.message || 'No se pudo guardar el color',
      });
    },
    onMutate: async ({ clientId, color }) => {
      await queryClient.cancelQueries({ queryKey: ['client-prefs'] });
      const prev = queryClient.getQueryData(['client-prefs']);
      queryClient.setQueryData(['client-prefs'], (old) => {
        const data = old?.data ? { ...old.data } : {};
        const wrapped = old?.success !== undefined ? { ...old } : { success: true, data };
        if (color === 'RESET') {
          // remove entry to represent reset
          const copy = { ...(wrapped.data || {}) };
          delete copy[clientId];
          wrapped.data = copy;
        } else {
          wrapped.data[clientId] = { ...(wrapped.data[clientId] || {}), color };
        }
        return wrapped;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['client-prefs'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['client-prefs'] }),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, payload }) =>
      toast.promise(
        apiFetch(`/clients/${clientId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
        { loading: 'Guardando cambios…', success: 'Cambios guardados', error: (e) => e.message || 'No se pudo guardar' }
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // Modals state
  const [renameTarget, setRenameTarget] = React.useState(null); // { id, name }
  const [industryTarget, setIndustryTarget] = React.useState(null); // { id, industry }
  const [isSubmittingModal, setIsSubmittingModal] = React.useState(false);

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
              className='btn-cyber px-6 py-3 text-sm font-semibold hover-cyber-glow min-h-[44px] touch-target glow-gold'
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
              <ArrowUpDown className='h-4 w-4' />
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
          <Search className='mx-auto h-12 w-12 text-text-muted mb-4' />
          <p className='text-text-muted text-lg mb-2'>No se encontraron clientes</p>
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
                className='relative group'
              >
                {/* Kebab menu (3 puntitos) */}
                <div className='absolute top-2 right-2 z-10'>
                  <Menu as='div' className='relative inline-block text-left'>
                    <Menu.Button
                      aria-label={`Opciones para ${client.name}`}
                      className='inline-flex items-center justify-center rounded-md p-2 text-text-muted hover:text-text-primary hover:bg-surface-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-border-subtle)]'
                    >
                      <MoreVertical size={18} />
                    </Menu.Button>
                    <Transition
                      enter='transition ease-out duration-100'
                      enterFrom='transform opacity-0 scale-95'
                      enterTo='transform opacity-100 scale-100'
                      leave='transition ease-in duration-75'
                      leaveFrom='transform opacity-100 scale-100'
                      leaveTo='transform opacity-0 scale-95'
                    >
                      <Menu.Items className='absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-[color:var(--color-border-subtle)] bg-surface-strong shadow-lg focus:outline-none p-1'>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${active ? 'bg-surface-soft' : ''}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenameTarget({ id: client.id, name: client.name || '' }); }}
                            >
                              <Pencil size={16} /> Renombrar
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${active ? 'bg-surface-soft' : ''}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndustryTarget({ id: client.id, industry: client.industry || '' }); }}
                            >
                              <Tag size={16} /> Cambiar industria
                            </button>
                          )}
                        </Menu.Item>
                        <div className='my-1 h-px bg-[color:var(--color-border-subtle)]' />
                        <div className='px-2 py-2'>
                          <div className='flex items-center justify-between text-xs text-text-muted px-1 mb-2'>
                            <span>Color (solo tú)</span>
                            <Palette size={14} />
                          </div>
                          <div className='grid grid-cols-6 gap-1'>
                            {['none','#454a4c','#987b50','#a56239','#ac5445','#8c5478','#765d93','#4c6c97','#4e7370','#7b7668','#6d777e'].map(c => (
                              <button
                                key={c}
                                className='h-6 w-6 rounded-md border border-[color:var(--color-border-subtle)] flex items-center justify-center text-[10px] text-text-muted'
                                style={c==='none' ? { background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 6px, rgba(0,0,0,0.06) 6px 12px)' } : { backgroundColor: c }}
                                aria-label={c==='none' ? 'Sin color (por defecto)' : `Establecer color ${c}`}
                                title={c==='none' ? 'Sin color (por defecto)' : `Color ${c}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const colorToSave = c === 'none' ? 'RESET' : c;
                                  setColorMutation.mutate({ clientId: client.id, color: colorToSave });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${active ? 'bg-surface-soft' : ''}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/clients/${client.id}`; }}
                            >
                              <History size={16} /> Ver actividad
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${active ? 'bg-surface-soft' : ''}`}
                              onClick={async (e) => { e.preventDefault(); e.stopPropagation(); const url = `${window.location.origin}/clients/${client.id}`; try { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); } catch { toast.error('No se pudo copiar'); } }}
                            >
                              <LinkIcon size={16} /> Copiar enlace
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${active ? 'bg-surface-soft' : ''}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/clients/${client.id}`, '_blank', 'noopener,noreferrer'); }}
                            >
                              <ExternalLink size={16} /> Abrir en nueva pestaña
                            </button>
                          )}
                        </Menu.Item>
                        {isAdmin && (
                          <>
                            <div className='my-1 h-px bg-[color:var(--color-border-subtle)]' />
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-red-500 ${active ? 'bg-surface-soft' : ''}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm(`¿Eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`)) {
                                      deleteClientMutation.mutate(client.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={16} /> Eliminar
                                </button>
                              )}
                            </Menu.Item>
                          </>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
                <Link 
                  to={`/clients/${client.id}`} 
                  className='block'
                  aria-label={`Ver detalles del cliente ${client.name}${client.industry ? ` - ${client.industry}` : ''}`}
                >
                  <div
                    className='card-cyber rounded-xl p-6 transition-all duration-300 ease-in-out hover:-translate-y-0.5 border-t-4'
                    style={(() => {
                      const theme = computeThemeFor(clientColorMap[client.id]?.color);
                      if (theme) {
                        return {
                          background: theme.bg,
                          borderTopColor: theme.borderTop,
                          '--color-text-primary': theme.textPrimary,
                          '--color-text-muted': theme.textMuted,
                          '--color-border-subtle': theme.borderSubtle,
                        };
                      }
                      return {
                        borderTopColor: clientColorMap[client.id]?.color || 'transparent'
                      };
                    })()}
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='text-[10px] uppercase tracking-wider text-text-muted'>
                        Cliente
                      </div>
                    </div>
                    
                    <h3 className='font-bold text-text-primary mb-1'>{client.name}</h3>
                    <p className='text-sm text-text-muted mb-3'>
                      {client.industry || 'Sin industria'}
                    </p>

                    {/* Estadísticas rápidas */}
                    {statsMap[client.id]?.hasEvents ? (
                        <div className='flex items-center justify-between text-xs'>
                        <div className='flex space-x-3'>
                          <span className='text-text-primary'>
                            ✓ {statsMap[client.id].stats.completed}
                          </span>
                          <span className='text-text-muted'>
                            ⟳ {statsMap[client.id].stats.inProgress}
                          </span>
                          <span className='text-text-muted'>
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
      {/* Modales de acciones */}
      <ClientRenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        initialName={renameTarget?.name || ''}
        isSubmitting={isSubmittingModal || updateClientMutation.isPending}
        onSubmit={async (newName) => {
          try {
            setIsSubmittingModal(true);
            await updateClientMutation.mutateAsync({ clientId: renameTarget.id, payload: { name: newName } });
            setRenameTarget(null);
          } finally {
            setIsSubmittingModal(false);
          }
        }}
      />
      <ClientIndustryModal
        isOpen={!!industryTarget}
        onClose={() => setIndustryTarget(null)}
        initialIndustry={industryTarget?.industry || ''}
        isSubmitting={isSubmittingModal || updateClientMutation.isPending}
        onSubmit={async (newInd) => {
          try {
            setIsSubmittingModal(true);
            await updateClientMutation.mutateAsync({ clientId: industryTarget.id, payload: { industry: newInd } });
            setIndustryTarget(null);
          } finally {
            setIsSubmittingModal(false);
          }
        }}
      />
    </div>
  );
};
