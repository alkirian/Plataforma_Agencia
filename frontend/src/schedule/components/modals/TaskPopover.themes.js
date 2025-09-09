/**
 * TaskPopover Theme Presets
 *
 * Extended theme configurations for different visual styles
 * Easy way to switch between complete theme packages
 */

export const TASKPOPOVER_THEMES = {
  // Current dark theme (default)
  'dark-modern': {
    name: 'Dark Modern',
    background: 'bg-gray-900/95',
    backgroundSolid: 'bg-gray-900',
    border: 'border-gray-600/50',
    borderSolid: 'border-gray-700',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
    buttonDanger: 'text-red-400 hover:text-red-300 hover:bg-red-900/20',
    buttonClose: 'text-gray-400 hover:text-white hover:bg-gray-800',
    draftIndicator: {
      background: 'bg-orange-900/20',
      border: 'border-orange-600/30',
      dot: 'bg-orange-400',
      text: 'text-orange-300',
    },
    overlay: 'bg-black/30',
  },

  // Softer dark theme
  'dark-soft': {
    name: 'Dark Soft',
    background: 'bg-slate-800/95',
    backgroundSolid: 'bg-slate-800',
    border: 'border-slate-500/40',
    borderSolid: 'border-slate-600',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    buttonDanger: 'text-rose-400 hover:text-rose-300 hover:bg-rose-900/20',
    buttonClose: 'text-slate-400 hover:text-slate-100 hover:bg-slate-700',
    draftIndicator: {
      background: 'bg-amber-900/20',
      border: 'border-amber-600/30',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
    },
    overlay: 'bg-slate-900/40',
  },

  // Light theme
  'light-clean': {
    name: 'Light Clean',
    background: 'bg-white/95',
    backgroundSolid: 'bg-white',
    border: 'border-gray-200/80',
    borderSolid: 'border-gray-200',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-500',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    buttonDanger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    buttonClose: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
    draftIndicator: {
      background: 'bg-orange-50',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      text: 'text-orange-700',
    },
    overlay: 'bg-black/20',
  },

  // Warm light theme
  'light-warm': {
    name: 'Light Warm',
    background: 'bg-stone-50/95',
    backgroundSolid: 'bg-stone-50',
    border: 'border-stone-200/80',
    borderSolid: 'border-stone-300',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-700',
    textMuted: 'text-stone-500',
    buttonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    buttonSecondary: 'bg-stone-200 hover:bg-stone-300 text-stone-700',
    buttonDanger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    buttonClose: 'text-stone-400 hover:text-stone-600 hover:bg-stone-200',
    draftIndicator: {
      background: 'bg-yellow-50',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      text: 'text-yellow-700',
    },
    overlay: 'bg-stone-900/25',
  },

  // Solid dark theme (no transparency/blur effects)
  'dark-solid': {
    name: 'Dark Solid',
    background: 'bg-gray-900',
    backgroundSolid: 'bg-gray-900',
    border: 'border-gray-700',
    borderSolid: 'border-gray-700',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
    buttonDanger: 'text-red-400 hover:text-red-300 hover:bg-red-900/20',
    buttonClose: 'text-gray-400 hover:text-white hover:bg-gray-800',
    draftIndicator: {
      background: 'bg-orange-900',
      border: 'border-orange-600',
      dot: 'bg-orange-400',
      text: 'text-orange-300',
    },
    overlay: 'bg-black/50',
  },

  // High contrast dark theme (for accessibility)
  'dark-contrast': {
    name: 'Dark High Contrast',
    background: 'bg-black/98',
    backgroundSolid: 'bg-black',
    border: 'border-white/30',
    borderSolid: 'border-white/40',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-200',
    textMuted: 'text-gray-300',
    buttonPrimary: 'bg-blue-500 hover:bg-blue-400 text-black font-bold',
    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    buttonDanger: 'text-red-300 hover:text-red-200 hover:bg-red-800/30',
    buttonClose: 'text-gray-200 hover:text-white hover:bg-gray-700',
    draftIndicator: {
      background: 'bg-orange-800/40',
      border: 'border-orange-400/50',
      dot: 'bg-orange-300',
      text: 'text-orange-200',
    },
    overlay: 'bg-black/60',
  },

  // Blue theme
  'blue-modern': {
    name: 'Blue Modern',
    background: 'bg-blue-900/95',
    backgroundSolid: 'bg-blue-900',
    border: 'border-blue-400/30',
    borderSolid: 'border-blue-400/40',
    textPrimary: 'text-blue-50',
    textSecondary: 'text-blue-200',
    textMuted: 'text-blue-300',
    buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    buttonSecondary: 'bg-blue-800 hover:bg-blue-700 text-blue-100',
    buttonDanger: 'text-red-300 hover:text-red-200 hover:bg-red-900/30',
    buttonClose: 'text-blue-300 hover:text-blue-100 hover:bg-blue-800',
    draftIndicator: {
      background: 'bg-amber-900/30',
      border: 'border-amber-500/40',
      dot: 'bg-amber-400',
      text: 'text-amber-200',
    },
    overlay: 'bg-blue-950/40',
  },

  // Purple theme
  'purple-elegant': {
    name: 'Purple Elegant',
    background: 'bg-purple-900/95',
    backgroundSolid: 'bg-purple-900',
    border: 'border-purple-400/30',
    borderSolid: 'border-purple-400/40',
    textPrimary: 'text-purple-50',
    textSecondary: 'text-purple-200',
    textMuted: 'text-purple-300',
    buttonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
    buttonSecondary: 'bg-purple-800 hover:bg-purple-700 text-purple-100',
    buttonDanger: 'text-rose-300 hover:text-rose-200 hover:bg-rose-900/30',
    buttonClose: 'text-purple-300 hover:text-purple-100 hover:bg-purple-800',
    draftIndicator: {
      background: 'bg-pink-900/30',
      border: 'border-pink-500/40',
      dot: 'bg-pink-400',
      text: 'text-pink-200',
    },
    overlay: 'bg-purple-950/40',
  },

  // Green theme
  'green-nature': {
    name: 'Green Nature',
    background: 'bg-emerald-900/95',
    backgroundSolid: 'bg-emerald-900',
    border: 'border-emerald-400/30',
    borderSolid: 'border-emerald-400/40',
    textPrimary: 'text-emerald-50',
    textSecondary: 'text-emerald-200',
    textMuted: 'text-emerald-300',
    buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
    buttonSecondary: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100',
    buttonDanger: 'text-red-300 hover:text-red-200 hover:bg-red-900/30',
    buttonClose: 'text-emerald-300 hover:text-emerald-100 hover:bg-emerald-800',
    draftIndicator: {
      background: 'bg-lime-900/30',
      border: 'border-lime-500/40',
      dot: 'bg-lime-400',
      text: 'text-lime-200',
    },
    overlay: 'bg-emerald-950/40',
  },
}

// Quick theme switching utilities
export const applyTheme = themeName => {
  if (TASKPOPOVER_THEMES[themeName]) {
    // Update the current theme in the main styles file
    // This would need to be implemented based on your preference
    // for global state management (Context, Redux, etc.)
    return TASKPOPOVER_THEMES[themeName]
  }
  return TASKPOPOVER_THEMES['dark-modern'] // fallback
}

export const getAllThemeNames = () => {
  return Object.keys(TASKPOPOVER_THEMES)
}

export const getThemeByName = themeName => {
  return TASKPOPOVER_THEMES[themeName] || TASKPOPOVER_THEMES['dark-modern']
}

// Example usage:
// import { applyTheme } from './TaskPopover.themes'
// applyTheme('light-clean')
// applyTheme('blue-modern')
// applyTheme('purple-elegant')

export default TASKPOPOVER_THEMES
