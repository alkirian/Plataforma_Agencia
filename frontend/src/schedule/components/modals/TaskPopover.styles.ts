/**
 * TaskPopover Centralized Styling System
 *
 * Centralizes all visual styling for TaskPopover component to enable:
 * - Easy theming changes across all use cases
 * - Consistent visual identity
 * - Maintainable responsive design
 * - Quick customization without code duplication
 */

import { TASKPOPOVER_THEMES, getThemeByName } from './TaskPopover.themes'

type DeviceType = 'mobile' | 'tablet' | 'desktop'

// Current active theme - change this to switch themes globally
let CURRENT_THEME = 'dark-solid' // Available: dark-modern, dark-solid, dark-soft, light-clean, light-warm, dark-contrast, blue-modern, purple-elegant, green-nature

// Spacing and sizing constants
const SPACING = {
  // Padding
  mobile: 'p-4 sm:p-6',
  tablet: 'p-6',
  desktop: 'p-4',

  // Margins
  headerMargin: 'mb-4',
  sectionMargin: 'mb-3',

  // Gaps
  buttonGap: 'gap-1',
  indicatorGap: 'gap-2',
  headerGap: 'gap-2',
}

// Border radius configuration
const BORDER_RADIUS = {
  popover: {
    mobile: 'rounded-t-2xl',
    tablet: '',
    desktop: 'rounded-xl',
  },
  button: 'rounded-lg',
  indicator: 'rounded-lg',
  draft: 'rounded-md',
}

// Animation configurations
const ANIMATIONS = {
  mobile: {
    hidden: { opacity: 0, y: '100%' },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.2 },
      },
    },
    exit: {
      opacity: 0,
      y: '100%',
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
    },
  },

  tablet: {
    hidden: { opacity: 0, x: '100%' },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      x: '100%',
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  },

  desktop: {
    hidden: {
      opacity: 0,
      scale: 0.3,
      y: -20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1], // Custom easing for smooth emergence
        opacity: { duration: 0.15 },
        scale: { duration: 0.25 },
        y: { duration: 0.2 },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: -10,
      transition: { duration: 0.15, ease: 'easeIn' },
    },
  },
}

interface PositionConfig {
  x?: number
  y?: number
}

interface ClickCoords {
  x: number
  y: number
}

/**
 * Get current theme colors
 */
export const getTheme = () => getThemeByName(CURRENT_THEME)

/**
 * Switch theme globally (for easy theming)
 */
export const switchTheme = (themeName: string): boolean => {
  if (TASKPOPOVER_THEMES[themeName]) {
    CURRENT_THEME = themeName
    return true
  }
  return false
}

/**
 * Get all available theme names
 */
export const getAvailableThemes = (): string[] => Object.keys(TASKPOPOVER_THEMES)

/**
 * Get current theme name
 */
export const getCurrentThemeName = (): string => CURRENT_THEME

/**
 * Get popover container classes based on device type and docked state
 */
export const getPopoverClasses = (deviceType: DeviceType, isDocked = false): string => {
  const theme = getTheme()
  const baseClasses = [theme.background, theme.border, 'shadow-2xl'].join(' ')

  const deviceSpecific = {
    mobile: [BORDER_RADIUS.popover.mobile, SPACING.mobile, 'max-h-[85vh]', 'overflow-y-auto'].join(
      ' '
    ),

    tablet: [BORDER_RADIUS.popover.tablet, SPACING.tablet, 'overflow-y-auto', 'max-h-[90vh]'].join(
      ' '
    ),

    desktop: isDocked
      ? [
          BORDER_RADIUS.popover.desktop,
          SPACING.desktop,
          'w-96',
          'h-full',
          'max-h-none',
          'overflow-y-auto',
        ].join(' ')
      : [BORDER_RADIUS.popover.desktop, SPACING.desktop, 'w-96'].join(' '),
  }

  return `${baseClasses} ${deviceSpecific[deviceType] || deviceSpecific.desktop}`
}

/**
 * Get popover positioning styles based on device type and position
 */
export const getPopoverStyles = (
  deviceType: DeviceType,
  position: PositionConfig | null = null,
  clickCoords: ClickCoords | null = null,
  isVisible = true,
  isDocked = false
): React.CSSProperties => {
  const positions: Record<DeviceType, React.CSSProperties> = {
    mobile: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },

    tablet: {
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '320px',
      zIndex: 1000,
    },

    desktop: isDocked
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '384px',
          zIndex: 1000,
        }
      : clickCoords
        ? {
            position: 'fixed',
            left: position?.x || 0,
            top: position?.y || 0,
            zIndex: 1000,
            visibility: isVisible ? 'visible' : 'hidden',
          }
        : {
            position: 'fixed',
            top: 96,
            right: 24,
            zIndex: 1000,
          },
  }

  return positions[deviceType] || positions.desktop
}

/**
 * Get animation variants based on device type and docked state
 */
