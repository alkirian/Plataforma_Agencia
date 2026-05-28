import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getClients, getClientById } from '../../api/clients';
import { PlusIcon, Cog6ToothIcon, BellIcon } from '@heroicons/react/24/outline';
import { ClientSearchModal } from '../ui/ClientSearchModal';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Sidebar = ({ userEmail, profile, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      const localAv = localStorage.getItem('cadence-avatar-' + profile.id);
      setAvatar(profile.avatar_url || localAv || null);
    }
  }, [profile]);

  // Consultar clientes reales
  const { data: response } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const clients = response?.data || [];

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
        // Efecto expansivo y deslizamiento lateral
        gsap.to(item, {
          x: 6,
          backgroundColor: activeState 
            ? `${brandColor}22` 
            : "rgba(255, 255, 255, 0.05)",
          borderColor: activeState
            ? `${brandColor}66`
            : "rgba(255, 255, 255, 0.08)",
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
          color: "#ffffff",
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
        // Retorno elástico al estado de reposo inicial
        gsap.to(item, {
          x: 0,
          backgroundColor: activeState
            ? `${brandColor}12`
            : "transparent",
          borderColor: activeState
            ? `${brandColor}33`
            : "transparent",
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

    // Entrada elegante escalonada para los clientes al montar
    gsap.fromTo(".client-item",
      { opacity: 0, x: -15 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power2.out", delay: 0.15 }
    );

    // Entrada elegante para el botón de agregar cliente
    gsap.fromTo(".add-client",
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)", delay: 0.4 }
    );

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

  // Colores alternativos para las iniciales del cliente
  const colors = ['#FF6B6B', '#4ECDC4', '#7C5CFC', '#FFD166', '#68D391', '#F06292'];

  return (
    <aside
      ref={containerRef}
      id='sidebar'
      className='w-[240px] min-w-[240px] bg-app-sidebar border-r border-border-subtle flex flex-col h-screen overflow-hidden select-none z-30 font-sans'
    >
      {/* Logo Area (Look Cadence exact specs) */}
      <Link
        to='/dashboard'
        className='sb-logo p-5 border-b border-border-subtle cursor-pointer flex items-center gap-3 hover:opacity-95 transition-opacity'
      >
        <div
          className='sb-logo-icon w-10 h-10 rounded-[12px] bg-gradient-to-br from-accent-violet to-accent-sage flex items-center justify-center font-black text-white text-lg shadow-sm select-none'
          style={{ minWidth: '40px', minHeight: '40px' }}
        >
          C
        </div>
        <div className='flex flex-col min-w-0'>
          <span className='sb-logo-name font-title font-black text-[15px] tracking-tight text-text-primary leading-tight truncate'>
            Cadence
          </span>
          <span className='sb-logo-sub text-[8.5px] tracking-[0.1em] text-text-muted uppercase leading-none font-extrabold mt-0.5'>
            Agency Platform
          </span>
        </div>
      </Link>

      {/* Clientes Section (Look Cadence exact specs, enlarged) */}
      <div className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
        <div className='text-[10px] font-extrabold tracking-[0.14em] text-text-secondary uppercase mb-3.5 px-2'>
          Clientes
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
              <Link
                key={client.id}
                to={targetPath}
                onMouseEnter={() => prefetchClientData(client.id)}
                data-active={isActive ? "true" : "false"}
                data-color={brandColor}
                className={`client-item flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent select-none relative ${
                  isActive
                    ? 'text-text-primary font-bold shadow-sm'
                    : 'text-text-muted'
                }`}
                style={{
                  backgroundColor: isActive ? brandColor + '12' : 'transparent',
                  borderColor: isActive ? brandColor + '33' : 'transparent',
                }}
              >
                <div
                  className='client-ini rounded-[10px] flex items-center justify-center font-black text-xs flex-shrink-0'
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
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='client-name text-sm font-bold truncate leading-normal text-text-primary'>
                    {client.name}
                  </span>
                  <span className='client-cat text-[10.5px] font-semibold text-text-secondary truncate leading-none mt-1'>
                    {client.industry || 'Sin categoría'}
                  </span>
                </div>
                <div
                  className='client-dot w-2 h-2 rounded-full flex-shrink-0'
                  style={{ backgroundColor: brandColor }}
                />
              </Link>
            );
          })}

          {/* Botón Añadir Cliente (Look Cadence exact specs) */}
          <button
            onClick={handleCreateClient}
            className='add-client w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary border border-dashed border-border-subtle hover:border-border-strong hover:text-text-primary transition-all duration-200 mt-3.5 text-left'
            style={{ borderStyle: 'dashed' }}
          >
            <div
              className='add-client-icon rounded-[10px] flex items-center justify-center border border-dashed border-border-subtle flex-shrink-0 text-text-secondary'
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
              }}
            >
              <PlusIcon style={{ width: '18px', height: '18px' }} />
            </div>
            <span>Nuevo cliente</span>
          </button>
        </div>
      </div>

      {/* Perfil de Usuario (Look Cadence exact specs, bulletproof constrained, enlarged) */}
      <div className='sb-user p-4 border-t border-border-subtle flex items-center gap-3'>
        <div className='relative flex-shrink-0'>
          <button
            onClick={handleOpenNotifications}
            className='user-avatar rounded-[10px] bg-gradient-to-br from-accent-violet to-accent-rose flex items-center justify-center font-black text-white text-sm shadow-sm overflow-hidden transition-transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer'
            style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
            title='Ver notificaciones'
          >
            {avatar ? (
              <img
                src={avatar}
                alt='Avatar'
                className='object-cover rounded-[10px]'
                style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
                onError={() => setAvatar(null)}
              />
            ) : (
              (profile?.fullName || profile?.full_name || userEmail || 'U').charAt(0).toUpperCase()
            )}
          </button>
          {stats.total > 0 && (
            <span
              onClick={handleOpenNotifications}
              className='absolute -top-1.5 -right-1.5 h-[20px] w-[20px] rounded-full bg-red-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-app-sidebar cursor-pointer animate-pulse shadow-md select-none'
              title={`${stats.total} notificaciones sin leer`}
            >
              {stats.total}
            </span>
          )}
        </div>
        <div className='flex flex-col min-w-0 flex-1'>
          <span className='user-name text-sm font-black text-text-primary truncate leading-normal'>
            {profile?.fullName || profile?.full_name || 'Miembro'}
          </span>
          <span className='user-email text-[10.5px] font-semibold text-text-muted truncate leading-none mt-1'>
            {userEmail}
          </span>
        </div>
        <Link
          to='/settings'
          className='text-text-muted hover:text-text-primary p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center'
          title='Configuración'
        >
          <Cog6ToothIcon style={{ width: '18px', height: '18px' }} />
        </Link>
        <button
          onClick={onLogout}
          className='text-text-muted hover:text-red-400 p-2 rounded-lg transition-colors text-xs flex-shrink-0'
          title='Cerrar sesión'
        >
          ⏻
        </button>
      </div>

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
    </aside>
  );
};
