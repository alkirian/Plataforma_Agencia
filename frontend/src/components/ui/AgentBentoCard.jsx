// src/components/ui/AgentBentoCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { InteractiveAvatar } from './InteractiveAvatar';
import { agentSynth } from '../../utils/agentSynth';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AgentBentoCard = ({
  card,
  index,
  draggedIndex,
  handleDragStart,
  handleDragOverCard,
  handleDragEnd,
  onClick,
  onChatClick,
  client,
  hasNotification = false,
  badgeCount = 0
}) => {
  const isDraggingThis = draggedIndex === index;
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [avatarSize, setAvatarSize] = useState('md');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setAvatarSize('lg');
      } else {
        setAvatarSize('md');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 1. PENSAMIENTOS EN VIVO ADAPTADOS AL CLIENTE ---
  const clientName = client?.name || 'Cliente';
  const clientIndustry = client?.industry || 'este sector';

  const thoughtsList = {
    cm: [
      `Lyra · "Redactando respuestas en el tono de ${clientName}..."`,
      `Lyra · "Monitoreando menciones y engagement social..."`,
      `Lyra · "Analizando el sentimiento de comentarios..."`,
      `Lyra · "Buscando interacciones clave en Instagram..."`,
      `Lyra · "Sugerencias de interacción listas."`
    ],
    trends: [
      `Vesper · "Escaneando tendencias de ${clientIndustry}..."`,
      `Vesper · "Cruzando intereses de la audiencia..."`,
      `Vesper · "Detectando hashtags de alto potencial..."`,
      `Vesper · "Filtrando virales de TikTok relevantes..."`,
      `Vesper · "8 oportunidades de radar detectadas hoy."`
    ],
    documents: [
      `Atlas · "Indexando briefs y recursos de ${clientName}..."`,
      `Atlas · "Sincronizando manuales de ADN visual..."`,
      `Atlas · "Clasificando formatos y contratos..."`,
      `Atlas · "Clasificando información operativa..."`,
      `Atlas · "Repositorio indexado y ordenado."`
    ],
    schedule: [
      `Ares · "Alineando calendario con metas de ${clientName}..."`,
      `Ares · "Calculando horarios pico de engagement..."`,
      `Ares · "Sincronizando publicaciones semanales..."`,
      `Ares · "Validando consistencia de publicaciones..."`,
      `Ares · "Calendario optimizado con éxito."`
    ],
    meta: [
      `Kaelen · "Monitoreando CPA y CTR de ${clientName}..."`,
      `Kaelen · "Evaluando presupuesto vs conversiones..."`,
      `Kaelen · "Pruebas A/B en creativos publicitarios..."`,
      `Kaelen · "Optimizando públicos personalizados..."`,
      `Kaelen · "Métricas de conversión estables."`
    ],
    identity: [
      `Nova · "Preservando el ADN visual de ${clientName}..."`,
      `Nova · "Sincronizando paletas de colores y fuentes..."`,
      `Nova · "Validando coherencia tipográfica de posts..."`,
      `Nova · "Auditando copys frente al manual de tono..."`,
      `Nova · "ADN de marca verificado al 100%."`
    ]
  };

  const agentId = card.id === 'identity' ? 'identity' : card.id;
  const thoughts = thoughtsList[agentId] || thoughtsList.identity;
  const [activeThoughtIdx, setActiveThoughtIdx] = useState(0);

  // Ciclo periódico de pensamientos en reposo (cada 8.5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveThoughtIdx(prev => (prev + 1) % thoughts.length);
    }, 8500);
    return () => clearInterval(interval);
  }, [thoughts]);

  // --- 2. FÍSICA E INCLINACIÓN 3D (TILT) ---
  const rotateX = useSpring(useMotionValue(0), { damping: 20, stiffness: 150 });
  const rotateY = useSpring(useMotionValue(0), { damping: 20, stiffness: 150 });

  // --- 3. REFLEXIÓN DE LUZ / SPOTLIGHT ---
  const spotlightX = useSpring(useMotionValue(-100), { damping: 25, stiffness: 180 });
  const spotlightY = useSpring(useMotionValue(-100), { damping: 25, stiffness: 180 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || isDraggingThis) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Coordenadas locales dentro de la tarjeta
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spotlight cursor (coordenadas porcentuales para el radial gradient)
    spotlightX.set((x / rect.width) * 100);
    spotlightY.set((y / rect.height) * 100);

    // Calcular inclinación 3D (de -6 a +6 grados)
    const factorX = 6;
    const factorY = 6;
    const tiltY = ((x / rect.width) - 0.5) * factorY * 2; // -6 a 6
    const tiltX = (0.5 - (y / rect.height)) * factorX * 2; // -6 a 6

    rotateX.set(tiltX);
    rotateY.set(tiltY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    spotlightX.set(-100);
    spotlightY.set(-100);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Sonido sutil al pasar el cursor (cyber chirp)
    agentSynth.playHover();
  };

  const handleCardClick = () => {
    // Sonido al hacer clic
    agentSynth.playClick();
    onClick();
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      draggable
      onDragStart={e => handleDragStart(e, index)}
      onDragOver={e => handleDragOverCard(e, index)}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`agent-card flex flex-col gap-3 group cursor-pointer hover:cursor-grab active:cursor-grabbing transition-all duration-200 h-full ${
        isDraggingThis ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className={`agent-card-inner flex-1 w-full rounded-[24px] relative overflow-hidden flex items-center justify-center border transition-all duration-300 transform ${
          isDraggingThis
            ? 'border-accent-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
            : ''
        }`}
        style={{ 
          background: card.grad,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          borderColor: isHovered ? hexToRgba(card.color, 0.4) : 'rgba(255,255,255,0.05)',
          boxShadow: isHovered 
            ? `0 15px 40px -10px ${hexToRgba(card.color, 0.35)}, inset 0 0 0 1px ${hexToRgba(card.color, 0.1)}`
            : '0 10px 25px -5px rgba(0,0,0,0.3)',
          scale: isHovered ? 1.02 : 1
        }}
      >
        {/* Reflexión de brillo (Spotlight cursor tracker) */}
        <motion.div
          className="absolute inset-0 opacity-[0.16] group-hover:opacity-[0.25] transition-opacity duration-300 pointer-events-none"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(circle 120px at ${x}% ${y}%, rgba(255,255,255,1) 0%, transparent 100%)`
            )
          }}
        />

        {/* Noise Grain Overlay */}
        <div
          className="agent-grain absolute inset-0 rounded-inherit opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.72' type='fractalNoise' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Glass Reflection Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

        {/* --- DIALOGO GLOBITO DE PENSAMIENTO EN VIVO (GLASSMORPHIC TOOLTIP) --- */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.85, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="absolute top-4 left-1/2 w-[200px] text-center bg-slate-950/85 border border-white/10 backdrop-blur-md px-3 py-2 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
            >
              <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-slate-950/85 border-r border-b border-white/10 rotate-45" />
              
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[8px] font-mono tracking-widest font-black uppercase text-emerald-400">
                  Pensando en Vivo
                </span>
              </div>
              
              <p className="text-[9.5px] leading-normal text-slate-100 font-bold select-none italic text-center">
                {thoughts[activeThoughtIdx]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive 3D Avatar (Recibe hovered de la tarjeta para sincronizar visualmente) */}
        <div className="relative z-10 transition-all duration-300 group-hover:scale-110" style={{ transform: 'translateZ(30px)' }}>
          <InteractiveAvatar
            variant={card.id === 'identity' ? 'ai' : card.id}
            size={avatarSize}
            interactive={!isDraggingThis}
            hovered={isHovered}
          />
        </div>

        {/* Label */}
        <div className="agent-card-label absolute top-4 left-5 text-[12px] md:text-sm font-title font-bold text-white/95 select-none drop-shadow-md" style={{ transform: 'translateZ(20px)' }}>
          {card.name}
        </div>

        {/* Premium Red Notification Badge */}
        {hasNotification && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)] z-20 flex items-center gap-1 border border-white/10 animate-pulse" style={{ transform: 'translateZ(15px)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>{badgeCount > 0 ? `${badgeCount} NUEVO${badgeCount > 1 ? 'S' : ''}` : '¡NUEVO!'}</span>
          </div>
        )}
      </motion.div>

      {/* Card Footer (Metadata) */}
      <div className="agent-card-foot flex justify-between items-center px-2 select-none gap-2">
        <span
          className={`agent-stat text-[11px] font-bold truncate max-w-[65%] ${
            hasNotification ? 'animate-pulse text-red-400 font-extrabold' : ''
          }`}
          style={hasNotification ? {} : { color: card.color }}
        >
          {card.stat}
        </span>
        
        <div className="flex items-center gap-2.5">
          <span className="agent-open text-[10px] font-bold text-text-secondary group-hover:text-accent-blue transition-colors flex items-center gap-0.5">
            Abrir →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
