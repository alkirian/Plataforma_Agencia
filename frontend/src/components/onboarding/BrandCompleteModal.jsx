// src/components/onboarding/BrandCompleteModal.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// Partícula individual del confetti
const Particle = ({ style }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-sm pointer-events-none"
    initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
    animate={{
      opacity: 0,
      y: style.vy,
      x: style.vx,
      rotate: style.rot,
      scale: 0.2,
    }}
    transition={{ duration: style.dur, ease: 'easeOut' }}
    style={{
      left: style.x,
      top: style.y,
      backgroundColor: style.color,
      borderRadius: style.round ? '50%' : '2px',
    }}
  />
);

const CONFETTI_COLORS = ['#7C5CFC', '#FF6B6B', '#4ECDC4', '#FFD166', '#68D391', '#F06292'];

function generateParticles(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${20 + Math.random() * 40}%`,
    vx: (Math.random() - 0.5) * 120,
    vy: -(60 + Math.random() * 120),
    rot: Math.random() * 720 - 360,
    dur: 0.9 + Math.random() * 0.8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    round: Math.random() > 0.5,
  }));
}

export const BrandCompleteModal = ({ clientId, onClose }) => {
  const particles = useRef(generateParticles(50)).current;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-cerrar después de 8 segundos si el usuario no interactúa
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="complete-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(4,4,14,0.85)', backdropFilter: 'blur(20px)' }}
        onClick={onClose}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => <Particle key={p.id} style={p} />)}
        </div>

        {/* Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, rgba(78,205,196,0.08) 50%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <motion.div
          key="complete-card"
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.05 }}
          className="relative w-full max-w-md rounded-3xl border border-white/[0.1] p-8 text-center shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'linear-gradient(145deg, rgba(12,12,24,0.99) 0%, rgba(18,14,36,0.99) 100%)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Ícono principal animado */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.12 }}
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl relative"
            style={{
              background: 'linear-gradient(135deg, #7C5CFC, #4ECDC4)',
              boxShadow: '0 0 50px rgba(124,92,252,0.45)',
            }}
          >
            🎉
            {/* Anillo pulsante */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Título */}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white tracking-tight mb-2"
          >
            ¡Tu marca está lista!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs mx-auto"
          >
            Completaste tu identidad de marca. Ahora la IA tiene todo lo que necesita para generar contenido que suena exactamente a vos.
          </motion.p>

          {/* Badges de logros */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="flex items-center justify-center gap-2 flex-wrap mb-7"
          >
            {['Identidad ✓', 'Paleta ✓', 'Canales ✓'].map((badge, i) => (
              <span
                key={i}
                className="text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: i === 0 ? 'rgba(124,92,252,0.2)' : i === 1 ? 'rgba(78,205,196,0.15)' : 'rgba(255,107,107,0.15)',
                  color: i === 0 ? '#7C5CFC' : i === 1 ? '#4ECDC4' : '#FF6B6B',
                  border: `1px solid ${i === 0 ? '#7C5CFC40' : i === 1 ? '#4ECDC440' : '#FF6B6B40'}`,
                }}
              >
                {badge}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="flex flex-col gap-2.5"
          >
            <Link
              to={`/clients/${clientId}?tab=cm`}
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] no-underline"
              style={{
                background: 'linear-gradient(135deg, #7C5CFC 0%, #4ECDC4 100%)',
                boxShadow: '0 0 30px rgba(124,92,252,0.4)',
              }}
            >
              <span>✨ Generar mi primer contenido</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-white/30 hover:text-white/50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </motion.div>

          {/* Barra de auto-cierre */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] rounded-b-3xl"
            style={{ background: 'linear-gradient(90deg, #7C5CFC, #4ECDC4)' }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
