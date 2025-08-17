import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  BellIcon, 
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const NotificationPanel = ({ 
  notifications = [], 
  groupedNotifications = {},
  stats = {},
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onClose,
  isOpen 
}) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter(n => !n.isRead);
  
  const tabs = [
    { id: 'all', name: 'Todas', count: notifications.length },
    { id: 'unread', name: 'No leídas', count: unreadNotifications.length },
    { id: 'high', name: 'Urgentes', count: groupedNotifications.high?.length || 0 },
    { id: 'medium', name: 'Importantes', count: groupedNotifications.medium?.length || 0 },
    { id: 'low', name: 'Próximas', count: groupedNotifications.low?.length || 0 },
  ];

  const getDisplayNotifications = () => {
    if (selectedTab === 'all') return notifications;
    if (selectedTab === 'unread') return unreadNotifications;
    return groupedNotifications[selectedTab] || [];
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      case 'due-today':
        return <CalendarDaysIcon className="h-5 w-5 text-orange-400" />;
      case 'due-tomorrow':
        return <ClockIcon className="h-5 w-5 text-blue-400" />;
      case 'upcoming':
        return <BellIcon className="h-5 w-5 text-green-400" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'overdue':
        return 'border-red-500/30 bg-red-500/10';
      case 'due-today':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'due-tomorrow':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'upcoming':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.task && notification.task.client_id) {
      navigate(`/clients/${notification.task.client_id}`);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    return `En ${diffDays} días`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-end p-4 pt-16">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-l-xl 
                                        bg-surface-900/95 backdrop-blur-sm border-l border-t border-b border-white/10 
                                        shadow-xl transition-all h-[calc(100vh-4rem)]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <BellIcon className="h-5 w-5 text-primary-400" />
                    <Dialog.Title className="text-lg font-medium text-white">
                      Notificaciones
                    </Dialog.Title>
                    {stats.total > 0 && (
                      <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {stats.total}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {notifications.length > 0 && (
                      <>
                        <motion.button
                          onClick={onMarkAllAsRead}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Marcar todas como leídas
                        </motion.button>
                        
                        <motion.button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
                              onDeleteAllNotifications();
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                          title="Eliminar todas las notificaciones"
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span>Limpiar todas</span>
                        </motion.button>
                      </>
                    )}
                    
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 
                                 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-4 py-2 border-b border-white/10">
                  <div className="flex space-x-1">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium 
                                   transition-all ${
                                     selectedTab === tab.id
                                       ? 'bg-primary-600 text-white'
                                       : 'text-gray-400 hover:text-white hover:bg-white/10'
                                   }`}
                      >
                        <span>{tab.name}</span>
                        {tab.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            selectedTab === tab.id
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-500/30 text-gray-300'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Notificaciones */}
                <div className="flex-1 overflow-y-auto">
                  {getDisplayNotifications().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <BellIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-center">
                        {selectedTab === 'all' 
                          ? 'No hay notificaciones' 
                          : `No hay notificaciones ${tabs.find(t => t.id === selectedTab)?.name.toLowerCase()}`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {getDisplayNotifications().map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                              getNotificationColor(notification.type)
                            } ${notification.isRead ? 'opacity-60 bg-gray-500/10' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
                                      {notification.title}
                                    </p>
                                    {notification.isRead && (
                                      <span className="text-xs text-green-400 font-medium">✓ Leída</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {!notification.isRead && (
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMarkAsRead(notification.id);
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="Marcar como leída"
                                      >
                                        <CheckIcon className="h-4 w-4" />
                                      </motion.button>
                                    )}
                                    
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNotification(notification.id);
                                      }}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="text-gray-400 hover:text-red-400 transition-colors"
                                      title="Eliminar notificación"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </motion.button>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-300 mb-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>{notification.clientName}</span>
                                  {notification.task?.scheduled_at && (
                                    <span>{formatDate(notification.task.scheduled_at)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer con estadísticas */}
                {stats.total > 0 && (
                  <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-medium text-red-400">{stats.overdue}</div>
                        <div className="text-xs text-gray-400">Vencidas</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-orange-400">{stats.dueToday}</div>
                        <div className="text-xs text-gray-400">Para hoy</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-green-400">{stats.upcoming}</div>
                        <div className="text-xs text-gray-400">Próximas</div>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};