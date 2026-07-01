import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveGSAPCharacter } from '../ui';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

// Step definitions for the tour
const TOUR_STEPS = [
  {
    target: '[data-tour="sidebar-logo"]',
    title: '¡Te damos la bienvenida a Cadence!',
    content: '¡Hola! Soy Aura, tu co-piloto de marketing estratégico. Este es el centro de control de tu agencia. Desde aquí siempre podés volver a la pantalla de inicio principal.',
    emotion: 'excited',
    position: 'right'
  },
  {
    target: '[data-tour="client-list"]',
    title: 'Tus Marcas y Clientes',
    content: 'Acá vas a ver listadas todas las marcas que gestionás. Hacé clic en cualquiera de ellas para acceder a su cronograma, analizar tendencias de mercado o generar contenido automático.',
    emotion: 'happy',
    position: 'right'
  },
  {
    target: '[data-tour="search-button"]',
    title: 'Búsqueda e Inteligencia',
    content: '¿Tenés muchos clientes? Hacé clic acá o presiona la tecla "/" para abrir el buscador inteligente de marcas y navegar de forma inmediata.',
    emotion: 'thinking',
    position: 'bottom'
  },
  {
    target: '[data-tour="settings-nav"]',
    title: 'Ajustes y Colaboradores',
    content: 'Desde acá podés invitar a otros miembros de tu agencia, gestionar roles (CM, Administrador), actualizar tu perfil y alternar entre temas claro y oscuro.',
    emotion: 'happy',
    position: 'right'
  },
  {
    target: '[data-tour="aura-chat-toggle"]',
    title: 'Hablá Conmigo en Cualquier Momento',
    content: '¡Acá estoy! Hacé clic en mi botón flotante en cualquier pantalla para abrir nuestro chat de consulta. Puedo redactar copies para redes, auditar pautas en Meta Ads o darte consejos estratégicos.',
    emotion: 'excited',
    position: 'left'
  }
];

