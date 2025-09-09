import React, { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'

// Services
import { authService } from '../services/auth.service'

// Components
import { GoogleLoginButton } from '../components/GoogleLoginButton'
import { FormField } from '../components/FormField'
import { EmailDisplay } from '../components/EmailDisplay'
import { FormSeparator } from '../components/FormSeparator'
import { AuthFormContainer } from '../components/AuthFormContainer'

// Types
import type {
  AuthFlowState,
  EmailStepData,
  LoginStepData,
  RegisterStepData,
  AuthPageProps,
} from '../types/auth-flow.types'

// Constants
import {
  AUTH_PATTERNS,
  AUTH_VALIDATION_MESSAGES,
  AUTH_UI_TEXT,
  AUTH_STYLES,
  AUTH_SUCCESS_MESSAGES,
  AUTH_ERROR_MESSAGES,
} from '../constants/auth.constants'

// Assets
import bgImage from '../../assets/BG.png'

/**
 * AuthPage Component
 *
 * A comprehensive authentication page with a three-step flow:
 * 1. Email entry - checks if user exists
 * 2. Login - for existing users
 * 3. Register - for new users
 *
 * Follows SOLID principles and clean architecture patterns
 */
export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, redirectTo }) => {
  // State management
  const [flowState, setFlowState] = useState<AuthFlowState>('enterEmail')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    setValue,
  } = useForm<EmailStepData | LoginStepData | RegisterStepData>()

  /**
   * Handle email submission and check if user exists
   */
  const handleEmailSubmit = useCallback(
    async (data: EmailStepData) => {
      try {
        clearErrors()
        setIsCheckingEmail(true)

        const exists = await authService.checkEmailExists(data.email)

        setUserEmail(data.email)
        setValue('email', data.email)
        setFlowState(exists ? 'login' : 'register')
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        setError('email', { type: 'manual', message })
        toast.error(message)
      } finally {
        setIsCheckingEmail(false)
      }
    },
    [clearErrors, setError, setValue]
  )

  /**
   * Handle user login
   */
  const handleLogin = useCallback(
    async (data: LoginStepData) => {
      try {
        clearErrors()
        await authService.login({
          email: data.email,
          password: data.password,
        })

        reset()
        toast.success(AUTH_SUCCESS_MESSAGES.LOGIN)
        onSuccess?.()
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        setError('root', { type: 'manual', message })
        toast.error(message)
      }
    },
    [clearErrors, reset, setError, onSuccess]
  )

  /**
   * Handle user registration
   */
  const handleRegister = useCallback(
    async (data: RegisterStepData) => {
      try {
        clearErrors()
        await authService.register({
          email: data.email,
          password: data.password,
          name: data.fullName,
          agencyName: data.agencyName,
          confirmPassword: data.password, // For now, using same password
        })

        reset()
        toast.success(AUTH_SUCCESS_MESSAGES.REGISTER)
        onSuccess?.()
      } catch (error: any) {
        const message = AUTH_ERROR_MESSAGES[error.code] || error.message
        setError('root', { type: 'manual', message })
        toast.error(message)
      }
    },
    [clearErrors, reset, setError, onSuccess]
  )

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsGoogleLoading(true)
      await authService.loginWithOAuth('google', redirectTo)
    } catch (error: any) {
      const message = AUTH_ERROR_MESSAGES[error.code] || error.message
      toast.error(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }, [redirectTo])

  /**
   * Handle navigation back to email step
   */
  const handleBackToEmail = useCallback(() => {
    setFlowState('enterEmail')
    setUserEmail('')
    reset()
    clearErrors()
  }, [reset, clearErrors])

  /**
   * Memoized form configurations for each step
   */
  const formConfigs = useMemo(
    () => ({
      enterEmail: {
        title: AUTH_UI_TEXT.WELCOME_TITLE,
        subtitle: AUTH_UI_TEXT.ENTER_EMAIL_SUBTITLE,
        onSubmit: handleEmailSubmit,
        submitLabel: AUTH_UI_TEXT.CONTINUE_WITH_EMAIL,
        loadingLabel: AUTH_UI_TEXT.CHECKING_EMAIL,
      },
      login: {
        title: AUTH_UI_TEXT.WELCOME_BACK_TITLE,
        subtitle: AUTH_UI_TEXT.ENTER_PASSWORD_SUBTITLE,
        onSubmit: handleLogin,
        submitLabel: AUTH_UI_TEXT.LOGIN_BUTTON,
        loadingLabel: AUTH_UI_TEXT.LOGGING_IN,
      },
      register: {
        title: AUTH_UI_TEXT.CREATE_ACCOUNT_TITLE,
        subtitle: AUTH_UI_TEXT.COMPLETE_INFO_SUBTITLE,
        onSubmit: handleRegister,
        submitLabel: AUTH_UI_TEXT.REGISTER_BUTTON,
        loadingLabel: AUTH_UI_TEXT.CREATING_ACCOUNT,
      },
    }),
    [handleEmailSubmit, handleLogin, handleRegister]
  )

  const currentConfig = formConfigs[flowState]

  return (
    <div
      className='flex min-h-screen items-center p-4'
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className='absolute inset-0 bg-[var(--palette-primary-bg)]/60' />

      {/* Form container aligned to the left */}
      <div className='relative z-10 ml-8 lg:ml-16'>
        <div className='w-full max-w-md rounded-xl border border-[var(--palette-secondary-accent)]/20 bg-[var(--palette-secondary-bg)]/95 backdrop-blur-sm p-6 shadow-2xl'>
          <AnimatePresence mode='wait'>
            <AuthFormContainer
              key={flowState}
              title={currentConfig.title}
              subtitle={currentConfig.subtitle}
              animationKey={flowState}
            >
              <form onSubmit={handleSubmit(currentConfig.onSubmit as any)} className='space-y-4'>
                {/* Show root errors */}
                {errors.root && (
                  <p className={AUTH_STYLES.ERROR_TEXT} role='alert'>
                    {errors.root.message}
                  </p>
                )}

                {/* Email Entry Step */}
                {flowState === 'enterEmail' && (
                  <>
                    <FormField
                      name='email'
                      type='email'
                      placeholder={AUTH_UI_TEXT.EMAIL_PLACEHOLDER}
                      error={errors.email}
                      register={register}
                      rules={{
                        required: AUTH_VALIDATION_MESSAGES.EMAIL_REQUIRED,
                        pattern: {
                          value: AUTH_PATTERNS.EMAIL,
                          message: AUTH_VALIDATION_MESSAGES.EMAIL_INVALID,
                        },
                      }}
                      autoComplete='email'
                      autoFocus
                    />
                  </>
                )}

                {/* Login Step */}
                {flowState === 'login' && (
                  <>
                    <EmailDisplay email={userEmail} onChangeEmail={handleBackToEmail} />
                    <input type='hidden' {...register('email')} value={userEmail} />

                    <FormField
                      name='password'
                      type='password'
                      placeholder={AUTH_UI_TEXT.PASSWORD_PLACEHOLDER}
                      error={errors.password}
                      register={register}
                      rules={{
                        required: AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED,
                        minLength: {
                          value: 6,
                          message: AUTH_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
                        },
                      }}
                      autoComplete='current-password'
                      autoFocus
                    />
                  </>
                )}

                {/* Register Step */}
                {flowState === 'register' && (
                  <>
                    <EmailDisplay email={userEmail} onChangeEmail={handleBackToEmail} />
                    <input type='hidden' {...register('email')} value={userEmail} />

                    <FormField
                      name='fullName'
                      type='text'
                      placeholder={AUTH_UI_TEXT.NAME_PLACEHOLDER}
                      error={errors.fullName}
                      register={register}
                      rules={{
                        required: AUTH_VALIDATION_MESSAGES.NAME_REQUIRED,
                        minLength: {
                          value: 2,
                          message: AUTH_VALIDATION_MESSAGES.NAME_MIN_LENGTH,
                        },
                        pattern: {
                          value: AUTH_PATTERNS.NAME,
                          message: AUTH_VALIDATION_MESSAGES.NAME_PATTERN,
                        },
                      }}
                      autoComplete='name'
                      autoFocus
                    />

                    <FormField
                      name='agencyName'
                      type='text'
                      placeholder={AUTH_UI_TEXT.AGENCY_NAME_PLACEHOLDER}
                      error={errors.agencyName}
                      register={register}
                      rules={{
                        required: AUTH_VALIDATION_MESSAGES.AGENCY_NAME_REQUIRED,
                        minLength: {
                          value: 2,
                          message: AUTH_VALIDATION_MESSAGES.AGENCY_NAME_MIN_LENGTH,
                        },
                        pattern: {
                          value: AUTH_PATTERNS.AGENCY_NAME,
                          message: 'Formato de nombre inválido',
                        },
                      }}
                      autoComplete='organization'
                    />

                    <FormField
                      name='password'
                      type='password'
                      placeholder={AUTH_UI_TEXT.NEW_PASSWORD_PLACEHOLDER}
                      error={errors.password}
                      register={register}
                      rules={{
                        required: AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED,
                        minLength: {
                          value: 6,
                          message: AUTH_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
                        },
                      }}
                      autoComplete='new-password'
                    />
                  </>
                )}

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={isSubmitting || isCheckingEmail}
                  className={AUTH_STYLES.PRIMARY_BUTTON}
                >
                  {isSubmitting || isCheckingEmail
                    ? currentConfig.loadingLabel
                    : currentConfig.submitLabel}
                </button>

                {/* Separator */}
                <FormSeparator />

                {/* Google Login Button */}
                <GoogleLoginButton
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || isCheckingEmail}
                  loading={isGoogleLoading}
                />
              </form>
            </AuthFormContainer>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
