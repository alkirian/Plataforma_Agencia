import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

import { getClients } from '../api/clients.api'
import { getSchedule } from '@schedule'
import { supabase } from '../supabaseClient'
import type {
  TaskReminder,
  TaskReminderType,
  TaskReminderPriority,
  TaskData,
  NotificationStats,
  GroupedNotifications,
  LocalStorageNotificationData,
} from '../types/common.types'
import type { Client } from '../types/client.types'

interface UseNotificationsReturn {
  notifications: TaskReminder[]
  groupedNotifications: GroupedNotifications
  stats: NotificationStats
  isEnabled: boolean
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  markAllAsViewed: () => void
  deleteNotification: (notificationId: string) => void
  deleteAllNotifications: () => void
  toggleNotifications: (enabled: boolean) => void
  refresh: () => void
}

interface TaskWithClient extends TaskData {
  clientName: string
  clientId: string
}

// Debounced toast timeout
const TOAST_DEBOUNCE_DELAY = 1000
// Polling interval in milliseconds (5 minutes)
const POLLING_INTERVAL = 5 * 60 * 1000
// Cache time for react-query (10 minutes)
const CACHE_TIME = 10 * 60 * 1000
// Stale time for react-query (5 minutes)
const STALE_TIME = 5 * 60 * 1000

/**
 * Optimized hook for managing task notifications and reminders
 *
 * Key optimizations:
 * - Proper TypeScript typing
 * - Memoized calculations
 * - Debounced toast notifications
 * - Optimized localStorage operations
 * - Better error handling
 * - Reduced re-renders
 */
