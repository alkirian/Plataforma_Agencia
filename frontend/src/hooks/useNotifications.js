import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../api/clients';
import { getSchedule } from '../api/schedule';
import toast from 'react-hot-toast';

/**
 * Hook para manejar notificaciones y recordatorios
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const toastTimeoutRef = useRef(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem('read-notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [toastShownNotifications, setToastShownNotifications] = useState(() => {
    const saved = localStorage.getItem('toast-shown-notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    const saved = localStorage.getItem('deleted-notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false';
  });

  // Obtener todos los clientes
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const clients = clientsResponse?.data || [];

  // Función para calcular recordatorios de una tarea
  const getTaskReminders = (task, clientName) => {
    const now = new Date();
    const taskDate = new Date(task.scheduled_at);
    const timeDiff = taskDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));

    const reminders = [];

    // Tarea vencida
    if (timeDiff < 0 && task.status !== 'publicado' && task.status !== 'completado') {
      reminders.push({
        id: `overdue-${task.id}`,
        type: 'overdue',
        priority: 'high',
        title: 'Tarea vencida',
        message: `"${task.title}" en ${clientName} está vencida`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      });
    }
    
    // Tarea para hoy
    else if (daysDiff === 0 && task.status === 'pendiente') {
      reminders.push({
        id: `today-${task.id}`,
        type: 'due-today',
        priority: 'high',
        title: 'Tarea para hoy',
        message: `"${task.title}" en ${clientName} es para hoy`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      });
    }
    
    // Tarea para mañana
    else if (daysDiff === 1 && task.status === 'pendiente') {
      reminders.push({
        id: `tomorrow-${task.id}`,
        type: 'due-tomorrow',
        priority: 'medium',
        title: 'Tarea para mañana',
        message: `"${task.title}" en ${clientName} es para mañana`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      });
    }
    
    // Tarea próxima (2-3 días)
    else if (daysDiff >= 2 && daysDiff <= 3 && task.status === 'pendiente') {
      reminders.push({
        id: `upcoming-${task.id}`,
        type: 'upcoming',
        priority: 'low',
        title: 'Tarea próxima',
        message: `"${task.title}" en ${clientName} es en ${daysDiff} días`,
        taskId: task.id,
        clientName,
        task,
        createdAt: now,
      });
    }

    return reminders;
  };

  // Función para obtener todas las tareas de todos los clientes  
  const getAllTasks = useCallback(async () => {
    if (!isEnabled) return [];
    
    // Obtener clientes frescos directamente de la API en lugar de depender del prop
    try {
      const response = await getClients();
      const currentClients = response?.data || [];
      
      if (currentClients.length === 0) return [];

      const allTasks = [];
      
      for (const client of currentClients) {
        try {
          const schedule = await getSchedule(client.id);
          const tasksWithClient = schedule.map(task => ({
            ...task,
            clientName: client.name,
            clientId: client.id,
          }));
          allTasks.push(...tasksWithClient);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Error loading schedule for client ${client.name}:`, error);
          }
        }
      }
      
      return allTasks;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading all tasks:', error);
      }
      return [];
    }
  }, [isEnabled]);

  // Función para generar notificaciones
  const generateNotifications = useCallback(async () => {
    if (!isEnabled) return;

    try {
      const allTasks = await getAllTasks();
      const newNotifications = [];

      allTasks.forEach(task => {
        const reminders = getTaskReminders(task, task.clientName);
        newNotifications.push(...reminders);
      });

      // Filtrar notificaciones duplicadas y eliminadas
      const uniqueNotifications = newNotifications.filter(
        (notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id) &&
          !deletedNotifications.has(notification.id)
      );

      // Marcar las notificaciones como leídas o no leídas
      const notificationsWithReadStatus = uniqueNotifications.map(notification => ({
        ...notification,
        isRead: readNotifications.has(notification.id)
      }));

      setNotifications(notificationsWithReadStatus);

      // Mostrar toasts para notificaciones de alta prioridad que son nuevas y no se han mostrado antes
      const highPriorityNew = uniqueNotifications.filter(n => 
        n.priority === 'high' && 
        !toastShownNotifications.has(n.id)
      );

      if (highPriorityNew.length > 0) {
        // Limpiar timeout anterior para evitar múltiples toasts
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        
        // Debounce de 1 segundo para evitar toasts múltiples
        toastTimeoutRef.current = setTimeout(() => {
          const newToastShown = new Set(toastShownNotifications);
          
          // Mostrar solo un toast resumen si hay múltiples notificaciones
          if (highPriorityNew.length === 1) {
            const notification = highPriorityNew[0];
            newToastShown.add(notification.id);
            
            if (notification.type === 'overdue') {
              toast.error(notification.message, {
                duration: 6000,
                icon: '⚠️',
              });
            } else if (notification.type === 'due-today') {
              toast(notification.message, {
                duration: 4000,
                icon: '📅',
                style: {
                  background: '#f59e0b',
                  color: 'white',
                },
              });
            }
          } else {
            // Si hay múltiples, mostrar un toast resumen
            const overdueCount = highPriorityNew.filter(n => n.type === 'overdue').length;
            const dueTodayCount = highPriorityNew.filter(n => n.type === 'due-today').length;
            
            let message = '';
            if (overdueCount > 0 && dueTodayCount > 0) {
              message = `${overdueCount} tareas vencidas y ${dueTodayCount} para hoy`;
            } else if (overdueCount > 0) {
              message = `${overdueCount} tarea${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`;
            } else if (dueTodayCount > 0) {
              message = `${dueTodayCount} tarea${dueTodayCount > 1 ? 's' : ''} para hoy`;
            }
            
            toast.error(message, {
              duration: 6000,
              icon: '🔔',
            });
            
            // Marcar todas como mostradas
            highPriorityNew.forEach(notification => {
              newToastShown.add(notification.id);
            });
          }

          // Actualizar el estado y localStorage
          setToastShownNotifications(newToastShown);
          localStorage.setItem('toast-shown-notifications', JSON.stringify([...newToastShown]));
        }, 1000);
      }

      setLastChecked(Date.now());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating notifications:', error);
      }
    }
  }, [isEnabled, getAllTasks, lastChecked, readNotifications, toastShownNotifications, deletedNotifications]);

  // Función para marcar notificación como leída
  const markAsRead = useCallback((notificationId) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notificationId);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read-notifications', JSON.stringify([...newReadNotifications]));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, [readNotifications]);

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    const currentNotificationIds = notifications.map(n => n.id);
    const newReadNotifications = new Set([...readNotifications, ...currentNotificationIds]);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read-notifications', JSON.stringify([...newReadNotifications]));
    setNotifications([]);
  }, [notifications, readNotifications]);

  // Función para marcar todas las notificaciones como vistas (al abrir el panel)
  const markAllAsViewed = useCallback(() => {
    const currentNotificationIds = notifications.map(n => n.id);
    const newReadNotifications = new Set([...readNotifications, ...currentNotificationIds]);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read-notifications', JSON.stringify([...newReadNotifications]));
    
    // No eliminamos las notificaciones, solo las marcamos como leídas
    // Las notificaciones seguirán apareciendo en el panel pero marcadas como leídas
  }, [notifications, readNotifications]);

  // Función para eliminar una notificación específica
  const deleteNotification = useCallback((notificationId) => {
    // Marcar como eliminada permanentemente
    const newDeletedNotifications = new Set(deletedNotifications);
    newDeletedNotifications.add(notificationId);
    setDeletedNotifications(newDeletedNotifications);
    localStorage.setItem('deleted-notifications', JSON.stringify([...newDeletedNotifications]));
    
    // Remover de la lista actual
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // También limpiar de otros estados
    const newReadNotifications = new Set(readNotifications);
    const newToastShown = new Set(toastShownNotifications);
    newReadNotifications.delete(notificationId);
    newToastShown.delete(notificationId);
    
    setReadNotifications(newReadNotifications);
    setToastShownNotifications(newToastShown);
    localStorage.setItem('read-notifications', JSON.stringify([...newReadNotifications]));
    localStorage.setItem('toast-shown-notifications', JSON.stringify([...newToastShown]));
  }, [deletedNotifications, readNotifications, toastShownNotifications]);

  // Función para eliminar todas las notificaciones
  const deleteAllNotifications = useCallback(() => {
    // Marcar todas las notificaciones actuales como eliminadas permanentemente
    const currentNotificationIds = notifications.map(n => n.id);
    const newDeletedNotifications = new Set([...deletedNotifications, ...currentNotificationIds]);
    setDeletedNotifications(newDeletedNotifications);
    localStorage.setItem('deleted-notifications', JSON.stringify([...newDeletedNotifications]));
    
    // Limpiar la lista actual
    setNotifications([]);
    
    // Limpiar otros estados
    const newReadNotifications = new Set();
    const newToastShown = new Set();
    
    setReadNotifications(newReadNotifications);
    setToastShownNotifications(newToastShown);
    localStorage.setItem('read-notifications', JSON.stringify([]));
    localStorage.setItem('toast-shown-notifications', JSON.stringify([]));
  }, [notifications, deletedNotifications]);

  // Función para alternar notificaciones
  const toggleNotifications = useCallback((enabled) => {
    setIsEnabled(enabled);
    localStorage.setItem('notifications-enabled', enabled.toString());
    if (!enabled) {
      setNotifications([]);
    }
  }, []);

  // Efecto para generar notificaciones periódicamente
  useEffect(() => {
    if (!isEnabled) return;

    // Generar notificaciones inmediatamente
    generateNotifications();

    // Configurar intervalo para revisar cada 5 minutos
    const interval = setInterval(() => {
      generateNotifications();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      // Limpiar timeout de toasts
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [isEnabled]); // Solo depende de isEnabled

  // Efecto para limpiar notificaciones antiguas (ejecutar una vez al día)
  useEffect(() => {
    const cleanupOldNotifications = () => {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const lastCleanup = localStorage.getItem('last-notification-cleanup');
      
      if (!lastCleanup || parseInt(lastCleanup) < oneWeekAgo) {
        // Limpiar notificaciones leídas y toasts mostrados que son más antiguos de una semana
        // (Aquí mantenemos todas por simplicidad, pero podrías implementar una lógica más sofisticada)
        localStorage.setItem('last-notification-cleanup', Date.now().toString());
        
        // Opcional: Limpiar algunos datos antiguos para evitar acumulación infinita
        // localStorage.removeItem('read-notifications');
        // localStorage.removeItem('toast-shown-notifications');
        // localStorage.removeItem('deleted-notifications');
      }
    };

    cleanupOldNotifications();
  }, []);

  // Separar notificaciones leídas y no leídas
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const allNotifications = notifications;

  // Agrupar notificaciones por prioridad (todas, para mostrar en el panel)
  const groupedNotifications = {
    high: allNotifications.filter(n => n.priority === 'high'),
    medium: allNotifications.filter(n => n.priority === 'medium'),
    low: allNotifications.filter(n => n.priority === 'low'),
  };

  // Estadísticas solo de notificaciones no leídas (para el contador)
  const stats = {
    total: unreadNotifications.length,
    overdue: unreadNotifications.filter(n => n.type === 'overdue').length,
    dueToday: unreadNotifications.filter(n => n.type === 'due-today').length,
    upcoming: unreadNotifications.filter(n => n.type === 'upcoming').length,
  };

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
  };
};