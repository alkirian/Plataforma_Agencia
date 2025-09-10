/**
 * THEME SWITCHER COMPONENT
 * 
 * A comprehensive UI component for switching between color palettes
 * and theme modes with real-time preview functionality.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, useThemeColors } from '../../contexts/ThemeContext'
import { ColorPaletteName, getPaletteNames } from '../../theme/colorPalettes'

interface ThemeSwitcherProps {
  className?: string
  showModeToggle?: boolean
  showPreview?: boolean
  compact?: boolean
}

/**
 * Color palette preview component
 */
const PalettePreview: React.FC<{ 
  paletteName: ColorPaletteName 
  isActive: boolean
  onClick: () => void
}> = ({ paletteName, isActive, onClick }) => {
  const { colors } = useThemeColors()
  
  // Define preview colors based on palette name
  const getPreviewColors = (name: ColorPaletteName) => {
    switch (name) {
      case 'orangeProfessional':
        return ['#FF5A09', '#BE4F0C', '#EC7F37', '#393F4D']
      case 'blueCyber':
        return ['#3B82F6', '#1E40AF', '#60A5FA', '#1A1F2E']
      case 'greenEmerald':
        return ['#10B981', '#059669', '#34D399', '#065F46']
      case 'purpleNeon':
        return ['#A855F7', '#7C3AED', '#C084FC', '#2D1B4E']
      case 'monochrome':
        return ['#FFFFFF', '#A3A3A3', '#E5E5E5', '#1A1A1A']
      default:
        return ['#FF5A09', '#BE4F0C', '#EC7F37', '#393F4D']
    }
  }
  
  const previewColors = getPreviewColors(paletteName)
  const displayName = paletteName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  
  return (
    <motion.button
      className={`
        relative group p-3 rounded-xl border transition-all duration-300
        ${isActive 
          ? 'border-theme-border-interactive bg-theme-surface-strong' 
          : 'border-theme-border-subtle bg-theme-surface-soft hover:border-theme-border-default'
        }
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Color preview circles */}
      <div className="flex justify-center gap-1 mb-2">
        {previewColors.map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded-full border border-theme-border-subtle"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      
      {/* Palette name */}
      <div className="text-xs text-theme-text-muted text-center font-medium">
        {displayName}
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-theme-interactive-primary"
          layoutId="activePalette"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/**
 * Mode toggle component
 */
const ModeToggle: React.FC = () => {
  const { mode, toggleMode, isDarkMode, isSystemMode } = useTheme()
  
  const getModeIcon = () => {
    if (isSystemMode) return '🖥️'
    return isDarkMode ? '🌙' : '☀️'
  }
  
  const getModeLabel = () => {
    if (isSystemMode) return 'System'
    return isDarkMode ? 'Dark' : 'Light'
  }
  
  return (
    <motion.button
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-theme-surface-soft border border-theme-border-subtle hover:border-theme-border-default transition-all duration-300"
      onClick={toggleMode}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-lg">{getModeIcon()}</span>
      <span className="text-sm font-medium text-theme-text-primary">
        {getModeLabel()}
      </span>
    </motion.button>
  )
}

/**
 * Main theme switcher component
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  showModeToggle = true,
  showPreview = true,
  compact = false,
}) => {
  const { 
    currentPaletteName, 
    setColorPalette, 
    availablePalettes,
    preferences 
  } = useTheme()
  
  const [isOpen, setIsOpen] = useState(false)
  
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          className="p-2 rounded-lg bg-theme-surface-soft border border-theme-border-subtle hover:border-theme-border-default transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-6 h-6 rounded-full bg-theme-interactive-primary" />
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute top-full mt-2 right-0 z-50 p-3 rounded-xl bg-theme-surface-strong border border-theme-border-default shadow-theme-strong min-w-[200px]"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-2 gap-2">
                {availablePalettes.map((paletteName) => (
                  <PalettePreview
                    key={paletteName}
                    paletteName={paletteName}
                    isActive={currentPaletteName === paletteName}
                    onClick={() => {
                      setColorPalette(paletteName)
                      setIsOpen(false)
                    }}
                  />
                ))}
              </div>
              
              {showModeToggle && (
                <div className="mt-3 pt-3 border-t border-theme-border-subtle">
                  <ModeToggle />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
          Choose Your Theme
        </h3>
        <p className="text-sm text-theme-text-muted">
          Select a color palette that matches your style
        </p>
      </div>
      
      {/* Color Palette Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availablePalettes.map((paletteName) => (
          <PalettePreview
            key={paletteName}
            paletteName={paletteName}
            isActive={currentPaletteName === paletteName}
            onClick={() => setColorPalette(paletteName)}
          />
        ))}
      </div>
      
      {/* Mode Toggle */}
      {showModeToggle && (
        <div className="flex justify-center">
          <ModeToggle />
        </div>
      )}
      
      {/* Current Theme Info */}
      {showPreview && (
        <motion.div
          className="p-4 rounded-xl bg-theme-surface-soft border border-theme-border-subtle"
          layout
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-theme-text-primary">
                Current Theme
              </div>
              <div className="text-xs text-theme-text-muted">
                {currentPaletteName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
            </div>
            <div className="flex gap-1">
              {/* Show current palette colors */}
              <div className="w-4 h-4 rounded-full bg-theme-interactive-primary border border-theme-border-subtle" />
              <div className="w-4 h-4 rounded-full bg-theme-interactive-secondary border border-theme-border-subtle" />
              <div className="w-4 h-4 rounded-full bg-theme-status-success border border-theme-border-subtle" />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Theme Preferences */}
      <div className="text-center">
        <div className="text-xs text-theme-text-muted">
          Animations: {preferences.animations ? 'Enabled' : 'Disabled'} • 
          Motion: {preferences.reducedMotion ? 'Reduced' : 'Normal'}
        </div>
      </div>
    </div>
  )
}

/**
 * Quick theme switcher for headers/toolbars
 */
export const QuickThemeSwitcher: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <ThemeSwitcher
      className={className}
      showModeToggle={false}
      showPreview={false}
      compact={true}
    />
  )
}

export default ThemeSwitcher