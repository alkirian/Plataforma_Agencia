import React, { useState, useEffect, Fragment, Suspense, lazy } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { getClientById } from '../api/clients';
import { useNotifications } from '../hooks/useNotifications';
import { aiGenerationManager } from '../utils/aiGenerationManager';

// Lazy loading de módulos pesados
const ScheduleSection = lazy(() =>
  import('../components/schedule/ScheduleSection').then(m => ({ default: m.ScheduleSection }))
);
const BrandIdentitySection = lazy(() =>
  import('../components/brand/BrandIdentitySection').then(m => ({ default: m.BrandIdentitySection }))
);
const TrendsSection = lazy(() =>
  import('../components/trends/TrendsSection').then(m => ({ default: m.TrendsSection }))
);

const CMSection = lazy(() =>
  import('../components/cm/CMSection').then(m => ({ default: m.CMSection }))
);
const DesignSection = lazy(() =>
  import('../components/design/DesignSection').then(m => ({ default: m.DesignSection }))
);
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks';
import { WelcomeGuideModal } from '../components/onboarding/WelcomeGuideModal';
import { BrandCompleteModal } from '../components/onboarding/BrandCompleteModal';
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
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { AgentBentoCard } from '../components/ui';

// Caché global en memoria para persistir la información básica de clientes entre montajes
const clientCache = new Map();

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(124, 92, 252, ${alpha})`;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Definición de las Tarjetas de Agentes Bento con iconos premium SVGs
const agentCards = [
  {
    id: 'cm',
    name: 'Redes Sociales',
    icon: ChatBubbleLeftRightIcon,
    grad: 'linear-gradient(140deg, #0b3c2c 0%, #11998e 55%, #38ef7d 100%)',
    color: '#38ef7d',
    stat: 'Gestión y Pauta Ads',
  },
  {
    id: 'trends',
    name: 'Ideas',
    icon: ArrowTrendingUpIcon,
    grad: 'linear-gradient(140deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
    color: '#4ECDC4',
    stat: '8 tendencias hoy',
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
    id: 'identity',
    name: 'Mi Marca',
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

const SECTIONS = [
  { id: 'schedule', label: 'Cronograma', icon: CalendarIcon },
  { id: 'trends', label: 'Ideas', icon: ArrowTrendingUpIcon },
  { id: 'cm', label: 'Redes Sociales', icon: ChatBubbleLeftRightIcon },
  { id: 'identity', label: 'Mi Marca', icon: SparklesIcon },
  { id: 'design', label: 'Estudio de Diseño', icon: PhotoIcon },
];

const tabAesthetics = {
  cm: { bg: '#65C596', text: '#14291E' },
  trends: { bg: '#8B5CF6', text: '#FFFFFF' },
  schedule: { bg: '#FBEED5', text: '#352918' },
  identity: { bg: '#EAEAEA', text: '#202020' },
  design: { bg: '#FFCB45', text: '#2C1F02' }
};

const getCardSize = (idx, colsCount) => {
  if (idx === 0 && colsCount > 1) return { cols: 2, rows: 1 };
  return { cols: 1, rows: 1 };
};

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const { profile, isOwnBusiness } = useAuth();
  const { lang, t } = useLanguage();

  const getTabLabel = (id, defaultLabel) => {
    if (isOwnBusiness) {
      if (id === 'cm') return lang === 'es' ? 'Redes Sociales' : 'Social Media';
      if (id === 'trends') return lang === 'es' ? 'Inspiración' : 'Inspiration';
      if (id === 'schedule') return t.clientDetail.tabSchedule;
      if (id === 'identity') return lang === 'es' ? 'Mi Negocio' : 'My Business';
      if (id === 'design') return lang === 'es' ? 'Creador de Imágenes' : 'Image Creator';
    }
    if (id === 'cm') return t.clientDetail.tabCm;
    if (id === 'trends') return t.clientDetail.tabTrends;
    if (id === 'schedule') return t.clientDetail.tabSchedule;
    if (id === 'identity') return t.clientDetail.tabIdentity;
    if (id === 'design') return t.clientDetail.tabDesign;
    return defaultLabel;
  };
  
  const { notifications, markTrendsAsReadForClient } = useNotifications();

  // --- Guía de bienvenida para negocio propio (primer acceso) ---
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  const handleWelcomeStart = () => {
    localStorage.setItem(`cadence_welcome_shown_${profile?.id}`, '1');
    setShowWelcomeGuide(false);
    setSearchParams({ tab: 'identity' });
  };

  const handleWelcomeSkip = () => {
    localStorage.setItem(`cadence_welcome_shown_${profile?.id}`, '1');
    setShowWelcomeGuide(false);
  };
  // -------------------------------------------------------------------

  // --- Modal de celebración: marca 100% completa ---
  const [showBrandComplete, setShowBrandComplete] = useState(false);

  useEffect(() => {
    if (!isOwnBusiness || !profile?.id) return;
    const handleBrandComplete = (e) => {
      if (e.detail?.clientId !== clientId) return;
      const key = `cadence_brand_complete_shown_${profile.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        setShowBrandComplete(true);
      }
    };
    window.addEventListener('cadence:brand-complete', handleBrandComplete);
    return () => window.removeEventListener('cadence:brand-complete', handleBrandComplete);
  }, [isOwnBusiness, profile?.id, clientId]);
  // -----------------------------------------------

  const [gridCols, setGridCols] = useState(3);

  useEffect(() => {
    const updateCols = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setGridCols(3);
      } else if (width >= 640) {
        setGridCols(2);
      } else {
        setGridCols(1);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  // Si la pestaña no está definida o no es una de las reales, mostramos el Panel Bento
  const activeTab = ['schedule', 'identity', 'trends', 'cm', 'design'].includes(requestedTab)
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

  // useEffect movido aquí para que `client` ya esté declarado (evita TDZ error)
  useEffect(() => {
    if (!isOwnBusiness || !profile?.id || !client) return;
    const key = `cadence_welcome_shown_${profile.id}`;
    if (!localStorage.getItem(key)) {
      setShowWelcomeGuide(true);
    }
  }, [isOwnBusiness, profile?.id, client]);

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
    cm: false,
    design: false,
  });

  const [isAiGenerating, setIsAiGenerating] = useState(() => aiGenerationManager.isGenerating(clientId));
  const [aiIdeasCount, setAiIdeasCount] = useState(() => aiGenerationManager.getIdeas(clientId).length);

  useEffect(() => {
    setIsAiGenerating(aiGenerationManager.isGenerating(clientId));
    setAiIdeasCount(aiGenerationManager.getIdeas(clientId).length);
    
    const unsubscribe = aiGenerationManager.subscribe(() => {
      setIsAiGenerating(aiGenerationManager.isGenerating(clientId));
      setAiIdeasCount(aiGenerationManager.getIdeas(clientId).length);
    });
    return unsubscribe;
  }, [clientId]);

  // Estado para las tarjetas ordenables
  const [cards, setCards] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Cargar orden inicial al montar o cuando el clientId cambie
  useEffect(() => {
    if (!clientId) return;

    const saved = localStorage.getItem(`cadence_client_layout_${clientId}`);
    if (saved) {
      try {
        const layout = JSON.parse(saved);
        if (layout && Array.isArray(layout.order)) {
          const ids = layout.order;
          const mapped = ids.map(id => agentCards.find(c => c.id === id)).filter(Boolean);
          const missing = agentCards.filter(c => !ids.includes(c.id));
          setCards([...mapped, ...missing]);
          return;
        }
      } catch (e) {
        console.error('Error parsing saved card layout', e);
      }
    }

    // Default Fallback
    setCards(agentCards);
  }, [clientId]);

  // Gestores de eventos de Drag & Drop
  const lastSwapTime = React.useRef(0);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOverCard = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const now = Date.now();
    if (now - lastSwapTime.current < 200) return;
    lastSwapTime.current = now;

    // Intercambiar posiciones en caliente
    const newCards = [...cards];
    const draggedItem = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setCards(newCards);

    // Guardar el layout completo en localStorage
    const layout = {
      order: newCards.map(c => c.id)
    };
    localStorage.setItem(`cadence_client_layout_${clientId}`, JSON.stringify(layout));
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
          </div>
        </div>



        {/* Bento Grid Skeleton */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[200px] md:auto-rows-[220px] lg:auto-rows-[240px] flex-1 w-full min-h-0 mb-2'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='w-full h-full rounded-[24px] border border-white/5 bg-white/[0.02] shadow-lg relative overflow-hidden flex flex-col p-5 justify-center items-center'>
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
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div className='text-center py-20 text-red-500'>Error: {error}</div>;
  if (!client)
    return <div className='text-center py-20 text-text-muted'>{t.clientDetail.clientNotFound || 'Cliente no encontrado.'}</div>;

  // Manejar navegación de pestañas
  const selectTab = tabId => {
    if (tabId) {
      setSearchParams({ tab: tabId });
    } else {
      setSearchParams({});
    }
  };

  const renderSkeleton = (tab) => {
    const isEs = lang === 'es';
    switch (tab) {
      case 'schedule':
        return (
          <div className='w-full h-full p-6 space-y-6 animate-pulse select-none'>
            <div className='flex justify-between items-center pb-4 border-b border-border-subtle'>
              <div className='h-6 w-32 bg-surface-soft rounded-lg' />
              <div className='flex gap-2'>
                <div className='h-8 w-16 bg-surface-soft rounded-lg' />
                <div className='h-8 w-24 bg-surface-soft rounded-lg' />
              </div>
            </div>
            <div className='grid grid-cols-7 gap-2 h-[450px]'>
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className='bg-surface-soft/40 border border-border-subtle/50 rounded-xl p-2 flex flex-col justify-between h-full'>
                  <div className='h-3 w-4 bg-surface-soft rounded' />
                  <div className='space-y-1'>
                    {idx % 4 === 0 && <div className='h-3.5 w-full bg-accent-lavender/10 rounded border border-accent-lavender/25' />}
                    {idx % 6 === 0 && <div className='h-3.5 w-full bg-accent-sage/10 rounded border border-accent-sage/25' />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'identity':
        return (
          <div className='w-full h-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse select-none text-left'>
            <div className='lg:col-span-5 space-y-4'>
              <div className='bg-surface-soft/40 border border-border-subtle rounded-2xl p-4 space-y-3 h-48' />
              <div className='bg-surface-soft/40 border border-border-subtle rounded-2xl p-4 space-y-3 h-64' />
              <div className='h-10 w-full bg-gradient-to-r from-accent-lavender/30 to-accent-sage/20 rounded-xl' />
            </div>
            <div className='lg:col-span-7 bg-surface-soft/40 border border-border-subtle rounded-2xl p-6 space-y-5 h-full min-h-[450px]'>
              <div className='flex justify-between border-b border-border-subtle pb-3'>
                <div className='h-4 w-28 bg-surface-soft rounded' />
                <div className='h-6 w-32 bg-surface-soft rounded-lg' />
              </div>
              <div className='space-y-3'>
                <div className='h-3.5 w-2/3 bg-surface-soft rounded' />
                <div className='h-3.5 w-full bg-surface-soft rounded' />
                <div className='h-24 w-full bg-surface-soft/50 rounded-xl' />
                <div className='h-3.5 w-5/6 bg-surface-soft rounded' />
                <div className='h-3.5 w-4/5 bg-surface-soft rounded' />
              </div>
            </div>
          </div>
        );
      case 'trends':
        return (
          <div className='w-full h-full p-6 space-y-6 animate-pulse select-none text-left'>
            <div className='h-6 w-48 bg-surface-soft rounded' />
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className='bg-surface-soft/40 border border-border-subtle rounded-2xl p-5 space-y-4 h-48 flex flex-col justify-between'>
                  <div className='space-y-2'>
                    <div className='h-4 w-3/4 bg-surface-soft rounded' />
                    <div className='h-3.5 w-full bg-surface-soft rounded' />
                    <div className='h-3.5 w-5/6 bg-surface-soft rounded' />
                  </div>
                  <div className='flex justify-between items-center pt-2 border-t border-border-subtle/55'>
                    <div className='h-5 w-16 bg-surface-soft rounded-full' />
                    <div className='h-5 w-20 bg-surface-soft rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cm':
        return (
          <div className='w-full h-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse select-none text-left'>
            <div className='lg:col-span-4 bg-surface-soft/40 border border-border-subtle rounded-2xl p-4 h-[450px]' />
            <div className='lg:col-span-8 bg-surface-soft/40 border border-border-subtle rounded-2xl p-6 h-[450px]' />
          </div>
        );
      case 'design':
        return (
          <div className='w-full h-full p-6 space-y-6 animate-pulse select-none text-left'>
            <div className='flex justify-between items-center'>
              <div className='h-6 w-36 bg-surface-soft rounded' />
              <div className='h-9 w-24 bg-surface-soft rounded-lg' />
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className='space-y-2'>
                  <div className='bg-surface-soft/40 border border-border-subtle rounded-2xl aspect-square w-full' />
                  <div className='h-3.5 w-3/4 bg-surface-soft rounded' />
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className='flex-1 w-full h-full flex flex-col items-center justify-center select-none gap-4 p-8 min-h-[300px]'>
            <div className='relative w-12 h-12'>
              <div className='absolute inset-0 rounded-full bg-gradient-to-br from-[#7C5CFC]/20 to-[#4ECDC4]/10 blur-md animate-pulse' />
              <div className='w-full h-full rounded-full border-2 border-white/5 border-t-[#7C5CFC] animate-spin' />
            </div>
            <span className='text-[10px] tracking-[0.15em] text-text-muted uppercase font-bold animate-pulse'>
              {isEs ? 'Iniciando módulo de IA...' : 'Starting AI module...'}
            </span>
          </div>
        );
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
            <div className='mb-6 px-1 flex flex-col items-center justify-center w-full gap-3'>
              <h1 className='text-2xl sm:text-3xl font-title font-extrabold text-text-primary tracking-tight text-center'>
                {client.name}
              </h1>
              {/* Fade separator line between title and bentocards */}
              <div 
                className='h-[2px] w-36 sm:w-48 rounded-full opacity-80'
                style={{ 
                  background: `linear-gradient(to right, transparent, ${client.brand_info?.card_color || '#7C5CFC'}, transparent)` 
                }}
              />
            </div>



            {/* Bento Grid - Mosaic grid with no gaps and dynamic packing */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense gap-0 auto-rows-[220px] sm:auto-rows-fr sm:h-full rounded-[28px] overflow-hidden border border-black/10 dark:border-white/10 flex-1 w-full min-h-0 mb-2 bg-[#121220]/20'>
              {cards.map((card, index) => {
                // Map card names/stats to translations
                const localizedCard = {
                  ...card,
                  name: getTabLabel(card.id, card.name),
                  stat: card.id === 'cm' ? t.clientDetail.statCm :
                        card.id === 'trends' ? t.clientDetail.statTrends :
                        card.id === 'schedule' ? t.clientDetail.statSchedule :
                        card.id === 'identity' ? t.clientDetail.statIdentity :
                        card.id === 'design' ? t.clientDetail.statDesign : card.stat
                };

                // Calcular si esta tarjeta tiene notificaciones pendientes (ej. tendencias)
                let hasNotification = false;
                let badgeCount = 0;
                let adjustedCard = localizedCard;

                if (card.id === 'trends') {
                  const unreadTrends = notifications.filter(
                    n => n.type === 'trend' && n.clientId === clientId && !n.isRead
                  );
                  if (unreadTrends.length > 0) {
                    hasNotification = true;
                    badgeCount = unreadTrends.length;
                    adjustedCard = {
                      ...localizedCard,
                      stat: lang === 'es'
                        ? `${badgeCount} nueva${badgeCount > 1 ? 's' : ''} tendencia${badgeCount > 1 ? 's' : ''}`
                        : `${badgeCount} new trend${badgeCount > 1 ? 's' : ''}`
                    };
                  } else {
                    adjustedCard = {
                      ...localizedCard,
                      stat: lang === 'es' ? 'Monitoreo activo' : 'Active monitoring'
                    };
                  }
                }

                const size = getCardSize(index, gridCols);

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
                    cols={size.cols}
                    rows={size.rows}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='flex-1 flex flex-col h-full overflow-hidden'
          >
            {/* Top Back-bar */}
            <div className='back-bar bg-app-sidebar border-b border-border-subtle px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0 z-10'>
              {/* Left side: Back Button */}
              <div className='flex items-center gap-3 w-full md:w-1/4 justify-between md:justify-start'>
                <button
                  onClick={() => selectTab(null)}
                  className='back-btn flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-xs'
                >
                  <ChevronLeftIcon className='h-3.5 w-3.5' />
                  <span>{t.common.back || (lang === 'es' ? 'Volver' : 'Back')}</span>
                </button>
              </div>

              {/* Center side: Pill tabs navigation */}
              <div className='flex items-center justify-center overflow-x-auto scrollbar-none max-w-full py-0.5 md:w-2/4'>
                <div className='flex items-center gap-1 bg-surface-soft/60 p-1 rounded-full backdrop-blur-md shadow-xs flex-nowrap'>
                  {SECTIONS.map((sec) => {
                    const isSecActive = activeTab === sec.id;
                    const SecIcon = sec.icon;
                    const aesthetics = tabAesthetics[sec.id] || { bg: '#7C5CFC', text: '#FFFFFF' };
                    return (
                      <button
                        key={sec.id}
                        onClick={() => selectTab(sec.id)}
                        className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] ${
                          isSecActive
                            ? 'shadow-sm font-black'
                            : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                        }`}
                        style={{
                          backgroundColor: isSecActive ? aesthetics.bg : 'transparent',
                          color: isSecActive ? aesthetics.text : 'var(--color-text-muted)'
                        }}
                      >
                        <SecIcon 
                          className="w-3.5 h-3.5" 
                          style={{ color: isSecActive ? aesthetics.text : 'var(--color-text-muted)' }}
                        />
                        <span>
                          {getTabLabel(sec.id, sec.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right side: Section-specific actions */}
              <div className='flex items-center justify-end gap-2 w-full md:w-1/4'>
                {activeTab === 'schedule' ? (
                  <>
                    <button
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent('cadence:calendar-action', { detail: { action: 'deliverables' } })
                        )
                      }
                      className='flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-xs'
                    >
                      <PhotoIcon className='h-3.5 w-3.5 text-blue-400' />
                      <span>{lang === 'es' ? 'Ver Entregables' : 'View Deliverables'}</span>
                    </button>

                    <button
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent('cadence:calendar-action', { detail: { action: 'ai-gen' } })
                        )
                      }
                      className='relative flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-xs'
                    >
                      {isAiGenerating ? (
                        <>
                          <div className='w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0' />
                          <span>{lang === 'es' ? 'Generando...' : 'Generating...'}</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className='h-3.5 w-3.5 text-emerald-400 shrink-0' />
                          <span>{lang === 'es' ? 'Generar con IA' : 'Generate with AI'}</span>
                        </>
                      )}

                      {aiIdeasCount > 0 && !isAiGenerating && (
                        <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse">
                          {aiIdeasCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu de Opciones (...) */}
                    <Menu as='div' className='relative inline-block text-left'>
                      <div>
                        <Menu.Button className='inline-flex items-center justify-center p-2 rounded-full border border-border-subtle bg-surface text-text-muted hover:text-text-primary transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] focus:outline-none cursor-pointer shadow-xs'>
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
                        <Menu.Items className='absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-border-subtle bg-surface-soft p-1.5 shadow-2xl focus:outline-none z-50'>
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
                                  } group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors`}
                                >
                                  <ArrowUpTrayIcon className='h-3.5 w-3.5 text-text-secondary' />
                                  <span>{lang === 'es' ? 'Importar archivo' : 'Import file'}</span>
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
                                  } group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors`}
                                >
                                  <LinkIcon className='h-3.5 w-3.5 text-text-secondary' />
                                  <span>{lang === 'es' ? 'Compartir aprobación' : 'Share approval'}</span>
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
                                  } group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors`}
                                >
                                  <TrashIcon className='h-3.5 w-3.5 text-red-500/60' />
                                  <span>{lang === 'es' ? 'Limpiar Cronograma' : 'Clear Schedule'}</span>
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </>
                ) : (
                  <>
                    {activeTab === 'cm' && (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('cadence:open-cm-rules'));
                        }}
                        className='flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary text-[11px] font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-xs'
                      >
                        <ShieldCheckIcon className='h-3.5 w-3.5 text-accent-cyan' />
                        <span>{lang === 'es' ? 'Reglas y Canales' : 'Rules & Channels'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contenedor del módulo real */}
            <div className={`flex-1 w-full relative ${(activeTab === 'identity' || activeTab === 'schedule') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <Suspense fallback={renderSkeleton(activeTab)}>
                <div 
                  className={`w-full h-full transition-all duration-300 transform ${
                    activeTab === 'schedule' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                      : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  }`}
                >
                  {visitedTabs.schedule && <ScheduleSection clientId={clientId} />}
                </div>
                <div 
                  className={`w-full h-full transition-all duration-300 transform ${
                    activeTab === 'identity' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                      : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  }`}
                >
                  {visitedTabs.identity && <BrandIdentitySection clientId={clientId} />}
                </div>
                <div 
                  className={`w-full h-full transition-all duration-300 transform ${
                    activeTab === 'trends' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                      : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  }`}
                >
                  {visitedTabs.trends && <TrendsSection clientId={clientId} client={client} />}
                </div>

                <div 
                  className={`w-full h-full transition-all duration-300 transform ${
                    activeTab === 'cm' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                      : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  }`}
                >
                  {visitedTabs.cm && <CMSection clientId={clientId} />}
                </div>
                <div 
                  className={`w-full h-full transition-all duration-300 transform ${
                    activeTab === 'design' 
                      ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                      : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  }`}
                >
                  {visitedTabs.design && <DesignSection clientId={clientId} />}
                </div>
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guía de bienvenida — solo negocio propio, solo primera vez */}
      {showWelcomeGuide && (
        <WelcomeGuideModal
          businessName={client?.name}
          onStart={handleWelcomeStart}
          onSkip={handleWelcomeSkip}
        />
      )}

      {/* Celebración — marca 100% completa, solo una vez */}
      {showBrandComplete && (
        <BrandCompleteModal
          clientId={clientId}
          onClose={() => setShowBrandComplete(false)}
        />
      )}
    </div>
  );
};
