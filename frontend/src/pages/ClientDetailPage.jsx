import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { getClientById } from '../api/clients';
import { ScheduleSection } from '../components/schedule/ScheduleSection';
import { DocumentsSection } from '../components/documents/DocumentsSection';
import { BrandIdentitySection } from '../components/brand/BrandIdentitySection';
import { TrendsSection } from '../components/trends/TrendsSection';
import { InteractiveAvatar } from '../components/ui/InteractiveAvatar';
import { MetaAdsSection } from '../components/meta/MetaAdsSection';
import {
  CalendarIcon,
  FolderIcon,
  ArrowTrendingUpIcon,
  FingerPrintIcon,
  ChevronLeftIcon,
  SparklesIcon,
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// Caché global en memoria para persistir la información básica de clientes entre montajes
const clientCache = new Map();

// Definición de las Tarjetas de Agentes Bento con iconos premium SVGs
const agentCards = [
  {
    id: 'trends',
    name: 'Tendencias',
    icon: ArrowTrendingUpIcon,
    grad: 'linear-gradient(140deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
    color: '#4ECDC4',
    stat: '8 tendencias hoy',
  },
  {
    id: 'documents',
    name: 'Documentos',
    icon: FolderIcon,
    grad: 'linear-gradient(140deg, #000428 0%, #004e92 55%, #00b4db 100%)',
    color: '#00b4db',
    stat: '3 bocetos activos',
  },
  {
    id: 'schedule',
    name: 'Cronograma',
    icon: CalendarIcon,
    grad: 'linear-gradient(140deg, #4b134f 0%, #7b4397 50%, #dc2430 100%)',
    color: '#dc2430',
    stat: 'Próx. post: mañana',
  },
  {
    id: 'meta',
    name: 'Meta Ads',
    icon: ChartBarIcon,
    grad: 'linear-gradient(140deg, #1f083d 0%, #461466 50%, #0f001f 100%)',
    color: '#A855F7',
    stat: 'Campaña y Analíticas',
  },
  {
    id: 'identity',
    name: 'Identidad de Marca',
    icon: Cog6ToothIcon,
    grad: 'linear-gradient(140deg, #0d0d1a 0%, #1c2e40 50%, #1e4060 100%)',
    color: '#7C5CFC',
    stat: '5 fuentes cargadas',
  },
];

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  // Si la pestaña no está definida o no es una de las 5 reales, mostramos el Panel Bento
  const activeTab = ['schedule', 'documents', 'identity', 'trends', 'meta'].includes(requestedTab)
    ? requestedTab
    : null;

  const queryClient = useQueryClient();

  // Función para intentar resolver el cliente desde la caché de React Query o de la caché local
  const getCachedClient = id => {
    if (!id) return null;
    if (clientCache.has(id)) {
      return clientCache.get(id);
    }
    try {
      const clientsData = queryClient?.getQueryData(['clients'])?.data;
      if (clientsData) {
        const found = clientsData.find(c => c.id === id);
        if (found) {
          clientCache.set(id, found);
          return found;
        }
      }
    } catch (e) {
      console.error('Error fetching from query client cache:', e);
    }
    return null;
  };

  const [client, setClient] = useState(() => getCachedClient(clientId));
  const [loading, setLoading] = useState(() => !getCachedClient(clientId));
  const [error, setError] = useState(null);
  const [prevClientId, setPrevClientId] = useState(clientId);

  // Patrón getDerivedStateFromProps en renderizado para evitar destellos (flashing) de clientes anteriores
  if (clientId !== prevClientId) {
    setPrevClientId(clientId);
    const cached = getCachedClient(clientId);
    setClient(cached);
    setLoading(!cached);
    setError(null);
  }

  const [visitedTabs, setVisitedTabs] = useState({
    schedule: false,
    documents: false,
    identity: false,
    trends: false,
    meta: false,
  });

  // Estado para las tarjetas ordenables
  const [cards, setCards] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Cargar orden inicial al montar o cuando clientId cambie
  useEffect(() => {
    const saved = localStorage.getItem('cadence_client_cards_order_global');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        const mapped = ids.map(id => agentCards.find(c => c.id === id)).filter(Boolean);
        const missing = agentCards.filter(c => !ids.includes(c.id));
        setCards([...mapped, ...missing]);
        return;
      } catch (e) {
        console.error('Error parsing saved card order', e);
      }
    }
    setCards(agentCards);
  }, [clientId]);

  // Gestores de eventos de Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOverCard = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Intercambiar posiciones en caliente
    const newCards = [...cards];
    const draggedItem = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setCards(newCards);

    // Persistir el orden en localStorage de manera global
    localStorage.setItem(
      'cadence_client_cards_order_global',
      JSON.stringify(newCards.map(c => c.id))
    );
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Reset visited tabs when client changes
  useEffect(() => {
    setVisitedTabs({
      schedule: false,
      documents: false,
      identity: false,
      trends: false,
      meta: false,
    });
  }, [clientId]);

  // Mark current tab as visited
  useEffect(() => {
    if (activeTab) {
      setVisitedTabs(prev => ({
        ...prev,
        [activeTab]: true,
      }));
    }
  }, [activeTab]);

  // Trigger window resize event when switching back to schedule tab
  // to ensure FullCalendar recalculates its size beautifully.
  useEffect(() => {
    if (activeTab === 'schedule' && visitedTabs.schedule) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, visitedTabs.schedule]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await getClientById(clientId);
        setClient(response.data);
        clientCache.set(clientId, response.data);
        setError(null);
      } catch (err) {
        // Solo establecer error si no pudimos resolverlo ni desde la caché
        if (!clientCache.has(clientId)) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [clientId]);

  if (loading) return <div className='text-center py-20 text-text-muted'>Cargando...</div>;
  if (error) return <div className='text-center py-20 text-red-500'>Error: {error}</div>;
  if (!client)
    return <div className='text-center py-20 text-text-muted'>Cliente no encontrado.</div>;

  // Manejar navegación de pestañas
  const selectTab = tabId => {
    if (tabId) {
      setSearchParams({ tab: tabId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <AnimatePresence mode='wait'>
        {!activeTab ? (
          /* =========================================================================
             VISTA 1: BENTO PANEL DE CONTROL DEL CLIENTE (Look Rambla exact specs)
             ========================================================================= */
          <motion.div
            key='bento-panel'
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className='p-6 md:p-8 flex flex-col flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto'
          >
            {/* Brand Header */}
            <div
              className='brand-header border border-border-subtle bg-surface mb-8 py-5 px-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4'
              style={{
                borderLeftColor: client.brand_info?.card_color || '#7C5CFC',
                borderLeftWidth: '5px',
              }}
            >
              <div className='flex items-center gap-4'>
                <div
                  className='brand-header-ini w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl text-text-primary shadow-sm flex-shrink-0'
                  style={{
                    backgroundColor: (client.brand_info?.card_color || '#7C5CFC') + '15',
                    border: `1px solid ${client.brand_info?.card_color || '#7C5CFC'}40`,
                    color: client.brand_info?.card_color || '#7C5CFC',
                    minWidth: '56px',
                    minHeight: '56px',
                  }}
                >
                  {(client.name || 'CL').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className='text-xl font-title font-extrabold text-text-primary leading-tight'>
                    {client.name}
                  </h2>
                  <p className='text-xs text-text-muted mt-1'>
                    {client.industry || 'Sin categoría/industria'}
                  </p>
                </div>
              </div>

              {/* Stats Rápidos */}
              <div className='flex items-center gap-6 self-end sm:self-center pr-2'>
                <div className='text-center sm:text-left'>
                  <div className='text-base font-black text-text-primary font-title'>Redes</div>
                  <div className='text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5'>
                    conectadas
                  </div>
                </div>
                <div className='h-8 w-px bg-border-subtle' />
                <div className='text-center sm:text-left'>
                  <div className='text-base font-black text-text-primary font-title'>Activo</div>
                  <div className='text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5'>
                    estado
                  </div>
                </div>
              </div>
            </div>

            {/* Label de Sección */}
            <div className='sec-lbl text-[9px] font-bold tracking-[0.12em] text-text-secondary uppercase mb-4 px-1'>
              Módulos del Cliente
            </div>

            {/* Bento Grid - 4 Columns in a beautiful horizontal row spanning screen width */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8 w-full'>
              {cards.map((card, index) => {
                const isDraggingThis = draggedIndex === index;
                return (
                  <motion.div
                    key={card.id}
                    layout
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => handleDragOverCard(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => selectTab(card.id)}
                    className={`agent-card flex flex-col gap-3.5 group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      isDraggingThis ? 'opacity-40 scale-95' : 'opacity-100'
                    }`}
                  >
                    <div
                      className={`agent-card-inner aspect-square w-full rounded-[28px] relative overflow-hidden flex items-center justify-center border border-white/5 shadow-lg transition-all duration-300 transform group-hover:scale-[1.03] group-hover:shadow-2xl ${
                        isDraggingThis
                          ? 'border-accent-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                          : ''
                      }`}
                      style={{ background: card.grad }}
                    >
                      {/* Noise Grain Overlay */}
                      <div
                        className='agent-grain absolute inset-0 rounded-inherit opacity-[0.08] mix-blend-overlay pointer-events-none'
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.72' type='fractalNoise' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='1'/%3E%3C/svg%3E")`,
                        }}
                      />

                      {/* Glass Reflection Highlight */}
                      <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none' />

                      {/* Interactive 3D Avatar (Sigue el ratón) */}
                      <div className='relative z-10 transition-all duration-300 group-hover:scale-110'>
                        <InteractiveAvatar
                          variant={card.id === 'identity' ? 'ai' : card.id}
                          size='lg'
                          interactive={!isDraggingThis}
                        />
                      </div>

                      {/* Label */}
                      <div className='agent-card-label absolute bottom-5 left-6 text-sm font-title font-bold text-white/95 select-none drop-shadow-md'>
                        {card.name}
                      </div>
                    </div>

                    {/* Card Footer (Metadata) */}
                    <div className='agent-card-foot flex justify-between items-center px-2 select-none'>
                      <span
                        className='agent-stat text-[11px] font-bold'
                        style={{ color: card.color }}
                      >
                        {card.stat}
                      </span>
                      <span className='agent-open text-[10px] font-bold text-text-secondary group-hover:text-accent-blue transition-colors flex items-center gap-0.5'>
                        Abrir →
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             VISTA 2: VISTA DETALLADA DEL MÓDULO CON BOTÓN VOLVER (Look Rambla Studio)
             ========================================================================= */
          <motion.div
            key='active-tab-view'
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className='flex-1 flex flex-col h-full overflow-hidden'
          >
            {/* Top Back-bar */}
            <div className='back-bar bg-app-sidebar border-b border-border-subtle px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-10'>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => selectTab(null)}
                  className='back-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary text-[11px] font-bold transition-all duration-200'
                >
                  <ChevronLeftIcon className='h-3.5 w-3.5' />
                  <span>Volver</span>
                </button>
                <div className='breadcrumb text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2'>
                  <span>Clientes</span>
                  <span>/</span>
                  <span className='text-text-muted'>{client.name}</span>
                  <span>/</span>
                  <span className='text-text-primary'>
                    {activeTab === 'schedule'
                      ? 'Cronograma'
                      : activeTab === 'documents'
                        ? 'Documentos'
                        : activeTab === 'trends'
                          ? 'Tendencias'
                          : activeTab === 'meta'
                            ? 'Meta Ads'
                            : 'Identidad'}
                  </span>
                </div>
              </div>

              {/* Acciones específicas del Cronograma o indicador por defecto */}
              {activeTab === 'schedule' ? (
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('cadence:new-event'))}
                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-text-primary text-app-sidebar hover:bg-white text-[11px] font-bold transition-all duration-200 shadow-sm'
                  >
                    <PlusIcon className='h-3.5 w-3.5' />
                    <span>Nuevo Evento</span>
                  </button>

                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('cadence:calendar-action', { detail: { action: 'ai-gen' } })
                      )
                    }
                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary text-[11px] font-bold transition-all duration-200'
                  >
                    <SparklesIcon className='h-3.5 w-3.5 text-emerald-400' />
                    <span>Generar con IA</span>
                  </button>

                  {/* Dropdown Menu de Opciones (...) */}
                  <Menu as='div' className='relative inline-block text-left'>
                    <div>
                      <Menu.Button className='inline-flex items-center justify-center p-1.5 rounded-xl border border-border-subtle bg-surface text-text-muted hover:text-text-primary transition-all duration-200 focus:outline-none'>
                        <EllipsisVerticalIcon className='h-4 w-4' aria-hidden='true' />
                      </Menu.Button>
                    </div>

                    <Transition
                      as={Fragment}
                      enter='transition ease-out duration-100'
                      enterFrom='transform opacity-0 scale-95'
                      enterTo='transform opacity-100 scale-100'
                      leave='transition ease-in duration-75'
                      leaveFrom='transform opacity-100 scale-100'
                      leaveTo='transform opacity-0 scale-95'
                    >
                      <Menu.Items className='absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-border-subtle bg-surface-soft p-1.5 shadow-2xl focus:outline-none z-50'>
                        <div className='space-y-0.5'>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() =>
                                  window.dispatchEvent(
                                    new CustomEvent('cadence:calendar-action', {
                                      detail: { action: 'import' },
                                    })
                                  )
                                }
                                className={`${
                                  active ? 'bg-surface text-text-primary' : 'text-text-muted'
                                } group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors`}
                              >
                                <ArrowUpTrayIcon className='h-3.5 w-3.5 text-text-secondary' />
                                <span>Importar archivo</span>
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() =>
                                  window.dispatchEvent(
                                    new CustomEvent('cadence:calendar-action', {
                                      detail: { action: 'share' },
                                    })
                                  )
                                }
                                className={`${
                                  active ? 'bg-surface text-text-primary' : 'text-text-muted'
                                } group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors`}
                              >
                                <LinkIcon className='h-3.5 w-3.5 text-text-secondary' />
                                <span>Compartir aprobación</span>
                              </button>
                            )}
                          </Menu.Item>
                          <div className='my-1 border-t border-border-subtle' />
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() =>
                                  window.dispatchEvent(
                                    new CustomEvent('cadence:calendar-action', {
                                      detail: { action: 'clear' },
                                    })
                                  )
                                }
                                className={`${
                                  active ? 'bg-red-500/10 text-red-300' : 'text-red-400'
                                } group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors`}
                              >
                                <TrashIcon className='h-3.5 w-3.5 text-red-500/60' />
                                <span>Limpiar Cronograma</span>
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <span className='h-2 w-2 rounded-full bg-green-500 animate-pulse-soft' />
                  <span className='text-[10px] font-bold text-text-muted uppercase tracking-wider'>
                    Agente Activo
                  </span>
                </div>
              )}
            </div>

            {/* Contenedor del módulo real */}
            <div className='flex-1 overflow-y-auto w-full relative'>
              <div style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
                {visitedTabs.schedule && <ScheduleSection clientId={clientId} />}
              </div>
              <div style={{ display: activeTab === 'identity' ? 'block' : 'none' }}>
                {visitedTabs.identity && <BrandIdentitySection clientId={clientId} />}
              </div>
              <div style={{ display: activeTab === 'trends' ? 'block' : 'none' }}>
                {visitedTabs.trends && <TrendsSection clientId={clientId} />}
              </div>
              <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
                {visitedTabs.documents && <DocumentsSection clientId={clientId} />}
              </div>
              <div style={{ display: activeTab === 'meta' ? 'block' : 'none' }}>
                {visitedTabs.meta && <MetaAdsSection clientId={clientId} />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