export const useNotifications = (): UseNotificationsReturn => {
  // Core state
  const [notifications, setNotifications] = useState<TaskReminder[]>([])
  const [lastChecked, setLastChecked] = useState<number>(Date.now())
  const [session, setSession] = useState<Session | null>(null)

  // Refs for cleanup and debouncing
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mounted = useRef(true)

  // Memoized localStorage data with optimized getters
  const localStorageData = useMemo<LocalStorageNotificationData>(() => {
    try {
      return {
        readNotifications: new Set(JSON.parse(localStorage.getItem('read-notifications') ?? '[]')),
        toastShownNotifications: new Set(
          JSON.parse(localStorage.getItem('toast-shown-notifications') ?? '[]')
        ),
        deletedNotifications: new Set(
          JSON.parse(localStorage.getItem('deleted-notifications') ?? '[]')
        ),
      }
    } catch {
      return {
        readNotifications: new Set<string>(),
        toastShownNotifications: new Set<string>(),
        deletedNotifications: new Set<string>(),
      }
    }
  }, [])

  // State for localStorage data with proper initialization
  const [readNotifications, setReadNotifications] = useState<Set<string>>(
    localStorageData.readNotifications
  )
  const [toastShownNotifications, setToastShownNotifications] = useState<Set<string>>(
    localStorageData.toastShownNotifications
  )
  const [deletedNotifications, setDeletedNotifications] = useState<Set<string>>(
    localStorageData.deletedNotifications
  )

  // Enabled state with proper initialization
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notifications-enabled') !== 'false'
    } catch {
      return true
    }
  })

  // Session management effect
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted.current) {
        setSession(session)
      }
    })

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) {
        setSession(session)
        // Clear notifications if no session
        if (!session) {
          setNotifications([])
        }
      }
    })

    subscription = data.subscription

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Optimized clients query with proper error handling
  const { data: clientsResponse, error: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled: isEnabled && !!session,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      const errorMessage = error?.message || ''
      if (errorMessage.includes('Token inválido') || errorMessage.includes('No autorizado')) {
        return false
      }
      return failureCount < 2
    },
  })

  const clients = useMemo<Client[]>(() => clientsResponse?.data || [], [clientsResponse?.data])

  // Optimized function to calculate task reminders with memoization
  const getTaskReminders = useCallback((task: TaskData, clientName: string): TaskReminder[] => {
    const now = new Date()
    const taskDate = new Date(task.scheduled_at)
    const timeDiff = taskDate.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    const reminders: TaskReminder[] = []

    // Task is overdue
    if (timeDiff < 0 && task.status !== 'publicado' && task.status !== 'completado') {
      reminders.push({
        id: `overdue-${task.id}`,
        type: 'overdue' as TaskReminderType,
        priority: 'high' as TaskReminderPriority,
        title: 'Tarea vencida',
        message: `"${task.title}" en ${clientName} está vencida`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      })
    }
    // Task due today
    else if (daysDiff === 0 && task.status === 'pendiente') {
      reminders.push({
        id: `today-${task.id}`,
        type: 'due-today' as TaskReminderType,
        priority: 'high' as TaskReminderPriority,
        title: 'Tarea para hoy',
        message: `"${task.title}" en ${clientName} es para hoy`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      })
    }
    // Task due tomorrow
    else if (daysDiff === 1 && task.status === 'pendiente') {
      reminders.push({
        id: `tomorrow-${task.id}`,
        type: 'due-tomorrow' as TaskReminderType,
        priority: 'medium' as TaskReminderPriority,
        title: 'Tarea para mañana',
        message: `"${task.title}" en ${clientName} es para mañana`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      })
    }
    // Upcoming task (2-3 days)
    else if (daysDiff >= 2 && daysDiff <= 3 && task.status === 'pendiente') {
      reminders.push({
        id: `upcoming-${task.id}`,
        type: 'upcoming' as TaskReminderType,
        priority: 'low' as TaskReminderPriority,
        title: 'Tarea próxima',
        message: `"${task.title}" en ${clientName} es en ${daysDiff} días`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      })
    }

    return reminders
  }, [])

  // Optimized function to get all tasks from all clients
  const getAllTasks = useCallback(async (): Promise<TaskWithClient[]> => {
    if (!isEnabled || !session || !clients.length) return []

    try {
      const allTasks: TaskWithClient[] = []

      // Use Promise.all for parallel requests with error handling
      const schedulePromises = clients.map(async client => {
        try {
          const schedule = await getSchedule(client.id)
          return schedule.map(
            (task: any) =>
              ({
                ...task,
                clientName: client.name,
                clientId: client.id,
              }) as TaskWithClient
          )
        } catch (error) {
          // Handle auth errors gracefully
          const errorMessage = (error as Error)?.message || ''
          if (errorMessage.includes('Token inválido') || errorMessage.includes('No autorizado')) {
            return []
          }

          if (process.env.NODE_ENV === 'development') {
            console.warn(`Error loading schedule for client ${client.name}:`, error)
          }
          return []
        }
      })

      const scheduleResults = await Promise.all(schedulePromises)
      scheduleResults.forEach((tasks: TaskWithClient[]) => allTasks.push(...tasks))

      return allTasks
    } catch (error) {
      const errorMessage = (error as Error)?.message || ''
      if (!errorMessage.includes('Token inválido') && !errorMessage.includes('No autorizado')) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading all tasks:', error)
        }
      }
      return []
    }
  }, [isEnabled, session, clients])

  // Optimized function to show toast notifications with debouncing
  const showToastNotifications = useCallback(
    (highPriorityNew: TaskReminder[]) => {
      if (highPriorityNew.length === 0) return

      // Clear previous timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }

      // Debounced toast showing
      toastTimeoutRef.current = setTimeout(() => {
        if (!mounted.current) return

        const newToastShown = new Set(toastShownNotifications)

        if (highPriorityNew.length === 1) {
          const notification = highPriorityNew[0]
          newToastShown.add(notification.id)

          if (notification.type === 'overdue') {
            toast.error(notification.message, {
              duration: 6000,
              icon: '⚠️',
            })
          } else if (notification.type === 'due-today') {
            toast(notification.message, {
              duration: 4000,
              icon: '📅',
              style: {
                background: '#f59e0b',
                color: 'white',
              },
            })
          }
        } else {
          // Multiple notifications - show summary
          const overdueCount = highPriorityNew.filter(n => n.type === 'overdue').length
          const dueTodayCount = highPriorityNew.filter(n => n.type === 'due-today').length

          let message = ''
          if (overdueCount > 0 && dueTodayCount > 0) {
            message = `${overdueCount} tareas vencidas y ${dueTodayCount} para hoy`
          } else if (overdueCount > 0) {
            message = `${overdueCount} tarea${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`
          } else if (dueTodayCount > 0) {
            message = `${dueTodayCount} tarea${dueTodayCount > 1 ? 's' : ''} para hoy`
          }

          if (message) {
            toast.error(message, {
              duration: 6000,
              icon: '🔔',
            })
          }

          // Mark all as shown
          highPriorityNew.forEach(notification => {
            newToastShown.add(notification.id)
          })
        }

        // Update state and localStorage atomically
        setToastShownNotifications(newToastShown)
        try {
          localStorage.setItem('toast-shown-notifications', JSON.stringify([...newToastShown]))
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to save toast shown notifications:', error)
          }
        }
      }, TOAST_DEBOUNCE_DELAY)
    },
    [toastShownNotifications]
  )

  // Main function to generate notifications with optimizations
  const generateNotifications = useCallback(async (): Promise<void> => {
    if (!isEnabled || !session) return

    try {
      const allTasks = await getAllTasks()
      const newNotifications: TaskReminder[] = []

      allTasks.forEach(task => {
        const reminders = getTaskReminders(task, task.clientName)
        newNotifications.push(...reminders)
      })

      // Filter duplicates and deleted notifications efficiently
      const uniqueNotifications = newNotifications.filter(
        (notification, index, self) =>
          index === self.findIndex(n => n.id === notification.id) &&
          !deletedNotifications.has(notification.id)
      )

      // Mark notifications as read/unread
      const notificationsWithReadStatus = uniqueNotifications.map(notification => ({
        ...notification,
        isRead: readNotifications.has(notification.id),
      }))

      setNotifications(notificationsWithReadStatus)

      // Show toasts for new high priority notifications
      const highPriorityNew = uniqueNotifications.filter(
        n => n.priority === 'high' && !toastShownNotifications.has(n.id)
      )

      showToastNotifications(highPriorityNew)
      setLastChecked(Date.now())
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating notifications:', error)
      }
    }
  }, [
    isEnabled,
    session,
    getAllTasks,
    getTaskReminders,
    deletedNotifications,
    readNotifications,
    toastShownNotifications,
    showToastNotifications,
  ])

  // Optimized utility function for localStorage operations
  const updateLocalStorage = useCallback(
    (key: string, value: Set<string>, setState: (value: Set<string>) => void) => {
      setState(value)
      try {
        localStorage.setItem(key, JSON.stringify([...value]))
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to save ${key}:`, error)
        }
      }
    },
    []
  )

  // Notification management functions with optimizations
  const markAsRead = useCallback(
    (notificationId: string) => {
      const newReadNotifications = new Set(readNotifications)
      newReadNotifications.add(notificationId)
      updateLocalStorage('read-notifications', newReadNotifications, setReadNotifications)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    },
    [readNotifications, updateLocalStorage]
  )

  const markAllAsRead = useCallback(() => {
    const currentNotificationIds = notifications.map(n => n.id)
    const newReadNotifications = new Set([...readNotifications, ...currentNotificationIds])
    updateLocalStorage('read-notifications', newReadNotifications, setReadNotifications)
    setNotifications([])
  }, [notifications, readNotifications, updateLocalStorage])

  const markAllAsViewed = useCallback(() => {
    const currentNotificationIds = notifications.map(n => n.id)
    const newReadNotifications = new Set([...readNotifications, ...currentNotificationIds])
    updateLocalStorage('read-notifications', newReadNotifications, setReadNotifications)
    // Don't remove notifications, just mark as read
  }, [notifications, readNotifications, updateLocalStorage])

  const deleteNotification = useCallback(
    (notificationId: string) => {
      // Mark as deleted permanently
      const newDeletedNotifications = new Set(deletedNotifications)
      newDeletedNotifications.add(notificationId)
      updateLocalStorage('deleted-notifications', newDeletedNotifications, setDeletedNotifications)

      // Remove from current list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Clean up other states
      const newReadNotifications = new Set(readNotifications)
      const newToastShown = new Set(toastShownNotifications)
      newReadNotifications.delete(notificationId)
      newToastShown.delete(notificationId)

      updateLocalStorage('read-notifications', newReadNotifications, setReadNotifications)
      updateLocalStorage('toast-shown-notifications', newToastShown, setToastShownNotifications)
    },
    [deletedNotifications, readNotifications, toastShownNotifications, updateLocalStorage]
  )

  const deleteAllNotifications = useCallback(() => {
    // Mark all current notifications as deleted permanently
    const currentNotificationIds = notifications.map(n => n.id)
    const newDeletedNotifications = new Set([...deletedNotifications, ...currentNotificationIds])
    updateLocalStorage('deleted-notifications', newDeletedNotifications, setDeletedNotifications)

    // Clear all states
    setNotifications([])
    updateLocalStorage('read-notifications', new Set(), setReadNotifications)
    updateLocalStorage('toast-shown-notifications', new Set(), setToastShownNotifications)
  }, [notifications, deletedNotifications, updateLocalStorage])

  const toggleNotifications = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    try {
      localStorage.setItem('notifications-enabled', enabled.toString())
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save notifications enabled state:', error)
      }
    }
    if (!enabled) {
      setNotifications([])
    }
  }, [])

  // Periodic notification generation with cleanup
  useEffect(() => {
    if (!isEnabled) return

    // Generate notifications immediately
    generateNotifications()

    // Set up polling interval
    const interval = setInterval(generateNotifications, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [isEnabled, generateNotifications])

  // Cleanup old notifications effect (once per week)
  useEffect(() => {
    const cleanupOldNotifications = () => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const lastCleanup = localStorage.getItem('last-notification-cleanup')

      if (!lastCleanup || parseInt(lastCleanup, 10) < oneWeekAgo) {
        try {
          localStorage.setItem('last-notification-cleanup', Date.now().toString())
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to save cleanup timestamp:', error)
          }
        }
      }
    }

    cleanupOldNotifications()
  }, [])

  // Component unmount cleanup
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  // Memoized computed values for better performance
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications])

  const groupedNotifications = useMemo<GroupedNotifications>(
    () => ({
      high: notifications.filter(n => n.priority === 'high'),
      medium: notifications.filter(n => n.priority === 'medium'),
      low: notifications.filter(n => n.priority === 'low'),
    }),
    [notifications]
  )

  const stats = useMemo<NotificationStats>(
    () => ({
      total: unreadNotifications.length,
      overdue: unreadNotifications.filter(n => n.type === 'overdue').length,
      dueToday: unreadNotifications.filter(n => n.type === 'due-today').length,
      upcoming: unreadNotifications.filter(n => n.type === 'upcoming').length,
    }),
    [unreadNotifications]
  )

  return {
    notifications,
    groupedNotifications,
    stats,
    isEnabled,
    markAsRead,
    markAllAsRead,
    markAllAsViewed,
    deleteNotification,
    deleteAllNotifications,
    toggleNotifications,
    refresh: generateNotifications,
  }
}
