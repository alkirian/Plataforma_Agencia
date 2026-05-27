import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { getApiUrl } from '@api/apiFetch';

// Premium glass and input styles
const inputClass =
  'w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-white/30 focus:border-[#7C5CFC]/60 focus:bg-white/[0.04] focus:ring-4 focus:ring-[#7C5CFC]/15 focus:outline-none transition-all duration-300 text-sm font-medium';
const primaryBtn =
  'relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#FF6B6B] px-5 py-3.5 font-extrabold text-white text-sm shadow-[0_0_25px_rgba(124,92,252,0.3)] hover:shadow-[0_0_35px_rgba(124,92,252,0.5)] transition-all duration-300 hover:opacity-95 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2';
const googleBtn =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-bold text-white text-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-3';
const errorClass = 'mt-1.5 text-xs font-semibold text-red-400 pl-1';

export const AuthPage = () => {
  const [flowState, setFlowState] = useState('enterEmail'); // 'enterEmail', 'login', 'register_choice', 'register'
  const [userEmail, setUserEmail] = useState('');
  const [agencyType, setAgencyType] = useState('agency'); // 'agency', 'own_business'
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [userHasAgency, setUserHasAgency] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm();

  // Load pending invites from localStorage on mount
  React.useEffect(() => {
    const resolveLocalStorageInvite = async () => {
      const code = localStorage.getItem('pending_invite_code');
      if (!code) return;

      try {
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/shared/invite/${code}`);
        const result = await response.json();

        if (response.ok && result.success && result.data) {
          setPendingInvitation({
            agencyName: result.data.agencyName,
            role: result.data.role,
          });
          setValue('agencyName', result.data.agencyName); // Pre-fill to avoid validation errors
          toast.success(`Invitación cargada: uniéndose a ${result.data.agencyName}`, {
            icon: '✨',
          });
        }
      } catch (err) {
        console.warn('[AuthPage] Error al precargar código de invitación:', err.message);
      }
    };
    resolveLocalStorageInvite();
  }, [setValue]);

  // Check email registration & invite status
  const checkEmail = async email => {
    setIsCheckingEmail(true);
    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/users/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al verificar el email');
      }

      return result?.data || { exists: false, hasAgency: false, invitation: null };
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Step 1: Email Form Submit
  const handleEmailSubmit = async data => {
    try {
      clearErrors();
      const checkResult = await checkEmail(data.email);
      setUserEmail(data.email);
      setUserHasAgency(checkResult.hasAgency);

      if (checkResult.exists) {
        setFlowState('login');
        setValue('email', data.email);
        setPendingInvitation(null);
      } else {
        setValue('email', data.email);
        if (checkResult.invitation) {
          // If direct email invitation exists, skip the choice step and go straight to registration
          setPendingInvitation(checkResult.invitation);
          setValue('agencyName', checkResult.invitation.agencyName);
          setAgencyType('agency');
          setFlowState('register');
        } else {
          setPendingInvitation(null);
          // Flow: enterEmail -> register_choice -> register
          setFlowState('register_choice');
        }
      }
    } catch (error) {
      // Safe fallback
      setUserEmail(data.email);
      setValue('email', data.email);
      setPendingInvitation(null);
      setFlowState('register_choice');
      toast('El validador de cuentas no respondió. Iniciando flujo de registro.', { icon: 'ℹ️' });
    }
  };

  // Step 2: Login Submit
  const handleLogin = async data => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email || userEmail,
        password: data.password,
      });
      if (error) throw error;
      reset();
      toast.success('¡Bienvenido de vuelta!', { icon: '⚡' });
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
      toast.error('Email o contraseña incorrectos.');
    }
  };

  // Step 4: Register Submit
  const handleRegister = async data => {
    try {
      const apiBaseUrl = getApiUrl();
      const inviteCode = localStorage.getItem('pending_invite_code') || undefined;

      const finalEmail = data.email || userEmail;
      if (!finalEmail) {
        throw new Error('El email es obligatorio.');
      }

      const response = await fetch(`${apiBaseUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail,
          password: data.password,
          fullName: data.fullName,
          agencyName: pendingInvitation ? pendingInvitation.agencyName : data.agencyName,
          inviteCode,
          agencyType: pendingInvitation ? 'agency' : agencyType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear la cuenta');
      }

      // Clear pending invite code
      localStorage.removeItem('pending_invite_code');

      // Auto login after registration
      await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: data.password,
      });

      reset();
      toast.success('¡Cuenta creada exitosamente!', { icon: '✨' });
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
      toast.error(err.message || 'Error al crear la cuenta');
    }
  };

  // Google OAuth handler
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err) {
      toast.error('No se pudo iniciar con Google');
    }
  };

  // Go back to Email stage
  const handleBackToEmail = () => {
    setFlowState('enterEmail');
    setUserEmail('');
    setPendingInvitation(null);
    setUserHasAgency(false);
    reset();
    clearErrors();
  };

  // Jump to register choice manually
  const handleGoToRegisterChoice = () => {
    setFlowState('register_choice');
    clearErrors();
  };

  // Jump to login manually
  const handleGoToLoginManually = () => {
    setFlowState('login');
    clearErrors();
  };

  // Framer-Motion transition config
  const stepVariants = {
    initial: { opacity: 0, scale: 0.97, x: 15 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.97, x: -15 },
  };

  const transitionConfig = {
    type: 'spring',
    stiffness: 320,
    damping: 26,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-[#07070E] text-white relative overflow-hidden select-none font-sans">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECCIÓN A: BRANDING ARTÍSTICO & VISUAL (Solo Desktop) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 flex-col justify-between p-16 relative overflow-hidden bg-[#07070E]">
        {/* Dynamic mesh glow layers */}
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#7C5CFC]/15 to-transparent blur-[140px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#FF6B6B]/10 to-transparent blur-[120px] animate-[pulse_12s_ease-in-out_infinite_2.5s]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#4ECDC4]/5 blur-[100px] pointer-events-none" />

        {/* Brand Top bar */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#FF6B6B] flex items-center justify-center font-black text-white text-xl shadow-[0_8px_20px_rgba(124,92,252,0.3)]">
            R
          </div>
          <span className="font-title font-black text-sm tracking-[0.25em] uppercase text-white/90">
            Rambla Studio
          </span>
        </div>

        {/* Center Artistic content */}
        <div className="relative z-10 my-auto max-w-2xl space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl xl:text-6xl font-title font-black tracking-tight leading-[1.08] text-white">
              Crea contenido sin <br/>
              <span className="bg-gradient-to-r from-[#7C5CFC] via-[#A088FF] to-[#FF6B6B] bg-clip-text text-transparent">
                límites ni fricción.
              </span>
            </h2>
            <p className="text-base text-white/60 leading-relaxed font-medium max-w-lg">
              La plataforma premium para que agencias y marcas automaticen sus cronogramas de contenido, diseñen ideas con Inteligencia Artificial y obtengan aprobaciones instantáneas.
            </p>
          </div>

          {/* Interactive Floating mockup block */}
          <div className="relative pt-6">
            
            {/* Nike LATAM glass card */}
            <div className="relative z-10 w-[380px] rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl animate-[bounce_6s_ease-in-out_infinite]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4] font-black text-sm">
                    N
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight">Nike Running Camp</h4>
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-0.5 block">
                      Campaña de Invierno
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#7C5CFC]/20 text-[#A088FF] font-black text-[9px] uppercase tracking-wider">
                  En Aprobación
                </span>
              </div>

              {/* Progress bar info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[9px] font-bold text-white/40">
                  <span>Aprobación de la Marca</span>
                  <span className="text-[#4ECDC4]">80% completado</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#7C5CFC] via-[#A088FF] to-[#4ECDC4] rounded-full" style={{ width: '80%' }} />
                </div>
              </div>

              {/* Collapsed view users */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#7C5CFC] border border-[#07070E] flex items-center justify-center font-bold text-[9px] text-white">S</div>
                  <div className="w-6 h-6 rounded-full bg-[#FF6B6B] border border-[#07070E] flex items-center justify-center font-bold text-[9px] text-white">F</div>
                  <div className="w-6 h-6 rounded-full bg-[#4ECDC4] border border-[#07070E] flex items-center justify-center font-bold text-[9px] text-white">O</div>
                </div>
                <span className="text-[9px] font-extrabold text-white/30">Feedback recibido hoy</span>
              </div>
            </div>

            {/* Overlapping secondary shadow card */}
            <div className="absolute top-10 left-24 z-0 w-[350px] rounded-3xl border border-white/5 bg-white/[0.01] p-5 shadow-2xl backdrop-blur-md opacity-45 animate-[bounce_8s_ease-in-out_infinite_1s]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B] font-bold text-xs">P</div>
                <div>
                  <h5 className="text-[11px] font-bold text-white leading-tight">Cronograma de Contenido</h5>
                  <span className="text-[8px] text-white/30 font-semibold block">18 publicaciones activas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-6 text-white/40 text-[11px] font-semibold">
          <span>© 2026 Rambla Studio.</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>Cadence Premium Enterprise</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECCIÓN B: INTERACTIVE FORM & GLASS CARD (Derecha/Central) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 relative bg-[#06060C]">
        
        {/* Glow overlay behind card */}
        <div className="absolute w-[320px] h-[320px] rounded-full bg-[#7C5CFC]/10 blur-[100px] pointer-events-none" />
        
        {/* Decorative Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Mobile Header Logo */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#FF6B6B] flex items-center justify-center font-black text-white text-xl shadow-lg mb-3">
            R
          </div>
          <span className="font-title font-black text-xs tracking-[0.25em] uppercase text-white/80">
            Rambla Studio
          </span>
        </div>

        {/* Glassmorphic Auth card */}
        <div className="w-full max-w-[420px] rounded-3xl border border-white/[0.06] bg-white/[0.01] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative z-10">
          
          {/* Dynamic premium headers inside form */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-title font-black text-white tracking-tight mb-2">
              {flowState === 'enterEmail' && '¡Hola! 👋'}
              {flowState === 'login' && (userHasAgency ? 'Ingresa a tu Agencia 🏢' : 'Ingresa a Cadence ⚡')}
              {flowState === 'register_choice' && '¿Cómo usarás Cadence?'}
              {flowState === 'register' && 'Crea tu cuenta premium'}
            </h1>
            <p className="text-xs text-white/50 font-medium">
              {flowState === 'enterEmail' && 'Ingresa tu correo para comenzar'}
              {flowState === 'login' && (userHasAgency ? 'Ingresa tu contraseña para acceder a tu agencia' : 'Coloca tu contraseña para ingresar')}
              {flowState === 'register_choice' && 'Elige la estructura que mejor se adapte a tu trabajo'}
              {flowState === 'register' && (agencyType === 'agency' ? 'Completa los datos de tu Agencia' : 'Completa los datos de tu Marca')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* 1. Enter Email screen */}
            {flowState === 'enterEmail' && (
              <motion.div
                key="enterEmail"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transitionConfig}
              >
                <form onSubmit={handleSubmit(handleEmailSubmit)} className="space-y-5">
                  {errors.root && <p className={errorClass}>{errors.root.message}</p>}

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className={inputClass}
                      {...register('email', {
                        required: 'El email es obligatorio',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Formato de email inválido',
                        },
                      })}
                    />
                    {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                  </div>

                  <button type="submit" disabled={isCheckingEmail} className={primaryBtn}>
                    {isCheckingEmail ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verificando cuenta...
                      </span>
                    ) : (
                      <>
                        <span>Continuar con Email</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <div className="relative my-6 flex items-center">
                    <div className="flex-1 border-t border-white/5" />
                    <span className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">o</span>
                    <div className="flex-1 border-t border-white/5" />
                  </div>

                  {/* Google OAuth Login */}
                  <button type="button" onClick={handleGoogleLogin} className={googleBtn}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </button>

                  <div className="text-center pt-4 border-t border-white/5">
                    <p className="text-xs text-white/40 font-medium">
                      ¿No tienes una cuenta?{' '}
                      <button
                        type="button"
                        onClick={handleGoToRegisterChoice}
                        className="font-extrabold text-[#A088FF] hover:underline"
                      >
                        Regístrate
                      </button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. Login Form screen */}
            {flowState === 'login' && (
              <motion.div
                key="login"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transitionConfig}
              >
                <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                  {errors.root && <p className={errorClass}>{errors.root.message}</p>}

                  {/* Adaptive Email and Change action */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">
                        Iniciar como
                      </span>
                      <span className="block text-sm font-bold text-white truncate">
                        {userEmail || watch('email')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-[10px] font-black text-[#A088FF] hover:bg-white/[0.08] transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Adaptive message based on agency status */}
                  {userHasAgency ? (
                    <div className="rounded-xl bg-[#7C5CFC]/5 border border-[#7C5CFC]/10 p-3.5 text-left flex items-start gap-2.5">
                      <span className="text-lg leading-none">🏢</span>
                      <p className="text-[10px] text-white/60 leading-relaxed font-semibold">
                        Agencia detectada. Ingresa tu contraseña para acceder directamente a tu panel de trabajo.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#FF6B6B]/5 border border-[#FF6B6B]/10 p-3.5 text-left flex items-start gap-2.5">
                      <span className="text-lg leading-none">⚙️</span>
                      <p className="text-[10px] text-white/60 leading-relaxed font-semibold">
                        Tu cuenta aún no tiene agencia configurada. Ingresa tu contraseña y te guiaremos en la configuración.
                      </p>
                    </div>
                  )}

                  <div>
                    <input
                      type="password"
                      placeholder="Tu contraseña"
                      className={inputClass}
                      {...register('password', {
                        required: 'La contraseña es obligatoria',
                        minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                      })}
                    />
                    {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                    {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>

                  <div className="relative my-6 flex items-center">
                    <div className="flex-1 border-t border-white/5" />
                    <span className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">o</span>
                    <div className="flex-1 border-t border-white/5" />
                  </div>

                  <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting} className={googleBtn}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </button>

                  <div className="text-center pt-4 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-xs font-bold text-white/50 hover:text-white transition-colors underline"
                    >
                      Regresar
                    </button>
                    
                    <p className="text-xs text-white/40 font-medium">
                      ¿No tienes una cuenta?{' '}
                      <button
                        type="button"
                        onClick={handleGoToRegisterChoice}
                        className="font-extrabold text-[#A088FF] hover:underline"
                      >
                        Regístrate
                      </button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 3. Register Role Choice screen */}
            {flowState === 'register_choice' && (
              <motion.div
                key="register_choice"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transitionConfig}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Card A: Agencia */}
                  <div
                    onClick={() => {
                      setAgencyType('agency');
                      setFlowState('register');
                    }}
                    className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                      agencyType === 'agency'
                        ? 'border-[#7C5CFC] bg-[#7C5CFC]/[0.06] shadow-[0_0_25px_rgba(124,92,252,0.15)]'
                        : 'border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        agencyType === 'agency' 
                          ? 'bg-[#7C5CFC]/20 text-[#A088FF]' 
                          : 'bg-white/5 text-white/60'
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-white group-hover:text-[#A088FF] transition-colors leading-tight mb-1">
                          Agencia de Marketing
                        </h4>
                        <p className="text-[11px] leading-relaxed text-white/50 font-medium">
                          Para profesionales, agencias o equipos que gestionan marcas de múltiples clientes independientes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card B: Negocio Propio */}
                  <div
                    onClick={() => {
                      setAgencyType('own_business');
                      setFlowState('register');
                    }}
                    className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                      agencyType === 'own_business'
                        ? 'border-[#4ECDC4] bg-[#4ECDC4]/[0.05] shadow-[0_0_25px_rgba(78,205,196,0.15)]'
                        : 'border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        agencyType === 'own_business' 
                          ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' 
                          : 'bg-white/5 text-white/60'
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.571V11m.667-.324a3 3 0 11-4-4 3 3 0 014 4zM12 11c0-3.517 1.009-6.799 2.753-9.571m-3.44 2.04l-.054.09A13.916 13.916 0 0115 11.571V11m-.667-.324a3 3 0 10-4-4 3 3 0 004 4z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-white group-hover:text-[#4ECDC4] transition-colors leading-tight mb-1">
                          Negocio Propio / Marca
                        </h4>
                        <p className="text-[11px] leading-relaxed text-white/50 font-medium">
                          Para marcas individuales, creadores de contenido o negocios que gestionan su propia marca interna.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back / Toggle buttons */}
                <div className="text-center pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-xs font-bold text-white/50 hover:text-white transition-colors underline"
                  >
                    Regresar
                  </button>
                  
                  <p className="text-xs text-white/40 font-medium">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={handleGoToLoginManually}
                      className="font-extrabold text-[#A088FF] hover:underline"
                    >
                      Ingresa
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 4. Complete Registration details form screen */}
            {flowState === 'register' && (
              <motion.div
                key="register"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transitionConfig}
              >
                <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
                  {errors.root && <p className={errorClass}>{errors.root.message}</p>}

                  {/* Render input email if empty, else show custom uneditable badge */}
                  {!userEmail ? (
                    <div>
                      <input
                        type="email"
                        placeholder="Tu correo electrónico"
                        className={inputClass}
                        {...register('email', {
                          required: 'El email es obligatorio',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Formato de email inválido',
                          },
                        })}
                      />
                      {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex items-center justify-between mb-2">
                      <div className="min-w-0 pr-2">
                        <span className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">
                          Email
                        </span>
                        <span className="block text-sm font-bold text-white truncate">
                          {userEmail}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-[10px] font-black text-[#A088FF] hover:bg-white/[0.08] transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  {/* Pending invitation alert banner */}
                  {pendingInvitation && (
                    <div className="rounded-xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-4 text-left flex items-start gap-3 backdrop-blur-md">
                      <span className="text-xl animate-pulse">✨</span>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">Invitación Activa</h4>
                        <p className="text-[10px] text-white/50 font-medium leading-relaxed mt-0.5">
                          Te unirás a la organización <span className="font-black text-[#A088FF]">{pendingInvitation.agencyName}</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      className={inputClass}
                      {...register('fullName', {
                        required: 'El nombre completo es obligatorio',
                        minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                      })}
                    />
                    {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
                  </div>

                  {/* Show organization input field only if they don't have invitation */}
                  {!pendingInvitation && (
                    <div>
                      <input
                        type="text"
                        placeholder={agencyType === 'agency' ? 'Nombre de tu agencia' : 'Nombre de tu negocio / marca'}
                        className={inputClass}
                        {...register('agencyName', {
                          required: 'Este campo es obligatorio',
                          minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                        })}
                      />
                      {errors.agencyName && <p className={errorClass}>{errors.agencyName.message}</p>}
                    </div>
                  )}

                  <div>
                    <input
                      type="password"
                      placeholder="Crea una contraseña"
                      className={inputClass}
                      {...register('password', {
                        required: 'La contraseña es obligatoria',
                        minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                      })}
                    />
                    {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                    {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </button>

                  {/* Switch navigation links */}
                  <div className="text-center pt-4 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFlowState('register_choice')}
                      className="text-xs font-bold text-white/50 hover:text-white transition-colors underline"
                    >
                      Regresar
                    </button>
                    
                    <p className="text-xs text-white/40 font-medium">
                      ¿Ya tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={handleGoToLoginManually}
                        className="font-extrabold text-[#A088FF] hover:underline"
                      >
                        Ingresa
                      </button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
