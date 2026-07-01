import React, { useState, useEffect, Fragment } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HomeIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  TrashIcon,
  CalendarIcon,
  FolderIcon,
  FingerPrintIcon,
  PhotoIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CyberButton, CadenceLogoCronogramaDigital } from '../ui';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications, useLanguage, useTheme } from '../../hooks';
import { Tooltip, ShortcutTooltip } from '../ui/Tooltip';
import { MobileMenu } from './MobileMenu';
import { ClientSearchModal } from '../ui/ClientSearchModal';
import { ClientSelector } from '../ui/ClientSelector';

export const Header = ({ userEmail, profile, onLogout }) => {
  const { lang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (profile) {
      const localAv = localStorage.getItem('cadence-avatar-' + profile.id);
      setAvatar(profile.avatar_url || localAv || null);
    }
  }, [profile]);

  // Detectar si estamos en una página de cliente
  const isOwnBusiness = profile?.agencies?.agency_type === 'own_business';
  const cachedClientId = localStorage.getItem('cadence_last_active_client_id');
  const homePath = isOwnBusiness && cachedClientId ? `/clients/${cachedClientId}` : '/dashboard';

  const isClientPage = location.pathname.startsWith('/clients/');
  const currentClientId = params.id;
  const currentClientTab = isClientPage ? new URLSearchParams(location.search).get('tab') : null;
  const activeClientTab = ['schedule', 'identity', 'trends', 'design'].includes(currentClientTab)
    ? currentClientTab
    : 'schedule';
  const isIdentityTab = isClientPage && activeClientTab === 'identity';
  const isTrendsTab = isClientPage && activeClientTab === 'trends';
  const isDesignTab = isClientPage && activeClientTab === 'design';
  const showCalendarViewControls =
    isClientPage && !isIdentityTab && !isTrendsTab && !isDesignTab;
  const clientTabs = [
    {
      id: 'schedule',
      label: t.clientDetail.tabSchedule,
      icon: CalendarIcon,
      tooltip: lang === 'es' ? 'Calendario interactivo y cronograma de contenidos con IA' : 'Interactive calendar and editorial content schedule with AI',
    },
    {
      id: 'identity',
      label: t.clientDetail.tabIdentity,
      icon: FingerPrintIcon,
      tooltip: lang === 'es' ? 'ADN de marca, valores, tono de voz y personalización de IA' : 'Brand DNA, values, voice, and AI customization',
    },
    {
      id: 'trends',
      label: t.clientDetail.tabTrends,
      icon: ArrowTrendingUpIcon,
      tooltip: lang === 'es' ? 'Análisis diario de tendencias de mercado e ideas' : 'Daily market trends analysis and brainstorming',
    },
    {
      id: 'design',
      label: t.clientDetail.tabDesign,
      icon: PhotoIcon,
      tooltip: lang === 'es' ? 'Generación de imágenes de alta calidad y adaptación multiformato' : 'High quality image generation and format adaptation with AI',
    },
  ];

  // Hook de notificaciones
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

  // Handler para abrir el panel de notificaciones
  const handleOpenNotifications = () => {
    setIsNotificationPanelOpen(true);
    if (notifications.length > 0) {
      markAllAsViewed();
    }
  };

  const navLinkClasses = ({ isActive }) => `icon-btn ${isActive ? 'icon-btn--active' : ''}`;

  const handleNewEventFromHeader = () => {
    if (!isClientPage) return;
    if (isDocumentsTab) {
      navigate(`${location.pathname}?tab=schedule`);
      setTimeout(() => window.dispatchEvent(new CustomEvent('cadence:new-event')), 50);
      return;
    }
    window.dispatchEvent(new CustomEvent('cadence:new-event'));
  };

  const handleHeaderCalendarView = nextView => {
    setCalendarView(nextView);
    window.dispatchEvent(new CustomEvent('cadence:calendar-view', { detail: { view: nextView } }));
  };

  const handleCalendarAction = action => {
    window.dispatchEvent(new CustomEvent('cadence:calendar-action', { detail: { action } }));
  };

  useEffect(() => {
    const syncCalendarView = event => {
      const next = event?.detail?.view;
      if (next) setCalendarView(next);
    };
    window.addEventListener('cadence:calendar-view-changed', syncCalendarView);
    return () => window.removeEventListener('cadence:calendar-view-changed', syncCalendarView);
  }, []);

  return (
    <motion.header
      className='sticky top-0 z-50 bg-surface/95 border-b border-border-subtle'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      role='banner'
      aria-label='Navegación principal'
    >
      <div className='relative flex h-12 w-full items-center justify-between px-4 sm:px-6'>
        {/* Left section: Logo and Client Selector */}
        <div className='flex items-center gap-4'>
          {/* Mobile: Hamburger Menu */}
          <div className='flex items-center md:hidden'>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className='p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
              aria-label='Abrir menú de navegación'
            >
              <Bars3Icon className='h-6 w-6' />
            </button>
          </div>



          {isClientPage && (
            <div className='hidden lg:block min-w-[10rem]'>
              <ClientSelector currentClientId={currentClientId} />
            </div>
          )}
        </div>


        {/* Mobile: Búsqueda y notificaciones */}
        <div className='flex items-center md:hidden gap-1'>
          <motion.button
            onClick={() => setIsSearchOpen(true)}
            className={`icon-btn`}
            aria-label='Buscar clientes'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MagnifyingGlassIcon className='h-6 w-6' aria-hidden='true' />
          </motion.button>

          <motion.button
            onClick={handleOpenNotifications}
            className={`icon-btn ${isNotificationPanelOpen ? 'icon-btn--active' : ''}`}
            aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
            aria-expanded={isNotificationPanelOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BellIcon className='h-6 w-6' aria-hidden='true' />
            {stats.total > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-xs font-medium text-white flex items-center justify-center'
                aria-label={`${stats.total} notificaciones sin leer`}
              >
                {stats.total > 9 ? '9+' : stats.total}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Desktop: Navegación completa */}
        <div className='hidden md:flex items-center space-x-4'>
          {/* Menú de opciones de tres puntos (...) para Calendario */}
          {isClientPage && activeClientTab === 'schedule' && (
            <Menu as='div' className='relative inline-block text-left'>
              <div>
                <Menu.Button className='inline-flex items-center justify-center p-2 rounded-lg border border-border-subtle bg-surface-soft/80 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-border-strong shadow-sm'>
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
                          onClick={() => handleCalendarAction('import')}
                          className={`${
                            active ? 'bg-surface text-text-primary' : 'text-text-muted'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors`}
                        >
                          <ArrowUpTrayIcon className='h-4 w-4 text-text-secondary group-hover:text-text-primary' />
                          <span>Importar archivo</span>
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCalendarAction('share')}
                          className={`${
                            active ? 'bg-surface text-text-primary' : 'text-text-muted'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors`}
                        >
                          <LinkIcon className='h-4 w-4 text-text-secondary group-hover:text-text-primary' />
                          <span>Compartir calendario</span>
                        </button>
                      )}
                    </Menu.Item>
                    <div className='my-1 border-t border-border-subtle' />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCalendarAction('clear')}
                          className={`${
                            active ? 'bg-red-500/10 text-red-500' : 'text-red-500/80'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors`}
                        >
                          <TrashIcon className='h-4 w-4 text-red-500 group-hover:text-red-500' />
                          <span>Limpiar Cronograma</span>
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          <motion.nav
            id='navigation'
            className='flex items-center space-x-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            role='navigation'
            aria-label='Navegación principal'
          >
            <Tooltip content={lang === 'es' ? 'Ir al dashboard principal (Alt+D)' : 'Go to main dashboard (Alt+D)'}>
              <NavLink
                to={homePath}
                className={navLinkClasses}
                title={lang === 'es' ? 'Dashboard' : 'Dashboard'}
                aria-label={lang === 'es' ? 'Ir al dashboard' : 'Go to dashboard'}
              >
                <HomeIcon className='h-5 w-5' aria-hidden='true' />
              </NavLink>
            </Tooltip>

            <Tooltip content={lang === 'es' ? 'Tendencias diarias de mercado' : 'Daily market trends'}>
              <NavLink
                to='/trends'
                className={navLinkClasses}
                title={t.sidebar.trends}
                aria-label={lang === 'es' ? 'Ver tendencias' : 'View trends'}
              >
                <ArrowTrendingUpIcon className='h-5 w-5' aria-hidden='true' />
              </NavLink>
            </Tooltip>

            <ShortcutTooltip shortcut="/" description={lang === 'es' ? 'Buscar clientes' : 'Search clients'}>
              <motion.button
                data-tour="search-button"
                onClick={() => setIsSearchOpen(true)}
                className={navLinkClasses({ isActive: false })}
                title={lang === 'es' ? 'Buscar' : 'Search'}
                aria-label={lang === 'es' ? 'Abrir búsqueda de clientes' : 'Open client search'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MagnifyingGlassIcon className='h-5 w-5' aria-hidden='true' />
              </motion.button>
            </ShortcutTooltip>

            {/* Botón de notificaciones - Desktop */}
            <ShortcutTooltip shortcut="Alt + N" description={lang === 'es' ? 'Notificaciones' : 'Notifications'}>
              <motion.button
                onClick={handleOpenNotifications}
                className={`rounded-xl p-2.5 transition-all duration-300 relative ${
                  isNotificationPanelOpen
                    ? 'bg-surface-strong text-text-primary border border-[color:var(--color-border-subtle)] shadow-sm'
                    : 'text-text-muted hover:bg-surface-soft hover:text-text-primary hover:border-[color:var(--color-border-subtle)] border border-transparent'
                }`}
                title={lang === 'es' ? 'Notificaciones' : 'Notifications'}
                aria-label={lang === 'es' ? `Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}` : `Notifications${stats.total > 0 ? ` - ${stats.total} unread` : ''}`}
                aria-expanded={isNotificationPanelOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BellIcon className='h-5 w-5' aria-hidden='true' />
                {stats.total > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-xs font-medium text-white flex items-center justify-center'
                    aria-label={lang === 'es' ? `${stats.total} notificaciones sin leer` : `${stats.total} unread notifications`}
                  >
                    {stats.total > 9 ? '9+' : stats.total}
                  </motion.span>
                )}
              </motion.button>
            </ShortcutTooltip>

          </motion.nav>

          {/* Separador Visual simple sin glow */}
          <motion.div
            className='h-6 w-px bg-border-subtle'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />

          {/* Menú de Usuario - Desktop */}
          <motion.div
            className='flex items-center space-x-3'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Theme switcher */}
            <ShortcutTooltip shortcut={lang === 'es' ? 'Cambiar tema' : 'Toggle theme'} description={lang === 'es' ? 'Cambiar modo oscuro/claro' : 'Toggle dark/light mode'} side="bottom">
              <button
                onClick={(e) => toggleTheme(e)}
                className='text-text-muted hover:text-text-primary p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-surface-soft'
                aria-label={lang === 'es' ? 'Cambiar tema' : 'Toggle theme'}
              >
                {theme === 'dark' ? (
                  <SunIcon className='h-5 w-5' />
                ) : (
                  <MoonIcon className='h-5 w-5' />
                )}
              </button>
            </ShortcutTooltip>

            {/* Configuration button */}
            <ShortcutTooltip shortcut="Alt + S" description={lang === 'es' ? 'Configuración de la aplicación' : 'App settings'} side="bottom">
              <NavLink
                to='/settings'
                className={({ isActive }) => `text-text-muted hover:text-text-primary p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center hover:bg-surface-soft ${isActive ? 'bg-surface-soft text-text-primary' : ''}`}
                aria-label={lang === 'es' ? 'Ir a configuración' : 'Go to settings'}
              >
                <Cog6ToothIcon className='h-5 w-5' />
              </NavLink>
            </ShortcutTooltip>

            {/* Circular Avatar + Name Pill */}
            <Link
              to='/settings?tab=profile'
              className='flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-soft/40 border border-border-subtle/50 hover:bg-surface-soft transition-colors select-none cursor-pointer'
              title={lang === 'es' ? 'Editar perfil' : 'Edit profile'}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className='flex items-center justify-center flex-shrink-0'
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt='Profile Avatar'
                    className='h-8 w-8 rounded-full object-cover border border-border-strong shadow-sm'
                    onError={() => setAvatar(null)}
                  />
                ) : profile?.fullName || profile?.full_name ? (
                  <div className='h-8 w-8 rounded-full bg-surface-strong border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary uppercase'>
                    {(profile.fullName || profile.full_name).charAt(0)}
                  </div>
                ) : (
                  <UserCircleIcon className='h-7 w-7 text-text-muted' />
                )}
              </motion.div>
              <span className='hidden sm:inline text-sm font-semibold text-text-primary pr-1'>
                {profile?.fullName || profile?.full_name || 'Miembro'}
              </span>
            </Link>

            {/* Logout button */}
            <Tooltip content={lang === 'es' ? 'Cerrar sesión' : 'Logout'}>
              <CyberButton
                variant='ghost'
                size='sm'
                onClick={onLogout}
                className='text-text-muted hover:text-red-400 p-2 rounded-lg transition-colors flex items-center justify-center'
              >
                <span className='hidden lg:inline mr-1'>{lang === 'es' ? 'Salir' : 'Exit'}</span>
                <span>⏻</span>
              </CyberButton>
            </Tooltip>
          </motion.div>
        </div>
      </div>

      {/* Panel de notificaciones */}
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

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userEmail={userEmail}
        profile={profile}
        onLogout={onLogout}
        notifications={stats}
        onNotificationsClick={handleOpenNotifications}
      />

      {/* Client Search Modal */}
      <ClientSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.header>
  );
};
