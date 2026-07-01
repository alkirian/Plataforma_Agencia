import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '../../lib/utils';

// ==================== 1. SUB-COMPONENT: GSAP FLOATING PARTICLE ====================
const FloatingParticle = ({ text, x, onComplete }) => {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.to(ref.current, {
      y: -120,
      x: `+=${Math.random() * 50 - 25}`,
      opacity: 0,
      scale: 1.6,
      rotation: Math.random() * 60 - 30,
      duration: 2.2,
      ease: 'power1.out',
      onComplete
    });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      className="absolute text-sm font-bold text-white pointer-events-none select-none z-50 drop-shadow-md"
      style={{
        left: `calc(50% + ${x}px)`,
        bottom: '60%',
      }}
    >
      {text}
    </div>
  );
};

// ==================== 2. MAIN COMPONENT ====================
const presetDefaults = {
  bloop: {
    theme: 'cyber',
    accessories: { headphones: true, glasses: false, halo: false, arms: true, feet: true }
  },
  daisy: {
    theme: 'mint',
    accessories: { headphones: false, glasses: false, halo: false, arms: true, feet: true }
  },
  hearty: {
    theme: 'peach',
    accessories: { headphones: false, glasses: false, halo: false, arms: true, feet: false }
  },
  cloudy: {
    theme: 'nebula',
    accessories: { headphones: false, glasses: false, halo: true, arms: true, feet: true }
  },
  chatter: {
    theme: 'jelly',
    accessories: { headphones: false, glasses: false, halo: false, arms: false, feet: true }
  }
};

