import React, { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useParams, useLocation } from 'react-router-dom'
import { Home, Settings, User, Bell, Menu, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getMyAgency } from '@api/agencies.api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CyberButton,
  Avatar,
  Button,
  KeyboardShortcutsModal,
  AnchorPopover,
} from '@shared/components/ui'
import { ClientSelector } from '@components/ui/ClientSelector'
import { NotificationDropdown } from '@components/notifications/NotificationDropdown'
import { ClientSearchDropdown } from '@components/ui/ClientSearchDropdown'
import { useNotifications } from '@hooks/useNotifications'
import { MobileMenu } from './MobileMenu'
import { Logo } from '@shared/components/Logo'
import { SettingsMenu } from './SettingsMenu'

// Types
export interface HeaderProps {
  userEmail: string
  onLogout: () => void
  profile?: {
    avatar_url?: string
    name?: string
    id: string
  }
}

interface NotificationStats {
  total: number
  unread: number
  viewed: number
}

interface Agency {
  id: string
  name: string
  website?: string
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onLogout, profile }) => {
  const location = useLocation()
  const params = useParams<{ id: string }>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

  // Detectar si estamos en una página de cliente
  const isClientPage = location.pathname.startsWith('/clients/')
  const currentClientId = params.id

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
  } = useNotifications()

  // Auto-mark notifications as viewed when panel opens
  const handleNotificationOpen = useCallback(() => {
    if (notifications.length > 0) {
      markAllAsViewed()
    }
  }, [notifications.length, markAllAsViewed])

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `icon-btn ${isActive ? 'icon-btn--active' : ''}`

  // Website de la agencia (para enlace rápido)
  const { data: agencyResp } = useQuery<{ data: Agency }>({
    queryKey: ['my-agency'],
    queryFn: getMyAgency,
  })
  const website = agencyResp?.data?.website

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(true)
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false)

  return (
    <motion.header
      className='header-cyber sticky top-0 z-50 use-new-palette'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      role='banner'
      aria-label='Navegación principal'
    >
      <div className='flex h-16 w-full items-center justify-between px-4 sm:px-6'>
        {/* Mobile: Hamburger Menu */}
        <div className='flex items-center md:hidden'>
          <button
            onClick={handleMobileMenuToggle}
            className='p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors'
            aria-label='Abrir menú de navegación'
            type='button'
          >
            <Menu className='h-6 w-6' />
          </button>
        </div>

        {/* Logo - Centrado en mobile, izquierda en desktop */}
        <motion.div
          className='flex items-center md:flex-none absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Link
            to='/dashboard'
            className='flex items-center gap-2'
            aria-label='Ir al dashboard - Cadence'
          >
            <Logo size={40} />
            <span className='text-xl sm:text-2xl font-bold text-brand-gradient'>Cadence</span>
          </Link>
        </motion.div>

        {/* Centro: Client Selector (solo en páginas de cliente y desktop) */}
        {isClientPage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className='hidden lg:block'
          >
            <ClientSelector currentClientId={currentClientId} />
          </motion.div>
        )}

        {/* Mobile: Búsqueda y notificaciones */}
        <div className='flex items-center md:hidden'>
          <AnchorPopover
            trigger={
              <button className='icon-btn' aria-label='Buscar clientes' type='button'>
                <Search className='h-6 w-6' aria-hidden='true' />
              </button>
            }
            placement='bottom-end'
            className='w-80'
          >
            {({ close }) => <ClientSearchDropdown onClose={close} />}
          </AnchorPopover>

          <AnchorPopover
            trigger={
              <motion.button
                className='relative icon-btn-style'
                aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type='button'
              >
                <Bell className='h-6 w-6' aria-hidden='true' />
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
            }
            placement='bottom-end'
            className='w-96'
          >
            {({ close }) => (
              <NotificationDropdown
                notifications={notifications}
                groupedNotifications={groupedNotifications}
                stats={stats}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDeleteNotification={deleteNotification}
                onDeleteAllNotifications={deleteAllNotifications}
                onClose={close}
              />
            )}
          </AnchorPopover>
        </div>

        {/* Desktop: Navegación completa */}
        <div className='hidden md:flex items-center space-x-4'>
          <motion.nav
            className='flex items-center space-x-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            role='navigation'
            aria-label='Navegación principal'
          >
            <NavLink
              to='/dashboard'
              className={navLinkClasses}
              title='Dashboard'
              aria-label='Ir al dashboard'
            >
              <Home className='h-5 w-5' aria-hidden='true' />
            </NavLink>

            <AnchorPopover
              trigger={
                <button
                  className={navLinkClasses({ isActive: false })}
                  title='Buscar'
                  aria-label='Buscar clientes'
                  type='button'
                >
                  <Search className='h-5 w-5' aria-hidden='true' />
                </button>
              }
              placement='bottom-start'
              className='w-80'
            >
              {({ close }) => <ClientSearchDropdown onClose={close} />}
            </AnchorPopover>

            {website && (
              <a
                href={website}
                target='_blank'
                rel='noopener noreferrer'
                className={navLinkClasses({ isActive: false })}
                title='Sitio web de la agencia'
                aria-label='Abrir sitio web de la agencia'
              >
                <User className='h-5 w-5' aria-hidden='true' />
              </a>
            )}

            {/* Botón de notificaciones - Desktop */}
            <AnchorPopover
              trigger={
                <motion.button
                  className='relative icon-btn'
                  title='Notificaciones'
                  aria-label={`Notificaciones${stats.total > 0 ? ` - ${stats.total} sin leer` : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type='button'
                >
                  <Bell className='h-5 w-5' aria-hidden='true' />
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
              }
              placement='bottom-end'
              className='w-96'
            >
              {({ close }) => (
                <NotificationDropdown
                  notifications={notifications}
                  groupedNotifications={groupedNotifications}
                  stats={stats}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDeleteNotification={deleteNotification}
                  onDeleteAllNotifications={deleteAllNotifications}
                  onClose={close}
                />
              )}
            </AnchorPopover>

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
            <span className='hidden lg:inline text-sm font-medium text-text-primary max-w-[220px] truncate'>
              {userEmail}
            </span>
            <CyberButton
              variant='ghost'
              size='sm'
              onClick={onLogout}
              className='text-text-muted hover:text-text-primary'
              aria-label='Cerrar sesión'
            >
              <span className='hidden lg:inline'>Salir</span>
              <span className='lg:hidden'>⏻</span>
            </CyberButton>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        userEmail={userEmail}
        onLogout={onLogout}
        notifications={stats}
        onNotificationsClick={() => {}}
        profile={profile}
      />
    </motion.header>
  )
}