export const DashboardTour = () => {
  const [currentStep, setCurrentStep] = useState(-2); // -2: checking, -1: welcome screen, >=0: steps
  const [highlightRect, setHighlightRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [currentEmotion, setCurrentEmotion] = useState('happy');
  
  const mascotRef = useRef(null);
  const bubbleRef = useRef(null);

  // Resize handler to recalculate highlights
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if tour should run (only if not completed in localStorage)
  useEffect(() => {
    const isCompleted = localStorage.getItem('cadence_tour_completed');
    if (isCompleted === 'true') {
      setCurrentStep(-2); // Don't run
    } else {
      // Small timeout to allow dashboard rendering before welcoming
      const timer = setTimeout(() => {
        setCurrentStep(-1); // Show welcome modal
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Helper to calculate coordinates
  const calculatePositions = (stepIndex) => {
    if (stepIndex < -1 || stepIndex >= TOUR_STEPS.length) return null;
    
    // Welcome screen centered positioning
    if (stepIndex === -1) {
      return {
        mascot: {
          left: window.innerWidth / 2 - 50,
          top: window.innerHeight / 2 - 200
        },
        bubble: {
          left: window.innerWidth / 2 - 170,
          top: window.innerHeight / 2 - 40
        }
      };
    }

    const step = TOUR_STEPS[stepIndex];
    const element = document.querySelector(step.target);
    
    // Default fallback (center of screen)
    let mLeft = window.innerWidth / 2 - 50;
    let mTop = window.innerHeight / 2 - 120;
    let bLeft = window.innerWidth / 2 - 150;
    let bTop = window.innerHeight / 2 + 10;
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const gap = 15;
      const mascotSize = 100; // Mascot container size
      const bubbleW = 340; // Speech bubble card width
      const bubbleH = 180; // Speech bubble card estimated height
      
      switch (step.position) {
        case 'right':
          mLeft = rect.right + gap;
          mTop = rect.top + rect.height / 2 - mascotSize / 2;
          
          bLeft = mLeft + mascotSize + 5;
          bTop = rect.top + rect.height / 2 - bubbleH / 2;
          break;
        case 'left':
          mLeft = rect.left - mascotSize - gap;
          mTop = rect.top + rect.height / 2 - mascotSize / 2;
          
          bLeft = mLeft - bubbleW - 5;
          bTop = rect.top + rect.height / 2 - bubbleH / 2;
          break;
        case 'bottom':
          mLeft = rect.left + rect.width / 2 - mascotSize / 2;
          mTop = rect.bottom + gap;
          
          bLeft = rect.left + rect.width / 2 - bubbleW / 2;
          bTop = mTop + mascotSize + 5;
          break;
        case 'top':
          mLeft = rect.left + rect.width / 2 - mascotSize / 2;
          mTop = rect.top - mascotSize - gap;
          
          bLeft = rect.left + rect.width / 2 - bubbleW / 2;
          bTop = mTop - bubbleH - 5;
          break;
        default:
          break;
      }
      
      // Screen boundary check to prevent clipping
      mLeft = Math.max(12, Math.min(window.innerWidth - mascotSize - 12, mLeft));
      mTop = Math.max(12, Math.min(window.innerHeight - mascotSize - 12, mTop));
      
      bLeft = Math.max(12, Math.min(window.innerWidth - bubbleW - 12, bLeft));
      bTop = Math.max(12, Math.min(window.innerHeight - bubbleH - 12, bTop));
    }
    
    return {
      mascot: { left: mLeft, top: mTop },
      bubble: { left: bLeft, top: bTop }
    };
  };

  // Coordinates calculation and animation triggers
  useEffect(() => {
    if (currentStep === -2) return;

    const pos = calculatePositions(currentStep);
    if (!pos) return;

    // 1. Handle Highlight Rect for target
    if (currentStep >= 0 && currentStep < TOUR_STEPS.length) {
      const step = TOUR_STEPS[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }

    const mascot = mascotRef.current;
    if (!mascot) return;

    // Hide bubble while traveling
    const bubble = bubbleRef.current;
    if (bubble) {
      gsap.to(bubble, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        overwrite: 'auto'
      });
    }

    if (currentStep === -1) {
      // Set to center welcome position immediately
      gsap.set(mascot, {
        left: pos.mascot.left,
        top: pos.mascot.top,
        scale: 1.25,
        rotation: 0
      });
      setCurrentEmotion('excited');
      return;
    }

    // Flight animation
    setCurrentEmotion('excited');
    
    // Calculate movement distance to derive tilt angle
    const currentRect = mascot.getBoundingClientRect();
    const dx = pos.mascot.left - currentRect.left;
    const tiltAngle = dx > 20 ? 15 : dx < -20 ? -15 : 0;

    gsap.to(mascot, {
      left: pos.mascot.left,
      top: pos.mascot.top,
      scale: 0.95, // slight stretch/shrink during flight
      rotation: tiltAngle,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        const step = TOUR_STEPS[currentStep];
        setCurrentEmotion(step.emotion || 'happy');

        // Squishy landing bounce
        gsap.timeline()
          .to(mascot, {
            scaleX: 1.15,
            scaleY: 0.85,
            rotation: 0,
            duration: 0.15,
            ease: 'power1.out'
          })
          .to(mascot, {
            scaleX: 0.95,
            scaleY: 1.05,
            duration: 0.12,
            ease: 'power2.out'
          })
          .to(mascot, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.2,
            ease: 'elastic.out(1, 0.3)'
          });

        // 3. Position and show text bubble next to it
        if (bubble) {
          gsap.set(bubble, {
            left: pos.bubble.left,
            top: pos.bubble.top
          });
          
          gsap.to(bubble, {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: 'back.out(1.5)',
            overwrite: 'auto'
          });
        }
      }
    });
  }, [currentStep, windowSize]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('cadence_tour_completed', 'true');
    setCurrentStep(-2); // Hide tour
  };

  const startTour = () => {
    setCurrentStep(0);
  };

  // Trigger manual reset of tour (exposed globally for testing / Settings)
  useEffect(() => {
    const handleResetTour = () => {
      localStorage.removeItem('cadence_tour_completed');
      setCurrentStep(-1);
    };
    window.addEventListener('cadence:reset-tour', handleResetTour);
    return () => window.removeEventListener('cadence:reset-tour', handleResetTour);
  }, []);

  if (currentStep === -2) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans select-none">
      
      {/* Dark Overlay (Transparent behind highlighted area, dark elsewhere) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] transition-all duration-300 pointer-events-auto"
        style={{
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 0% 100%, 
                ${highlightRect.left}px 100%, 
                ${highlightRect.left}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px 100%, 
                100% 100%, 100% 0%
              )`
            : 'none'
        }}
        onClick={handleSkip} // Click background to skip/close
      />

      {/* ================= A. WELCOME / INTRO MODAL ================= */}
      <AnimatePresence>
        {currentStep === -1 && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-md bg-slate-900/95 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-lg flex flex-col items-center text-center gap-4 pointer-events-auto mt-[120px]"
            >
              {/* Spacing for the mascot floating above */}
              <div className="h-14" />

              <div>
                <h2 className="text-lg font-black text-white tracking-tight">¡Hola, te doy la bienvenida! 👋</h2>
                <p className="text-[10px] text-violet-400 font-extrabold tracking-widest uppercase mt-0.5">Asistente Virtual Aura</p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed px-2">
                Soy Aura, tu co-piloto en Cadence. ¿Te gustaría hacer un breve recorrido omitible para conocer las secciones clave de tu dashboard de forma rápida?
              </p>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  Omitir recorrido
                </button>
                <button
                  onClick={startTour}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-95 shadow-lg shadow-violet-950/20 cursor-pointer"
                >
                  ¡Iniciar Tour! 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= B. GLOWING HIGHLIGHT RING ================= */}
      {highlightRect && (
        <div 
          className="absolute border border-violet-400 rounded-xl pointer-events-none z-[10000] shadow-[0_0_15px_rgba(139,92,246,0.4),_inset_0_0_8px_rgba(139,92,246,0.3)] transition-all duration-300"
          style={{
            top: highlightRect.top - 2,
            left: highlightRect.left - 2,
            width: highlightRect.width + 4,
            height: highlightRect.height + 4
          }}
        />
      )}

      {/* ================= C. FLYING MASCOT CHARACTER ================= */}
      {currentStep >= -1 && currentStep < TOUR_STEPS.length && (
        <div
          ref={mascotRef}
          className="absolute z-[10001] pointer-events-none overflow-visible transition-transform duration-100 flex-shrink-0"
          style={{
            width: '100px',
            height: '100px',
            position: 'absolute'
          }}
        >
          <InteractiveGSAPCharacter
            preset="chatter"
            emotion={currentEmotion}
            size="sm"
            className="scale-[0.8] origin-center"
          />
        </div>
      )}

      {/* ================= D. INTERACTIVE SPEECH CARD ================= */}
      {currentStep >= 0 && currentStep < TOUR_STEPS.length && (
        <div
          ref={bubbleRef}
          className="absolute z-[10000] pointer-events-auto opacity-0 scale-[0.8]"
          style={{
            width: 340,
            position: 'absolute'
          }}
        >
          <div className="w-full bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-lg flex flex-col gap-3 relative">
            
            {/* Speech Bubble Arrow pointing to Mascot */}
            <div className={cn(
              "absolute w-3 h-3 bg-slate-900 border border-white/10 rotate-45 z-[-1]",
              TOUR_STEPS[currentStep].position === 'right' && "left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0 bg-slate-900",
              TOUR_STEPS[currentStep].position === 'left' && "right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0 bg-slate-900",
              TOUR_STEPS[currentStep].position === 'bottom' && "top-[-6px] left-1/2 -translate-x-1/2 border-r-0 border-b-0 bg-slate-900",
              TOUR_STEPS[currentStep].position === 'top' && "bottom-[-6px] left-1/2 -translate-x-1/2 border-l-0 border-t-0 bg-slate-900"
            )} />

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-2">
              <div className="min-w-0">
                <h3 className="font-extrabold text-xs text-white leading-tight truncate">
                  {TOUR_STEPS[currentStep].title}
                </h3>
                <span className="text-[9px] text-violet-400 font-extrabold tracking-widest uppercase">AURA TUTORIAL</span>
              </div>
            </div>

            {/* Bubble text content */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {TOUR_STEPS[currentStep].content}
            </p>

            {/* Footer Buttons & Step count */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
              <button
                onClick={handleSkip}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-bold transition-all cursor-pointer"
              >
                Omitir
              </button>

              <span className="text-[10px] font-mono text-slate-500">
                Paso {currentStep + 1} de {TOUR_STEPS.length}
              </span>

              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-white text-black hover:bg-slate-200 transition-all shadow-md cursor-pointer"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Terminar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