export const InteractiveGSAPCharacter = ({
  preset = 'bloop',
  emotion = 'happy',
  theme = '',
  accessories = null,
  size = 'lg',
  className = '',
  onAction = () => {},
  actionRef = null
}) => {
  const containerRef = useRef(null);
  const tiltWrapperRef = useRef(null);
  const bodyRef = useRef(null);
  const faceRef = useRef(null);
  const shadowRef = useRef(null);

  // Eyelids/Pupils refs for blink animations
  const leftEyelidRef = useRef(null);
  const rightEyelidRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);

  // Blush and mouth refs
  const mouthRef = useRef(null);
  const leftCheekRef = useRef(null);
  const rightCheekRef = useRef(null);

  // Accessories & Limbs refs
  const haloRef = useRef(null);
  const headphonesRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const leftFootRef = useRef(null);
  const rightFootRef = useRef(null);

  // Daisy petal wrapper ref
  const daisyPetalsRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  // Resolve presets and defaults
  const defaults = presetDefaults[preset] || presetDefaults.bloop;
  
  // Props override preset defaults
  const activeTheme = theme || defaults.theme;
  const activeAccessories = accessories || defaults.accessories;

  // Size configurations
  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  // Color themes configurations
  const themeMap = {
    cyber: {
      body: 'bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500',
      glow: 'shadow-[0_0_50px_rgba(217,70,239,0.4)]',
      blush: 'bg-rose-400/60',
      limbs: 'bg-gradient-to-b from-fuchsia-500 to-violet-600 border-violet-400/30',
      stops: ['#7c3aed', '#d946ef', '#ec4899']
    },
    peach: {
      body: 'bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400',
      glow: 'shadow-[0_0_50px_rgba(244,63,94,0.4)]',
      blush: 'bg-pink-500/50',
      limbs: 'bg-gradient-to-b from-orange-400 to-rose-500 border-orange-300/30',
      stops: ['#f59e0b', '#fb923c', '#fb7185']
    },
    mint: {
      body: 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500',
      glow: 'shadow-[0_0_50px_rgba(20,184,166,0.4)]',
      blush: 'bg-rose-400/50',
      limbs: 'bg-gradient-to-b from-teal-400 to-emerald-500 border-teal-300/30',
      stops: ['#10b981', '#2dd4bf', '#06b6d4']
    },
    nebula: {
      body: 'bg-gradient-to-tr from-indigo-900 via-purple-700 to-blue-500',
      glow: 'shadow-[0_0_50px_rgba(99,102,241,0.4)]',
      blush: 'bg-fuchsia-400/40',
      limbs: 'bg-gradient-to-b from-purple-700 to-indigo-950 border-purple-500/30',
      stops: ['#312e81', '#7e22ce', '#3b82f6']
    },
    sun: {
      body: 'bg-gradient-to-tr from-yellow-500 via-amber-400 to-orange-400',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
      blush: 'bg-rose-500/50',
      limbs: 'bg-gradient-to-b from-yellow-400 to-amber-500 border-yellow-300/30',
      stops: ['#eab308', '#fbbf24', '#fb923c']
    },
    jelly: {
      body: 'bg-gradient-to-tr from-pink-400 via-rose-300 to-fuchsia-200',
      glow: 'shadow-[0_0_55px_rgba(244,63,94,0.4)]',
      blush: 'bg-rose-400/60',
      limbs: 'bg-gradient-to-b from-rose-300 to-pink-400 border-pink-200/20',
      stops: ['#f472b6', '#fda4af', '#f5d0fe']
    }
  };

  const themeConfig = themeMap[activeTheme] || themeMap.cyber;

  // Particle Emitter Function
  const spawnParticle = (text) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 60 - 30; // Random horizontal offset
    setParticles((prev) => [...prev, { id, text, x }]);
  };

  const removeParticle = (id) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  // ==================== GSAP TIMELINES AND LOOPS ====================
  useGSAP(() => {
    // 1. FLOATING CHARACTER + FLOOR SHADOW SYNC
    const floatSpeed = preset === 'cloudy' ? 3.8 : 2.5;
    const floatHeight = preset === 'cloudy' ? -8 : -15;

    const floatTl = gsap.timeline({ repeat: -1, yoyo: true });
    floatTl
      .to(tiltWrapperRef.current, {
        y: floatHeight,
        rotation: preset === 'cloudy' ? 0.3 : 1.2,
        duration: floatSpeed,
        ease: 'sine.inOut'
      }, 0)
      .to(shadowRef.current, {
        scaleX: 0.72,
        opacity: 0.15,
        duration: floatSpeed,
        ease: 'sine.inOut'
      }, 0);

    // 2. UNIFIED SQUIRCLE MORPHING (loops fluid rounded square border-radius presets)
    const morphTl = gsap.timeline({ repeat: -1, yoyo: true });
    if (preset === 'chatter') {
      morphTl
        .to(bodyRef.current, {
          borderRadius: '52% 48% 51% 49% / 47% 53% 47% 53%',
          duration: 1.8,
          ease: 'sine.inOut'
        })
        .to(bodyRef.current, {
          borderRadius: '48% 52% 45% 55% / 52% 48% 55% 45%',
          duration: 2.2,
          ease: 'sine.inOut'
        })
        .to(bodyRef.current, {
          borderRadius: '53% 47% 54% 46% / 45% 55% 48% 52%',
          duration: 1.6,
          ease: 'sine.inOut'
        });
    } else {
      morphTl
        .to(bodyRef.current, {
          borderRadius: '35% 25% 30% 28% / 28% 30% 25% 35%',
          duration: 2.8,
          ease: 'sine.inOut'
        })
        .to(bodyRef.current, {
          borderRadius: '22% 38% 25% 32% / 32% 25% 38% 22%',
          duration: 3.2,
          ease: 'sine.inOut'
        });
    }

    // 3. HEARTY DOUBLE-BEAT LATIDO
    let heartbeatTl;
    if (preset === 'hearty') {
      heartbeatTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      heartbeatTl
        .to(bodyRef.current, { scale: 1.12, duration: 0.12, ease: 'power2.out' })
        .to(bodyRef.current, { scale: 0.98, duration: 0.1, ease: 'power1.inOut' })
        .to(bodyRef.current, { scale: 1.08, duration: 0.12, ease: 'power2.out' })
        .to(bodyRef.current, { scale: 1.0, duration: 0.25, ease: 'power1.in' });
    }

    // 4. RANDOM BLINKING TIMER (Blinks actual lids)
    let blinkTimer;
    const triggerBlink = () => {
      onAction(`[${preset.toUpperCase()}] Blink triggered`);
      gsap.timeline()
        .to([leftEyelidRef.current, rightEyelidRef.current], { scaleY: 1, duration: 0.08, ease: 'power2.inOut' })
        .to([leftEyelidRef.current, rightEyelidRef.current], { scaleY: 0, duration: 0.08, ease: 'power2.inOut' });

      const minSec = preset === 'cloudy' ? 4 : preset === 'chatter' ? 1.5 : 2.5;
      const maxSec = preset === 'cloudy' ? 9 : preset === 'chatter' ? 5 : 7.5;
      blinkTimer = gsap.delayedCall(gsap.utils.random(minSec, maxSec), triggerBlink);
    };
    // Don't blink if Cloudy or Daisy (since their eyes are paths/lines, not lids)
    if (!['cloudy', 'daisy'].includes(preset)) {
      blinkTimer = gsap.delayedCall(3, triggerBlink);
    }

    // 5. CLOUDY LAZY Zzz EMITTER
    let zzzTimer;
    const triggerZzzEmission = () => {
      if (preset === 'cloudy') {
        spawnParticle('Zzz');
        zzzTimer = gsap.delayedCall(gsap.utils.random(2.2, 3.8), triggerZzzEmission);
      }
    };
    if (preset === 'cloudy') {
      zzzTimer = gsap.delayedCall(2, triggerZzzEmission);
    }

    // 6. FLOATING NEON HALO
    let haloTween;
    if (haloRef.current) {
      haloTween = gsap.to(haloRef.current, {
        y: -6,
        rotation: 4,
        scaleX: 1.03,
        duration: 1.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }

    return () => {
      floatTl.kill();
      morphTl.kill();
      if (heartbeatTl) heartbeatTl.kill();
      if (blinkTimer) blinkTimer.kill();
      if (zzzTimer) zzzTimer.kill();
      if (haloTween) haloTween.kill();
    };
  }, [preset]);

  // 7. LIMBS IDLE SWINGS
  useGSAP(() => {
    let armSwayL, armSwayR, feetSwayL, feetSwayR;

    if (activeAccessories.arms) {
      armSwayL = gsap.to(leftArmRef.current, { rotation: 15, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      armSwayR = gsap.to(rightArmRef.current, { rotation: -15, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    if (activeAccessories.feet) {
      feetSwayL = gsap.to(leftFootRef.current, { rotation: 8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      feetSwayR = gsap.to(rightFootRef.current, { rotation: -8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.2 });
    }

    return () => {
      if (armSwayL) armSwayL.kill();
      if (armSwayR) armSwayR.kill();
      if (feetSwayL) feetSwayL.kill();
      if (feetSwayR) feetSwayR.kill();
    };
  }, [activeAccessories.arms, activeAccessories.feet]);

  // 8. MOUSE MOVE: 3D ROTATION, PARALLAX & INERTIA LIMBS
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      const normX = gsap.utils.clamp(-1, 1, dx / (window.innerWidth / 2));
      const normY = gsap.utils.clamp(-1, 1, dy / (window.innerHeight / 2));

      setMousePos({ x: normX, y: normY });

      // Tilt body
      gsap.to(tiltWrapperRef.current, {
        rotateX: -normY * 18,
        rotateY: normX * 18,
        duration: 0.6,
        ease: 'power2.out'
      });

      // Shift face
      gsap.to(faceRef.current, {
        x: normX * 16,
        y: normY * 12,
        duration: 0.5,
        ease: 'power2.out'
      });

      // Shift pupils (focus look)
      if (leftPupilRef.current && rightPupilRef.current) {
        gsap.to([leftPupilRef.current, rightPupilRef.current], {
          x: normX * 6,
          y: normY * 4,
          duration: 0.4,
          ease: 'power2.out'
        });
      }

      // Inertia Limbs: Arms tilt slightly in sync with mouse offset direction
      if (activeAccessories.arms) {
        gsap.to(leftArmRef.current, {
          rotation: 15 + normX * 14,
          duration: 0.6,
          ease: 'power2.out'
        });
        gsap.to(rightArmRef.current, {
          rotation: -15 + normX * 14,
          duration: 0.6,
          ease: 'power2.out'
        });
      }

      // Inertia feet
      if (activeAccessories.feet) {
        gsap.to([leftFootRef.current, rightFootRef.current], {
          x: normX * 6,
          duration: 0.7,
          ease: 'power2.out'
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [preset, activeAccessories]);

  const handleMouseLeave = () => {
    gsap.to(tiltWrapperRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    gsap.to(faceRef.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    if (leftPupilRef.current && rightPupilRef.current) {
      gsap.to([leftPupilRef.current, rightPupilRef.current], { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    }
    if (activeAccessories.arms) {
      gsap.to(leftArmRef.current, { rotation: 15, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      gsap.to(rightArmRef.current, { rotation: -15, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    }
    if (activeAccessories.feet) {
      gsap.to([leftFootRef.current, rightFootRef.current], { x: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    }
  };

  // 9. SQUISH ON CLICK & TRIGGER PARTICLES
  const handleSquish = () => {
    onAction(`[${preset.toUpperCase()}] Clicked: Squash & Stretch timeline triggered`);
    
    // Spawn custom particle based on preset
    const particleMap = {
      bloop: '🫧',
      daisy: '✨',
      hearty: '💖',
      cloudy: '☁️',
      chatter: '💬'
    };
    spawnParticle(particleMap[preset] || '🫧');

    // Squish body
    gsap.timeline()
      .to(bodyRef.current, { scaleX: 1.25, scaleY: 0.75, duration: 0.12, ease: 'power1.out' })
      .to(bodyRef.current, { scaleX: 0.85, scaleY: 1.15, duration: 0.15, ease: 'power2.out' })
      .to(bodyRef.current, { scaleX: 1.05, scaleY: 0.95, duration: 0.15, ease: 'power2.out' })
      .to(bodyRef.current, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.3)' });

    // Blink lids
    if (leftEyelidRef.current && rightEyelidRef.current) {
      gsap.timeline()
        .to([leftEyelidRef.current, rightEyelidRef.current], { scaleY: 1, duration: 0.05 })
        .to([leftEyelidRef.current, rightEyelidRef.current], { scaleY: 0, duration: 0.15, delay: 0.05 });
    }

    // Blush flare
    gsap.timeline()
      .to([leftCheekRef.current, rightCheekRef.current], { scale: 1.4, opacity: 0.9, duration: 0.15 })
      .to([leftCheekRef.current, rightCheekRef.current], { scale: 1, opacity: 0.6, duration: 0.5, ease: 'power2.out' });

    // Arm click wave
    if (activeAccessories.arms && leftArmRef.current) {
      gsap.timeline()
        .to(leftArmRef.current, { rotation: 130, duration: 0.15 })
        .to(leftArmRef.current, { rotation: 90, duration: 0.1, yoyo: true, repeat: 3 })
        .to(leftArmRef.current, { rotation: 15, duration: 0.25 });
    }
  };

  const triggerWaveAction = () => {
    if (activeAccessories.arms && leftArmRef.current) {
      onAction(`[${preset.toUpperCase()}] Hand waving!`);
      spawnParticle('👋');
      gsap.timeline()
        .to(leftArmRef.current, { rotation: 140, duration: 0.18, ease: 'back.out(1.5)' })
        .to(leftArmRef.current, { rotation: 90, duration: 0.12, yoyo: true, repeat: 4 })
        .to(leftArmRef.current, { rotation: 15, duration: 0.3 });
    } else {
      onAction(`[${preset.toUpperCase()}] Cannot wave: limbs disabled`);
    }
  };

  // Bind wave hello action to actionRef prop
  useEffect(() => {
    if (actionRef) {
      actionRef.current = {
        wave: triggerWaveAction
      };
    }
  }, [actionRef, activeAccessories.arms]);

  // Render distinct face structures based on preset
  const renderFace = () => {
    const eyeClass = "w-10 h-12 bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-inner border border-slate-200/10";
    const blushClass = cn("w-6 h-3 rounded-full blur-[1px] opacity-65", themeConfig.blush);

    switch (preset) {
      case 'daisy': // SMILEY FACE
        return (
          <>
            {/* Smiling Eyes */}
            <div className="flex gap-10 items-center justify-center relative mb-4">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-none stroke-current" strokeWidth="3" strokeLinecap="round">
                <path d="M 4 15 Q 12 5 20 15" />
              </svg>
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-none stroke-current" strokeWidth="3" strokeLinecap="round">
                <path d="M 4 15 Q 12 5 20 15" />
              </svg>
            </div>
            
            {/* Feline mouth (w / cute cat smile) */}
            <div className="relative h-6 flex items-center justify-center">
              <svg viewBox="0 0 30 15" className="w-8 h-4 text-white fill-none stroke-current" strokeWidth="3.5" strokeLinecap="round">
                <path d="M 3,4 Q 8,11 15,4 Q 22,11 27,4" />
              </svg>
            </div>

            {/* Blush */}
            <div className="absolute inset-x-4 flex justify-between px-2 top-[55%] pointer-events-none">
              <div ref={leftCheekRef} className={blushClass} />
              <div ref={rightCheekRef} className={blushClass} />
            </div>
          </>
        );

      case 'hearty': // HEART EYES
        return (
          <>
            {/* Heart Eyes */}
            <div className="flex gap-10 items-center justify-center relative mb-4 text-rose-500 fill-current">
              <svg viewBox="0 0 24 24" className="w-10 h-10 animate-pulse">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <svg viewBox="0 0 24 24" className="w-10 h-10 animate-pulse" style={{ animationDelay: '0.2s' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            
            {/* Tongue out mouth (:P) */}
            <div className="relative h-6 flex flex-col items-center">
              {/* Mouth line */}
              <div className="w-8 h-1 bg-white rounded-full" />
              {/* Hanging tongue */}
              <div className="w-4 h-4 bg-rose-400 rounded-b-lg border-t-0 -mt-[1px] animate-bounce" />
            </div>

            {/* Blush */}
            <div className="absolute inset-x-4 flex justify-between px-2 top-[55%] pointer-events-none">
              <div ref={leftCheekRef} className={blushClass} />
              <div ref={rightCheekRef} className={blushClass} />
            </div>
          </>
        );

      case 'cloudy': // SLEEPY FACE
        return (
          <>
            {/* Lazy Sleepy Lines for Eyes */}
            <div className="flex gap-10 items-center justify-center relative mb-5 text-white fill-none stroke-current" strokeWidth="4" strokeLinecap="round">
              <svg viewBox="0 0 20 10" className="w-10 h-3">
                <line x1="2" y1="5" x2="18" y2="5" />
              </svg>
              <svg viewBox="0 0 20 10" className="w-10 h-3">
                <line x1="2" y1="5" x2="18" y2="5" />
              </svg>
            </div>

            {/* Tiny Yawning mouth */}
            <div className="w-4.5 h-4.5 rounded-full border-[3.5px] border-white bg-transparent animate-pulse" />

            {/* Blush */}
            <div className="absolute inset-x-4 flex justify-between px-2 top-[55%] pointer-events-none">
              <div ref={leftCheekRef} className={blushClass} />
              <div ref={rightCheekRef} className={blushClass} />
            </div>
          </>
        );

      case 'chatter': // JELLY DROP - CUTE FEMININE FACE
        return (
          <>
            {/* Cute Anime Eyes with Eyelashes */}
            <div className="flex gap-10 items-center justify-center relative mb-4">
              {/* Left Eye */}
              <div className="relative">
                {/* Eyelash overlay */}
                <svg className="absolute -top-3.5 -left-3.5 w-14 h-6 text-slate-800 pointer-events-none z-20" fill="none" viewBox="0 0 56 24">
                  <path d="M10 20 Q 25 2 45 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M40 8 Q 48 3 52 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className={eyeClass}>
                  <div ref={leftPupilRef} className="w-6 h-6 bg-slate-900 rounded-full relative flex items-center justify-center">
                    {/* Anime highlights */}
                    <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-white/80 rounded-full" />
                  </div>
                  <div ref={leftEyelidRef} className="absolute inset-x-0 top-0 h-full bg-slate-800 origin-top transform scale-y-0" />
                </div>
              </div>

              {/* Right Eye */}
              <div className="relative">
                {/* Eyelash overlay */}
                <svg className="absolute -top-3.5 -right-3.5 w-14 h-6 text-slate-800 pointer-events-none z-20" fill="none" viewBox="0 0 56 24">
                  <path d="M46 20 Q 31 2 11 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M16 8 Q 8 3 4 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className={eyeClass}>
                  <div ref={rightPupilRef} className="w-6 h-6 bg-slate-900 rounded-full relative flex items-center justify-center">
                    {/* Anime highlights */}
                    <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-white/80 rounded-full" />
                  </div>
                  <div ref={rightEyelidRef} className="absolute inset-x-0 top-0 h-full bg-slate-800 origin-top transform scale-y-0" />
                </div>
              </div>
            </div>
            
            {/* Cute happy feline mouth or open mouth */}
            <div className="relative h-6 flex items-center justify-center">
              <svg viewBox="0 0 30 15" className="w-8 h-5 text-white fill-none stroke-current" strokeWidth="3.5" strokeLinecap="round">
                <path d="M 5,3 Q 15,13 25,3" />
              </svg>
            </div>

            {/* Blush */}
            <div className="absolute inset-x-4 flex justify-between px-2 top-[55%] pointer-events-none">
              <div ref={leftCheekRef} className={blushClass} />
              <div ref={rightCheekRef} className={blushClass} />
            </div>
          </>
        );

      case 'bloop': // ANIME SHINY SHINE EYES
      default:
        return (
          <>
            {/* Big Shiny Eyes */}
            <div className="flex gap-10 items-center justify-center relative mb-4">
              <div className={eyeClass}>
                <div ref={leftPupilRef} className="w-6 h-6 bg-slate-900 rounded-full relative flex items-center justify-center">
                  {/* Anime highlights */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full" />
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/70 rounded-full" />
                </div>
                <div ref={leftEyelidRef} className="absolute inset-x-0 top-0 h-full bg-slate-800 origin-top transform scale-y-0" />
              </div>

              <div className={eyeClass}>
                <div ref={rightPupilRef} className="w-6 h-6 bg-slate-900 rounded-full relative flex items-center justify-center">
                  {/* Anime highlights */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full" />
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/70 rounded-full" />
                </div>
                <div ref={rightEyelidRef} className="absolute inset-x-0 top-0 h-full bg-slate-800 origin-top transform scale-y-0" />
              </div>
            </div>

            {/* Open happy mouth with tongue */}
            <div
              ref={mouthRef}
              className="w-8 h-5 bg-white relative flex items-center justify-center overflow-hidden rounded-b-2xl border-t-0"
            >
              {/* Pink tongue */}
              <div className="absolute bottom-0 w-6 h-3 bg-pink-400 rounded-t-full" />
            </div>

            {/* Blush */}
            <div className="absolute inset-x-4 flex justify-between px-2 top-[55%] pointer-events-none">
              <div ref={leftCheekRef} className={blushClass} />
              <div ref={rightCheekRef} className={blushClass} />
            </div>
          </>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center select-none cursor-pointer flex-shrink-0',
        sizeMap[size] || sizeMap.lg,
        className
      )}
      onMouseLeave={handleMouseLeave}
      onClick={handleSquish}
      style={{ perspective: 1000 }}
    >
      {/* ==================== 1. FLOATING PARTICLE POP-UPS ==================== */}
      {particles.map((p) => (
        <FloatingParticle
          key={p.id}
          text={p.text}
          x={p.x}
          onComplete={() => removeParticle(p.id)}
        />
      ))}

      {/* ==================== 2. DYNAMIC FLOOR SHADOW ==================== */}
      <div
        ref={shadowRef}
        className="absolute bottom-[-18px] left-[15%] right-[15%] h-3.5 bg-black/35 rounded-full blur-[4px] z-0 pointer-events-none scale-100 opacity-30"
      />

      {/* ==================== 3. ACCESSORIES: GLOWING HALO ==================== */}
      {activeAccessories.halo && (
        <div
          ref={haloRef}
          className="absolute -top-[25%] w-[80%] h-6 rounded-[50%] border-4 border-amber-300 pointer-events-none z-40"
          style={{
            boxShadow: '0 0 15px rgba(253,224,71,0.8), inset 0 0 10px rgba(253,224,71,0.6)',
            transformStyle: 'preserve-3d'
          }}
        />
      )}

      {/* ==================== 4. TILT WRAPPER ==================== */}
      <div
        ref={tiltWrapperRef}
        className="relative w-full h-full flex items-center justify-center z-10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* A. LEFT ARM */}
        {activeAccessories.arms && (
          <div
            ref={leftArmRef}
            className={cn(
              'absolute right-full mr-[-6px] top-[43%] w-10 h-3 rounded-full border shadow-md z-0 transition-colors duration-500',
              themeConfig.limbs
            )}
            style={{ transformOrigin: 'right center', transform: 'rotate(15deg)' }}
          />
        )}

        {/* B. RIGHT ARM */}
        {activeAccessories.arms && (
          <div
            ref={rightArmRef}
            className={cn(
              'absolute left-full ml-[-6px] top-[43%] w-10 h-3 rounded-full border shadow-md z-0 transition-colors duration-500',
              themeConfig.limbs
            )}
            style={{ transformOrigin: 'left center', transform: 'rotate(-15deg)' }}
          />
        )}

        {/* C. LEFT FOOT */}
        {activeAccessories.feet && (
          <div
            ref={leftFootRef}
            className={cn(
              'absolute bottom-[-10px] left-[26%] w-5 h-6 rounded-b-xl border shadow-md z-0 transition-colors duration-500',
              themeConfig.limbs
            )}
            style={{ transformOrigin: 'center top' }}
          />
        )}

        {/* D. RIGHT FOOT */}
        {activeAccessories.feet && (
          <div
            ref={rightFootRef}
            className={cn(
              'absolute bottom-[-10px] right-[26%] w-5 h-6 rounded-b-xl border shadow-md z-0 transition-colors duration-500',
              themeConfig.limbs
            )}
            style={{ transformOrigin: 'center top' }}
          />
        )}

        {/* E. MORPHING SQUIRCLE BODY */}
        <div
          ref={bodyRef}
          className={cn(
            'w-full h-full relative transition-all duration-500 z-10 flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-2xl rounded-[30%]',
            themeConfig.body,
            themeConfig.glow
          )}
          style={{ 
            transformStyle: 'preserve-3d',
            borderRadius: preset === 'chatter' ? '49% 51% 52% 48% / 53% 47% 53% 47%' : undefined
          }}
        >
          {/* Glass glare highlight */}
          <div className="absolute top-2 left-6 right-6 h-[40%] bg-gradient-to-b from-white/20 to-white/0 rounded-t-[50%] pointer-events-none z-10" />

          {/* Inner ambient lights */}
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-cyan-400/35 blur-xl pointer-events-none" />
          <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-rose-400/35 blur-xl pointer-events-none" />

          {/* F. FACE CONTAINER */}
          <div
            ref={faceRef}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {renderFace()}
          </div>
        </div>

      </div>

      {/* ==================== 5. ACCESSORIES: RETRO HEADPHONES ==================== */}
      {activeAccessories.headphones && (
        <div
          ref={headphonesRef}
          className="absolute inset-0 -inset-x-4 flex items-center justify-between pointer-events-none z-30"
        >
          <div className="absolute -top-3 inset-x-2 h-8 rounded-t-[50%] border-t-8 border-slate-700/95 shadow-[0_4px_10px_rgba(0,0,0,0.3)] animate-pulse" />
          <div className="w-8 h-16 bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center">
            <div className="w-3 h-10 bg-violet-400 rounded-full animate-pulse" />
          </div>
          <div className="w-8 h-16 bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center">
            <div className="w-3 h-10 bg-violet-400 rounded-full animate-pulse" />
          </div>
        </div>
      )}

    </div>
  );
};
