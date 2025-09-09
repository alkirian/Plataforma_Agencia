import { useState, useCallback, useReducer } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { authService } from '../services/auth.service'
import type {
  AuthFlowState,
  EmailStepData,
  LoginStepData,
  RegisterStepData,
} from '../types/auth-flow.types'
import { AUTH_SUCCESS_MESSAGES, AUTH_ERROR_MESSAGES } from '../constants/auth.constants'

/**
 * Auth flow state interface
 */
interface AuthFlowStateData {
  flowState: AuthFlowState
  userEmail: string
  isCheckingEmail: boolean
  isGoogleLoading: boolean
  error: string | null
}

/**
 * Auth flow actions
 */
type AuthFlowAction =
  | { type: 'SET_FLOW_STATE'; payload: AuthFlowState }
  | { type: 'SET_USER_EMAIL'; payload: string }
  | { type: 'SET_CHECKING_EMAIL'; payload: boolean }
  | { type: 'SET_GOOGLE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

/**
 * Auth flow reducer
 */
const authFlowReducer = (state: AuthFlowStateData, action: AuthFlowAction): AuthFlowStateData => {
  switch (action.type) {
    case 'SET_FLOW_STATE':
      return { ...state, flowState: action.payload }
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.payload }
    case 'SET_CHECKING_EMAIL':
      return { ...state, isCheckingEmail: action.payload }
    case 'SET_GOOGLE_LOADING':
      return { ...state, isGoogleLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'RESET':
      return {
        flowState: 'enterEmail',
        userEmail: '',
        isCheckingEmail: false,
        isGoogleLoading: false,
        error: null,
      }
    default:
      return state
  }
}

/**
 * Hook return type
 */
export interface UseAuthFlowReturn {
  // State
  flowState: AuthFlowState
  userEmail: string
  isCheckingEmail: boolean
  isGoogleLoading: boolean
  error: string | null

  // Form methods
  register: any
  handleSubmit: any
  errors: any
  isSubmitting: boolean

  // Actions
  handleEmailSubmit: (data: EmailStepData) => Promise<void>
  handleLogin: (data: LoginStepData) => Promise<void>
  handleRegister: (data: RegisterStepData) => Promise<void>
  handleGoogleLogin: () => Promise<void>
  handleBackToEmail: () => void
  clearError: () => void
}

/**
 * Custom hook for managing auth flow state and logic
 *
 * Encapsulates all authentication flow logic in a reusable hook
 * Follows the custom hook pattern for better code organization
 */
export const useAuthFlow = (onSuccess?: () => void, redirectTo?: string): UseAuthFlowReturn => {
  // Use reducer for complex state management
  const [state, dispatch] = useReducer(authFlowReducer, {
    flowState: 'enterEmail',
    userEmail: '',
    isCheckingEmail: false,
    isGoogleLoading: false,
    error: null,
  })

  // Form handling
  const form = useForm<EmailStepData | LoginStepData | RegisterStepData>()
  const { setError, clearErrors, setValue, reset } = form

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
    clearErrors()
  }, [clearErrors])

  /**
   * Handle email submission
   */
  const handleEmailSubmit = useCallback(
    async (data: EmailStepData) => {
      try {
        clearError()
        dispatch({ type: 'SET_CHECKING_EMAIL', payload: true })

        const exists = await authService.checkEmailExists(data.email)

        dispatch({ type: 'SET_USER_EMAIL', payload: data.email })
        setValue('email', data.email)
        dispatch({ type: 'SET_FLOW_STATE', payload: exists ? 'login' : 'register' })
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        dispatch({ type: 'SET_ERROR', payload: message })
        setError('email', { type: 'manual', message })
        toast.error(message)
      } finally {
        dispatch({ type: 'SET_CHECKING_EMAIL', payload: false })
      }
    },
    [clearError, setError, setValue]
  )

  /**
   * Handle login
   */
  const handleLogin = useCallback(
    async (data: LoginStepData) => {
      try {
        clearError()
        await authService.login({
          email: data.email,
          password: data.password,
        })

        reset()
        toast.success(AUTH_SUCCESS_MESSAGES.LOGIN)
        onSuccess?.()
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        dispatch({ type: 'SET_ERROR', payload: message })
        setError('root', { type: 'manual', message })
        toast.error(message)
      }
    },
    [clearError, reset, setError, onSuccess]
  )

  /**
   * Handle registration
   */
  const handleRegister = useCallback(
    async (data: RegisterStepData) => {
      try {
        clearError()
        await authService.register({
          email: data.email,
          password: data.password,
          name: data.fullName,
          agencyName: data.agencyName,
          confirmPassword: data.password,
        })

        reset()
        toast.success(AUTH_SUCCESS_MESSAGES.REGISTER)
        onSuccess?.()
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        dispatch({ type: 'SET_ERROR', payload: message })
        setError('root', { type: 'manual', message })
        toast.error(message)
      }
    },
    [clearError, reset, setError, onSuccess]
  )

  /**
   * Handle Google OAuth
   */
  const handleGoogleLogin = useCallback(async () => {
    try {
      dispatch({ type: 'SET_GOOGLE_LOADING', payload: true })
      await authService.loginWithOAuth('google', redirectTo)
    } catch (error: any) {
      const message = AUTH_ERROR_MESSAGES[error.code] || error.message
      dispatch({ type: 'SET_ERROR', payload: message })
      toast.error(message)
    } finally {
      dispatch({ type: 'SET_GOOGLE_LOADING', payload: false })
    }
  }, [redirectTo])

  /**
   * Handle back to email
   */
  const handleBackToEmail = useCallback(() => {
    dispatch({ type: 'RESET' })
    reset()
    clearErrors()
  }, [reset, clearErrors])

  return {
    // State
    flowState: state.flowState,
    userEmail: state.userEmail,
    isCheckingEmail: state.isCheckingEmail,
    isGoogleLoading: state.isGoogleLoading,
    error: state.error,

    // Form methods
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,

    // Actions
    handleEmailSubmit,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleBackToEmail,
    clearError,
  }
}

export default useAuthFlow
