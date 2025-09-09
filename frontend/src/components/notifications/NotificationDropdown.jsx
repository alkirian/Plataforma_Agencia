import React from 'react'
import { motion } from 'framer-motion'
import { Bell, X, Trash2, Check, Clock } from 'lucide-react'
import { Avatar } from '@shared/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const NotificationDropdown = ({
  notifications = [],
  groupedNotifications = {},
  stats = { total: 0, unread: 0 },
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onClose,
}) => {
  const hasUnread = stats.unread > 0
  const isEmpty = notifications.length === 0

  return (
    <div className='nav-menu__scroller' style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {/* Empty State */}
      {isEmpty && (
        <div className='readings__show-when-empty p-6 text-center'>
          <div className='mb-3'>
            <Bell className='h-8 w-8 text-text-muted mx-auto' />
          </div>
          <h3 className='text-base font-medium text-text-primary mb-1'>No tienes notificaciones</h3>
          <p className='text-sm text-text-muted'>
            Te notificaremos cuando algo requiera tu atención.
          </p>
        </div>
      )}

      {/* Has Content */}
      {!isEmpty && (
        <>
          {/* Unread Section */}
          {hasUnread && (
            <section className='nav-menu__section readings--unreads border-b border-[color:var(--color-border-subtle)]'>
              <div className='readings__hide-when-empty'>
                <header className='flex items-center justify-between p-4 pb-2'>
                  <h3 className='text-sm font-semibold text-red-500 uppercase tracking-wide'>
                    Nuevas para ti
                    <span className='ml-1 text-xs'>({stats.unread})</span>
                  </h3>
                  <button
                    onClick={() => {
                      onMarkAllAsRead?.()
                      onClose?.()
                    }}
                    className='text-xs text-text-muted hover:text-text-primary transition-colors'
                    title='Marcar todas como leídas'
                  >
                    Marcar todas como leídas
                  </button>
                </header>

                <div className='space-y-1 px-2 pb-4'>
                  {notifications
                    .filter(n => !n.read_at)
                    .slice(0, 5)
                    .map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDeleteNotification}
                        onClose={onClose}
                        isUnread={true}
                      />
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent Section */}
          <section className='nav-menu__section'>
            <header className='flex items-center justify-between p-4 pb-2'>
              <h3 className='text-sm font-medium text-text-primary'>Recientes</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    onDeleteAllNotifications?.()
                    onClose?.()
                  }}
                  className='text-xs text-text-muted hover:text-red-500 transition-colors'
                  title='Eliminar todas'
                >
                  Limpiar todo
                </button>
              )}
            </header>

            <div className='space-y-1 px-2 pb-4'>
              {notifications
                .filter(n => n.read_at)
                .slice(0, 10)
                .map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                    onClose={onClose}
                    isUnread={false}
                  />
                ))}

              {notifications.filter(n => n.read_at).length === 0 && hasUnread && (
                <div className='text-center py-4 text-sm text-text-muted'>
                  Las notificaciones leídas aparecerán aquí
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClose, isUnread }) => {
  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead?.(notification.id)
    }
    onClose?.()
  }

  const handleDelete = e => {
    e.stopPropagation()
    onDelete?.(notification.id)
  }

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: es,
      })
    : ''

  return (
    <motion.article
      className={`reading group cursor-pointer rounded-lg transition-colors ${
        isUnread
          ? 'bg-blue-50/50 hover:bg-blue-50/80 border-l-2 border-blue-500'
          : 'hover:bg-surface-soft/50'
      }`}
      whileHover={{ scale: 1.01 }}
      onClick={handleClick}
    >
      <div className='reading__link p-3'>
        <div className='flex items-start space-x-3'>
          {/* Avatar */}
          <div className='reading__avatar flex-shrink-0'>
            <Avatar
              name={notification.data?.user_name || 'Sistema'}
              size={32}
              className='relative'
            />
            {isUnread && (
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white' />
            )}
          </div>

          {/* Content */}
          <div className='reading__content flex-1 min-w-0'>
            <h4 className='reading__description text-sm font-medium text-text-primary truncate mb-1'>
              {notification.data?.title || notification.type}
            </h4>

            {notification.data?.message && (
              <div className='reading__content-excerpt text-xs text-text-muted truncate mb-2'>
                {notification.data.message}
              </div>
            )}

            <div className='reading__metadata flex items-center space-x-2 text-xs text-text-muted'>
              <span>{notification.data?.user_name || 'Sistema'}</span>
              {notification.data?.client_name && (
                <>
                  <span>•</span>
                  <span>{notification.data.client_name}</span>
                </>
              )}
              <span>•</span>
              <time>{timeAgo}</time>
            </div>
          </div>

          {/* Actions */}
          <div className='reading__extras flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            {isUnread && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onMarkAsRead?.(notification.id)
                }}
                className='p-1 text-text-muted hover:text-blue-500 transition-colors'
                title='Marcar como leída'
              >
                <Check className='h-3 w-3' />
              </button>
            )}
            <button
              onClick={handleDelete}
              className='p-1 text-text-muted hover:text-red-500 transition-colors'
              title='Eliminar notificación'
            >
              <Trash2 className='h-3 w-3' />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
