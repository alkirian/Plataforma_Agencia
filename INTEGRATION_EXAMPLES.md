# 🛠️ Integration Examples

## Complete Integration Example

Here's how to integrate the centralized color system into your existing React application:

### 1. App Setup (Required First Step)

```tsx
// src/main.tsx or src/App.tsx
import React from 'react'
import { ThemeProvider } from '@/shared/contexts/ThemeContext'
import './styles/globals.css' // Your existing global styles

function App() {
  return (
    <ThemeProvider defaultPalette="orangeProfessional" defaultMode="dark">
      <div className="bg-theme-bg-primary min-h-screen">
        <Header />
        <MainContent />
        <Footer />
      </div>
    </ThemeProvider>
  )
}

export default App
```

### 2. Header with Theme Switcher

```tsx
// src/components/layout/Header.tsx
import React from 'react'
import { QuickThemeSwitcher } from '@/shared/components/theme/ThemeSwitcher'
import { useTheme } from '@/shared/contexts/ThemeContext'

function Header() {
  const { isDarkMode } = useTheme()
  
  return (
    <header className="bg-theme-surface-strong border-b border-theme-border-subtle px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-theme-interactive-primary" />
          <h1 className="text-xl font-bold text-theme-text-primary">
            Your App
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <a 
            href="/dashboard" 
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            Dashboard
          </a>
          <a 
            href="/settings" 
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            Settings
          </a>
        </nav>
        
        {/* Theme Switcher */}
        <div className="flex items-center gap-4">
          <QuickThemeSwitcher />
          <span className="text-sm text-theme-text-muted">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
```

### 3. Card Component Migration

```tsx
// Before: Using hardcoded colors
function OldCard({ children, title }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  )
}

// After: Using theme system
function NewCard({ children, title }) {
  return (
    <div className="bg-theme-surface-default border border-theme-border-default rounded-xl p-6 shadow-theme-medium hover:border-theme-border-interactive transition-all duration-300">
      <h3 className="text-theme-text-primary font-semibold mb-4">{title}</h3>
      <div className="text-theme-text-secondary">
        {children}
      </div>
    </div>
  )
}
```

### 4. Button Component Migration

```tsx
// Before: Multiple hardcoded variants
function OldButton({ variant = 'primary', children, ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300'
  }
  
  return (
    <button 
      className={`px-6 py-3 rounded-lg font-medium transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

// After: Using theme system
import { useThemeColors } from '@/shared/contexts/ThemeContext'

