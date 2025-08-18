import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
  XMarkIcon, 
  HomeIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { CyberButton } from '../ui';

export const MobileMenu = ({ 
  isOpen, 
  onClose, 
  userEmail, 
  onLogout,
  notifications,
  onNotificationsClick 
}) => {
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
      shortcut: 'Alt+D'
    },
    {
      label: 'Configuración',
      path: '/settings', 
      icon: Cog6ToothIcon,
      shortcut: 'Alt+S'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
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
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-surface-strong border-r border-[color:var(--color-border-subtle)] z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[color:var(--color-border-subtle)]">
                <Link 
                  to="/dashboard" 
                  className="text-2xl font-bold text-cyber-gradient"
                  onClick={onClose}
                >
                  Cadence
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-soft transition-colors"
                  aria-label="Cerrar menú"
                >
                  <XMarkIcon className="h-6 w-6 text-text-muted" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-6 space-y-2" role="navigation">
                {menuItems.map((item) => (
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
                    <item.icon className="h-6 w-6" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{item.shortcut}</div>
                    </div>
                  </NavLink>
                ))}

                {/* Notifications */}
                <button
                  onClick={() => {
                    onNotificationsClick();
                    onClose();
                  }}
                  className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-soft hover:text-text-primary w-full"
                  aria-label={`Notificaciones${notifications?.total > 0 ? ` - ${notifications.total} sin leer` : ''}`}
                >
                  <div className="relative">
                    <BellIcon className="h-6 w-6" />
                    {notifications?.total > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.total > 9 ? '9+' : notifications.total}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Notificaciones</div>
                    <div className="text-xs text-text-muted mt-0.5">Alt+N</div>
                  </div>
                </button>
              </nav>

              {/* User Section */}
              <div className="p-6 border-t border-[color:var(--color-border-subtle)] space-y-4">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-10 w-10 text-text-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {userEmail}
                    </div>
                    <div className="text-xs text-text-muted">
                      Usuario activo
                    </div>
                  </div>
                </div>
                
                <CyberButton
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full justify-center"
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