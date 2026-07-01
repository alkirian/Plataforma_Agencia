// src/components/onboarding/WelcomeGuideModal.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    num: 1,
    emoji: '🏢',
    title: 'Contanos de tu negocio',
    desc: 'Nombre, rubro, tono de voz, misión… la IA usa esta info para generar contenido que suena a vos.',
    color: '#7C5CFC',
    glow: 'rgba(124,92,252,0.25)',
    active: true,
  },
  {
    num: 2,
    emoji: '🎨',
    title: 'Definí tu identidad visual',
    desc: 'Paleta de colores, canales sociales y referencias. Todo en un lugar.',
    color: '#4ECDC4',
    glow: 'rgba(78,205,196,0.2)',
    active: false,
  },
  {
    num: 3,
    emoji: '✨',
    title: '¡Generá tu primer contenido!',
    desc: 'Con tu marca configurada, la IA crea posts, copys y calendarios en segundos.',
    color: '#FF6B6B',
    glow: 'rgba(255,107,107,0.2)',
    active: false,
  },
];

export const WelcomeGuideModal = ({ businessName, onStart, onSkip }) => {
  // Bloquear scroll del fondo mientras el modal está visible
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(4,4,14,0.88)', backdropFilter: 'blur(18px)' }}
      >
        {/* Glows de fondo */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />

        <motion.div
          key="welcome-card"
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/[0.08] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
          style={{ background: 'linear-gradient(145deg, rgba(12,12,22,0.98) 0%, rgba(16,14,32,0.98) 100%)' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(124,92,252,0.3)]"
              style={{ background: 'linear-gradient(135deg, #7C5CFC, #FF6B6B)' }}
            >
              🚀
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black text-white tracking-tight mb-2"
            >
              ¡Bienvenido a{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #7C5CFC, #FF6B6B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {businessName || 'tu marca'}
              </span>
              !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto"
            >
              Tu espacio está listo. Completá 3 pasos rápidos para que la IA conozca tu negocio y empiece a trabajar para vos.
            </motion.p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
                className="flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200"
                style={{
                  borderColor: step.active ? `${step.color}40` : 'rgba(255,255,255,0.05)',
                  background: step.active
                    ? `linear-gradient(135deg, ${step.glow} 0%, rgba(255,255,255,0.01) 100%)`
                    : 'rgba(255,255,255,0.015)',
                  boxShadow: step.active ? `0 0 20px ${step.glow}` : 'none',
                }}
              >
                {/* Ícono del paso */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 select-none"
                  style={{
                    background: step.active
                      ? `linear-gradient(135deg, ${step.color}33, ${step.color}11)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${step.active ? step.color + '50' : 'rgba(255,255,255,0.07)'}`,
                    color: step.active ? step.color : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {step.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: step.active ? step.color : 'rgba(255,255,255,0.2)' }}
                    >
                      Paso {step.num}
                    </span>
                    {step.active && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${step.color}25`, color: step.color }}
                      >
                        Empezamos acá
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ color: step.active ? '#fff' : 'rgba(255,255,255,0.25)' }}
                  >
                    {step.title}
                  </p>
                  {step.active && (
                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  )}
                </div>

                {/* Indicador */}
                {!step.active ? (
                  <div className="text-white/15 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0" style={{ color: step.color }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-2.5"
          >
            <button
              onClick={onStart}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7C5CFC 0%, #FF6B6B 100%)',
                boxShadow: '0 0 30px rgba(124,92,252,0.35)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Empezar ahora
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            <button
              onClick={onSkip}
              className="w-full py-2.5 text-xs font-semibold text-white/30 hover:text-white/50 transition-colors cursor-pointer"
            >
              Explorar primero →
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
