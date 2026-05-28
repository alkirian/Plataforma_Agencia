import React, { useState, useEffect, Fragment, Suspense, lazy } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { getClientById } from '../api/clients';
import { useNotifications } from '../hooks/useNotifications';

// Lazy loading de módulos pesados
const ScheduleSection = lazy(() =>
  import('../components/schedule/ScheduleSection').then(m => ({ default: m.ScheduleSection }))
);
const DocumentsSection = lazy(() =>
  import('../components/documents/DocumentsSection').then(m => ({ default: m.DocumentsSection }))
);
const BrandIdentitySection = lazy(() =>
  import('../components/brand/BrandIdentitySection').then(m => ({ default: m.BrandIdentitySection }))
);
const TrendsSection = lazy(() =>
  import('../components/trends/TrendsSection').then(m => ({ default: m.TrendsSection }))
);
const MetaAdsSection = lazy(() =>
  import('../components/meta/MetaAdsSection').then(m => ({ default: m.MetaAdsSection }))
);
const CMSection = lazy(() =>
  import('../components/cm/CMSection').then(m => ({ default: m.CMSection }))
);
const DesignSection = lazy(() =>
  import('../components/design/DesignSection').then(m => ({ default: m.DesignSection }))
);
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
  ChatBubbleLeftRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { InteractiveAvatar, AgentBentoCard, AgentChatPanel } from '../components/ui';

// Caché global en memoria para persistir la información básica de clientes entre montajes
const clientCache = new Map();

