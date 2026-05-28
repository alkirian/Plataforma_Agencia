import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { getApiUrl } from '@api/apiFetch';

// High-end inputs and buttons classes
const inputClass =
  'w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/[0.01] text-white placeholder-white/20 focus:border-[#7C5CFC] focus:bg-white/[0.03] focus:ring-4 focus:ring-[#7C5CFC]/10 focus:outline-none transition-all duration-300 text-sm font-medium backdrop-blur-md';

const primaryBtn =
  'relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#7C5CFC] via-[#FF6B6B] to-[#4ECDC4] px-5 py-3.5 font-extrabold text-white text-sm shadow-[0_0_30px_rgba(124,92,252,0.2)] hover:shadow-[0_0_40px_rgba(124,92,252,0.4)] transition-all duration-300 hover:opacity-95 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-title';

const googleBtn =
  'w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 font-bold text-white text-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/15 active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-3 backdrop-blur-md';

const errorClass = 'mt-1.5 text-xs font-semibold text-red-400 pl-1';

export const AuthPage = () => {
  const [flowState, setFlowState] = useState('enterEmail'); // 'enterEmail', 'login', 'register_choice', 'register'
  const [userEmail, setUserEmail] = useState('');
  const [agencyType, setAgencyType] = useState('agency'); // 'agency', 'own_business'
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [userHasAgency, setUserHasAgency] = useState(false);

  // Mouse Parallax coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  // Mouse position listener for sutil parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Pre-load invites from localStorage
  useEffect(() => {
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
          setValue('agencyName', result.data.agencyName);
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

  // Check email registered
  const checkEmail = async (email) => {
    setIsCheckingEmail(true);
    try {
      // Intentar primero usando el RPC de Supabase (más resiliente y rápido)
      const { data, error } = await supabase.rpc('check_user_and_invitation', { check_email: email });
      if (error) throw error;
      return data || { exists: false, hasAgency: false, invitation: null };
    } catch (rpcErr) {
      console.warn('[checkEmail] Supabase RPC falló, intentando API de Express:', rpcErr.message);
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
      } catch (apiErr) {
        console.error('[checkEmail] Ambos métodos de verificación fallaron:', apiErr.message);
        throw new Error('No se pudo verificar el email de ninguna forma.');
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Step 1: Submit Email
  const handleEmailSubmit = async (data) => {
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
          setPendingInvitation(checkResult.invitation);
          setValue('agencyName', checkResult.invitation.agencyName);
          setAgencyType('agency');
          setFlowState('register');
        } else {
          setPendingInvitation(null);
          setFlowState('register_choice');
        }
      }
    } catch (error) {
      setUserEmail(data.email);
      setValue('email', data.email);
      setPendingInvitation(null);
      setFlowState('register_choice');
      toast('El validador de cuentas no respondió. Iniciando flujo de registro.', { icon: 'ℹ️' });
    }
  };

  // Step 2: Login Submit
  const handleLogin = async (data) => {
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
  const handleRegister = async (data) => {
    try {
      const apiBaseUrl = getApiUrl();
      const inviteCode = localStorage.getItem('pending_invite_code') || undefined;

      const finalEmail = data.email || userEmail;
      if (!finalEmail) {
        throw new Error('El email es obligatorio.');
      }

      let registeredSuccessfully = false;

      // 1. Intentar el registro mediante backend Express
      try {
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

        if (response.ok) {
          localStorage.removeItem('pending_invite_code');
          await supabase.auth.signInWithPassword({
            email: finalEmail,
            password: data.password,
          });
          registeredSuccessfully = true;
        } else {
          // Si el servidor devolvió un error específico (ej: correo ya registrado), lo lanzamos sin hacer fallback
          if (response.status === 400 || response.status === 409) {
            throw new Error(result.message || 'Error al crear la cuenta');
          }
          throw new Error('Servidor inalcanzable');
        }
      } catch (fetchErr) {
        // Si fue error de validación o duplicado real, lanzarlo
        if (fetchErr.message && fetchErr.message !== 'Servidor inalcanzable' && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }

        console.warn('[handleRegister] Backend no disponible, usando registro directo con Supabase...');

        // 2. Fallback: Registro directo en Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: finalEmail,
          password: data.password,
        });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No se pudo registrar el usuario en el proveedor de identidad.');

        // Iniciar sesión para obtener tokens
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: data.password,
        });
        if (signInError) throw signInError;

        const userId = signUpData.user.id;
        let createdAgencyId = null;

        if (pendingInvitation) {
          // Unirse mediante invitación por email
          const { data: inviteRes, error: rpcError } = await supabase.rpc('accept_agency_invitation', {
            user_full_name: data.fullName
          });
          if (rpcError) throw rpcError;
          createdAgencyId = inviteRes?.agencyId;
        } else if (inviteCode) {
          // Unirse mediante enlace de invitación
          const { data: inviteRes, error: rpcError } = await supabase.rpc('accept_agency_invite_link', {
            invite_code: inviteCode,
            user_full_name: data.fullName
          });
          if (rpcError) throw rpcError;
          createdAgencyId = inviteRes?.agencyId;
        } else {
          // Crear nueva organización y perfil de administrador
          const { data: newAgencyId, error: rpcError } = await supabase.rpc('create_new_agency_and_admin', {
            user_id: userId,
            agency_name: data.agencyName,
            user_full_name: data.fullName,
            agency_type: agencyType
          });
          if (rpcError) throw rpcError;
          createdAgencyId = newAgencyId;

          // Auto-crear cliente para negocio propio
          if (agencyType === 'own_business' && createdAgencyId) {
            try {
              await supabase.from('clients').insert({
                agency_id: createdAgencyId,
                name: data.agencyName,
                industry: 'Mi Negocio',
                brand_info: { card_color: '#7C5CFC' },
              });
            } catch (clientErr) {
              console.warn('[handleRegister] Auto-creación de marca falló en fallback:', clientErr.message);
            }
          }
        }

        localStorage.removeItem('pending_invite_code');
        registeredSuccessfully = true;
      }

      if (registeredSuccessfully) {
        reset();
        toast.success('¡Cuenta creada exitosamente!', { icon: '✨' });
      }
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
      toast.error(err.message || 'Error al crear la cuenta');
    }
  };

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

  const handleBackToEmail = () => {
    setFlowState('enterEmail');
    setUserEmail('');
    setPendingInvitation(null);
    setUserHasAgency(false);
    reset();
    clearErrors();
  };

  const handleGoToRegisterChoice = () => {
    setFlowState('register_choice');
    clearErrors();
  };

  const handleGoToLoginManually = () => {
    setFlowState('login');
    clearErrors();
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const transitionConfig = {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  };

  const glowVariants = {
    animate1: {
      x: [0, 80, -50, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.15, 0.95, 1],
      transition: { duration: 20, repeat: Infinity, ease: 'easeInOut' }
    },
    animate2: {
      x: [0, -70, 60, 0],
      y: [0, 60, -50, 0],
      scale: [1, 0.9, 1.15, 1],
      transition: { duration: 25, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030307] text-white relative overflow-hidden flex flex-col lg:flex-row select-none font-sans">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* CUSTOM INLINE INTERACTIVE CSS KEYFRAMES */}
      {/* ──────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes rotate-3d-cube {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }
        .wireframe-cube-anim {
          transform-style: preserve-3d;
          animation: rotate-3d-cube 20s linear infinite;
        }
        .wireframe-cube-anim:hover {
          animation-duration: 8s;
        }
        @keyframes orbit-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .orbit-element {
          animation: orbit-slow 40s linear infinite;
        }
        .glow-hover-transition {
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .watermark-glow {
          text-shadow: 0 0 80px rgba(124, 92, 252, 0.04);
        }
        .rotating-glow-bar {
          position: relative;
          overflow: hidden;
        }
        .rotating-glow-bar::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 180deg, #7C5CFC, #FF6B6B, #4ECDC4, #7C5CFC);
          animation: rotate-3d-cube 10s linear infinite;
          z-index: 0;
        }
        .rotating-glow-inner-bar {
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* LIENZO IZQUIERDO: Branding de Agua + Figuras Geométricas 3D */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative hidden lg:flex flex-col justify-between p-12 overflow-hidden z-10">
        
        {/* Giant Spatial Watermark Branding */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
          <span className="font-title font-black text-[12vw] tracking-[0.25em] uppercase text-white/[0.015] watermark-glow">
            CADENCE
          </span>
        </div>

        {/* Ambient glow layers */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            variants={glowVariants}
            animate="animate1"
            className="absolute top-[20%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-br from-[#7C5CFC]/8 to-transparent blur-[120px]"
          />
          <motion.div
            variants={glowVariants}
            animate="animate2"
            className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-[#4ECDC4]/5 blur-[100px]"
          />
        </div>

        {/* Technical Grid Blueprint */}
        <div
          className="absolute inset-0 z-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle, #ffffff 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px, 128px 128px, 128px 128px',
          }}
        />

        {/* Top bar Branding Info */}
        <div className="relative z-20 flex items-center gap-3 self-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] via-[#FF6B6B] to-[#4ECDC4] flex items-center justify-center font-black text-white text-lg shadow-[0_8px_20px_rgba(124,92,252,0.25)] hover:scale-105 transition-transform duration-300">
            C
          </div>
          <span className="font-title font-black text-xs tracking-[0.3em] uppercase text-white/80">
            CADENCE
          </span>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE FLOATING ABSTRACT GEOMETRY HUD */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="relative z-10 my-auto w-full h-[60vh] flex items-center justify-center">
          
          {/* 1. Wireframe 3D Cube (Central Left) */}
          <motion.div
            className="absolute left-[8%] top-[15%] w-36 h-36 border border-white/[0.04] bg-[#07070E]/30 rounded-2xl backdrop-blur-md shadow-2xl p-4 flex items-center justify-center cursor-crosshair glow-hover-transition"
            style={{
              transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 0)`,
            }}
            whileHover={{
              scale: 1.1,
              borderColor: 'rgba(124,92,252,0.4)',
              boxShadow: '0 25px 50px rgba(124,92,252,0.15)',
            }}
          >
            <div className="w-20 h-20 relative wireframe-cube-anim">
              {/* SVG 3D Cube Wireframe representation */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-white/60 hover:text-[#7C5CFC] transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1">
                {/* Back face */}
                <rect x="20" y="20" width="60" height="60" />
                {/* Front face */}
                <rect x="40" y="40" width="60" height="60" strokeDasharray="3 3" opacity="0.5" />
                {/* Connectors */}
                <line x1="20" y1="20" x2="40" y2="40" />
                <line x1="80" y1="20" x2="100" y2="40" />
                <line x1="20" y1="80" x2="40" y2="100" />
                <line x1="80" y1="80" x2="100" y2="100" />
              </svg>
            </div>
            <span className="absolute bottom-2 right-3 font-mono text-[8px] tracking-wider text-white/30">CUBE.MESH</span>
          </motion.div>

          {/* 2. Concentric Data Dial Card (Top Right / Center) */}
          <motion.div
            className="absolute left-[38%] top-[5%] w-[250px] rounded-2xl border border-white/[0.04] bg-[#07070E]/30 p-5 backdrop-blur-md shadow-2xl cursor-pointer glow-hover-transition"
            style={{
              transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * -15}px, 0)`,
            }}
            whileHover={{
              scale: 1.06,
              borderColor: 'rgba(78,205,196,0.3)',
              boxShadow: '0 25px 50px rgba(78,205,196,0.12)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full border border-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4] text-xs font-black">
                ◎
              </div>
              <div className="text-left">
                <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5">ESTRUCTURA RADIAL</span>
                <span className="block text-[10px] font-extrabold text-white leading-none">ORQUESTADOR DE DATOS</span>
              </div>
            </div>

            {/* Circular Gauge Diagram */}
            <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center orbit-element">
              <svg viewBox="0 0 100 100" className="w-full h-full text-white/20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="50" cy="50" r="40" strokeDasharray="3 4" />
                <circle cx="50" cy="50" r="30" stroke="#7C5CFC" strokeWidth="3" strokeDasharray="120 40" strokeLinecap="round" />
                <circle cx="50" cy="50" r="20" stroke="#4ECDC4" strokeWidth="2.5" strokeDasharray="70 20" />
                <circle cx="50" cy="50" r="10" stroke="#FF6B6B" strokeWidth="1.5" />
              </svg>
              <div className="absolute font-mono text-[9px] font-extrabold text-white/50">89.4%</div>
            </div>
          </motion.div>

          {/* 3. Node Net Connectivity Grid (Bottom Left / Center) */}
          <motion.div
            className="absolute left-[15%] bottom-[8%] w-[240px] rounded-2xl border border-white/[0.04] bg-[#07070E]/30 p-4.5 backdrop-blur-md shadow-2xl cursor-pointer glow-hover-transition"
            style={{
              transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * 30}px, 0)`,
            }}
            whileHover={{
              scale: 1.08,
              borderColor: 'rgba(255,107,107,0.3)',
              boxShadow: '0 25px 50px rgba(255,107,107,0.12)',
            }}
          >
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between text-left">
                <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">CONEXIÓN DE NODOS</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              </div>

              {/* Connected Dots Vector Representation */}
              <div className="h-16 w-full border border-white/[0.03] rounded-lg bg-black/20 flex items-center justify-center p-2 relative">
                <svg viewBox="0 0 100 40" className="w-full h-full text-white/40" fill="currentColor">
                  {/* Lines */}
                  <line x1="20" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="50" y1="30" x2="80" y2="15" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="20" y1="10" x2="80" y2="15" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
                  <line x1="50" y1="30" x2="50" y2="5" stroke="currentColor" strokeWidth="0.4" />
                  {/* Nodes */}
                  <circle cx="20" cy="10" r="3" fill="#7C5CFC" />
                  <circle cx="50" cy="30" r="4.5" fill="#4ECDC4" />
                  <circle cx="80" cy="15" r="3.5" fill="#FF6B6B" />
                  <circle cx="50" cy="5" r="2.5" fill="#ffffff" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[8px] font-mono text-white/40">
                <span>ESTADO: VINCULADO</span>
                <span>NODES: 04/04</span>
              </div>
            </div>
          </motion.div>

          {/* 4. Sound Wave Frequency Card (Bottom Right / Center) */}
          <motion.div
            className="absolute left-[45%] bottom-[12%] w-[220px] rounded-2xl border border-white/[0.04] bg-[#07070E]/30 p-4 backdrop-blur-md shadow-2xl cursor-pointer glow-hover-transition"
            style={{
              transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * 25}px, 0)`,
            }}
            whileHover={{
              scale: 1.07,
              borderColor: 'rgba(160,136,255,0.4)',
              boxShadow: '0 25px 50px rgba(124,92,252,0.12)',
            }}
          >
            <div className="flex flex-col space-y-3.5">
              <div className="flex items-center justify-between text-left">
                <div>
                  <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest">ANALIZADOR DE SEÑAL</span>
                  <span className="block text-[10px] font-extrabold text-white">FRECUENCIA DE FLUJO</span>
                </div>
                <span className="text-[9px] font-mono text-[#A088FF] font-bold">ACTIVE</span>
              </div>

              {/* Soundwaves bars animating */}
              <div className="flex justify-between items-end h-8 px-2 bg-white/[0.01] rounded-lg border border-white/[0.03]">
                {[20, 60, 45, 80, 30, 90, 50, 75, 40, 85, 30].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-[#7C5CFC] to-[#FF6B6B]"
                    animate={{ height: [`${h * 0.35}%`, `${h}%`, `${h * 0.35}%`] }}
                    transition={{ duration: 1.2 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* 5. Ambient Orbiting Ring Overlay */}
          <div
            className="absolute w-[600px] h-[600px] z-0 opacity-10 pointer-events-none"
            style={{
              transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 8}px, 0) rotate(${mousePos.x * 12}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full text-white" fill="none">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.3" strokeDasharray="4 4" />
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="0.1" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="0.1" />
            </svg>
          </div>

        </div>

        {/* Footer legal info */}
        <div className="relative z-20 flex items-center gap-5 text-white/20 text-[10px] font-semibold self-start">
          <span>© 2026 CADENCE STUDIO.</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>SISTEMA DE ORQUESTACIÓN PREMIUM</span>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECCIÓN DERECHA: Formulario de Login Lateral Integrado */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-full lg:max-w-md xl:max-w-lg bg-[#07070E]/85 border-l border-white/[0.08] backdrop-blur-3xl p-8 sm:p-12 md:p-14 flex flex-col justify-between relative z-20 shadow-[-10px_0_50px_rgba(0,0,0,0.85)] min-h-screen">
        
        {/* Glow overlay inside the panel */}
        <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#7C5CFC]/5 blur-[80px] pointer-events-none z-0" />

        {/* Technical micro dots for detail */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Header Logo (Mobile View Only) */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C5CFC] via-[#FF6B6B] to-[#4ECDC4] flex items-center justify-center font-black text-white text-xl shadow-lg mb-3">
            C
          </div>
          <span className="font-title font-black text-xs tracking-[0.25em] uppercase text-white/80">
            CADENCE
          </span>
        </div>

        {/* Center alignment spacer */}
        <div className="my-auto relative z-10 w-full">
          
          {/* Form Top Area */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-title font-black text-white tracking-tight mb-2.5">
              {flowState === 'enterEmail' && '¡Hola! 👋'}
              {flowState === 'login' && (userHasAgency ? 'Ingresa a tu Agencia 🏢' : 'Ingresa a Cadence ⚡')}
              {flowState === 'register_choice' && '¿Cómo usarás Cadence?'}
              {flowState === 'register' && 'Crea tu cuenta premium'}
            </h2>
            <p className="text-xs text-white/40 font-medium leading-relaxed max-w-[320px] lg:max-w-none">
              {flowState === 'enterEmail' && 'Ingresa tu correo para dominar tus campañas y automatizar tu ecosistema de marca.'}
              {flowState === 'login' && (userHasAgency ? 'Ingresa tu contraseña para acceder directamente a tu panel de control.' : 'Coloca tu contraseña para ingresar a tu cuenta.')}
              {flowState === 'register_choice' && 'Elige la estructura que mejor se adapte a tu flujo diario de trabajo.'}
              {flowState === 'register' && (agencyType === 'agency' ? 'Completa los datos para inicializar tu Agencia.' : 'Completa los datos de tu Negocio o Marca.')}
            </p>
          </div>

          {/* Form wrapper */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              
              {/* 1. STATE: ENTER EMAIL */}
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
                          Verificando...
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
                      <div className="flex-1 border-t border-white/[0.06]" />
                      <span className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">o</span>
                      <div className="flex-1 border-t border-white/[0.06]" />
                    </div>

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
                      <span>Entrar con Google</span>
                    </button>

                    <div className="text-center pt-4 border-t border-white/[0.06]">
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

              {/* 2. STATE: LOGIN PASSWORD */}
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

                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                          SESIÓN INICIADA COMO
                        </span>
                        <span className="block text-xs font-bold text-white truncate">
                          {userEmail || watch('email')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-[9px] font-black text-[#A088FF] hover:bg-white/[0.08] transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>

                    {userHasAgency ? (
                      <div className="rounded-xl bg-[#7C5CFC]/5 border border-[#7C5CFC]/10 p-3.5 text-left flex items-start gap-2.5">
                        <span className="text-base leading-none">🏢</span>
                        <p className="text-[10px] text-white/50 leading-relaxed font-semibold">
                          Estructura organizacional encontrada. Al ingresar tu clave, accederás directamente a tus calendarios.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-[#FF6B6B]/5 border border-[#FF6B6B]/10 p-3.5 text-left flex items-start gap-2.5">
                        <span className="text-base leading-none">⚙️</span>
                        <p className="text-[10px] text-white/50 leading-relaxed font-semibold">
                          Aún no has configurado tu marca o agencia. Te guiaremos en el proceso a continuación.
                        </p>
                      </div>
                    )}

                    <div>
                      <input
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        className={inputClass}
                        {...register('password', {
                          required: 'La contraseña es obligatoria',
                          minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                        })}
                      />
                      {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                    </div>

                    <div className="text-[10px] text-white/40 text-center font-medium pl-1">
                      ¿Te registraste con Google? Haz clic en <span className="font-bold text-[#A088FF] hover:underline cursor-pointer" onClick={handleGoogleLogin}>Continuar con Google</span> más abajo.
                    </div>

                    <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                      {isSubmitting ? 'Verificando acceso...' : 'Iniciar Sesión'}
                    </button>

                    <div className="relative my-6 flex items-center">
                      <div className="flex-1 border-t border-white/[0.06]" />
                      <span className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">o</span>
                      <div className="flex-1 border-t border-white/[0.06]" />
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

                    <div className="text-center pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="text-xs font-bold text-white/40 hover:text-white transition-colors underline"
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
                          Crea una
                        </button>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* 3. STATE: REGISTER CHOICE */}
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
                    {/* Agencia de Marketing */}
                    <div
                      onClick={() => {
                        setAgencyType('agency');
                        setFlowState('register');
                      }}
                      className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                        agencyType === 'agency'
                          ? 'border-[#7C5CFC] bg-[#7C5CFC]/[0.03] shadow-[0_0_25px_rgba(124,92,252,0.12)]'
                          : 'border-white/[0.04] bg-white/[0.005] hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                            agencyType === 'agency'
                              ? 'bg-[#7C5CFC]/20 text-[#A088FF]'
                              : 'bg-white/5 text-white/40'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-black text-white group-hover:text-[#A088FF] transition-colors leading-tight mb-1">
                            Agencia de Marketing
                          </h4>
                          <p className="text-[10px] leading-relaxed text-white/40 font-medium">
                            Para profesionales o equipos independientes que configuran marcas de múltiples clientes independientes.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Negocio Propio */}
                    <div
                      onClick={() => {
                        setAgencyType('own_business');
                        setFlowState('register');
                      }}
                      className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                        agencyType === 'own_business'
                          ? 'border-[#4ECDC4] bg-[#4ECDC4]/[0.03] shadow-[0_0_25px_rgba(78,205,196,0.12)]'
                          : 'border-white/[0.04] bg-white/[0.005] hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                            agencyType === 'own_business'
                              ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]'
                              : 'bg-white/5 text-white/40'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.571V11m.667-.324a3 3 0 11-4-4 3 3 0 014 4zM12 11c0-3.517 1.009-6.799 2.753-9.571m-3.44 2.04l-.054.09A13.916 13.916 0 0115 11.571V11m-.667-.324a3 3 0 10-4-4 3 3 0 004 4z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-black text-white group-hover:text-[#4ECDC4] transition-colors leading-tight mb-1">
                            Negocio Propio / Creador
                          </h4>
                          <p className="text-[10px] leading-relaxed text-white/40 font-medium">
                            Para marcas individuales, corporaciones únicas o creadores que gestionan sus propios perfiles internos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-xs font-bold text-white/40 hover:text-white transition-colors underline"
                    >
                      Regresar
                    </button>

                    <p className="text-xs text-white/40 font-medium">
                      ¿Ya tienes una cuenta?{' '}
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

              {/* 4. STATE: FULL REGISTRATION FORM */}
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

                    {/* Email display indicator */}
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
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 flex items-center justify-between mb-2">
                        <div className="min-w-0 pr-2">
                          <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                            EMAIL REGISTRADO
                          </span>
                          <span className="block text-xs font-bold text-white truncate">
                            {userEmail}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleBackToEmail}
                          className="px-2 py-1 rounded bg-white/[0.04] text-[9px] font-black text-[#A088FF] hover:bg-white/[0.08] transition-colors"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}

                    {/* Invitation badge notification */}
                    {pendingInvitation && (
                      <div className="rounded-xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-3.5 text-left flex items-start gap-2.5 backdrop-blur-md">
                        <span className="text-base leading-none">✨</span>
                        <div>
                          <h4 className="font-extrabold text-white text-[10px]">Invitación Activa</h4>
                          <p className="text-[9px] text-white/50 font-medium leading-normal mt-0.5">
                            Te unirás de forma inmediata a la organización <span className="font-black text-[#A088FF]">{pendingInvitation.agencyName}</span>.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        className={inputClass}
                        {...register('fullName', {
                          required: 'El nombre completo es obligatorio',
                          minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                        })}
                      />
                      {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
                    </div>

                    {/* Agency name input if no invitation */}
                    {!pendingInvitation && (
                      <div>
                        <input
                          type="text"
                          placeholder={agencyType === 'agency' ? 'Nombre de la Agencia' : 'Nombre de la Marca'}
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
                        placeholder="Contraseña"
                        className={inputClass}
                        {...register('password', {
                          required: 'La contraseña es obligatoria',
                          minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
                        })}
                      />
                      {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                      {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                    </button>

                    <div className="text-center pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFlowState('register_choice')}
                        className="text-xs font-bold text-white/40 hover:text-white transition-colors underline"
                      >
                        Regresar
                      </button>

                      <p className="text-xs text-white/40 font-medium">
                        ¿Ya tienes una cuenta?{' '}
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

        {/* Small generic micro stats at the bottom of sidebar */}
        <div className="relative z-10 text-[9px] text-white/25 flex justify-between items-center pt-6 border-t border-white/[0.05]">
          <span>CONECTADO SEGURO SSL</span>
          <span>BUILD v1.0.4 Premium</span>
        </div>

      </div>

    </div>
  );
};
