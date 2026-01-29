import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CheckCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

/**
 * NotificationDropdown - Dropdown compacto para notificaciones en el header
 *
 * Muestra las notificaciones de tareas (TaskReminder) generadas por useNotifications
 * con acciones para marcar como leída y eliminar.
 */
export const NotificationDropdown = ({
  notifications = [],
  groupedNotifications = {},
  stats = { total: 0, overdue: 0, dueToday: 0, upcoming: 0 },
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onClose,
}) => {
  const navigate = useNavigate()

  // Separar notificaciones en no leídas y leídas
  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications = notifications.filter(n => n.isRead)

  const hasUnread = unreadNotifications.length > 0
  const isEmpty = notifications.length === 0

  // Obtener icono según el tipo de notificación
  const getIcon = type => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className='h-4 w-4 text-red-400' />
      case 'due-today':
        return <CalendarDays className='h-4 w-4 text-orange-400' />
      case 'due-tomorrow':
        return <Clock className='h-4 w-4 text-yellow-400' />
      case 'upcoming':
        return <Bell className='h-4 w-4 text-green-400' />
      default:
        return <Bell className='h-4 w-4 text-gray-400' />
    }
  }

  // Obtener color de fondo según tipo
  const getBackgroundColor = (type, isRead) => {
    if (isRead) return 'bg-surface-soft/30'

    switch (type) {
      case 'overdue':
        return 'bg-red-500/10 border-l-2 border-l-red-500'
      case 'due-today':
        return 'bg-orange-500/10 border-l-2 border-l-orange-500'
      case 'due-tomorrow':
        return 'bg-yellow-500/10 border-l-2 border-l-yellow-500'
      case 'upcoming':
        return 'bg-green-500/10 border-l-2 border-l-green-500'
      default:
        return 'bg-surface-soft/50'
    }
  }

  // Obtener etiqueta de prioridad
  const getPriorityLabel = priority => {
    switch (priority) {
      case 'high':
        return { text: 'Urgente', color: 'text-red-400 bg-red-500/20' }
      case 'medium':
        return { text: 'Importante', color: 'text-orange-400 bg-orange-500/20' }
      case 'low':
        return { text: 'Próxima', color: 'text-green-400 bg-green-500/20' }
      default:
        return null
    }
  }

  // Manejar click en notificación
  const handleNotificationClick = notification => {
    // Navegar al cliente si existe
    if (notification.task?.client_id) {
      navigate(`/clients/${notification.task.client_id}`)
      onClose?.()
    }
  }

  return (
    <div className='nav-menu__scroller' style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {/* Header con acciones */}
      <div className='flex items-center justify-between p-3 border-b border-[color:var(--color-border-subtle)]'>
        <div className='flex items-center gap-2'>
          <Bell className='h-4 w-4 text-[color:var(--color-accent-blue)]' />
          <span className='text-sm font-semibold text-text-primary'>Notificaciones</span>
          {stats.total > 0 && (
            <span className='bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
              {stats.total}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <div className='flex items-center gap-1'>
            {hasUnread && (
              <button
                onClick={() => onMarkAllAsRead?.()}
                className='text-xs text-text-muted hover:text-[color:var(--color-accent-blue)] transition-colors p-1 rounded hover:bg-surface-soft'
                title='Marcar todas como leídas'
              >
                <CheckCheck className='h-4 w-4' />
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm('¿Eliminar todas las notificaciones?')) {
                  onDeleteAllNotifications?.()
                }
              }}
              className='text-xs text-text-muted hover:text-red-400 transition-colors p-1 rounded hover:bg-surface-soft'
              title='Eliminar todas'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>

      {/* Stats rapidas */}
      {stats.total > 0 && (
        <div className='grid grid-cols-3 gap-2 p-3 border-b border-[color:var(--color-border-subtle)] bg-surface-soft/30'>
          <div className='text-center'>
            <div className='text-lg font-bold text-red-400'>{stats.overdue}</div>
            <div className='text-xs text-text-muted'>Vencidas</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-orange-400'>{stats.dueToday}</div>
            <div className='text-xs text-text-muted'>Para hoy</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-green-400'>{stats.upcoming}</div>
            <div className='text-xs text-text-muted'>Próximas</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className='p-8 text-center'>
          <div className='mb-3'>
            <Bell className='h-10 w-10 text-text-muted/30 mx-auto' />
          </div>
          <h3 className='text-sm font-medium text-text-primary mb-1'>Sin notificaciones</h3>
          <p className='text-xs text-text-muted'>
            Te avisaremos cuando haya tareas pendientes o vencidas.
          </p>
        </div>
      )}

      {/* Lista de notificaciones */}
      {!isEmpty && (
        <div className='divide-y divide-[color:var(--color-border-subtle)]'>
          {/* Sección: No leídas */}
          {hasUnread && (
            <div>
              <div className='px-3 py-2 bg-surface-soft/50'>
                <span className='text-xs font-semibold text-red-400 uppercase tracking-wide'>
                  Nuevas ({unreadNotifications.length})
                </span>
              </div>
              <AnimatePresence>
                {unreadNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    getIcon={getIcon}
                    getBackgroundColor={getBackgroundColor}
                    getPriorityLabel={getPriorityLabel}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                    onClick={handleNotificationClick}
                    onClose={onClose}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Sección: Leídas */}
          {readNotifications.length > 0 && (
            <div>
              <div className='px-3 py-2 bg-surface-soft/30'>
                <span className='text-xs font-medium text-text-muted uppercase tracking-wide'>
                  Anteriores ({readNotifications.length})
                </span>
              </div>
              <AnimatePresence>
                {readNotifications.slice(0, 5).map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    getIcon={getIcon}
                    getBackgroundColor={getBackgroundColor}
                    getPriorityLabel={getPriorityLabel}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                    onClick={handleNotificationClick}
                    onClose={onClose}
                  />
                ))}
              </AnimatePresence>

              {readNotifications.length > 5 && (
                <div className='p-2 text-center'>
                  <span className='text-xs text-text-muted'>
                    +{readNotifications.length - 5} más
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * NotificationItem - Componente individual de notificación
 */
const NotificationItem = ({
  notification,
  index,
  getIcon,
  getBackgroundColor,
  getPriorityLabel,
  onMarkAsRead,
  onDelete,
  onClick,
  onClose,
}) => {
  const isUnread = !notification.isRead
  const priorityInfo = getPriorityLabel(notification.priority)

  // Formatear tiempo relativo
  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: es,
      })
    : ''

  // Formatear fecha de la tarea
  const taskDate = notification.task?.scheduled_at
    ? new Date(notification.task.scheduled_at).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : ''

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead?.(notification.id)
    }
    onClick?.(notification)
  }

  const handleMarkAsRead = e => {
    e.stopPropagation()
    onMarkAsRead?.(notification.id)
  }

  const handleDelete = e => {
    e.stopPropagation()
    onDelete?.(notification.id)
  }

  return (
    <motion.article
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative cursor-pointer transition-all hover:bg-surface-soft/50 ${getBackgroundColor(notification.type, notification.isRead)}`}
      onClick={handleClick}
    >
      <div className='p-3'>
        <div className='flex items-start gap-3'>
          {/* Icono */}
          <div className='flex-shrink-0 mt-0.5'>{getIcon(notification.type)}</div>

          {/* Contenido */}
          <div className='flex-1 min-w-0'>
            {/* Título y prioridad */}
            <div className='flex items-center gap-2 mb-0.5'>
              <span
                className={`text-sm font-medium truncate ${isUnread ? 'text-text-primary' : 'text-text-muted'}`}
              >
                {notification.title}
              </span>
              {priorityInfo && isUnread && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityInfo.color}`}
                >
                  {priorityInfo.text}
                </span>
              )}
            </div>

            {/* Mensaje */}
            <p
              className={`text-xs mb-1.5 line-clamp-2 ${isUnread ? 'text-text-primary/80' : 'text-text-muted'}`}
            >
              {notification.message}
            </p>

            {/* Metadata */}
            <div className='flex items-center gap-2 text-[10px] text-text-muted'>
              <span className='truncate max-w-[100px]'>{notification.clientName}</span>
              <span>•</span>
              <span>{taskDate}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
            {isUnread && (
              <button
                onClick={handleMarkAsRead}
                className='p-1.5 text-text-muted hover:text-[color:var(--color-accent-blue)] hover:bg-surface-soft rounded transition-colors'
                title='Marcar como leída'
              >
                <Check className='h-3.5 w-3.5' />
              </button>
            )}
            <button
              onClick={handleDelete}
              className='p-1.5 text-text-muted hover:text-red-400 hover:bg-surface-soft rounded transition-colors'
              title='Eliminar'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default NotificationDropdown
