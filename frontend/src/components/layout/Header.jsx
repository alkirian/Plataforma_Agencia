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
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CyberButton } from '../ui';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import { Tooltip } from '../ui/Tooltip';
import { MobileMenu } from './MobileMenu';
import { ClientSearchModal } from '../ui/ClientSearchModal';
import { ClientSelector } from '../ui/ClientSelector';

export const Header = ({ userEmail, profile, onLogout }) => {
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
  const isClientPage = location.pathname.startsWith('/clients/');
  const currentClientId = params.id;
  const currentClientTab = isClientPage ? new URLSearchParams(location.search).get('tab') : null;
  const activeClientTab = ['schedule', 'documents', 'identity', 'trends', 'design'].includes(currentClientTab)
    ? currentClientTab
    : 'schedule';
  const isDocumentsTab = isClientPage && activeClientTab === 'documents';
  const isIdentityTab = isClientPage && activeClientTab === 'identity';
  const isTrendsTab = isClientPage && activeClientTab === 'trends';
  const isDesignTab = isClientPage && activeClientTab === 'design';
  const showCalendarViewControls =
    isClientPage && !isDocumentsTab && !isIdentityTab && !isTrendsTab && !isDesignTab;
  const clientTabs = [
    {
      id: 'schedule',
      label: 'Cronograma',
      icon: CalendarIcon,
      tooltip: 'Calendario interactivo y cronograma de contenidos con IA',
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: FolderIcon,
      tooltip: 'Historial de entregables y biblioteca de briefs para RAG',
    },
    {
      id: 'identity',
      label: 'Identidad',
      icon: FingerPrintIcon,
      tooltip: 'ADN de marca, valores, tono de voz y personalización de IA',
    },
    {
      id: 'trends',
      label: 'Tendencias',
      icon: ArrowTrendingUpIcon,
      tooltip: 'Análisis diario de tendencias de mercado e ideas',
    },
    {
      id: 'design',
      label: 'Diseño',
      icon: PhotoIcon,
      tooltip: 'Generación de imágenes premium y adaptación multiformato con IA',
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
      className='sticky top-0 z-50 bg-surface-strong/95 border-b border-border-subtle'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      role='banner'
      aria-label='Navegación principal'
    >
      <div className='relative flex h-16 w-full items-center justify-between px-4 sm:px-6'>
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

          {/* Logo - Centrado en mobile, izquierda en desktop */}
          <motion.div
            className='flex items-center md:flex-none absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none'
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip content='Ve al inicio'>
              <Link
                to='/dashboard'
                className='text-xl sm:text-2xl font-bold text-text-primary hover:text-text-primary/95 transition-colors'
                aria-label='Ir al dashboard - Cadence'
              >
                Cadence
              </Link>
            </Tooltip>
            <motion.div
              className='ml-2 w-1.5 h-1.5 bg-gray-500 rounded-full'
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {isClientPage && (
            <div className='hidden lg:block min-w-[10rem]'>
              <ClientSelector currentClientId={currentClientId} />
            </div>
          )}
        </div>

        {/* Centro: secciones fijas y estáticas con centrado absoluto */}
        {isClientPage && (
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10'>
            <nav
              className='flex items-center rounded-lg border border-border-subtle bg-surface-soft/80 p-1 shadow-sm'
              aria-label='Secciones del cliente'
            >
              {clientTabs.map(tab => {
                const isActive = activeClientTab === tab.id;
                const Icon = tab.icon;
                return (
                  <Tooltip key={tab.id} content={tab.tooltip}>
                    <Link
                      to={`${location.pathname}?tab=${tab.id}`}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold leading-none transition-all flex items-center gap-1.5 border border-transparent ${
                        isActive
                          ? 'bg-surface border-border-strong text-text-primary shadow-sm font-bold scale-[1.02]'
                          : 'text-text-muted hover:bg-surface-soft hover:text-text-primary'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-text-primary' : 'text-text-muted/70 hover:text-text-primary'}`}
                      />
                      <span>{tab.label}</span>
                    </Link>
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        )}

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
                <Menu.Items className='absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-white/10 bg-[#161517] shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1.5'>
                  <div className='space-y-0.5'>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCalendarAction('import')}
                          className={`${
                            active ? 'bg-white/5 text-white' : 'text-gray-300'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors`}
                        >
                          <ArrowUpTrayIcon className='h-4 w-4 text-gray-400 group-hover:text-white' />
                          <span>Importar archivo</span>
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCalendarAction('share')}
                          className={`${
                            active ? 'bg-white/5 text-white' : 'text-gray-300'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors`}
                        >
                          <LinkIcon className='h-4 w-4 text-[#8FA89B] group-hover:text-white' />
                          <span>Compartir calendario</span>
                        </button>
                      )}
                    </Menu.Item>
                    <div className='my-1 border-t border-white/5' />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleCalendarAction('clear')}
                          className={`${
                            active ? 'bg-red-500/10 text-red-300' : 'text-red-400/80'
                          } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors`}
                        >
                          <TrashIcon className='h-4 w-4 text-red-500/70 group-hover:text-red-400' />
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
            <Tooltip content='Ir al dashboard principal (Alt+D)'>
              <NavLink
                to='/dashboard'
                className={navLinkClasses}
                title='Dashboard'
                aria-label='Ir al dashboard'
              >
                <HomeIcon className='h-5 w-5' aria-hidden='true' />
              </NavLink>
            </Tooltip>

            <Tooltip content='Tendencias diarias de mercado'>
              <NavLink
                to='/trends'
                className={navLinkClasses}
                title='Tendencias'
                aria-label='Ver tendencias'
              >
                <ArrowTrendingUpIcon className='h-5 w-5' aria-hidden='true' />
              </NavLink>
            </Tooltip>

            <Tooltip content='Buscar clientes (/)'>
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className={navLinkClasses({ isActive: false })}
                title='Buscar'
                aria-label='Abrir búsqueda de clientes'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MagnifyingGlassIcon className='h-5 w-5' aria-hidden='true' />
              </motion.button>
            </Tooltip>

            {/* Botón de notificaciones - Desktop */}
            <motion.button
              onClick={handleOpenNotifications}
              className={`rounded-xl p-2.5 transition-all duration-300 relative ${
                isNotificationPanelOpen
                  ? 'bg-surface-strong text-text-primary border border-[color:var(--color-border-subtle)] shadow-sm'
                  : 'text-text-muted hover:bg-surface-soft hover:text-text-primary hover:border-[color:var(--color-border-subtle)] border border-transparent'
              }`}
              title='Notificaciones'
              aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
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
                  aria-label={`${stats.total} notificaciones sin leer`}
                >
                  {stats.total > 9 ? '9+' : stats.total}
                </motion.span>
              )}
            </motion.button>

            <Tooltip content='Configuración de la aplicación (Alt+S)'>
              <NavLink
                to='/settings'
                className={navLinkClasses}
                title='Configuración'
                aria-label='Ir a configuración'
              >
                <Cog6ToothIcon className='h-5 w-5' aria-hidden='true' />
              </NavLink>
            </Tooltip>
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
            <span className='hidden lg:inline text-sm font-medium text-text-primary'>
              {profile?.fullName || profile?.full_name || userEmail}
            </span>
            <Tooltip content='Cerrar sesión y salir de la aplicación'>
              <CyberButton
                variant='ghost'
                size='sm'
                onClick={onLogout}
                className='text-text-muted hover:text-text-primary'
              >
                <span className='hidden lg:inline'>Salir</span>
                <span className='lg:hidden'>⏻</span>
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
        onLogout={onLogout}
        notifications={stats}
        onNotificationsClick={handleOpenNotifications}
      />

      {/* Client Search Modal */}
      <ClientSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.header>
  );
};
