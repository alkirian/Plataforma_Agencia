import React, { useState } from 'react';
import { Link, NavLink, useParams, useLocation } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '../ui';
import { ClientSelector } from '../ui/ClientSelector';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';

export const Header = ({ userEmail, onLogout }) => {
  const location = useLocation();
  const params = useParams();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  
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
    `rounded-xl p-2.5 transition-all duration-300 relative overflow-hidden ${
      isActive
        ? 'bg-primary-500/15 text-primary-400 shadow-purple-subtle border border-primary-500/25'
        : 'text-rambla-text-secondary hover:bg-primary-500/8 hover:text-primary-400 hover:border-primary-500/15 border border-transparent'
    }`;

  return (
    <motion.header
      className='header-cyber sticky top-0 z-50'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      <div className='flex h-16 w-full items-center justify-between px-6'>
        {/* Izquierda: Logo */}
        <motion.div
          className='flex items-center'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Link to='/dashboard' className='text-2xl font-bold text-cyber-gradient'>
            Rambla
          </Link>
          <motion.div
            className='ml-2 w-2 h-2 bg-glow-cyan rounded-full'
            animate={{
              boxShadow: [
                '0 0 5px rgb(0 246 255 / 0.5)',
                '0 0 15px rgb(0 246 255 / 0.8)',
                '0 0 5px rgb(0 246 255 / 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Centro: Client Selector (solo en páginas de cliente) */}
        {isClientPage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ClientSelector 
              currentClientId={currentClientId}
            />
          </motion.div>
        )}

        {/* Derecha: Navegación y Menú de Usuario */}
        <div className='flex items-center space-x-4'>
          <motion.nav
            className='flex items-center space-x-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NavLink to='/dashboard' className={navLinkClasses} title='Dashboard'>
              <HomeIcon className='h-5 w-5' />
            </NavLink>
            
            {/* Botón de notificaciones */}
            <motion.button
              onClick={handleOpenNotifications}
              className={`rounded-xl p-2.5 transition-all duration-300 relative overflow-hidden ${
                isNotificationPanelOpen
                  ? 'bg-primary-500/15 text-primary-400 shadow-purple-subtle border border-primary-500/25'
                  : 'text-rambla-text-secondary hover:bg-primary-500/8 hover:text-primary-400 hover:border-primary-500/15 border border-transparent'
              }`}
              title='Notificaciones'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon className='h-5 w-5' />
              {stats.total > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center'
                >
                  {stats.total > 9 ? '9+' : stats.total}
                </motion.span>
              )}
            </motion.button>
            
            <NavLink to='/settings' className={navLinkClasses} title='Configuración'>
              <Cog6ToothIcon className='h-5 w-5' />
            </NavLink>
          </motion.nav>

          {/* Separador Visual con glow */}
          <motion.div
            className='h-6 w-px bg-gradient-to-b from-transparent via-primary-500/50 to-transparent'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />

          {/* Menú de Usuario */}
          <motion.div
            className='flex items-center space-x-3'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
              <UserCircleIcon className='h-7 w-7 text-primary-400' />
            </motion.div>
            <span className='text-sm font-medium text-rambla-text-primary'>{userEmail}</span>
            <CyberButton
              variant='ghost'
              size='sm'
              onClick={onLogout}
              className='text-rambla-text-secondary hover:text-primary-300'
            >
              Salir
            </CyberButton>
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
    </motion.header>
  );
};
