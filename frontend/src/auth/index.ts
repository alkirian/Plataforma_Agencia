// Auth Feature - Barrel Export
// Following Scope Rules: All auth-related functionality in one feature

// Pages
export { AuthPage } from './pages/AuthPage.jsx'
export { WelcomePage } from './pages/WelcomePage.jsx'

// Components
export * from './components'

// Hooks
// Note: useAuth was removed as it was empty, using useAuthFlow instead
export { useAuthFlow } from './hooks/useAuthFlow'

// Services
export { authService } from './services/auth.service'

// Types
export * from './types/auth.types'
export type * from './types/auth-flow.types'

// Constants
export * from './constants/auth.constants'

// Store
// Note: authStore was removed as it was empty
