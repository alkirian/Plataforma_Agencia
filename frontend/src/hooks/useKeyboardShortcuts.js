import { useEffect, useCallback } from 'react';

/**
 * Hook para manejar atajos de teclado globales
 */
export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  // Función para verificar si los modificadores están activos
  const checkModifiers = useCallback((event, modifiers) => {
    const { ctrl, alt, shift, meta } = modifiers;
    
    return (
      (!ctrl || event.ctrlKey) &&
      (!alt || event.altKey) &&
      (!shift || event.shiftKey) &&
      (!meta || event.metaKey)
    );
  }, []);

  // Función para obtener la tecla normalizada
  const normalizeKey = useCallback((key) => {
    return key.toLowerCase();
  }, []);

  // Handler principal del evento keydown
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Ignorar si estamos en un input, textarea o elemento editable
    const activeElement = document.activeElement;
    const isInputElement = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.getAttribute('role') === 'textbox'
    );

    if (isInputElement) return;

    const key = normalizeKey(event.key);
    
    // Buscar el shortcut correspondiente
    for (const [shortcutKey, config] of Object.entries(shortcuts)) {
      const { key: targetKey, modifiers = {}, handler, description } = config;
      
      if (normalizeKey(targetKey) === key && checkModifiers(event, modifiers)) {
        event.preventDefault();
        event.stopPropagation();
        
        if (handler && typeof handler === 'function') {
          handler(event);
        }
        
        break;
      }
    }
  }, [enabled, shortcuts, checkModifiers, normalizeKey]);

  // Efecto para agregar/remover el listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Función para generar el texto descriptivo del shortcut
  const formatShortcut = useCallback((config) => {
    const { key, modifiers = {} } = config;
    const parts = [];

    if (modifiers.ctrl || modifiers.meta) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (modifiers.alt) {
      parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    }
    if (modifiers.shift) {
      parts.push('⇧');
    }
    
    parts.push(key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  return {
    formatShortcut
  };
};

/**
 * Hook especializado para atajos de teclado de la aplicación
 */
export const useAppKeyboardShortcuts = () => {
  const shortcuts = {
    // Navegación general
    newClient: {
      key: 'n',
      modifiers: { ctrl: true },
      description: 'Crear nuevo cliente',
      handler: () => {
        // Buscar y hacer click en el botón de nuevo cliente
        const addButton = document.getElementById('add-client-button');
        if (addButton) addButton.click();
      }
    },
    
    search: {
      key: '/',
      modifiers: {},
      description: 'Buscar',
      handler: () => {
        // Enfocar en el campo de búsqueda si existe
        const searchInput = document.querySelector('input[placeholder*="Buscar"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    },
    
    dashboard: {
      key: 'd',
      modifiers: { alt: true },
      description: 'Ir al Dashboard',
      handler: () => {
        window.location.href = '/dashboard';
      }
    },
    
    settings: {
      key: 's',
      modifiers: { alt: true },
      description: 'Ir a Configuración',
      handler: () => {
        window.location.href = '/settings';
      }
    },

    // Atajos del calendario
    calendarToday: {
      key: 't',
      modifiers: { ctrl: true },
      description: 'Ir a hoy en el calendario',
      handler: () => {
        // Buscar botón "Hoy" en el calendario
        const todayButton = document.querySelector('button:contains("Hoy")') || 
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent.trim() === 'Hoy'
                           );
        if (todayButton) todayButton.click();
      }
    },
    
    calendarPrev: {
      key: 'ArrowLeft',
      modifiers: { ctrl: true },
      description: 'Período anterior del calendario',
      handler: () => {
        const prevButton = document.querySelector('button:contains("◀")') || 
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('◀')
                          );
        if (prevButton) prevButton.click();
      }
    },
    
    calendarNext: {
      key: 'ArrowRight',
      modifiers: { ctrl: true },
      description: 'Período siguiente del calendario',
      handler: () => {
        const nextButton = document.querySelector('button:contains("▶")') || 
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('▶')
                          );
        if (nextButton) nextButton.click();
      }
    },
    
    newEvent: {
      key: 'e',
      modifiers: { ctrl: true },
      description: 'Crear nuevo evento',
      handler: () => {
        const newEventButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Nuevo Evento')
        );
        if (newEventButton) newEventButton.click();
      }
    },

    exportCalendar: {
      key: 'e',
      modifiers: { ctrl: true, shift: true },
      description: 'Exportar calendario',
      handler: () => {
        const exportButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Exportar')
        );
        if (exportButton) exportButton.click();
      }
    },

    // Atajos de notificaciones
    toggleNotifications: {
      key: 'n',
      modifiers: { alt: true },
      description: 'Alternar panel de notificaciones',
      handler: () => {
        // Buscar el botón de notificaciones por el ícono de campana
        const notificationButton = document.querySelector('button[title="Notificaciones"]');
        if (notificationButton) notificationButton.click();
      }
    },

    // Atajos de ayuda
    showHelp: {
      key: '?',
      modifiers: { shift: true },
      description: 'Mostrar ayuda de atajos',
      handler: () => {
        // Trigger help modal
        const event = new CustomEvent('show-keyboard-help');
        document.dispatchEvent(event);
      }
    },

    // Cerrar modales con Escape (ya funciona por defecto, pero lo incluimos para documentación)
    closeModal: {
      key: 'Escape',
      modifiers: {},
      description: 'Cerrar modal o panel',
      handler: () => {
        // Los modales ya manejan Escape, este es solo para documentación
      }
    }
  };

  const { formatShortcut } = useKeyboardShortcuts(shortcuts);

  // Función para obtener todos los atajos con sus descripciones
  const getAllShortcuts = useCallback(() => {
    return Object.entries(shortcuts).map(([key, config]) => ({
      id: key,
      shortcut: formatShortcut(config),
      description: config.description,
      category: getShortcutCategory(key)
    }));
  }, [formatShortcut]);

  // Función para categorizar los atajos
  const getShortcutCategory = (shortcutKey) => {
    if (shortcutKey.startsWith('calendar')) return 'Calendario';
    if (shortcutKey.includes('notification') || shortcutKey.includes('Notifications')) return 'Notificaciones';
    if (shortcutKey === 'search' || shortcutKey === 'newClient') return 'Navegación';
    if (shortcutKey === 'dashboard' || shortcutKey === 'settings') return 'Navegación';
    if (shortcutKey === 'showHelp' || shortcutKey === 'closeModal') return 'Ayuda';
    return 'General';
  };

  return {
    getAllShortcuts,
    formatShortcut
  };
};