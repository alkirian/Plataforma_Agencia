/**
 * TaskPopover Theme Switching Example
 *
 * This example shows how easy it is to switch themes for the TaskPopover component.
 * Simply change the theme name in TaskPopover.styles.js or use the switchTheme function.
 */

import React, { useState } from 'react'
import taskPopoverStyles from './TaskPopover.styles'

/**
 * Example theme switcher component
 * This shows how to create a UI for switching TaskPopover themes
 */
const TaskPopoverThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState(taskPopoverStyles.getCurrentThemeName())
  const availableThemes = taskPopoverStyles.getAvailableThemes()

  const handleThemeChange = themeName => {
    if (taskPopoverStyles.switchTheme(themeName)) {
      setCurrentTheme(themeName)
      console.log(`✅ Theme switched to: ${themeName}`)
    } else {
      console.error(`❌ Invalid theme: ${themeName}`)
    }
  }

  return (
    <div className='p-6 bg-gray-100 rounded-lg'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>TaskPopover Theme Switcher</h3>

      <div className='mb-4'>
        <p className='text-sm text-gray-600 mb-2'>
          Current theme: <span className='font-medium'>{currentTheme}</span>
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
        {availableThemes.map(themeName => (
          <button
            key={themeName}
            onClick={() => handleThemeChange(themeName)}
            className={`
              px-3 py-2 text-sm rounded-md transition-colors
              ${
                currentTheme === themeName
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {themeName
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </button>
        ))}
      </div>

      <div className='mt-4 p-3 bg-blue-50 rounded-md'>
        <h4 className='text-sm font-medium text-blue-800 mb-2'>Available Themes:</h4>
        <ul className='text-xs text-blue-700 space-y-1'>
          <li>
            <strong>dark-modern:</strong> Current dark theme (default)
          </li>
          <li>
            <strong>dark-soft:</strong> Softer dark colors using slate palette
          </li>
          <li>
            <strong>light-clean:</strong> Clean white theme
          </li>
          <li>
            <strong>light-warm:</strong> Warm beige/stone theme
          </li>
          <li>
            <strong>dark-contrast:</strong> High contrast dark (accessibility)
          </li>
          <li>
            <strong>blue-modern:</strong> Blue-based dark theme
          </li>
          <li>
            <strong>purple-elegant:</strong> Purple-based elegant theme
          </li>
          <li>
            <strong>green-nature:</strong> Green-based natural theme
          </li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Example of using themes in your own components
 */
const MyCustomTaskCard = () => {
  const theme = taskPopoverStyles.getTheme()

  return (
    <div
      className={`
      p-4 rounded-lg shadow-sm
      ${theme.backgroundSolid} 
      ${theme.border} 
      border
    `}
    >
      <h4 className={`font-medium ${theme.textPrimary}`}>
        Custom Component Using TaskPopover Theme
      </h4>
      <p className={`text-sm mt-1 ${theme.textSecondary}`}>
        This component uses the same theme as TaskPopover automatically.
      </p>
      <div className='flex gap-2 mt-3'>
        <button className={`px-3 py-1 text-xs rounded ${theme.buttonPrimary}`}>
          Primary Action
        </button>
        <button className={`px-3 py-1 text-xs rounded ${theme.buttonSecondary}`}>
          Secondary Action
        </button>
      </div>
    </div>
  )
}

/**
 * How to switch themes programmatically
 */
export const exampleThemeSwitching = () => {
  console.log('=== TaskPopover Theme Switching Examples ===')

  // Get current theme
  console.log('Current theme:', taskPopoverStyles.getCurrentThemeName())

  // Get all available themes
  console.log('Available themes:', taskPopoverStyles.getAvailableThemes())

  // Switch to light theme
  const success = taskPopoverStyles.switchTheme('light-clean')
  console.log('Switched to light-clean:', success)

  // Switch to purple theme
  taskPopoverStyles.switchTheme('purple-elegant')
  console.log('Current theme after switch:', taskPopoverStyles.getCurrentThemeName())

  // Try invalid theme
  const invalidSwitch = taskPopoverStyles.switchTheme('invalid-theme')
  console.log('Tried invalid theme:', invalidSwitch) // false

  // Switch back to dark
  taskPopoverStyles.switchTheme('dark-modern')
}

export { TaskPopoverThemeSwitcher, MyCustomTaskCard }

// Example usage in your app:
/*

// In your settings component:
import { TaskPopoverThemeSwitcher } from './TaskPopover.example'

const SettingsPanel = () => (
  <div>
    <h2>Theme Settings</h2>
    <TaskPopoverThemeSwitcher />
  </div>
)

// To switch themes programmatically:
import taskPopoverStyles from './TaskPopover.styles'

// Switch to light theme
taskPopoverStyles.switchTheme('light-clean')

// Switch to blue theme
taskPopoverStyles.switchTheme('blue-modern')

// Switch to high contrast theme
taskPopoverStyles.switchTheme('dark-contrast')

*/