// Definición de las Tarjetas de Agentes Bento con iconos premium SVGs
const agentCards = [
  {
    id: 'cm',
    name: 'CM',
    icon: ChatBubbleLeftRightIcon,
    grad: 'linear-gradient(140deg, #0b3c2c 0%, #11998e 55%, #38ef7d 100%)',
    color: '#38ef7d',
    stat: '0 pendientes',
  },
  {
    id: 'trends',
    name: 'Trends',
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
    name: 'Identidad',
    icon: Cog6ToothIcon,
    grad: 'linear-gradient(140deg, #0d0d1a 0%, #1c2e40 50%, #1e4060 100%)',
    color: '#7C5CFC',
    stat: '5 fuentes cargadas',
  },
  {
    id: 'design',
    name: 'Estudio de Diseño',
    icon: PhotoIcon,
    grad: 'linear-gradient(140deg, #3b0764 0%, #701a75 50%, #4c1d95 100%)',
    color: '#D946EF',
    stat: 'Fotos 2K/4K con IA',
  },
];

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  
  const [activeChatAgent, setActiveChatAgent] = useState(null);

  const { notifications, markTrendsAsReadForClient } = useNotifications();

  // Si la pestaña no está definida o no es una de las reales, mostramos el Panel Bento
  const activeTab = ['schedule', 'documents', 'identity', 'trends', 'meta', 'cm', 'design'].includes(requestedTab)
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
    cm: false,
    design: false,
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
      cm: false,
      design: false,
    });
  }, [clientId]);

  // Mark current tab as visited and trigger clear notifications side-effect
  useEffect(() => {
    if (activeTab) {
      setVisitedTabs(prev => ({
        ...prev,
        [activeTab]: true,
      }));

      if (activeTab === 'trends') {
        markTrendsAsReadForClient(clientId);
      }
    }
  }, [activeTab, clientId, markTrendsAsReadForClient]);

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

  if (loading) {
    return (
      <div className='h-full flex flex-col overflow-hidden p-6 md:p-8 flex-1 w-full max-w-full select-none'>
        {/* Title Header Skeleton */}
        <div className='mb-6 px-1 flex items-baseline justify-between gap-4 animate-pulse'>
          <div>
            <div className='flex items-center gap-2.5'>
              <span className='w-1 h-6 rounded-full bg-white/10' />
              <div className='h-7 w-48 rounded bg-white/15' />
            </div>
            <div className='h-3 w-32 rounded bg-white/5 mt-2.5 ml-3.5' />
          </div>
        </div>

        {/* Section Label */}
        <div className='h-3 w-28 rounded bg-white/10 animate-pulse mb-4 px-1' />

        {/* Bento Grid Skeleton */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rows-3 sm:grid-rows-2 lg:grid-rows-2 gap-5 flex-1 w-full min-h-0 mb-2'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='flex flex-col gap-3 w-full h-full relative overflow-hidden'>
              <div className='flex-1 w-full rounded-[24px] border border-white/5 bg-white/[0.02] shadow-lg relative overflow-hidden flex flex-col p-5 justify-center items-center'>
                {/* Shimmer sweep */}
                <div className='absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent' />
                {/* Noise overlay */}
                <div
                  className="absolute inset-0 rounded-inherit opacity-[0.05] mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.72' type='fractalNoise' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='1'/%3E%3C/svg%3E")`,
                  }}
                />
                
                {/* Avatar sphere */}
                <div className='w-16 h-16 rounded-full bg-white/10 animate-pulse mb-auto mt-4' />
                
                {/* Title */}
                <div className='h-3.5 w-2/3 rounded bg-white/15 animate-pulse mt-auto mb-2 self-start' />
              </div>
              
              {/* Footer metadata skeleton */}
              <div className='flex justify-between items-center px-2 w-full'>
                <div className='h-3 w-1/3 rounded bg-white/10 animate-pulse' />
                <div className='h-4 w-14 rounded-full bg-white/5 animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
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
             VISTA 1: BENTO PANEL DE CONTROL DEL CLIENTE (Look Cadence exact specs)
             ========================================================================= */
          <motion.div
            key='bento-panel'
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className='p-6 md:p-8 flex flex-col flex-1 h-full min-h-0 overflow-hidden w-full max-w-full'
          >
            {/* Sleek Professional Client Title Header */}
            <div className='mb-4.5 px-1 flex items-baseline justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-title font-extrabold text-white tracking-tight flex items-center gap-2.5'>
                  <span 
                    className='w-1 h-6 rounded-full' 
                    style={{ backgroundColor: client.brand_info?.card_color || '#7C5CFC' }}
                  />
                  {client.name}
                </h1>
                <p className='text-[11px] text-text-muted mt-1.5 ml-3.5 font-medium'>
                  {client.industry || 'Sin categoría/industria'}
                </p>
              </div>
            </div>

            {/* Label de Sección */}
            <div className='sec-lbl text-[9px] font-bold tracking-[0.12em] text-text-secondary uppercase mb-3 px-1'>
              Módulos del Cliente
            </div>

            {/* Bento Grid - 4 Columns spanning screen width and height to fit perfectly in viewport */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-rows-3 sm:grid-rows-2 lg:grid-rows-2 gap-5 flex-1 w-full min-h-0 mb-2'>
              {cards.map((card, index) => {
                // Calcular si esta tarjeta tiene notificaciones pendientes (ej. tendencias)
                let hasNotification = false;
                let badgeCount = 0;
                let adjustedCard = card;

                if (card.id === 'trends') {
                  const unreadTrends = notifications.filter(
                    n => n.type === 'trend' && n.clientId === clientId && !n.isRead
                  );
                  if (unreadTrends.length > 0) {
                    hasNotification = true;
                    badgeCount = unreadTrends.length;
                    adjustedCard = {
                      ...card,
                      stat: `${badgeCount} nueva${badgeCount > 1 ? 's' : ''} tendencia${badgeCount > 1 ? 's' : ''}`
                    };
                  } else {
                    adjustedCard = {
                      ...card,
                      stat: 'Monitoreo activo'
                    };
                  }
                }

                return (
                  <AgentBentoCard
                    key={card.id}
                    card={adjustedCard}
                    index={index}
                    draggedIndex={draggedIndex}
                    handleDragStart={handleDragStart}
                    handleDragOverCard={handleDragOverCard}
                    handleDragEnd={handleDragEnd}
                    onClick={() => selectTab(card.id)}
                    onChatClick={(c) => setActiveChatAgent(c)}
                    client={client}
                    hasNotification={hasNotification}
                    badgeCount={badgeCount}
                  />
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             VISTA 2: VISTA DETALLADA DEL MÓDULO CON BOTÓN VOLVER (Look Cadence Studio)
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
                            : activeTab === 'cm'
                              ? 'CM Inteligente'
                              : activeTab === 'design'
                                ? 'Estudio de Diseño'
                                : 'Identidad'}
                  </span>
                </div>
              </div>

              {/* Acciones específicas del Cronograma o indicador por defecto */}
              {activeTab === 'schedule' ? (
                <div className='flex items-center gap-2'>
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
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-1.5'>
                    <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                    <span className='text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono'>
                      Aura Online
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Contenedor del módulo real */}
            <div className={`flex-1 w-full relative ${activeTab === 'identity' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <Suspense
                fallback={
                  <div className='flex-1 w-full h-full flex flex-col items-center justify-center select-none gap-4 p-8 min-h-[300px]'>
                    <div className='relative w-12 h-12'>
                      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-[#7C5CFC]/20 to-[#4ECDC4]/10 blur-md animate-pulse' />
                      <div className='w-full h-full rounded-full border-2 border-white/5 border-t-[#7C5CFC] animate-spin' />
                    </div>
                    <span className='text-[10px] tracking-[0.15em] text-text-muted uppercase font-bold animate-pulse'>
                      Iniciando módulo de IA...
                    </span>
                  </div>
                }
              >
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
                <div style={{ display: activeTab === 'cm' ? 'block' : 'none' }}>
                  {visitedTabs.cm && <CMSection clientId={clientId} />}
                </div>
                <div style={{ display: activeTab === 'design' ? 'block' : 'none' }}>
                  {visitedTabs.design && <DesignSection clientId={clientId} />}
                </div>
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante persistente de Aura (Mini Copiloto) */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-auto">
        <motion.button
          onClick={() => setActiveChatAgent({ id: 'general', name: 'Aura' })}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative group flex items-center gap-3 pl-3 pr-4.5 py-2.5 rounded-full bg-slate-900/90 border border-white/10 hover:border-[#7C5CFC]/30 text-white font-title font-bold text-xs shadow-2xl transition-all duration-300 backdrop-blur-md cursor-pointer"
        >
          {/* Glowing background blur */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7C5CFC]/20 to-[#4ECDC4]/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
          
          <div className="relative w-7 h-7 rounded-full overflow-hidden p-0.5 border border-white/10 bg-black/40">
            <InteractiveAvatar 
              variant="ai" 
              state={activeChatAgent ? 'talking' : 'idle'} 
              size="sm" 
              className="w-full h-full" 
              interactive={false} 
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black animate-pulse" />
          </div>
          
          <div className="text-left flex flex-col justify-center leading-none">
            <span className="text-[9.5px] text-text-secondary font-medium tracking-wide uppercase">Copiloto</span>
            <span className="text-[11px] font-black text-white mt-0.5">Consultar a Aura</span>
          </div>
        </motion.button>
      </div>

      {/* Panel de Chat Lateral Deslizable */}
      <AnimatePresence>
        {activeChatAgent && (
          <AgentChatPanel
            clientId={clientId}
            agent={activeChatAgent}
            onClose={() => setActiveChatAgent(null)}
            client={client}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