export const getAnimationVariants = (deviceType: DeviceType, isDocked = false) => {
  if (isDocked && deviceType === 'desktop') {
    // Special animation for docked state - slide in from left
    return {
      hidden: { opacity: 0, x: '-100%' },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
      exit: {
        opacity: 0,
        x: '-100%',
        transition: { duration: 0.3, ease: 'easeIn' },
      },
    }
  }
  return ANIMATIONS[deviceType] || ANIMATIONS.desktop
}

/**
 * Get overlay classes for mobile/tablet
 */
export const getOverlayClasses = (): string => {
  const theme = getTheme()
  return ['fixed', 'inset-0', theme.overlay, 'z-50'].join(' ')
}

/**
 * Get header container classes
 */
export const getHeaderClasses = (): string => {
  const theme = getTheme()
  return [
    'flex',
    'items-center',
    'justify-between',
    SPACING.headerMargin,
    'pb-3',
    theme.borderSolid,
    'border-b',
  ].join(' ')
}

/**
 * Get header title classes
 */
export const getHeaderTitleClasses = (): string => {
  const theme = getTheme()
  return ['text-lg', 'font-semibold', theme.textPrimary].join(' ')
}

/**
 * Get header actions container classes
 */
export const getHeaderActionsClasses = (): string => {
  return ['flex', 'items-center', SPACING.buttonGap].join(' ')
}

/**
 * Get close button classes
 */
export const getCloseButtonClasses = (): string => {
  const theme = getTheme()
  return ['p-2', theme.buttonClose, BORDER_RADIUS.button, 'transition-colors'].join(' ')
}

/**
 * Get dock button classes
 */
export const getDockButtonClasses = (): string => {
  const theme = getTheme()
  return [
    'p-2',
    theme.buttonClose,
    BORDER_RADIUS.button,
    'transition-colors',
    'hover:scale-105',
    'active:scale-95',
  ].join(' ')
}

/**
 * Get delete button classes
 */
export const getDeleteButtonClasses = (isDesktop = false): string => {
  const theme = getTheme()
  const baseClasses = [
    theme.buttonDanger,
    BORDER_RADIUS.button,
    'transition-colors',
    'disabled:opacity-50',
  ]

  if (isDesktop) {
    return [...baseClasses, 'px-3', 'py-1.5', 'text-sm', 'flex', 'items-center', 'gap-1'].join(' ')
  }

  return [...baseClasses, 'p-2'].join(' ')
}

/**
 * Get draft indicator container classes
 */
export const getDraftIndicatorClasses = (isDesktop = false): string => {
  const theme = getTheme()
  const baseClasses = [
    'flex',
    'items-center',
    theme.draftIndicator.background,
    theme.draftIndicator.border,
    'border',
  ]

  if (isDesktop) {
    return [
      ...baseClasses,
      SPACING.indicatorGap,
      SPACING.sectionMargin,
      'p-2',
      BORDER_RADIUS.indicator,
    ].join(' ')
  }

  return [...baseClasses, 'gap-1', 'px-2', 'py-1', BORDER_RADIUS.draft].join(' ')
}

/**
 * Get draft indicator dot classes
 */
export const getDraftIndicatorDotClasses = (isDesktop = false): string => {
  const theme = getTheme()
  const size = isDesktop ? 'w-2 h-2' : 'w-1.5 h-1.5'

  return [size, theme.draftIndicator.dot, 'rounded-full', 'animate-pulse'].join(' ')
}

/**
 * Get draft indicator text classes
 */
export const getDraftIndicatorTextClasses = (isDesktop = false): string => {
  const theme = getTheme()
  const textSize = isDesktop ? 'text-xs' : 'text-xs'
  const fontWeight = isDesktop ? 'font-medium' : ''

  return [textSize, theme.draftIndicator.text, fontWeight].filter(Boolean).join(' ')
}

/**
 * Get desktop delete container classes
 */
export const getDesktopDeleteContainerClasses = (): string => {
  return ['flex', 'justify-end', SPACING.sectionMargin].join(' ')
}

/**
 * Get pointer/arrow classes for visual connection to click point
 */
export const getPointerClasses = (): string => {
  const theme = getTheme()
  return [
    'absolute',
    'w-3',
    'h-3',
    theme.background,
    theme.border,
    'border',
    'transform',
    'rotate-45',
    'shadow-sm',
  ].join(' ')
}

// Export theme switching utilities
export const taskPopoverStyles = {
  // Theme management
  getTheme,
  switchTheme,
  getAvailableThemes,
  getCurrentThemeName,

  // Style functions
  getPopoverClasses,
  getPopoverStyles,
  getAnimationVariants,
  getOverlayClasses,
  getHeaderClasses,
  getHeaderTitleClasses,
  getHeaderActionsClasses,
  getCloseButtonClasses,
  getDockButtonClasses,
  getDeleteButtonClasses,
  getDraftIndicatorClasses,
  getDraftIndicatorDotClasses,
  getDraftIndicatorTextClasses,
  getDesktopDeleteContainerClasses,
  getPointerClasses,
}

export default taskPopoverStyles
