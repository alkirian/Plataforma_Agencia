import React, { useState } from 'react'
import { Bell, Check, Clock, AlertTriangle, CalendarDays, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/Modal'

export const NotificationPanel = ({
  notifications = [],
  groupedNotifications = {},
  stats = {},
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onClose,
  isOpen,
}) => {
  const [selectedTab, setSelectedTab] = useState('all')
  const navigate = useNavigate()

  const unreadNotifications = notifications.filter(n => !n.isRead)

  const tabs = [
    { id: 'all', name: 'Todas', count: notifications.length },
    { id: 'unread', name: 'No leídas', count: unreadNotifications.length },
    { id: 'high', name: 'Urgentes', count: groupedNotifications.high?.length || 0 },
    { id: 'medium', name: 'Importantes', count: groupedNotifications.medium?.length || 0 },
    { id: 'low', name: 'Próximas', count: groupedNotifications.low?.length || 0 },
  ]

  const getDisplayNotifications = () => {
    if (selectedTab === 'all') return notifications
    if (selectedTab === 'unread') return unreadNotifications
    return groupedNotifications[selectedTab] || []
  }

  const getNotificationIcon = type => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className='h-5 w-5 text-red-400' />
      case 'due-today':
        return <CalendarDays className='h-5 w-5 text-orange-400' />
      case 'due-tomorrow':
        return <Clock className='h-5 w-5 text-gray-400' />
      case 'upcoming':
        return <Bell className='h-5 w-5 text-green-400' />
      default:
        return <Bell className='h-5 w-5 text-gray-400' />
    }
  }

  const getNotificationColor = type => {
    switch (type) {
      case 'overdue':
        return 'border-red-500/30 bg-red-500/10'
      case 'due-today':
        return 'border-orange-500/30 bg-orange-500/10'
      case 'due-tomorrow':
        return 'border-gray-500/30 bg-gray-500/10'
      case 'upcoming':
        return 'border-green-500/30 bg-green-500/10'
      default:
        return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const handleNotificationClick = notification => {
    if (notification.task && notification.task.client_id) {
      navigate(`/clients/${notification.task.client_id}`)
      onClose()
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Mañana'
    if (diffDays === -1) return 'Ayer'
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`
    return `En ${diffDays} días`
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size='lg'
      maxHeight='90vh'
      title={
        <div className='flex items-center space-x-2'>
          <Bell className='h-5 w-5 text-[color:var(--color-accent-blue)]' />
          <span>Notificaciones</span>
          {stats.total > 0 && (
            <span className='bg-[color:var(--color-accent-blue)] text-black text-xs px-2 py-0.5 rounded-full'>
              {stats.total}
            </span>
          )}
        </div>
      }
      secondaryActions={
        notifications.length > 0
          ? [
              {
                label: 'Marcar todas como leídas',
                onClick: onMarkAllAsRead,
                variant: 'ghost',
              },
              {
                label: 'Limpiar todas',
                onClick: () => {
                  if (
                    window.confirm(
                      '¿Estás seguro de que quieres eliminar todas las notificaciones?'
                    )
                  ) {
                    onDeleteAllNotifications()
                  }
                },
                variant: 'ghost',
                icon: <Trash className='h-4 w-4' />,
              },
            ]
          : []
      }
      className='w-full max-w-2xl'
    >
      {/* Tabs */}
      <div className='mb-4 border-b border-[color:var(--color-border-subtle)] pb-2'>
        <div className='flex space-x-1'>
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium 
                           transition-all ${
                             selectedTab === tab.id
                               ? 'bg-[color:var(--color-accent-blue)] text-black'
                               : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
                           }`}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    selectedTab === tab.id
                      ? 'bg-white/20 text-black'
                      : 'bg-surface-soft text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Notificaciones */}
      <div className='flex-1 overflow-y-auto max-h-[50vh]'>
        {getDisplayNotifications().length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-text-muted'>
            <Bell className='h-12 w-12 mb-4 opacity-50' />
            <p className='text-center'>
              {selectedTab === 'all'
                ? 'No hay notificaciones'
                : `No hay notificaciones ${tabs.find(t => t.id === selectedTab)?.name.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <AnimatePresence>
              {getDisplayNotifications().map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getNotificationColor(
                    notification.type
                  )} ${notification.isRead ? 'opacity-60 bg-white/5' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 mt-0.5'>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <div className='flex items-center space-x-2'>
                          <p
                            className={`text-sm font-medium ${notification.isRead ? 'text-text-muted' : 'text-text-primary'}`}
                          >
                            {notification.title}
                          </p>
                          {notification.isRead && (
                            <span className='text-xs text-green-400 font-medium'>✓ Leída</span>
                          )}
                        </div>
                        <div className='flex items-center space-x-1'>
                          {!notification.isRead && (
                            <motion.button
                              onClick={e => {
                                e.stopPropagation()
                                onMarkAsRead(notification.id)
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className='text-text-muted hover:text-text-primary transition-colors'
                              title='Marcar como leída'
                            >
                              <Check className='h-4 w-4' />
                            </motion.button>
                          )}

                          <motion.button
                            onClick={e => {
                              e.stopPropagation()
                              onDeleteNotification(notification.id)
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className='text-text-muted hover:text-red-400 transition-colors'
                            title='Eliminar notificación'
                          >
                            <Trash className='h-4 w-4' />
                          </motion.button>
                        </div>
                      </div>

                      <p className='text-sm text-text-primary/80 mb-2'>{notification.message}</p>

                      <div className='flex items-center justify-between text-xs text-text-muted'>
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
        <div className='mt-4 pt-4 border-t border-[color:var(--color-border-subtle)]'>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-lg font-medium text-red-400'>{stats.overdue}</div>
              <div className='text-xs text-text-muted'>Vencidas</div>
            </div>
            <div>
              <div className='text-lg font-medium text-orange-400'>{stats.dueToday}</div>
              <div className='text-xs text-text-muted'>Para hoy</div>
            </div>
            <div>
              <div className='text-lg font-medium text-green-400'>{stats.upcoming}</div>
              <div className='text-xs text-text-muted'>Próximas</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
