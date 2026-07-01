import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getClients, getClientById, updateClient, updateClientCardColor, deleteClient } from '../../api/clients';
import { compressBrandLogo } from '../../utils/imageCompressor';

import { 
  PlusIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  EllipsisVerticalIcon, 
  BriefcaseIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ClientSearchModal } from '../ui/ClientSearchModal';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications, useLanguage, useAuth } from '../../hooks';
import { CadenceLogoCronogramaDigital } from '../ui';
import { ShortcutTooltip } from '../ui/Tooltip';
import { extractDominantColor } from '../../utils/colorExtractor';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';


const SECTIONS = [
  { id: 'schedule', label: 'Cronograma', icon: CalendarIcon },
  { id: 'trends', label: 'Ideas', icon: ArrowTrendingUpIcon },
  { id: 'cm', label: 'Redes Sociales', icon: ChatBubbleLeftRightIcon },
  { id: 'identity', label: 'Mi Marca', icon: SparklesIcon },
  { id: 'design', label: 'Estudio de Diseño', icon: PhotoIcon },
];

export const Sidebar = ({ userEmail, profile, onLogout, isCollapsed }) => {
  const { lang, t } = useLanguage();
  const { isOwnBusiness } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabLabel = (id, defaultLabel) => {
    if (isOwnBusiness) {
      if (id === 'cm') return lang === 'es' ? 'Redes Sociales' : 'Social Media';
      if (id === 'trends') return lang === 'es' ? 'Inspiración' : 'Inspiration';
      if (id === 'schedule') return t.clientDetail.tabSchedule || 'Cronograma';
      if (id === 'identity') return lang === 'es' ? 'Mi Negocio' : 'My Business';
      if (id === 'design') return lang === 'es' ? 'Creador de Imágenes' : 'Image Creator';
    }
    return defaultLabel;
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const queryClient = useQueryClient();
  const animatedRef = useRef(false);

  // Estados para la edición de clientes
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editLogo, setEditLogo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para el menú contextual y papelera
  const [activeDropdownClientId, setActiveDropdownClientId] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);



  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeDropdownClientId && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdownClientId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeDropdownClientId]);

  // Escuchar evento global de restauración
  useEffect(() => {
    const handleRestoreEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    };
    window.addEventListener('cadence:client-restored', handleRestoreEvent);
    return () => window.removeEventListener('cadence:client-restored', handleRestoreEvent);
  }, [queryClient]);



  // Consultar clientes reales
  const { data: response } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const clients = response?.data || [];

  // Calcula el % de completitud de la marca para negocio propio
  const getBrandProgress = (client) => {
    if (!client) return { pct: 0, missing: [] };
    const checks = [
      { label: 'Descripción del negocio', ok: !!client.business_description?.trim() },
      { label: 'Tono de comunicación', ok: !!client.tone_detected?.trim() },
      { label: 'Público objetivo', ok: !!client.target_audience?.trim() },
      { label: 'Colores de marca', ok: (client.color_palette?.length || client.brand_info?.color_palette?.length || 0) > 0 },
      { label: 'Redes sociales', ok: !!(client.instagram_url || client.website_url || client.facebook_url) },
    ];
    const done = checks.filter(c => c.ok).length;
    const missing = checks.filter(c => !c.ok).map(c => c.label);
    return { pct: Math.round((done / checks.length) * 100), done, total: checks.length, missing };
  };

  const prefetchClientData = (clientId) => {
    if (!clientId) return;
    queryClient.prefetchQuery({
      queryKey: ['client', clientId],
      queryFn: () => getClientById(clientId).then(res => res.data),
      staleTime: 1000 * 60 * 5, // Considerar frescos por 5 minutos
    });
  };

  const containerRef = useRef(null);

  // Animación interactiva fluida para la barra lateral y los clientes con GSAP
  useGSAP(() => {
    const items = gsap.utils.toArray(".client-item");

    items.forEach((item) => {
      const initialsCircle = item.querySelector(".client-ini");
      const clientName = item.querySelector(".client-name");
      const activeIndicatorDot = item.querySelector(".client-dot");
      const activeState = item.dataset.active === "true";
      const brandColor = item.dataset.color;

      const handleMouseEnter = () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        // Efecto expansivo y deslizamiento lateral
        gsap.to(item, {
          x: 6,
          backgroundColor: activeState 
            ? `${brandColor}2b` 
            : (isLight ? "rgba(24, 119, 242, 0.08)" : "rgba(255, 255, 255, 0.08)"),
          borderColor: activeState
            ? `${brandColor}66`
            : (isLight ? "rgba(24, 119, 242, 0.15)" : "rgba(255, 255, 255, 0.12)"),
          duration: 0.35,
          ease: "power2.out"
        });

        // Rotación y pop de las iniciales
        gsap.to(initialsCircle, {
          scale: 1.12,
          rotation: 12,
          borderColor: `${brandColor}aa`,
          backgroundColor: `${brandColor}38`,
          duration: 0.35,
          ease: "back.out(2)"
        });

        // Deslizar levemente el texto hacia la derecha
        gsap.to(clientName, {
          x: 2,
          color: isLight ? "#1877f2" : "#ffffff",
          duration: 0.3
        });

        // Escalar e imantar el punto de estado activo al final
        gsap.to(activeIndicatorDot, {
          scale: 1.5,
          x: -2,
          duration: 0.35,
          ease: "back.out(3.5)"
        });
      };

      const handleMouseLeave = () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        // Retorno elástico al estado de reposo inicial
        gsap.to(item, {
          x: 0,
          backgroundColor: activeState
            ? `${brandColor}${isLight ? '1a' : '1c'}`
            : (isLight ? "transparent" : "rgba(255, 255, 255, 0.02)"),
          borderColor: activeState
            ? `${brandColor}${isLight ? '33' : '38'}`
            : (isLight ? "transparent" : "rgba(255, 255, 255, 0.04)"),
          duration: 0.45,
          ease: "power2.out"
        });

        gsap.to(initialsCircle, {
          scale: 1,
          rotation: 0,
          borderColor: `${brandColor}40`,
          backgroundColor: `${brandColor}20`,
          duration: 0.45,
          ease: "power2.out"
        });

        gsap.to(clientName, {
          x: 0,
          color: "",
          duration: 0.4
        });

        gsap.to(activeIndicatorDot, {
          scale: 1,
          x: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      };

      const handleClick = () => {
        // Animación de pop/latido al seleccionar un cliente
        gsap.fromTo(item,
          { scale: 0.94 },
          { scale: 1, duration: 0.55, ease: "elastic.out(1.2, 0.45)" }
        );
        gsap.fromTo(initialsCircle,
          { rotation: -20, scale: 0.85 },
          { rotation: 0, scale: 1, duration: 0.65, ease: "back.out(2.2)" }
        );
      };

      item.addEventListener("mouseenter", handleMouseEnter);
      item.addEventListener("mouseleave", handleMouseLeave);
      item.addEventListener("click", handleClick);

      // Conservamos las referencias en el DOM para la limpieza
      item._gsapEnter = handleMouseEnter;
      item._gsapLeave = handleMouseLeave;
      item._gsapClick = handleClick;
    });

    // Entrada elegante escalonada para los clientes al montar (solo se ejecuta una vez al tener clientes)
    if (items.length > 0 && !animatedRef.current) {
      gsap.fromTo(".client-item",
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power2.out", delay: 0.15 }
      );

      // Entrada elegante para el botón de agregar cliente
      gsap.fromTo(".add-client",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)", delay: 0.4 }
      );

      animatedRef.current = true;
    }

    return () => {
      items.forEach((item) => {
        item.removeEventListener("mouseenter", item._gsapEnter);
        item.removeEventListener("mouseleave", item._gsapLeave);
        item.removeEventListener("click", item._gsapClick);
      });
    };
  }, { scope: containerRef, dependencies: [clients, location.pathname] });

  // Notificaciones
  const {
    notifications,
    groupedNotifications,
    stats,
    markAsRead,
    markAllAsRead,
    markAllAsViewed,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const handleOpenNotifications = () => {
    setIsNotificationPanelOpen(true);
    if (notifications.length > 0) {
      markAllAsViewed();
    }
  };

  const handleCreateClient = () => {
    // Si estamos en la página del Dashboard, podemos abrir el modal directamente,
    // de lo contrario navegamos al dashboard y abrimos el modal
    if (location.pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('cadence:open-create-client'));
    } else {
      navigate('/dashboard');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cadence:open-create-client'));
      }, 100);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedClient || !editName.trim()) return;
    setIsSaving(true);
    try {
      await Promise.all([
        updateClient(selectedClient.id, {
          name: editName.trim(),
          industry: editIndustry.trim(),
          logo_url: editLogo,
        }),
        updateClientCardColor(selectedClient.id, editColor)
      ]);
      
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ queryKey: ['client', selectedClient.id] });

      setIsEditModalOpen(false);
      setSelectedClient(null);
      setEditLogo(null);
      toast.success(
        isLight ? 'Cambios guardados con éxito' : 'Changes saved successfully'
      );
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al guardar los cambios: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClientSubmit = async () => {
    if (!selectedClient || deleteConfirmationName !== selectedClient.name) return;
    setIsSaving(true);
    try {
      await deleteClient(selectedClient.id);
      
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Si el cliente eliminado es el activo actual, redirigir
      if (location.pathname.includes(selectedClient.id)) {
        navigate('/dashboard');
      }
      
      setIsConfirmingDelete(false);
      setIsEditModalOpen(false);
      setSelectedClient(null);
      setDeleteConfirmationName('');
      setEditLogo(null);
      toast.success(
        profile?.role === 'admin'
          ? 'Cliente enviado a la papelera (se conservará por 7 días).'
          : 'Cliente eliminado correctamente.'
      );
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar cliente: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Colores alternativos para las iniciales del cliente
  const colors = ['#FF6B6B', '#4ECDC4', '#7C5CFC', '#FFD166', '#68D391', '#F06292'];
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  return (
    <>
      <aside
        ref={containerRef}
        id='sidebar'
        className={`w-[240px] min-w-[240px] bg-app-sidebar border-r border-border-subtle flex flex-col h-screen overflow-hidden select-none z-30 font-sans transition-all duration-300 ease-in-out ${
          isCollapsed ? '!w-0 !min-w-0 !border-r-0 opacity-0 pointer-events-none' : ''
        }`}
      >
        <div className="w-[240px] h-full flex flex-col flex-shrink-0 overflow-hidden">
      {/* Logo Area (Look Cadence exact specs) */}
      <ShortcutTooltip shortcut="Alt + D" description={lang === 'es' ? 'Ir al Dashboard' : 'Go to Dashboard'} side="right">
        <Link
          to={
            isOwnBusiness 
              ? (clients[0]?.id || localStorage.getItem('cadence_last_active_client_id') 
                  ? `/clients/${clients[0]?.id || localStorage.getItem('cadence_last_active_client_id')}` 
                  : '/dashboard')
              : '/dashboard'
          }
          data-tour="sidebar-logo"
          className='sb-logo group p-5 border-b border-border-subtle cursor-pointer flex items-center gap-3 select-none w-full'
        >
          <motion.div 
            className='w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[12px] bg-surface-soft border border-border-subtle p-1.5 shadow-sm'
            whileHover={{ 
              scale: 1.08,
              borderColor: "var(--color-border-strong)",
              boxShadow: "var(--card-shadow)"
            }}
            transition={{ type: "spring", stiffness: 350, damping: 14 }}
          >
            <CadenceLogoCronogramaDigital className='w-full h-full text-primary' animated={false} />
          </motion.div>
          <div className='flex flex-col min-w-0'>
            <span className='sb-logo-name font-title font-black text-[15px] tracking-tight text-text-primary leading-tight truncate'>
              Cadence
            </span>
          </div>
        </Link>
      </ShortcutTooltip>

      <div data-tour="client-list" className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
        {isOwnBusiness && clients.length > 0 ? (
          <div className="space-y-1">
            <div className='flex items-center gap-2 mb-4 px-2'>
              <BriefcaseIcon className="w-3.5 h-3.5 text-text-muted" />
              <span className='text-[10px] font-extrabold tracking-[0.14em] text-text-muted uppercase'>
                {clients[0].name || (lang === 'es' ? 'Mi Negocio' : 'My Business')}
              </span>
            </div>
            
            {SECTIONS.map((sec) => {
              const queryParams = new URLSearchParams(location.search);
              const activeTab = queryParams.get('tab');
              const isTabActive = location.pathname.startsWith(`/clients/${clients[0].id}`) && activeTab === sec.id;
              const SecIcon = sec.icon;
              const label = getTabLabel(sec.id, sec.label);
              
              return (
                <Link
                  key={sec.id}
                  to={`/clients/${clients[0].id}?tab=${sec.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent select-none relative cursor-pointer hover:no-underline transition-all duration-200 ${
                    isTabActive
                      ? 'text-text-primary font-bold bg-surface-soft border-border-subtle shadow-xs'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-soft/40'
                  }`}
                  style={{
                    backgroundColor: isTabActive ? 'rgba(24, 119, 242, 0.08)' : 'transparent',
                    borderColor: isTabActive ? 'rgba(24, 119, 242, 0.15)' : 'transparent',
                  }}
                >
                  {isTabActive && (
                    <div 
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] rounded-r-md bg-accent-cyan"
                    />
                  )}
                  <SecIcon className={`w-5 h-5 ${isTabActive ? 'text-accent-cyan' : 'text-text-muted'}`} />
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              );
            })}

            {/* Widget de progreso de marca */}
            {(() => {
              const ownClient = clients[0];
              const { pct, done, total, missing } = getBrandProgress(ownClient);
              const isComplete = pct >= 100;
              const barColor = pct < 40 ? '#FF6B6B' : pct < 80 ? '#FFD166' : '#4ECDC4';
              if (isComplete) return null;
              return (
                <Link
                  to={`/clients/${ownClient?.id}?tab=identity`}
                  className="block mt-4 mx-1 rounded-2xl border border-white/[0.07] p-3.5 cursor-pointer group transition-all duration-200 hover:border-white/15 hover:bg-white/[0.03] no-underline"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9.5px] font-black uppercase tracking-widest text-text-muted">
                      Tu marca
                    </span>
                    <span
                      className="text-[10px] font-black tabular-nums"
                      style={{ color: barColor }}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                        boxShadow: `0 0 8px ${barColor}66`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">
                      {done}/{total} completado
                    </span>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider group-hover:translate-x-0.5 transition-transform"
                      style={{ color: barColor }}
                    >
                      Completar →
                    </span>
                  </div>
                </Link>
              );
            })()}
          </div>
        ) : (
          <>
            <div className='flex items-center justify-between mb-4 px-2'>
              <div className='flex items-center gap-2'>
                <BriefcaseIcon className="w-3.5 h-3.5 text-text-muted" />
                <span className='text-[10px] font-extrabold tracking-[0.14em] text-text-muted uppercase'>
                  {t.sidebar.recentClients || 'Clientes'}
                </span>
              </div>
              <span className='px-1.5 py-0.5 rounded-md text-[9px] font-black bg-surface-soft border border-border-subtle text-text-muted'>
                {clients.length}
              </span>
            </div>
            <div className='space-y-2'>
              {clients.map((client, idx) => {
                const isActive = location.pathname.startsWith(`/clients/${client.id}`);
                const brandColor = client.brand_info?.card_color || colors[idx % colors.length];
                const initials = (client.name || 'CL').substring(0, 2).toUpperCase();
                
                // Preservar la pestaña/módulo activo del cliente al cambiar de cliente
                const activeTab = new URLSearchParams(location.search).get('tab');
                const targetPath = activeTab
                  ? `/clients/${client.id}?tab=${activeTab}`
                  : `/clients/${client.id}`;

                return (
                  <div key={client.id} className="flex flex-col gap-1">
                    <Link
                      to={targetPath}
                      onMouseEnter={() => prefetchClientData(client.id)}
                      data-active={isActive ? "true" : "false"}
                      data-color={brandColor}
                      className={`client-item group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent select-none relative cursor-pointer hover:no-underline ${
                        isActive
                          ? 'text-text-primary font-bold shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      style={{
                        backgroundColor: isActive ? brandColor + (isLight ? '1a' : '1c') : (isLight ? 'transparent' : 'rgba(255, 255, 255, 0.02)'),
                        borderColor: isActive ? brandColor + (isLight ? '33' : '38') : (isLight ? 'transparent' : 'rgba(255, 255, 255, 0.04)'),
                      }}
                    >
                      {isActive && (
                        <div 
                          className="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] rounded-r-md transition-all duration-300"
                          style={{ backgroundColor: brandColor }}
                        />
                      )}
                      
                      {client.logo_url ? (
                        <div className="flex-shrink-0">
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="rounded-[12px] object-cover border border-border-subtle"
                            style={{
                              width: '38px',
                              height: '38px',
                              minWidth: '38px',
                              minHeight: '38px',
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className='client-ini rounded-[12px] flex items-center justify-center font-black text-xs flex-shrink-0'
                          style={{
                            backgroundColor: brandColor + '20',
                            border: `1px solid ${brandColor}40`,
                            color: brandColor,
                            width: '38px',
                            height: '38px',
                            minWidth: '38px',
                            minHeight: '38px',
                          }}
                        >
                          {initials}
                        </div>
                      )}

                      <div className='flex flex-col min-w-0 flex-1 justify-center'>
                        <span className='client-name text-sm font-bold truncate leading-normal text-text-primary'>
                          {client.name}
                        </span>
                      </div>

                      <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <div
                          className={`client-dot w-1.5 h-1.5 rounded-full absolute transition-opacity duration-200 group-hover:opacity-0 ${
                            isActive ? 'animate-pulse' : ''
                          } ${activeDropdownClientId === client.id ? 'opacity-0' : ''}`}
                          style={{ 
                            backgroundColor: brandColor,
                            boxShadow: `0 0 6px ${brandColor}`,
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (activeDropdownClientId === client.id) {
                              setActiveDropdownClientId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.top + window.scrollY + (rect.height / 2),
                                left: rect.right + window.scrollX + 8,
                              });
                              setSelectedClient(client);
                              setEditName(client.name);
                              setEditIndustry(client.industry || '');
                              setEditColor(brandColor);
                              setEditLogo(client.logo_url || null);
                              setIsConfirmingDelete(false);
                              setActiveDropdownClientId(client.id);
                            }
                          }}
                          className={`client-actions-btn p-1.5 rounded-lg bg-surface hover:bg-surface-soft text-text-secondary hover:text-text-primary border border-border-subtle transition-all duration-200 absolute flex items-center justify-center w-6 h-6 z-10 cursor-pointer shadow-lg ${
                            activeDropdownClientId === client.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title='Opciones de cliente'
                        >
                          <EllipsisVerticalIcon className='w-4 h-4' />
                        </button>
                      </div>
                    </Link>
                  </div>
                );
              })}

              <ShortcutTooltip shortcut="Ctrl + N" description={lang === 'es' ? 'Nuevo cliente' : 'New client'} side="right">
                <button
                  onClick={handleCreateClient}
                  className='add-client w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary border border-dashed border-border-subtle hover:border-border-strong hover:bg-surface-soft/30 hover:text-text-primary transition-all duration-200 mt-3.5 text-left'
                  style={{ borderStyle: 'dashed' }}
                >
                  <div
                    className='add-client-icon rounded-[12px] flex items-center justify-center border border-dashed border-border-subtle flex-shrink-0 text-text-secondary'
                    style={{
                      width: '38px',
                      height: '38px',
                      minWidth: '38px',
                      minHeight: '38px',
                    }}
                  >
                    <PlusIcon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <span>{t.sidebar.addClient || 'Nuevo cliente'}</span>
                </button>
              </ShortcutTooltip>
            </div>
          </>
        )}
      </div>


      </div>
    </aside>

      {/* Modals encapsulados para acceso global */}
      <ClientSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={notifications}
        groupedNotifications={groupedNotifications}
        stats={stats}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onDeleteAllNotifications={deleteAllNotifications}
      />

      {/* Modal de Edición / Eliminación de Cliente */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
            {/* Background glow matching the selected color */}
            <div 
              className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-300 pointer-events-none"
              style={{ backgroundColor: editColor }}
            />
            
            {!isConfirmingDelete ? (
              <>
                <h3 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2 relative z-10">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: editColor }} />
                  {t.sidebar.editClient}
                </h3>
                
                <div className="space-y-4 relative z-10">
                  {/* Logo de Cliente */}
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <label className="block text-[11px] font-extrabold tracking-wider text-text-secondary uppercase self-start">
                      {t.sidebar.clientLogo}
                    </label>
                    <div className="relative group w-20 h-20 rounded-[20px] overflow-hidden border border-border-subtle flex items-center justify-center bg-surface-strong shadow-inner">
                      {editLogo ? (
                        <img src={editLogo} alt="Client Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-black" style={{ color: editColor }}>
                          {editName.substring(0, 2).toUpperCase() || 'CL'}
                        </span>
                      )}
                      {/* File Upload Overlay */}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-200">
                        <span>{t.sidebar.changeLogo || 'Cambiar'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedFile = await compressBrandLogo(file, 400, 0.8);
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const result = reader.result;
                                  setEditLogo(result);
                                  const color = await extractDominantColor(result);
                                  if (color) {
                                    setEditColor(color);
                                    toast.success(lang === 'es' ? 'Color sugerido a partir del logotipo' : 'Suggested color from logo');
                                  }
                                };
                                reader.readAsDataURL(compressedFile);
                              } catch (err) {
                                console.error('Error compressing client logo, using original:', err);
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const result = reader.result;
                                  setEditLogo(result);
                                  const color = await extractDominantColor(result);
                                  if (color) {
                                    setEditColor(color);
                                    toast.success(lang === 'es' ? 'Color sugerido a partir del logotipo' : 'Suggested color from logo');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    {editLogo && (
                      <button
                        type="button"
                        onClick={() => setEditLogo(null)}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                      >
                        {t.sidebar.removeLogo || 'Quitar Logo'}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider text-text-secondary uppercase mb-1.5">
                      {t.sidebar.clientName}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface-strong border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none transition-colors"
                      placeholder="Ej. Ameral"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider text-text-secondary uppercase mb-1.5">
                      {t.sidebar.clientIndustry}
                    </label>
                    <input
                      type="text"
                      value={editIndustry}
                      onChange={(e) => setEditIndustry(e.target.value)}
                      className="w-full bg-surface-strong border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none transition-colors"
                      placeholder="Ej. Bebidas, Salud, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider text-text-secondary uppercase mb-1.5">
                      {t.sidebar.clientColor}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className={`w-8 h-8 rounded-xl border transition-all duration-200 cursor-pointer ${
                            editColor.toLowerCase() === color.toLowerCase()
                              ? 'border-white scale-110 shadow-lg'
                              : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {/* Custom color picker */}
                      <div className="relative w-8 h-8 rounded-xl border border-border-subtle flex items-center justify-center overflow-hidden hover:scale-105 transition-all cursor-pointer">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                        />
                        <span className="text-xs font-black text-white pointer-events-none mix-blend-difference">+</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle relative z-10">
                  {profile?.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmationName('');
                        setIsConfirmingDelete(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                      disabled={isSaving}
                    >
                      {t.sidebar.deleteClient}
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditLogo(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-subtle hover:border-border-strong hover:text-text-primary transition-colors cursor-pointer"
                      disabled={isSaving}
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: editColor }}
                      disabled={isSaving || !editName.trim()}
                    >
                      {isSaving ? t.common.saving : t.common.save}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black text-red-500 mb-4 flex items-center gap-2 relative z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  {t.sidebar.deleteClient}
                </h3>
                
                <div className="space-y-4 relative z-10 text-sm text-text-secondary">
                  <p className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs leading-relaxed text-red-400">
                    {t.sidebar.confirmDeleteDesc}
                  </p>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider text-text-secondary uppercase mb-1.5 leading-relaxed">
                      {t.sidebar.typeClientName} <span className="text-text-primary font-bold">{selectedClient?.name}</span>
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmationName}
                      onChange={(e) => setDeleteConfirmationName(e.target.value)}
                      className="w-full bg-surface-strong border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:border-red-500 focus:outline-none transition-colors"
                      placeholder={t.sidebar.placeholderName || "Ej. Nombre del Cliente"}
                      disabled={isSaving}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-subtle relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingDelete(false);
                      setDeleteConfirmationName('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-subtle hover:border-border-strong hover:text-text-primary transition-colors cursor-pointer"
                    disabled={isSaving}
                  >
                    {t.common.back}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClientSubmit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
                    disabled={isSaving || deleteConfirmationName !== selectedClient?.name}
                  >
                    {isSaving ? (t.common.saving || 'Eliminando...') : t.sidebar.deleteBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dropdown de opciones vía React Portal (previene clipping de overflow) */}
      {activeDropdownClientId && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translateY(-50%)',
          }}
          className="bg-white dark:bg-[#131524] border border-border-subtle rounded-2xl p-1.5 shadow-2xl z-[9999] w-40 flex flex-col gap-0.5 font-sans"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsConfirmingDelete(false);
              setIsEditModalOpen(true);
              setActiveDropdownClientId(null);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-soft transition-all text-left w-full cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            <span>{t.sidebar.editClient}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDropdownClientId(null);
              navigate(`/clients/${selectedClient?.id}?tab=identity`);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-soft transition-all text-left w-full cursor-pointer"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>{t.clientDetail.tabIdentity || 'Identidad de Marca'}</span>
          </button>

          {profile?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationName('');
                setIsConfirmingDelete(true);
                setIsEditModalOpen(true);
                setActiveDropdownClientId(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all text-left w-full cursor-pointer border-t border-border-subtle mt-1 pt-2.5"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>{t.sidebar.deleteClient}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