function NewButton({ variant = 'primary', children, ...props }) {
  const variants = {
    primary: 'bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover text-theme-text-inverse',
    secondary: 'bg-theme-interactive-secondary hover:bg-theme-interactive-secondary-hover text-theme-text-primary', 
    ghost: 'bg-transparent hover:bg-theme-surface-soft text-theme-text-primary border border-theme-border-subtle hover:border-theme-border-default'
  }
  
  return (
    <button 
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 5. Settings Page with Full Theme Switcher

```tsx
// src/pages/SettingsPage.tsx
import React from 'react'
import { ThemeSwitcher } from '@/shared/components/theme/ThemeSwitcher'
import { useTheme } from '@/shared/contexts/ThemeContext'

function SettingsPage() {
  const { currentPaletteName, mode, preferences } = useTheme()
  
  return (
    <div className="bg-theme-bg-primary min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-theme-text-primary mb-8">
          Settings
        </h1>
        
        {/* Theme Settings Card */}
        <div className="bg-theme-surface-default border border-theme-border-default rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-theme-text-primary mb-6">
            Appearance
          </h2>
          
          {/* Theme Switcher */}
          <ThemeSwitcher 
            showModeToggle={true} 
            showPreview={true} 
            className="mb-6" 
          />
          
          {/* Current Settings Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-theme-surface-soft rounded-lg">
            <div className="text-center">
              <div className="text-sm text-theme-text-muted">Color Palette</div>
              <div className="font-medium text-theme-text-primary">
                {currentPaletteName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-theme-text-muted">Theme Mode</div>
              <div className="font-medium text-theme-text-primary capitalize">
                {mode}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-theme-text-muted">Animations</div>
              <div className="font-medium text-theme-text-primary">
                {preferences.animations ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Other Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsCard title="Account" />
          <SettingsCard title="Notifications" />
          <SettingsCard title="Privacy" />
          <SettingsCard title="Advanced" />
        </div>
      </div>
    </div>
  )
}

function SettingsCard({ title }) {
  return (
    <div className="bg-theme-surface-default border border-theme-border-default rounded-xl p-6 hover:border-theme-border-interactive transition-all duration-300">
      <h3 className="text-lg font-semibold text-theme-text-primary mb-3">
        {title}
      </h3>
      <p className="text-theme-text-muted">
        Configure your {title.toLowerCase()} settings here.
      </p>
      <button className="mt-4 text-theme-text-accent hover:text-theme-interactive-primary transition-colors">
        Manage →
      </button>
    </div>
  )
}

export default SettingsPage
```

### 6. Modal Component with Theme Support

```tsx
// src/components/ui/Modal.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeAnimation } from '@/shared/contexts/ThemeContext'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { getAnimationProps } = useThemeAnimation()
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-theme-surface-overlay backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            {...getAnimationProps({ duration: 0.2 })}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...getAnimationProps({ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            })}
          >
            <div className="bg-theme-surface-strong border border-theme-border-default rounded-xl shadow-theme-strong max-w-md w-full">
              {/* Header */}
              <div className="border-b border-theme-border-subtle px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-theme-text-primary">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-theme-text-muted hover:text-theme-text-primary transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 py-6">
                {children}
              </div>
              
              {/* Footer */}
              <div className="border-t border-theme-border-subtle px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button className="bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover text-theme-text-inverse px-4 py-2 rounded-lg transition-all duration-300">
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal
```

### 7. Form Components with Theme Support

```tsx
// src/components/forms/FormField.tsx
import React from 'react'
import { useThemeColors } from '@/shared/contexts/ThemeContext'

interface FormFieldProps {
  label: string
  error?: string
  success?: boolean
  children: React.ReactNode
}

function FormField({ label, error, success, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-text-primary">
        {label}
      </label>
      
      <div className="relative">
        {children}
        
        {/* Success indicator */}
        {success && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-theme-status-success">✓</span>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-theme-status-error">
          {error}
        </p>
      )}
    </div>
  )
}

function TextInput({ error, success, ...props }) {
  const baseClasses = "w-full px-4 py-3 rounded-lg border transition-all duration-300 placeholder:text-theme-text-muted"
  const stateClasses = error
    ? "border-theme-status-error focus:border-theme-status-error bg-theme-surface-soft"
    : success
    ? "border-theme-status-success focus:border-theme-status-success bg-theme-surface-soft"
    : "border-theme-border-default focus:border-theme-border-interactive bg-theme-surface-soft"
  
  return (
    <input
      className={`${baseClasses} ${stateClasses} text-theme-text-primary`}
      {...props}
    />
  )
}

// Usage example
function LoginForm() {
  return (
    <form className="space-y-6">
      <FormField label="Email Address" error="">
        <TextInput 
          type="email" 
          placeholder="Enter your email"
        />
      </FormField>
      
      <FormField label="Password">
        <TextInput 
          type="password" 
          placeholder="Enter your password"
        />
      </FormField>
      
      <button className="w-full bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover text-theme-text-inverse py-3 rounded-lg font-medium transition-all duration-300">
        Sign In
      </button>
    </form>
  )
}

export default FormField
```

### 8. Dashboard with Theme-Aware Charts

```tsx
// src/pages/Dashboard.tsx  
import React from 'react'
import { useThemeColors } from '@/shared/contexts/ThemeContext'

function Dashboard() {
  const { colors } = useThemeColors()
  
  // Chart configuration using theme colors
  const chartOptions = {
    colors: [
      colors.interactive.primary,
      colors.interactive.secondary, 
      colors.status.success,
      colors.status.warning,
    ],
    theme: {
      mode: 'dark',
    },
    chart: {
      background: colors.surface.default,
    },
    xaxis: {
      labels: {
        style: {
          colors: colors.text.muted,
        }
      }
    }
  }
  
  return (
    <div className="bg-theme-bg-primary min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-theme-text-primary mb-8">
          Dashboard
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value="12,345"
            change="+12%"
            positive={true}
          />
          <StatCard
            title="Revenue"
            value="$45,678"
            change="+8%"
            positive={true}
          />
          <StatCard
            title="Orders"
            value="1,234"
            change="-3%"
            positive={false}
          />
          <StatCard
            title="Conversion"
            value="3.45%"
            change="+5%"
            positive={true}
          />
        </div>
        
        {/* Chart */}
        <div className="bg-theme-surface-default border border-theme-border-default rounded-xl p-6">
          <h2 className="text-xl font-semibold text-theme-text-primary mb-6">
            Analytics Overview
          </h2>
          {/* Your chart component here using chartOptions */}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, positive }) {
  return (
    <div className="bg-theme-surface-default border border-theme-border-default rounded-xl p-6 hover:border-theme-border-interactive transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-theme-text-muted">{title}</span>
        <span className={`text-sm font-medium ${
          positive ? 'text-theme-status-success' : 'text-theme-status-error'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold text-theme-text-primary">
        {value}
      </div>
    </div>
  )
}

export default Dashboard
```

## 🚀 Quick Migration Checklist

### Phase 1: Setup (5 minutes)
- [ ] Wrap your app with `ThemeProvider`
- [ ] Add theme switcher to settings page
- [ ] Test basic theme switching

### Phase 2: Core Components (15 minutes)
- [ ] Migrate header/navigation
- [ ] Migrate button components  
- [ ] Migrate card/panel components
- [ ] Test color switching

### Phase 3: Advanced Components (30 minutes)
- [ ] Migrate forms and inputs
- [ ] Migrate modals and overlays
- [ ] Migrate dashboard/charts
- [ ] Add theme animations

### Phase 4: Polish (15 minutes)
- [ ] Add quick theme switcher to header
- [ ] Test all theme combinations
- [ ] Fix any remaining hardcoded colors
- [ ] Document any custom patterns

## 💡 Tips for Success

1. **Start Small**: Migrate one component at a time
2. **Test Frequently**: Switch themes after each component migration
3. **Use Browser DevTools**: Inspect CSS variables in real-time
4. **Keep Consistency**: Use the same color patterns across similar components
5. **Document Custom Patterns**: If you create new color combinations, document them

The system is designed to make this migration smooth and rewarding. Each component you migrate becomes more flexible and user-friendly!