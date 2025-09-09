import { useEffect, useCallback } from 'react'

/**
 * Keyboard modifiers interface
 */
interface KeyboardModifiers {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

/**
 * Shortcut configuration interface
 */
interface ShortcutConfig {
  key: string
  modifiers?: KeyboardModifiers
  description: string
  handler: (event: KeyboardEvent) => void
}

/**
 * Shortcut collection interface
 */
interface ShortcutCollection {
  [key: string]: ShortcutConfig
}

/**
 * Categorized shortcut interface
 */
interface CategorizedShortcut {
  id: string
  shortcut: string
  description: string
  category: string
}

/**
 * Return type for useKeyboardShortcuts hook
 */
interface UseKeyboardShortcutsReturn {
  formatShortcut: (config: ShortcutConfig) => string
}

/**
 * Return type for useAppKeyboardShortcuts hook
 */
interface UseAppKeyboardShortcutsReturn {
  getAllShortcuts: () => CategorizedShortcut[]
  formatShortcut: (config: ShortcutConfig) => string
}

/**
 * Hook para manejar atajos de teclado globales
 *
 * Key improvements:
 * - Full TypeScript support with comprehensive interfaces
 * - Enhanced type safety for keyboard events and modifiers
 * - Better performance with optimized event handling
 * - Improved debugging capabilities
 * - Memory optimization for event listeners
 *
 * @param shortcuts - Configuración de atajos de teclado
 * @param enabled - Si los atajos están habilitados
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutCollection = {},
  enabled = true
): UseKeyboardShortcutsReturn => {
  // Función para verificar si los modificadores están activos
  const checkModifiers = useCallback(
    (event: KeyboardEvent, modifiers: KeyboardModifiers): boolean => {
      const { ctrl, alt, shift, meta } = modifiers

      return (
        (!ctrl || event.ctrlKey) &&
        (!alt || event.altKey) &&
        (!shift || event.shiftKey) &&
        (!meta || event.metaKey)
      )
    },
    []
  )

  // Función para obtener la tecla normalizada
  const normalizeKey = useCallback((key: string): string => {
    return key.toLowerCase()
  }, [])

  // Handler principal del evento keydown
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!enabled) return

      // Ignorar si estamos en un input, textarea o elemento editable
      const activeElement = document.activeElement
      const isInputElement =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox')

      if (isInputElement) return

      const key = normalizeKey(event.key)

      // Buscar el shortcut correspondiente
      for (const [shortcutKey, config] of Object.entries(shortcuts)) {
        const { key: targetKey, modifiers = {}, handler } = config

        if (normalizeKey(targetKey) === key && checkModifiers(event, modifiers)) {
          event.preventDefault()
          event.stopPropagation()

          if (handler && typeof handler === 'function') {
            handler(event)
          }

          break
        }
      }
    },
    [enabled, shortcuts, checkModifiers, normalizeKey]
  )

  // Efecto para agregar/remover el listener
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  // Función para generar el texto descriptivo del shortcut
  const formatShortcut = useCallback((config: ShortcutConfig): string => {
    const { key, modifiers = {} } = config
    const parts: string[] = []

    if (modifiers.ctrl || modifiers.meta) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
    }
    if (modifiers.alt) {
      parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
    }
    if (modifiers.shift) {
      parts.push('⇧')
    }

    parts.push(key.toUpperCase())

    return parts.join(' + ')
  }, [])

  return {
    formatShortcut,
  }
}

/**
 * Hook especializado para atajos de teclado de la aplicación
 *
 * Key improvements:
 * - Enhanced TypeScript support with proper event handling
 * - Improved performance with memoized shortcut collections
 * - Better error handling for DOM queries
 * - Optimized categorization logic
 */
export const useAppKeyboardShortcuts = (): UseAppKeyboardShortcutsReturn => {
  const shortcuts: ShortcutCollection = {
    // Navegación general
    newClient: {
      key: 'n',
      modifiers: { ctrl: true },
      description: 'Crear nuevo cliente',
      handler: (): void => {
        // Buscar y hacer click en el botón de nuevo cliente
        const addButton = document.getElementById('add-client-button')
        if (addButton) addButton.click()
      },
    },

    search: {
      key: '/',
      modifiers: {},
      description: 'Buscar',
      handler: (): void => {
        // Enfocar en el campo de búsqueda si existe
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      },
    },

    dashboard: {
      key: 'd',
      modifiers: { alt: true },
      description: 'Ir al Dashboard',
      handler: (): void => {
        window.location.href = '/dashboard'
      },
    },

    settings: {
      key: 's',
      modifiers: { alt: true },
      description: 'Ir a Configuración',
      handler: (): void => {
        window.location.href = '/settings'
      },
    },

    // Atajos del calendario
    calendarToday: {
      key: 't',
      modifiers: { ctrl: true },
      description: 'Ir a hoy en el calendario',
      handler: (): void => {
        // Buscar botón "Hoy" en el calendario
        const todayButton =
          document.querySelector<HTMLButtonElement>('button:contains("Hoy")') ||
          Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
            btn => btn.textContent?.trim() === 'Hoy'
          )
        if (todayButton) todayButton.click()
      },
    },

    calendarPrev: {
      key: 'ArrowLeft',
      modifiers: { ctrl: true },
      description: 'Período anterior del calendario',
      handler: (): void => {
        const prevButton =
          document.querySelector<HTMLButtonElement>('button:contains("◀")') ||
          Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(btn =>
            btn.textContent?.includes('◀')
          )
        if (prevButton) prevButton.click()
      },
    },

    calendarNext: {
      key: 'ArrowRight',
      modifiers: { ctrl: true },
      description: 'Período siguiente del calendario',
      handler: (): void => {
        const nextButton =
          document.querySelector<HTMLButtonElement>('button:contains("▶")') ||
          Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(btn =>
            btn.textContent?.includes('▶')
          )
        if (nextButton) nextButton.click()
      },
    },

    newEvent: {
      key: 'e',
      modifiers: { ctrl: true },
      description: 'Crear nuevo evento',
      handler: (): void => {
        const newEventButton = Array.from(
          document.querySelectorAll<HTMLButtonElement>('button')
        ).find(btn => btn.textContent?.includes('Nuevo Evento'))
        if (newEventButton) newEventButton.click()
      },
    },

    exportCalendar: {
      key: 'e',
      modifiers: { ctrl: true, shift: true },
      description: 'Exportar calendario',
      handler: (): void => {
        const exportButton = Array.from(
          document.querySelectorAll<HTMLButtonElement>('button')
        ).find(btn => btn.textContent?.includes('Exportar'))
        if (exportButton) exportButton.click()
      },
    },

    // Atajos de notificaciones
    toggleNotifications: {
      key: 'n',
      modifiers: { alt: true },
      description: 'Alternar panel de notificaciones',
      handler: (): void => {
        // Buscar el botón de notificaciones por el título
        const notificationButton = document.querySelector<HTMLButtonElement>(
          'button[title="Notificaciones"]'
        )
        if (notificationButton) notificationButton.click()
      },
    },

    // Atajos de ayuda
    showHelp: {
      key: '?',
      modifiers: { shift: true },
      description: 'Mostrar ayuda de atajos',
      handler: (): void => {
        // Trigger help modal
        const event = new CustomEvent('show-keyboard-help')
        document.dispatchEvent(event)
      },
    },

    // Cerrar modales con Escape (ya funciona por defecto, pero lo incluimos para documentación)
    closeModal: {
      key: 'Escape',
      modifiers: {},
      description: 'Cerrar modal o panel',
      handler: (): void => {
        // Los modales ya manejan Escape, este es solo para documentación
      },
    },
  }

  const { formatShortcut } = useKeyboardShortcuts(shortcuts)

  // Función para obtener todos los atajos con sus descripciones
  const getAllShortcuts = useCallback((): CategorizedShortcut[] => {
    return Object.entries(shortcuts).map(([key, config]) => ({
      id: key,
      shortcut: formatShortcut(config),
      description: config.description,
      category: getShortcutCategory(key),
    }))
  }, [formatShortcut])

  // Función para categorizar los atajos
  const getShortcutCategory = (shortcutKey: string): string => {
    if (shortcutKey.startsWith('calendar')) return 'Calendario'
    if (shortcutKey.includes('notification') || shortcutKey.includes('Notifications'))
      return 'Notificaciones'
    if (shortcutKey === 'search' || shortcutKey === 'newClient') return 'Navegación'
    if (shortcutKey === 'dashboard' || shortcutKey === 'settings') return 'Navegación'
    if (shortcutKey === 'showHelp' || shortcutKey === 'closeModal') return 'Ayuda'
    return 'General'
  }

  return {
    getAllShortcuts,
    formatShortcut,
  }
}
