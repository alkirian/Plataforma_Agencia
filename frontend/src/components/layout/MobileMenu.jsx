import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  XMarkIcon,
  HomeIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { CyberButton } from '../ui';
import { useEscapeClose, useTheme } from '../../hooks';

export const MobileMenu = ({
  isOpen,
  onClose,
  userEmail,
  profile,
  onLogout,
  notifications,
  onNotificationsClick,
}) => {
  const { theme, toggleTheme } = useTheme();
  useEscapeClose(isOpen, onClose);
  const location = useLocation();

  const isOwnBusiness = profile?.agencies?.agency_type === 'own_business';
  const cachedClientId = localStorage.getItem('cadence_last_active_client_id');
  const dashboardPath = isOwnBusiness && cachedClientId ? `/clients/${cachedClientId}` : '/dashboard';

  const menuItems = [
    {
      label: 'Dashboard',
      path: dashboardPath,
      icon: HomeIcon,
      shortcut: 'Alt+D',
    },
    {
      label: 'Tendencias',
      path: '/trends',
      icon: ArrowTrendingUpIcon,
      shortcut: '',
    },
    {
      label: 'Configuración',
      path: '/settings',
      icon: Cog6ToothIcon,
      shortcut: 'Alt+S',
    },
  ];

  const isActiveRoute = path => {
    return location.pathname === path || ((path === '/dashboard' || path === dashboardPath) && location.pathname === '/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/60 z-40'
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-surface-strong border-r border-[color:var(--color-border-subtle)] z-50'
          >
            <div className='flex flex-col h-full'>
              {/* Header */}
              <div className='flex items-center justify-between p-6 border-b border-[color:var(--color-border-subtle)]'>
                <Link
                  to='/dashboard'
                  className='text-2xl font-bold text-cyber-gradient'
                  onClick={onClose}
                >
                  Cadence
                </Link>
                <button
                  onClick={onClose}
                  className='p-2 rounded-lg hover:bg-surface-soft transition-colors'
                  aria-label='Cerrar menú'
                >
                  <XMarkIcon className='h-6 w-6 text-text-muted' />
                </button>
              </div>

              {/* Navigation */}
              <nav className='flex-1 p-6 space-y-2' role='navigation'>
                {menuItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${
                      isActiveRoute(item.path)
                        ? 'bg-surface-strong text-text-primary border border-[color:var(--color-border-subtle)] shadow-halo'
                        : 'text-text-muted hover:bg-surface-soft hover:text-text-primary'
                    }`}
                    aria-label={`${item.label} - ${item.shortcut}`}
                  >
                    <item.icon className='h-6 w-6' />
                    <div className='flex-1'>
                      <div className='font-medium'>{item.label}</div>
                      <div className='text-xs text-text-muted mt-0.5'>{item.shortcut}</div>
                    </div>
                  </NavLink>
                ))}

                {/* Notifications */}
                <button
                  onClick={() => {
                    onNotificationsClick();
                    onClose();
                  }}
                  className='flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-soft hover:text-text-primary w-full'
                  aria-label={`Notificaciones${notifications?.total > 0 ? ` - ${notifications.total} sin leer` : ''}`}
                >
                  <div className='relative'>
                    <BellIcon className='h-6 w-6' />
                    {notifications?.total > 0 && (
                      <span className='absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
                        {notifications.total > 9 ? '9+' : notifications.total}
                      </span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium'>Notificaciones</div>
                    <div className='text-xs text-text-muted mt-0.5'>Alt+N</div>
                  </div>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={(e) => {
                    toggleTheme(e);
                  }}
                  className='flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-soft hover:text-text-primary w-full'
                  aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                >
                  <div>
                    {theme === 'dark' ? (
                      <SunIcon className='h-6 w-6' />
                    ) : (
                      <MoonIcon className='h-6 w-6' />
                    )}
                  </div>
                  <div className='flex-1 text-left'>
                    <div className='font-medium'>
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </div>
                    <div className='text-xs text-text-muted mt-0.5'>
                      {theme === 'dark' ? 'Cambiar a diseño claro' : 'Cambiar a diseño oscuro'}
                    </div>
                  </div>
                </button>
              </nav>

              {/* User Section */}
              <div className='p-6 border-t border-[color:var(--color-border-subtle)] space-y-4'>
                <div className='flex items-center space-x-3'>
                  <UserCircleIcon className='h-10 w-10 text-text-muted' />
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium text-text-primary truncate'>
                      {userEmail}
                    </div>
                    <div className='text-xs text-text-muted'>Usuario activo</div>
                  </div>
                </div>

                <CyberButton
                  variant='ghost'
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className='w-full justify-center'
                >
                  Cerrar Sesión
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
