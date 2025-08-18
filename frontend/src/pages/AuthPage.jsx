import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const inputClass =
  'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30';
const primaryBtn = 'w-full btn-cyber px-4 py-2 font-semibold';
const googleBtn =
  'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-white/5 px-4 py-2 font-semibold text-text-primary transition hover:bg-white/10';
const errorClass = 'mt-1 text-sm text-red-400';

export const AuthPage = () => {
  const [flowState, setFlowState] = useState('enterEmail'); // 'enterEmail', 'login', 'register'
  const [userEmail, setUserEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    setValue,
    watch
  } = useForm();

  // Función para verificar si el email existe
  const checkEmail = async (email) => {
    try {
      setIsCheckingEmail(true);
      const response = await fetch('/api/v1/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al verificar el email');
      }

      return result.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error('Error al verificar el email');
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handler para el paso inicial de email
  const handleEmailSubmit = async (data) => {
    try {
      clearErrors();
      const exists = await checkEmail(data.email);
      setUserEmail(data.email);
      
      if (exists) {
        setFlowState('login');
        setValue('email', data.email);
      } else {
        setFlowState('register');
        setValue('email', data.email);
      }
    } catch (error) {
      setError('email', { type: 'manual', message: 'Error al verificar el email' });
    }
  };

  // Handler para login
  const handleLogin = async (data) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      reset();
      toast.success('¡Bienvenido de vuelta!');
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
      toast.error('Email o contraseña incorrectos.');
    }
  };

  // Handler para registro
  const handleRegister = async (data) => {
    try {
      const response = await fetch('/api/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          agencyName: data.agencyName
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear la cuenta');
      }

      // Intentar hacer login automático después del registro
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      reset();
      toast.success('¡Cuenta creada exitosamente!');
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
      toast.error('Error al crear la cuenta');
    }
  };

  // Handler para Google OAuth
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (err) {
      toast.error('No se pudo iniciar con Google');
    }
  };

  // Handler para volver al paso inicial
  const handleBackToEmail = () => {
    setFlowState('enterEmail');
    setUserEmail('');
    reset();
    clearErrors();
  };

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
  <div className='w-full max-w-md rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        
        {/* Header dinámico */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {flowState === 'enterEmail' && '¡Hola! 👋'}
            {flowState === 'login' && '¡Bienvenido de vuelta!'}
            {flowState === 'register' && '¡Vamos a crear tu cuenta!'}
          </h1>
          <p className="text-text-muted">
            {flowState === 'enterEmail' && 'Ingresa tu email para comenzar'}
            {flowState === 'login' && 'Ingresa tu contraseña para continuar'}
            {flowState === 'register' && 'Completa tu información para empezar'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Paso 1: Ingresar Email */}
          {flowState === 'enterEmail' && (
            <motion.div
              key="enterEmail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit(handleEmailSubmit)} className='space-y-4'>
                {errors.root && <p className={errorClass}>{errors.root.message}</p>}
                
                <div>
                  <input
                    type='email'
                    placeholder='tu@email.com'
                    className={inputClass}
                    {...register('email', { 
                      required: 'El email es obligatorio',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Formato de email inválido'
                      }
                    })}
                  />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>

                <button type='submit' disabled={isCheckingEmail} className={primaryBtn}>
                  {isCheckingEmail ? 'Verificando...' : 'Continuar con Email'}
                </button>

                {/* Separador */}
                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <span className='w-full border-t border-[color:var(--color-border-subtle)]' />
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='bg-surface-strong px-3 text-text-muted'>o</span>
                  </div>
                </div>

                {/* Botón de Google prominente */}
                <button
                  type='button'
                  onClick={handleGoogleLogin}
                  className={googleBtn}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </div>
                </button>
              </form>
            </motion.div>
          )}

          {/* Paso 2: Login */}
          {flowState === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit(handleLogin)} className='space-y-4'>
                {errors.root && <p className={errorClass}>{errors.root.message}</p>}
                
                {/* Email no editable */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Email:</span>
                    <button 
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-xs text-[color:var(--color-accent-blue)] hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="px-3 py-2 bg-white/5 border border-[color:var(--color-border-subtle)] rounded-md text-text-primary">
                    {userEmail}
                  </div>
                  <input type="hidden" {...register('email')} value={userEmail} />
                </div>

                <div>
                  <input
                    type='password'
                    placeholder='Tu contraseña'
                    className={inputClass}
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                    })}
                  />
                  {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                </div>

                <button type='submit' disabled={isSubmitting} className={primaryBtn}>
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                {/* Separador */}
                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <span className='w-full border-t border-[color:var(--color-border-subtle)]' />
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='bg-surface-strong px-3 text-text-muted'>o</span>
                  </div>
                </div>

                {/* Botón de Google prominente */}
                <button
                  type='button'
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className={googleBtn}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </div>
                </button>
              </form>
            </motion.div>
          )}

          {/* Paso 3: Register */}
          {flowState === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit(handleRegister)} className='space-y-4'>
                {errors.root && <p className={errorClass}>{errors.root.message}</p>}
                
                {/* Email no editable */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Email:</span>
                    <button 
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-xs text-[color:var(--color-accent-blue)] hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="px-3 py-2 bg-white/5 border border-[color:var(--color-border-subtle)] rounded-md text-text-primary">
                    {userEmail}
                  </div>
                  <input type="hidden" {...register('email')} value={userEmail} />
                </div>

                <div>
                  <input
                    type='text'
                    placeholder='Tu nombre completo'
                    className={inputClass}
                    {...register('fullName', { 
                      required: 'El nombre completo es obligatorio',
                      minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' }
                    })}
                  />
                  {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
                </div>

                <div>
                  <input
                    type='text'
                    placeholder='Nombre de tu agencia'
                    className={inputClass}
                    {...register('agencyName', { 
                      required: 'El nombre de la agencia es obligatorio',
                      minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' }
                    })}
                  />
                  {errors.agencyName && <p className={errorClass}>{errors.agencyName.message}</p>}
                </div>

                <div>
                  <input
                    type='password'
                    placeholder='Crea una contraseña'
                    className={inputClass}
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                    })}
                  />
                  {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                </div>

                <button type='submit' disabled={isSubmitting} className={primaryBtn}>
                  {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>

                {/* Separador */}
                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <span className='w-full border-t border-[color:var(--color-border-subtle)]' />
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='bg-surface-strong px-3 text-text-muted'>o</span>
                  </div>
                </div>

                {/* Botón de Google prominente */}
                <button
                  type='button'
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className={googleBtn}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </div>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
