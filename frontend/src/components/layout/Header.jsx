import React, { useState } from 'react';
import { Link, NavLink, useParams, useLocation } from 'react-router-dom';
import { 
  Home,
  Settings,
  User,
  Bell,
  Menu,
  Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyAgency } from '@api/agencies';;
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton, Avatar } from '../ui';
import { ClientSelector } from '../ui/ClientSelector';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import { Tooltip } from '../ui/Tooltip';
import { MobileMenu } from './MobileMenu';
import { Logo } from '../Logo';
import { ClientSearchModal } from '../ui/ClientSearchModal';
import { SettingsMenu } from './SettingsMenu';

export const Header = ({ userEmail, onLogout, profile }) => {
  const location = useLocation();
  const params = useParams();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Detectar si estamos en una página de cliente
  const isClientPage = location.pathname.startsWith('/clients/');
  const currentClientId = params.id;

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
    // Marcar todas las notificaciones actuales como vistas
    if (notifications.length > 0) {
      markAllAsViewed();
    }
  };

  const navLinkClasses = ({ isActive }) =>
    `icon-btn ${isActive ? 'icon-btn--active' : ''}`;

  // Website de la agencia (para enlace rápido)
  const { data: agencyResp } = useQuery({ queryKey: ['my-agency'], queryFn: getMyAgency });
  const website = agencyResp?.data?.website;

  return (
    <motion.header
      className='header-cyber sticky top-0 z-50'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      role="banner"
      aria-label="Navegación principal"
    >
      <div className='flex h-16 w-full items-center justify-between px-4 sm:px-6'>
        {/* Mobile: Hamburger Menu */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Logo - Centrado en mobile, izquierda en desktop */}
        <motion.div
          className='flex items-center md:flex-none absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Tooltip content="Ve al inicio">
            <Link 
              to='/dashboard' 
              className='flex items-center gap-2'
              aria-label="Ir al dashboard - Cadence"
            >
              <Logo size={40} />
              <span className='text-xl sm:text-2xl font-bold text-brand-gradient'>Cadence</span>
            </Link>
          </Tooltip>
        </motion.div>

        {/* Centro: Client Selector (solo en páginas de cliente y desktop) */}
        {isClientPage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="hidden lg:block"
          >
            <ClientSelector 
              currentClientId={currentClientId}
            />
          </motion.div>
        )}

        {/* Mobile: Búsqueda y notificaciones */}
        <div className="flex items-center md:hidden">
          <motion.button
            onClick={() => setIsSearchOpen(true)}
            className={`icon-btn`}
            aria-label="Buscar clientes"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
                <Search className='h-6 w-6' aria-hidden="true" />
          </motion.button>

          <motion.button
            onClick={handleOpenNotifications}
            className={`icon-btn ${isNotificationPanelOpen ? 'icon-btn--active' : ''}`}
            aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
            aria-expanded={isNotificationPanelOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
              <Bell className='h-6 w-6' aria-hidden="true" />
            {stats.total > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center'
                aria-label={`${stats.total} notificaciones sin leer`}
              >
                {stats.total > 9 ? '9+' : stats.total}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Desktop: Navegación completa */}
        <div className='hidden md:flex items-center space-x-4'>
          <motion.nav
            id="navigation"
            className='flex items-center space-x-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            role="navigation"
            aria-label="Navegación principal"
          >
            <Tooltip content="Ir al dashboard principal (Alt+D)">
              <NavLink 
                to='/dashboard' 
                className={navLinkClasses} 
                title='Dashboard'
                aria-label="Ir al dashboard"
              >
                <Home className='h-5 w-5' aria-hidden="true" />
              </NavLink>
            </Tooltip>

            <Tooltip content="Buscar clientes (/)" >
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className={navLinkClasses({ isActive: false })}
                title='Buscar'
                aria-label='Abrir búsqueda de clientes'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className='h-5 w-5' aria-hidden="true" />
              </motion.button>
            </Tooltip>
            {website && (
              <Tooltip content="Abrir sitio de la agencia">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navLinkClasses({ isActive: false })}
                  title="Sitio web de la agencia"
                  aria-label="Abrir sitio web de la agencia"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                </a>
              </Tooltip>
            )}
            
            {/* Botón de notificaciones - Desktop */}
            <motion.button
              onClick={handleOpenNotifications}
              className={`rounded-xl p-2.5 transition-all duration-300 relative overflow-hidden ${
                isNotificationPanelOpen
                  ? 'bg-surface-strong text-text-primary shadow-halo border border-[color:var(--color-border-subtle)]'
                  : 'text-text-muted hover:bg-surface-soft hover:text-text-primary hover:border-[color:var(--color-border-subtle)] border border-transparent'
              }`}
              title='Notificaciones'
              aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
              aria-expanded={isNotificationPanelOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className='h-5 w-5' aria-hidden="true" />
              {stats.total > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center'
                  aria-label={`${stats.total} notificaciones sin leer`}
                >
                  {stats.total > 9 ? '9+' : stats.total}
                </motion.span>
              )}
            </motion.button>
            
            {/* Removed invisible settings NavLink; use SettingsMenu button instead */}
            <SettingsMenu userEmail={userEmail} profile={profile} />
          </motion.nav>

          {/* Separador Visual con glow */}
          <motion.div
              className='h-6 w-px bg-gradient-to-b from-transparent via-[var(--color-accent-blue)]/50 to-transparent'
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
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Avatar src={profile?.avatar_url} name={userEmail} size={28} />
            </motion.div>
            <span className='hidden lg:inline text-sm font-medium text-text-primary max-w-[220px] truncate'>{userEmail}</span>
            <Tooltip content="Cerrar sesión y salir de la aplicación">
              <CyberButton
                variant='ghost'
                size='sm'
                onClick={onLogout}
                className='text-text-muted hover:text-text-primary'
              >
                <span className="hidden lg:inline">Salir</span>
                <span className="lg:hidden">⏻</span>
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
        profile={profile}
      />

  {/* Client Search Modal */}
  <ClientSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.header>
  );
};

