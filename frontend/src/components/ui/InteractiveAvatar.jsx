import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * InteractiveAvatar - Un avatar interactivo 3D / 2.5D premium y futurista
 * que sigue el movimiento del cursor, parpadea y reacciona a estados.
 * Soporta 4 variantes para cada uno de los módulos de clientes de Cadence.
 *
 * @param {string} variant - Variante de diseño: 'ai' (identidad), 'trends' (tendencias), 'schedule' (cronograma), 'documents' (documentos), 'meta' (meta ads)
 * @param {string} state - Estado del avatar: 'idle', 'thinking', 'talking', 'listening'
 * @param {string} size - Tamaño del avatar: 'sm', 'md', 'lg', 'xl'
 * @param {string} className - Clases de CSS adicionales
 * @param {boolean} interactive - Si es true, sigue el cursor global. Si es false, se mantiene estático.
 */
export const InteractiveAvatar = ({
  variant = 'ai',
  state = 'idle',
  size = 'lg',
  className = '',
  interactive = true,
  hovered = false,
}) => {
  const containerRef = useRef(null);
  const [localHovered, setLocalHovered] = useState(false);
  const isHovered = localHovered || hovered;
  const [isBlinking, setIsBlinking] = useState(false);

  // Estados locales para el Cronograma (Fecha, Hora, Día de la Semana en tiempo real)
  const [timeStr, setTimeStr] = useState('12:00');
  const [dateInfo, setDateInfo] = useState({ month: 'MAY', day: '27', todayIndex: 2 });

  useEffect(() => {
    if (variant !== 'schedule') return;
    const updateDateTime = () => {
      const now = new Date();
      // Hora: HH:MM
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
      
      // Fecha: MES y DÍA
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const currentMonth = months[now.getMonth()];
      const currentDayStr = String(now.getDate()).padStart(2, '0');
      
      // Día de la semana (0 = SUN, 1 = MON, ... 6 = SAT)
      // En nuestro orden: MON=0, TUE=1, WED=2, THU=3, FRI=4, SAT=5, SUN=6
      const currentDayIndex = now.getDay();
      const todayIndexInOrder = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

      setDateInfo({
        month: currentMonth,
        day: currentDayStr,
        todayIndex: todayIndexInOrder
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [variant]);

  // Valores de movimiento del mouse (normalizados de -0.5 a 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configuración de resortes (Springs) para un movimiento ultra suave y orgánico
  const springConfig = { damping: 25, stiffness: 120, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Transformaciones 3D de la cabeza
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [15, -15]); // Inclinación vertical
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-20, 20]); // Rotación horizontal

  // Parallax para elementos internos (ojos se mueven más para dar sensación de profundidad)
  const eyeX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const eyeY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  // Parallax inverso para el fondo de la pantalla (profundidad holográfica)
  const bgX = useTransform(smoothX, [-0.5, 0.5], [8, -8]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [8, -8]);

  // Rotación del anillo exterior
  const ringRotateX = useTransform(smoothY, [-0.5, 0.5], [25, -25]);
  const ringRotateY = useTransform(smoothX, [-0.5, 0.5], [-35, 35]);

  useEffect(() => {
    if (!interactive) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    const handleMouseMove = e => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Calcular el centro del avatar
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height / 2;

        // Distancia del cursor al centro del avatar
        const dx = e.clientX - avatarCenterX;
        const dy = e.clientY - avatarCenterY;

        // Distancia máxima de influencia (p. ej., radio de 600px para máxima sensibilidad)
        const maxDist = 600;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalizar los valores limitándolos al rango [-0.5, 0.5]
        const influence = Math.max(0, 1 - distance / maxDist);

        const normX = (dx / (window.innerWidth / 2)) * 0.5;
        const normY = (dy / (window.innerHeight / 2)) * 0.5;

        // Limitar para evitar deformaciones exageradas
        const clampedX = Math.max(-0.5, Math.min(0.5, normX));
        const clampedY = Math.max(-0.5, Math.min(0.5, normY));

        mouseX.set(clampedX);
        mouseY.set(clampedY);
      } else {
        // Fallback global si no hay ref
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;
        mouseX.set(normX);
        mouseY.set(normY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, mouseX, mouseY]);

  // Efecto de parpadeo aleatorio y natural (solo aplica para variantes con ojos)
  useEffect(() => {
    if (variant === 'trends') return;

    let blinkTimeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);

      const nextBlinkTime = Math.random() * 4000 + 2000;
      blinkTimeout = setTimeout(triggerBlink, nextBlinkTime);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, [variant]);

  // Clases de tamaño
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
    xl: 'w-64 h-64',
  };

  // Configuraciones de brillo y colores según la variante y estado
  const getGlowColorClass = () => {
    if (variant === 'trends') {
      return 'bg-teal-500/50 shadow-[0_0_40px_rgba(78,205,196,0.4)]';
    }
    if (variant === 'schedule') {
      return 'bg-rose-500/50 shadow-[0_0_40px_rgba(255,107,107,0.4)]';
    }
    if (variant === 'documents') {
      return 'bg-[#00b4db]/50 shadow-[0_0_40px_rgba(0,180,219,0.4)]';
    }
    if (variant === 'meta') {
      return 'bg-purple-600/50 shadow-[0_0_40px_rgba(168,85,247,0.4)]';
    }
    if (variant === 'cm') {
      return 'bg-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.4)]';
    }
    // Variant AI (Identidad)
    if (state === 'thinking') return 'bg-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.4)]';
    if (state === 'talking') return 'bg-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.4)]';
    if (state === 'listening') return 'bg-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.4)]';
    return 'bg-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.3)]';
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center select-none',
        sizeClasses[size] || sizeClasses.lg,
        className
      )}
      onMouseEnter={() => setLocalHovered(true)}
      onMouseLeave={() => {
        setLocalHovered(false);
        if (!interactive) {
          mouseX.set(0);
          mouseY.set(0);
        }
      }}
      style={{ perspective: 1000 }}
    >
      {/* 1. AURA / RESPLANDOR TRASERO */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500',
          getGlowColorClass()
        )}
        style={{
          x: bgX,
          y: bgY,
          scale: isHovered ? 1.15 : 1.0,
        }}
      />

      {/* 2. ANILLO CYBERNETICO ORBITAL */}
      {variant === 'ai' && (
        <>
          <motion.div
            className={cn(
              'absolute -inset-4 rounded-full border border-dashed opacity-30 pointer-events-none transition-colors duration-500',
              state === 'thinking'
                ? 'border-indigo-400'
                : state === 'talking'
                  ? 'border-emerald-400'
                  : state === 'listening'
                    ? 'border-amber-400 animate-spin'
                    : 'border-violet-400'
            )}
            style={{
              rotateX: ringRotateX,
              rotateY: ringRotateY,
              rotateZ: state === 'listening' ? undefined : isHovered ? 180 : 0,
            }}
            transition={{
              rotateZ: { type: 'spring', stiffness: 40, damping: 10 },
              default: { duration: 0.3 },
            }}
          />
          <motion.div
            className='absolute -inset-8 rounded-full border border-double opacity-10 pointer-events-none border-violet-500'
            style={{
              rotateX: ringRotateY,
              rotateY: ringRotateX,
              scale: isHovered ? 1.05 : 0.95,
            }}
            transition={{ duration: 0.5 }}
          />
        </>
      )}

      {variant === 'trends' && (
        <>
          {/* Radar Sonar concéntrico para Tendencias */}
          <motion.div
            className='absolute -inset-6 rounded-full border border-teal-500/20 pointer-events-none'
            style={{
              rotateX: ringRotateX,
              rotateY: ringRotateY,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
          <motion.div
            className='absolute -inset-2 rounded-full border border-dashed border-teal-400/30 pointer-events-none'
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
          />
        </>
      )}

      {variant === 'schedule' && (
        <>
          {/* Dial de Reloj Táctico / Cronómetro */}
          <motion.div
            className='absolute -inset-6 rounded-full border border-rose-500/20 pointer-events-none'
            style={{
              rotateX: ringRotateX,
              rotateY: ringRotateY,
              rotateZ: isHovered ? 360 : 0,
            }}
            transition={{ type: 'spring', stiffness: 30, damping: 15 }}
          >
            {/* Marcas de tiempo en el borde del dial */}
            <div className='absolute inset-0 rounded-full border-t-2 border-b-2 border-dashed border-rose-500/40 opacity-40 animate-spin-slow' />
          </motion.div>
          <motion.div
            className='absolute -inset-9 rounded-full border border-rose-500/10 pointer-events-none flex items-center justify-center'
            style={{
              scale: isHovered ? 1.05 : 0.95,
              rotateX: ringRotateY,
              rotateY: ringRotateX,
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Cuadrante circular de reloj */}
            <div className='w-full h-full rounded-full border border-double border-rose-500/5 relative'>
              <div className='absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-rose-500/30' />
              <div className='absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-rose-500/30' />
              <div className='absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-rose-500/30' />
              <div className='absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-rose-500/30' />
            </div>
          </motion.div>
        </>
      )}

      {variant === 'documents' && (
        <>
          {/* Hojas / Archivos flotantes en 3D para Documentos */}
          <motion.div
            className='absolute -inset-5 rounded-2xl border border-sky-500/25 pointer-events-none'
            style={{
              rotateX: ringRotateX,
              rotateY: ringRotateY,
              rotateZ: isHovered ? 90 : 35,
            }}
            transition={{ type: 'spring', stiffness: 55 }}
          />
          <motion.div
            className='absolute -inset-8 rounded-full border border-dashed border-sky-400/10 pointer-events-none'
            style={{
              scale: isHovered ? 1.06 : 0.94,
              rotate: -35,
            }}
            transition={{ duration: 0.4 }}
          />
        </>
      )}

      {variant === 'cm' && (
        <>
          {/* Ondas concéntricas de comunicación/chat */}
          <motion.div
            className='absolute -inset-6 rounded-full border border-emerald-500/20 pointer-events-none'
            style={{
              rotateX: ringRotateX,
              rotateY: ringRotateY,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          />
          <motion.div
            className='absolute -inset-3 rounded-full border border-dashed border-emerald-400/30 pointer-events-none'
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          />
        </>
      )}

      {/* 3. CABEZA DEL AVATAR (Giro 3D y perspectiva) */}
      <motion.div
        className={cn(
          'relative w-full h-full flex flex-col items-center justify-center overflow-hidden border backdrop-blur-xl shadow-2xl transition-all duration-500',
          variant === 'ai'
            ? 'rounded-[2.5rem] bg-slate-950/80 border-slate-800/80'
            : variant === 'trends'
              ? 'rounded-[3rem] bg-slate-950/85 border-teal-900/40'
              : variant === 'schedule'
                ? 'rounded-[2rem] bg-slate-950/90 border-rose-900/40'
                : variant === 'documents'
                  ? 'rounded-[2.2rem] bg-slate-950/85 border-sky-900/40'
                  : variant === 'cm'
                    ? 'rounded-[2.4rem] bg-slate-950/85 border-emerald-900/40'
                    : 'rounded-[2.8rem] bg-slate-950/85 border-purple-900/40', // variant === 'meta'
          isHovered &&
            (variant === 'ai'
              ? 'border-violet-500/40 shadow-[0_0_25px_rgba(139,92,246,0.15)]'
              : variant === 'trends'
                ? 'border-teal-400/40 shadow-[0_0_25px_rgba(78,205,196,0.15)]'
                : variant === 'schedule'
                  ? 'border-rose-400/40 shadow-[0_0_25px_rgba(255,107,107,0.15)]'
                  : variant === 'documents'
                    ? 'border-sky-400/40 shadow-[0_0_25px_rgba(0,180,219,0.15)]'
                    : variant === 'cm'
                      ? 'border-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                      : 'border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.15)]') // variant === 'meta'
        )}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Efecto de líneas de escaneo holográficas */}
        <div
          className='absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay'
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Resplandor superior interno */}
        <div className='absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none' />

        {/* 4. ROSTRO / ELEMENTOS SENSORIALES (Con Parallax) */}
        <motion.div
          className='relative w-full h-full flex flex-col items-center justify-center px-4'
          style={{
            x: eyeX,
            y: eyeY,
            transformStyle: 'preserve-3d',
            translateZ: 35, // Empuja el rostro hacia afuera del plano
          }}
        >
          {/* ======================================================== */}
          {/* VARIANTE A: ASISTENTE DE IA (DISEÑO ORIGINAL - IDENTIDAD) */}
          {/* ======================================================== */}
          {variant === 'ai' && (
            <>
              {/* OJOS */}
              <div
                className='flex justify-between w-3/5 mb-3'
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className='w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden'>
                  <motion.div
                    className={cn(
                      'rounded-full transition-all duration-300',
                      isBlinking ? 'h-0.5 w-5 bg-violet-400' : 'h-3.5 w-3.5',
                      state === 'thinking'
                        ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                        : state === 'talking'
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                          : state === 'listening'
                            ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse'
                            : 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]'
                    )}
                    animate={
                      state === 'thinking'
                        ? {
                            scaleY: [1, 0.2, 1],
                            transition: { repeat: Infinity, duration: 2, repeatDelay: 1 },
                          }
                        : {}
                    }
                  />
                </div>
                <div className='w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden'>
                  <motion.div
                    className={cn(
                      'rounded-full transition-all duration-300',
                      isBlinking ? 'h-0.5 w-5 bg-violet-400' : 'h-3.5 w-3.5',
                      state === 'thinking'
                        ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                        : state === 'talking'
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                          : state === 'listening'
                            ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse'
                            : 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]'
                    )}
                    animate={
                      state === 'thinking'
                        ? {
                            scaleY: [1, 0.2, 1],
                            transition: { repeat: Infinity, duration: 2, repeatDelay: 1 },
                          }
                        : {}
                    }
                  />
                </div>
              </div>

              {/* BOCA / VISUALIZADOR */}
              <div
                className='h-6 flex items-center justify-center gap-0.5 mt-2'
                style={{ transformStyle: 'preserve-3d' }}
              >
                {state === 'idle' && (
                  <motion.div
                    className='h-1 w-8 rounded-full bg-slate-700 opacity-60'
                    layoutId='avatar-mouth'
                  />
                )}
                {state === 'thinking' && (
                  <div className='flex gap-1 justify-center items-center'>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className='w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.5)]'
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                )}
                {state === 'talking' && (
                  <div className='flex items-center gap-0.5 h-4'>
                    {[0, 1, 2, 3, 4, 3, 2, 1, 0].map((h, i) => (
                      <motion.div
                        key={i}
                        className='w-0.75 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)] rounded-full'
                        style={{ width: '2px' }}
                        animate={{ height: [4, h * 3 + 4, 4] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + Math.random() * 0.3,
                          delay: i * 0.03,
                        }}
                      />
                    ))}
                  </div>
                )}
                {state === 'listening' && (
                  <motion.div
                    className='w-7 h-1 bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)] rounded-full'
                    animate={{ scaleX: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* VARIANTE B: ANALISTA DE TENDENCIAS (OJO-SCANNER ÚNICO) */}
          {/* ======================================================== */}
          {variant === 'trends' && (
            <div
              className='flex flex-col items-center justify-center animate-fade-in'
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Lente Radar Central */}
              <div className='relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 border border-teal-500/40 p-1 flex items-center justify-center shadow-[inset_0_0_15px_rgba(78,205,196,0.3)]'>
                {/* Anillos Holográficos internos del lente */}
                <div className='absolute inset-2 rounded-full border border-teal-500/20 animate-ping opacity-35' />

                {/* Pupila Scanner que se mueve de forma responsiva al ratón */}
                <motion.div
                  className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-2 border-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(78,205,196,0.6)]'
                  style={{
                    x: useTransform(smoothX, [-0.5, 0.5], [-8, 8]),
                    y: useTransform(smoothY, [-0.5, 0.5], [-8, 8]),
                  }}
                >
                  {/* Núcleo Láser */}
                  <div className='w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1),0_0_15px_rgba(78,205,196,1)]' />
                </motion.div>
              </div>

              {/* Data Grid / Línea de escaneo inferior */}
              <div className='mt-3 flex items-center gap-1'>
                <span className='w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_5px_rgba(78,205,196,0.8)]' />
                <div className='w-12 h-1 bg-teal-950 rounded-full overflow-hidden border border-teal-500/20'>
                  <motion.div
                    className='h-full bg-teal-400'
                    animate={{ x: [-48, 48] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VARIANTE C: ESTRATEGA DE CRONOGRAMA (VISOR LED MILITAR) */}
          {/* ======================================================== */}
          {variant === 'schedule' && (
            <div
              className='flex flex-col items-center justify-center w-full h-full relative px-6 select-none'
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Grid Digital de Fondo del Calendario */}
              <div className='absolute inset-4 grid grid-cols-4 grid-rows-3 gap-1 opacity-10 pointer-events-none'>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className='rounded-xs bg-rose-500/10 border border-rose-500/5' />
                ))}
              </div>

              {/* Contenedor de Ojos y Rostro Superior */}
              <div className='relative w-[85%] flex justify-between items-center mb-5 z-10' style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Ojo Izquierdo Expresivo */}
                <motion.div
                  className='relative w-12 h-12 rounded-full bg-slate-900 border border-rose-500/25 flex items-center justify-center shadow-[inset_0_0_8px_rgba(244,63,94,0.15)]'
                  animate={
                    state === 'thinking'
                      ? { scaleX: 0.9, scaleY: 0.9 }
                      : state === 'talking'
                        ? { scaleY: 0.9, scaleX: 1.05 }
                        : isHovered
                          ? { scaleY: 0.8, rotate: 10 } // Guiño/Sonrisa con el ojo
                          : { scaleY: 1, scaleX: 1, rotate: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                >
                  {/* Pupila con Física de mirada */}
                  <motion.div
                    className={cn(
                      'rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.85)] transition-all duration-300 relative',
                      isHovered ? 'w-6 h-3 rounded-t-full rounded-b-none' : 'w-4 h-4'
                    )}
                    style={{
                      x: useTransform(smoothX, [-0.5, 0.5], [-6, 6]),
                      y: useTransform(smoothY, [-0.5, 0.5], [-5, 5]),
                    }}
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Brillo tierno en la pupila */}
                    {!isHovered && <div className='w-1 h-1 rounded-full bg-white absolute top-1 left-1 opacity-80' />}
                  </motion.div>
                </motion.div>

                {/* Ojo Derecho Expresivo */}
                <motion.div
                  className='relative w-12 h-12 rounded-full bg-slate-900 border border-rose-500/25 flex items-center justify-center shadow-[inset_0_0_8px_rgba(244,63,94,0.15)]'
                  animate={
                    state === 'thinking'
                      ? { scaleX: 0.9, scaleY: 0.9 }
                      : state === 'talking'
                        ? { scaleY: 0.9, scaleX: 1.05 }
                        : isHovered
                          ? { scaleY: 0.8, rotate: -10 } // Guiño/Sonrisa con el ojo
                          : { scaleY: 1, scaleX: 1, rotate: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                >
                  {/* Pupila con Física de mirada */}
                  <motion.div
                    className={cn(
                      'rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.85)] transition-all duration-300 relative',
                      isHovered ? 'w-6 h-3 rounded-t-full rounded-b-none' : 'w-4 h-4'
                    )}
                    style={{
                      x: useTransform(smoothX, [-0.5, 0.5], [-6, 6]),
                      y: useTransform(smoothY, [-0.5, 0.5], [-5, 5]),
                    }}
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Brillo tierno en la pupila */}
                    {!isHovered && <div className='w-1 h-1 rounded-full bg-white absolute top-1 left-1 opacity-80' />}
                  </motion.div>
                </motion.div>

                {/* Mejillas LED Adorables */}
                <motion.div
                  className='w-4 h-1.5 rounded-full bg-rose-500/20 filter blur-[1px] absolute'
                  style={{ left: '-2px', bottom: '-4px' }}
                  animate={isHovered ? { scale: 1.25, opacity: 0.8 } : { scale: 1, opacity: 0.3 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
                <motion.div
                  className='w-4 h-1.5 rounded-full bg-rose-500/20 filter blur-[1px] absolute'
                  style={{ right: '-2px', bottom: '-4px' }}
                  animate={isHovered ? { scale: 1.25, opacity: 0.8 } : { scale: 1, opacity: 0.3 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>

              {/* Boca Expresiva (Sonrisa / Línea de Tiempo interactiva) */}
              <div className='relative w-[65%] h-8 flex items-center justify-center z-10' style={{ transformStyle: 'preserve-3d' }}>
                {state === 'talking' ? (
                  /* Boca Parlante (Elipse que vibra elásticamente con la voz) */
                  <motion.div
                    className='w-7 h-5 rounded-full bg-slate-900 border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.65)]'
                    animate={{
                      scaleY: [1, 1.3, 0.8, 1.2, 1],
                      scaleX: [1, 0.9, 1.1, 0.95, 1],
                      y: [0, -2, 1, -1, 0]
                    }}
                    transition={{
                      type: 'tween',
                      repeat: Infinity,
                      duration: 0.35,
                      ease: 'easeInOut'
                    }}
                  />
                ) : state === 'thinking' ? (
                  /* Boca Pensativa / Dudosa (Pequeña 'o' flotando de lado a lado) */
                  <motion.div
                    className='w-4 h-4 rounded-full bg-slate-900 border-2 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    animate={{
                      x: [-3, 3, -3],
                      scale: [1, 0.9, 1],
                    }}
                    transition={{
                      type: 'tween',
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'easeInOut'
                    }}
                  />
                ) : (
                  /* Boca de Sonrisa Feliz / Línea de Tiempo Curva */
                  <div className='relative w-full h-full flex flex-col items-center justify-center'>
                    {/* El arco de la sonrisa */}
                    <motion.svg
                      width='60'
                      height='24'
                      viewBox='0 0 60 24'
                      fill='none'
                      className='filter drop-shadow-[0_0_4px_rgba(244,63,94,0.7)]'
                    >
                      <motion.path
                        d='M10 4C20 18 40 18 50 4'
                        stroke='#f43f5e'
                        strokeWidth='3.5'
                        strokeLinecap='round'
                        animate={isHovered ? { d: 'M6 2C18 22 42 22 54 2' } : { d: 'M10 4C20 18 40 18 50 4' }}
                        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
                      />
                    </motion.svg>

                    {/* Nodos de posteo en la sonrisa (Simbolizando cronograma) */}
                    <div className='absolute inset-x-2 top-0 flex justify-between px-2.5 pointer-events-none'>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className='w-2 h-2 rounded-full bg-rose-400 border border-rose-600 shadow-[0_0_4px_rgba(244,63,94,0.5)]'
                          animate={isHovered ? { y: -3, scale: 1.2 } : { y: 0, scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 100,
                            damping: 8,
                            y: {
                              type: 'spring',
                              stiffness: 80,
                              damping: 5,
                              repeat: isHovered ? Infinity : 0,
                              repeatType: 'reverse',
                              delay: i * 0.15
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Firma de Estatus del Asistente */}
              <div className='mt-4 flex items-center gap-1.5 z-10 select-none'>
                <span className='w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_6px_rgba(244,63,94,0.6)]' />
                <span className='text-[8px] text-rose-400/80 font-mono tracking-[0.2em] uppercase font-bold filter drop-shadow-[0_0_2px_rgba(244,63,94,0.25)]'>
                  ARES PLANNER
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VARIANTE D: RESPONSABLE DE DOCUMENTOS (VISOR HOLOGRÁFICO DE DATOS) */}
          {/* ======================================================== */}
          {variant === 'documents' && (
            <div
              className='flex flex-col items-center justify-center w-full'
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Visor de doble barra vertical / almacenamiento */}
              <div className='relative w-12 h-12 flex items-center justify-center bg-slate-900 border border-[#00b4db]/30 rounded-2xl shadow-[inset_0_0_12px_rgba(0,180,219,0.25)]'>
                {/* Cuadrículas de memoria */}
                <div className='absolute inset-1 grid grid-cols-2 gap-1 opacity-20'>
                  <div className='bg-sky-500/50 rounded-xs' />
                  <div className='bg-sky-500/50 rounded-xs' />
                  <div className='bg-sky-500/50 rounded-xs' />
                  <div className='bg-sky-500/50 rounded-xs' />
                </div>

                {/* Doble sensor ocular de datos */}
                <motion.div
                  className='flex gap-2 relative z-10'
                  style={{
                    x: useTransform(smoothX, [-0.5, 0.5], [-5, 5]),
                    y: useTransform(smoothY, [-0.5, 0.5], [-5, 5]),
                  }}
                >
                  <motion.div
                    className='w-2 h-4 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(0,180,219,0.9)]'
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                  <motion.div
                    className='w-2 h-4 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(0,180,219,0.9)]'
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                </motion.div>
              </div>

              {/* Data stream dots */}
              <div className='mt-2.5 flex items-center gap-1.5 h-3'>
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className='w-1.5 h-1.5 rounded-full bg-sky-400/90 shadow-[0_0_4px_rgba(0,180,219,0.6)]'
                    animate={{
                      scale: [0.6, 1.2, 0.6],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VARIANTE E: ESTRATEGA DE META ADS (VISOR EN INFINITO)    */}
          {/* ======================================================== */}
          {variant === 'meta' && (
            <div
              className='flex flex-col items-center justify-center w-full'
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Contenedor del visor de infinito de Meta */}
              <div className='relative w-16 h-12 flex items-center justify-center bg-slate-900 border border-purple-500/30 rounded-2xl shadow-[inset_0_0_12px_rgba(168,85,247,0.25)]'>
                {/* SVG animado y responsivo del logo de infinito */}
                <motion.svg
                  width='36'
                  height='18'
                  viewBox='0 0 36 18'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='relative z-10 filter drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                >
                  <motion.path
                    d='M18 9C15.5 5 12 2 8 2C3.5 2 1.5 5.5 1.5 9C1.5 12.5 3.5 16 8 16C12 16 15.5 13 18 9ZM18 9C20.5 5 24 2 28 2C32.5 2 34.5 5.5 34.5 9C34.5 12.5 32.5 16 28 16C24 16 20.5 13 18 9Z'
                    stroke='#a855f7'
                    strokeWidth='3.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    animate={{
                      stroke: ['#a855f7', '#ec4899', '#3b82f6', '#a855f7'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Dos puntos oculares virtuales en el centro de los loops del infinito */}
                  <circle cx='8' cy='9' r='1.5' fill='#ffffff' className='animate-pulse' />
                  <circle cx='28' cy='9' r='1.5' fill='#ffffff' className='animate-pulse' />
                </motion.svg>
              </div>

              {/* Data stream - Barritas de campaña subiendo/bajando */}
              <div className='mt-2.5 flex items-end gap-1 h-3.5 px-3'>
                {[0, 1, 2, 3, 4].map(i => {
                  const heights = [4, 12, 6, 14, 8];
                  return (
                    <motion.div
                      key={i}
                      className='w-1 bg-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.6)] rounded-full'
                      animate={{
                        height: [4, heights[i], 4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6 + i * 0.15,
                        ease: 'easeInOut',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VARIANTE F: ASISTENTE DE CM INTELIGENTE (BURBUJAS + CHAT) */}
          {/* ======================================================== */}
          {variant === 'cm' && (
            <div
              className='flex flex-col items-center justify-center w-full animate-fade-in'
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Ojos - Burbujas de diálogo digitales */}
              <div
                className='flex justify-between w-[62%] mb-4'
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Ojo Izquierdo (Burbuja Chat) */}
                <div className='w-7 h-7 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-center relative shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]'>
                  <div className='absolute -bottom-1 -left-0.5 w-1.5 h-1.5 bg-slate-900 border-b border-l border-emerald-500/30 rotate-45 rounded-xs' />
                  <motion.div
                    className='w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(56,239,125,0.9)]'
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Ojo Derecho (Burbuja Chat) */}
                <div className='w-7 h-7 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-center relative shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]'>
                  <div className='absolute -bottom-1 -right-0.5 w-1.5 h-1.5 bg-slate-900 border-b border-r border-emerald-500/30 -rotate-45 rounded-xs' />
                  <motion.div
                    className='w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(56,239,125,0.9)]'
                    animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Boca de Intercomunicador - Onda de Audio / Chat */}
              <div className='w-[82%] h-8 bg-slate-950/80 border border-emerald-500/20 rounded-xl flex items-center justify-center px-3 gap-0.5 relative overflow-hidden'>
                <div className='absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-[0.06]' />
                
                {[0, 1, 2, 3, 4, 5, 6].map(i => {
                  const animHeights = [4, 18, 10, 22, 12, 16, 4];
                  return (
                    <motion.div
                      key={i}
                      className='bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] rounded-full'
                      style={{ width: '2.5px' }}
                      animate={{
                        height: isHovered ? [4, animHeights[i], 4] : [4, 7, 4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4 + i * 0.08,
                        ease: 'easeInOut',
                      }}
                    />
                  );
                })}
              </div>

              {/* Estatus "ONLINE" */}
              <div className='mt-2.5 flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping' />
                <span className='text-[8px] text-emerald-400/80 font-mono tracking-widest uppercase'>
                  CM ACTIVE
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* 5. SOMBRA INFERIOR EN EL ESPACIO 3D */}
      <div
        className={cn(
          'absolute -bottom-6 w-3/4 h-2 rounded-full blur-md opacity-75 transform scale-x-75 pointer-events-none',
          variant === 'trends'
            ? 'bg-teal-950/60'
            : variant === 'schedule'
              ? 'bg-rose-950/60'
              : variant === 'documents'
                ? 'bg-sky-950/60'
                : variant === 'meta'
                  ? 'bg-purple-950/60'
                  : variant === 'cm'
                    ? 'bg-emerald-950/60'
                    : 'bg-slate-950/40'
        )}
      />
    </div>
  );
};
