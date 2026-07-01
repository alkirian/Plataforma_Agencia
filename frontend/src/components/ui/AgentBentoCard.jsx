// src/components/ui/AgentBentoCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { agentSynth } from '../../utils/agentSynth';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Vivid, highly distinguished soft-matte backgrounds inspired by the user's reference image
const cardBackgrounds = {
  cm: '#65C596',         // Vibrant Mint Green
  trends: '#8B5CF6',     // Vibrant Violet
  documents: '#FDF6E2',  // Soft Sand/Bone
  schedule: '#FBEED5',   // Soft Warm Cream
  meta: '#9F86F0',       // Soft Lavender
  identity: '#EAEAEA',   // Pearl Grey/Bone
  design: '#FFCB45'      // Vibrant Sunflower Yellow
};

// Adaptive high contrast typography colors for readable texts (dark charcoal on light cards, white on dark cards)
const textColors = {
  cm: '#14291E',
  trends: '#FFFFFF',
  documents: '#272317',
  schedule: '#352918',
  meta: '#FFFFFF',
  identity: '#202020',
  design: '#2C1F02'
};

// Semi-transparent label colors
const labelColors = {
  cm: 'rgba(20, 41, 30, 0.45)',
  trends: 'rgba(255, 255, 255, 0.55)',
  documents: 'rgba(39, 35, 23, 0.45)',
  schedule: 'rgba(53, 41, 24, 0.45)',
  meta: 'rgba(255, 255, 255, 0.55)',
  identity: 'rgba(32, 32, 32, 0.45)',
  design: 'rgba(44, 31, 2, 0.45)'
};

// Colors of the shapes tailored to match each background's aesthetic and maintain high contrast
const shapeColors = {
  cm: '#1E4E37',
  trends: '#EDE9FE',
  documents: '#cf6b54',
  schedule: '#ad4336',
  meta: '#F5F3FF',
  identity: '#8c2525',
  design: '#805ad5'
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
  badgeCount = 0,
  cols = 1,
  rows = 1
}) => {
  const isDraggingThis = draggedIndex === index;
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // --- 1. PENSAMIENTOS EN VIVO ---
  const clientName = client?.name || 'Cliente';
  const clientIndustry = client?.industry || 'este sector';

  const thoughtsList = {
    cm: [
      `Lyra · "Redactando respuestas en el tono de ${clientName}..."`,
      `Lyra · "Monitoreando menciones y engagement social..."`,
      `Lyra · "Analizando el sentimiento de comentarios..."`,
      `Lyra · "Buscando interacciones clave en Instagram..."`
    ],
    trends: [
      `Vesper · "Escaneando tendencias de ${clientIndustry}..."`,
      `Vesper · "Cruzando intereses de la audiencia..."`,
      `Vesper · "8 oportunidades de radar detectadas hoy."`
    ],
    documents: [
      `Atlas · "Indexando briefs y recursos de ${clientName}..."`,
      `Atlas · "Sincronizando manuales de ADN visual..."`,
      `Atlas · "Repositorio indexado y ordenado."`
    ],
    schedule: [
      `Ares · "Alineando calendario con metas de ${clientName}..."`,
      `Ares · "Calculando horarios de mayor engagement..."`,
      `Ares · "Calendario optimizado con éxito."`
    ],
    meta: [
      `Kaelen · "Monitoreando CPA e CTR de ${clientName}..."`,
      `Kaelen · "Evaluando presupuesto vs conversiones..."`,
      `Kaelen · "Métricas de conversión estables."`
    ],
    identity: [
      `Nova · "Preservando el ADN visual de ${clientName}..."`,
      `Nova · "Sincronizando paletas de colores y fuentes..."`,
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

  // --- 2. REFLEXIÓN DE LUZ / SPOTLIGHT ---
  const spotlightX = useSpring(useMotionValue(50), { damping: 25, stiffness: 180 });
  const spotlightY = useSpring(useMotionValue(50), { damping: 25, stiffness: 180 });

  // Reciprocal Looking Directions setup (characters look at each other by default):
  // - cm: Looks right (baseXPupil = 8)
  // - trends: Looks right (baseXPupil = 8)
  // - schedule: Looks left (baseXPupil = -8)
  // - identity: Looks up-right (baseXPupil = 6, baseYPupil = -4)
  // - design: Looks left-up (baseXPupil = -6, baseYPupil = -4)
  const baseXPupil = card.id === 'cm' ? 8 : 
                     card.id === 'trends' ? 8 : 
                     card.id === 'schedule' ? -8 : 
                     card.id === 'identity' ? 6 : 
                     card.id === 'design' ? -6 : 0;

  const baseYPupil = card.id === 'identity' ? -4 : 
                     card.id === 'design' ? -4 : 0;

  const pupilX = useTransform(spotlightX, [0, 100], [baseXPupil - 8, baseXPupil + 8]);
  const pupilY = useTransform(spotlightY, [0, 100], [baseYPupil - 6, baseYPupil + 6]);

  // Dynamic face parallax setup (entire face moves with mouse)
  const faceX = useTransform(spotlightX, [0, 100], [-8, 8]);
  const faceY = useTransform(spotlightY, [0, 100], [-6, 6]);

  // Global Mouse Tracking Effect: all characters track the mouse cursor simultaneously
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!containerRef.current || isDraggingThis) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Sensitivity: within 450px distance, look changes linearly
      const maxDistance = 450;
      const normX = Math.max(-1, Math.min(1, dx / maxDistance));
      const normY = Math.max(-1, Math.min(1, dy / maxDistance));

      // Update spotlight values globally for eye tracking
      spotlightX.set((normX + 1) * 50);
      spotlightY.set((normY + 1) * 50);
    };

    const handleWindowMouseLeave = () => {
      // Reset eyes to look at each other when cursor leaves window/goes idle
      spotlightX.set(50);
      spotlightY.set(50);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseleave', handleWindowMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleWindowMouseLeave);
    };
  }, [isDraggingThis]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    agentSynth.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleCardClick = () => {
    agentSynth.playClick();
    onClick();
  };

  // Shared highly fluid spring transition for expression changes
  const bounceTransition = {
    type: 'spring',
    stiffness: 220,
    damping: 14,
    mass: 0.8
  };

  // --- 3. RENDERIZADO DEL SVG CON CARA VECTORIAL INTERACTIVA ---
  const renderCartoonFace = (cardId) => {
    const styleTag = (
      <style>{`
        @keyframes eye-blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.05); }
        }
        .animate-blink-left {
          animation: eye-blink 4.5s infinite;
          transform-origin: 72px 105px;
        }
        .animate-blink-right {
          animation: eye-blink 4.5s infinite;
          transform-origin: 128px 105px;
        }
        .animate-blink-design-left {
          animation: eye-blink 4.5s infinite;
          transform-origin: 65px 110px;
        }
        .animate-blink-design-right {
          animation: eye-blink 4.5s infinite;
          transform-origin: 135px 110px;
        }
      `}</style>
    );

    const wrapFace = (content) => (
      <motion.g style={{ x: faceX, y: faceY }}>
        {styleTag}
        {content}
      </motion.g>
    );

    switch (cardId) {
      case 'cm': // CM & Publicidad: Headphones + Anime Eyes
        return (
          <svg className="w-full h-full p-6 pt-16 pb-4 select-none animate-fade-in" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {wrapFace(
              <>
                {/* Headphones Accessory */}
                <path d="M 35,85 C 35,25 165,25 165,85" stroke={textColor} strokeWidth="6" fill="none" opacity="0.85" strokeLinecap="round" />
                <rect x="23" y="80" width="14" height="45" rx="7" fill={textColor} opacity="0.85" />
                <rect x="163" y="80" width="14" height="45" rx="7" fill={textColor} opacity="0.85" />

                {/* Eyeballs */}
                <motion.circle cx="72" cy="105" fill="white" animate={{ r: isHovered ? 24 : 20 }} transition={bounceTransition} className="animate-blink-left" />
                <motion.circle cx="128" cy="105" fill="white" animate={{ r: isHovered ? 24 : 20 }} transition={bounceTransition} className="animate-blink-right" />
                
                {/* Pupils with Anime highlights */}
                <motion.g style={{ x: pupilX, y: pupilY }} className="animate-blink-left">
                  <motion.circle cx="72" cy="105" fill={textColor} animate={{ r: isHovered ? 7.5 : 10 }} transition={bounceTransition} />
                  <motion.circle cx="69" cy="101" fill="white" animate={{ r: isHovered ? 2 : 3 }} transition={bounceTransition} />
                  <motion.circle cx="75" cy="109" r="1.5" fill="white" animate={{ opacity: isHovered ? 0 : 0.8 }} transition={bounceTransition} />
                </motion.g>
                <motion.g style={{ x: pupilX, y: pupilY }} className="animate-blink-right">
                  <motion.circle cx="128" cy="105" fill={textColor} animate={{ r: isHovered ? 7.5 : 10 }} transition={bounceTransition} />
                  <motion.circle cx="125" cy="101" fill="white" animate={{ r: isHovered ? 2 : 3 }} transition={bounceTransition} />
                  <motion.circle cx="131" cy="109" r="1.5" fill="white" animate={{ opacity: isHovered ? 0 : 0.8 }} transition={bounceTransition} />
                </motion.g>

                {/* Normal mouth */}
                <motion.path d="M 75,138 Q 100,158 125,138" stroke={textColor} strokeWidth="8" strokeLinecap="round" fill="none" animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.5 : 1 }} transition={bounceTransition} />
                {/* Surprised O mouth */}
                <motion.circle cx="100" cy="148" r="15" stroke={textColor} strokeWidth="8" fill="none" animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.4 }} transition={bounceTransition} />
              </>
            )}
          </svg>
        );
      case 'trends': // Trends: Crown + Looking Right
        return (
          <svg className="w-full h-full p-6 pt-16 pb-4 select-none animate-fade-in" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {wrapFace(
              <>
                {/* Crown Accessory */}
                <motion.g animate={{ y: isHovered ? -5 : 0 }} transition={bounceTransition}>
                  <path d="M 80,50 L 88,32 L 100,45 L 112,32 L 120,50 Z" fill="#FBBF24" stroke={textColor} strokeWidth="4.5" strokeLinejoin="round" />
                  <circle cx="88" cy="32" r="2.5" fill="#FBBF24" stroke={textColor} strokeWidth="1.5" />
                  <circle cx="100" cy="45" r="2.5" fill="#FBBF24" stroke={textColor} strokeWidth="1.5" />
                  <circle cx="112" cy="32" r="2.5" fill="#FBBF24" stroke={textColor} strokeWidth="1.5" />
                </motion.g>

                {/* Eyeballs */}
                <motion.circle cx="72" cy="105" animate={{ r: isHovered ? 24 : 20 }} transition={bounceTransition} fill="white" className="animate-blink-left" />
                <motion.circle cx="128" cy="105" animate={{ r: isHovered ? 24 : 20 }} transition={bounceTransition} fill="white" className="animate-blink-right" />
                {/* Pupils */}
                <motion.circle cx="72" cy="105" animate={{ r: isHovered ? 7.5 : 9.5 }} transition={bounceTransition} fill={textColor} style={{ x: pupilX, y: pupilY }} className="animate-blink-left" />
                <motion.circle cx="128" cy="105" animate={{ r: isHovered ? 7.5 : 9.5 }} transition={bounceTransition} fill={textColor} style={{ x: pupilX, y: pupilY }} className="animate-blink-right" />
                {/* Normal mouth */}
                <motion.path d="M 85,145 L 115,145" stroke={textColor} strokeWidth="8" strokeLinecap="round" animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.5 : 1 }} transition={bounceTransition} />
                {/* Surprised O mouth */}
                <motion.circle cx="100" cy="148" r="15" stroke={textColor} strokeWidth="8" fill="none" animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.4 }} transition={bounceTransition} />
              </>
            )}
          </svg>
        );
      case 'schedule': // Cronograma: Sleep Mask + Looks Left + Sleepy half-shut eyes
        return (
          <svg className="w-full h-full p-6 pt-16 pb-4 select-none animate-fade-in" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {wrapFace(
              <>
                {/* Sleep Mask Accessory on forehead */}
                <motion.g animate={{ y: isHovered ? -5 : 0 }} transition={bounceTransition}>
                  <rect x="55" y="45" width="90" height="26" rx="13" fill={textColor} opacity="0.85" />
                  <path d="M 35,58 L 55,58 M 145,58 L 165,58" stroke={textColor} strokeWidth="3" />
                  <path d="M 75,56 Q 82,62 89,56" stroke={bgStyleColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 111,56 Q 118,62 125,56" stroke={bgStyleColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                </motion.g>

                {/* Eyeballs (morph from scaleY=0.55 sleepy to scaleY=1.2 wide open) */}
                <motion.circle cx="72" cy="105" r="20" fill="white" animate={{ scaleY: isHovered ? 1.2 : 0.55 }} transition={bounceTransition} style={{ transformOrigin: '72px 105px' }} className="animate-blink-left" />
                <motion.circle cx="128" cy="105" r="20" fill="white" animate={{ scaleY: isHovered ? 1.2 : 0.55 }} transition={bounceTransition} style={{ transformOrigin: '128px 105px' }} className="animate-blink-right" />
                {/* Pupils */}
                <motion.circle cx="72" cy="105" r="9.5" fill={textColor} style={{ x: pupilX, y: pupilY }} animate={{ scaleY: isHovered ? 1.2 : 0.55 }} transition={bounceTransition} className="animate-blink-left" />
                <motion.circle cx="128" cy="105" r="9.5" fill={textColor} style={{ x: pupilX, y: pupilY }} animate={{ scaleY: isHovered ? 1.2 : 0.55 }} transition={bounceTransition} className="animate-blink-right" />
                {/* Normal mouth */}
                <motion.path d="M 88,142 Q 100,150 112,142" stroke={textColor} strokeWidth="7" strokeLinecap="round" fill="none" animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.5 : 1 }} transition={bounceTransition} />
                {/* Surprised O mouth */}
                <motion.circle cx="100" cy="148" r="15" stroke={textColor} strokeWidth="8" fill="none" animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.4 }} transition={bounceTransition} />
              </>
            )}
          </svg>
        );
      case 'design': // Estudio de Diseño: Artist Beret + Splats + Winking Left Eye
        return (
          <svg className="w-full h-full p-6 pt-16 pb-4 select-none animate-fade-in" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {wrapFace(
              <>
                {/* Artist Beret Accessory */}
                <motion.g animate={{ y: isHovered ? -4 : 0, rotate: isHovered ? -12 : -15 }} transition={bounceTransition} style={{ transformOrigin: '125px 45px' }}>
                  <ellipse cx="125" cy="45" rx="28" ry="12" fill={textColor} />
                  <path d="M 125,33 Q 128,25 125,22" stroke={textColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                </motion.g>

                {/* Paint Splats on Cheek */}
                <g opacity="0.85">
                  <circle cx="48" cy="138" r="7" fill="#EC4899" />
                  <circle cx="40" cy="144" r="5" fill="#3B82F6" />
                  <circle cx="54" cy="143" r="4.5" fill="#10B981" />
                </g>

                {/* Left Eye: Normal Wink (path) OR Surprised open (circle) */}
                <motion.path d="M 52,100 Q 65,112 78,100" stroke={textColor} strokeWidth="7" strokeLinecap="round" fill="none" animate={{ opacity: isHovered ? 0 : 1 }} transition={bounceTransition} />
                
                <motion.circle cx="65" cy="110" fill="white" animate={{ opacity: isHovered ? 1 : 0, r: isHovered ? 23 : 19 }} transition={bounceTransition} className="animate-blink-design-left" />
                <motion.circle cx="65" cy="110" fill={textColor} style={{ x: pupilX, y: pupilY }} animate={{ opacity: isHovered ? 1 : 0, r: isHovered ? 7.5 : 9 }} transition={bounceTransition} className="animate-blink-design-left" />

                {/* Right Eye: Normal (blinks, expands slightly on hover) */}
                <motion.circle cx="135" cy="110" fill="white" animate={{ r: isHovered ? 23 : 19 }} transition={bounceTransition} className="animate-blink-design-right" />
                <motion.circle cx="135" cy="110" fill={textColor} style={{ x: pupilX, y: pupilY }} animate={{ r: isHovered ? 7.5 : 9 }} transition={bounceTransition} className="animate-blink-design-right" />

                {/* Normal mouth */}
                <motion.path d="M 80,140 Q 102,154 120,138" stroke={textColor} strokeWidth="8" strokeLinecap="round" fill="none" animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.5 : 1 }} transition={bounceTransition} />
                {/* Surprised O mouth */}
                <motion.circle cx="100" cy="148" r="15" stroke={textColor} strokeWidth="8" fill="none" animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.4 }} transition={bounceTransition} />
              </>
            )}
          </svg>
        );
      case 'identity': // Identidad: Reading Glasses + Looks Up-Right
      default:
        return (
          <svg className="w-full h-full p-6 pt-16 pb-4 select-none animate-fade-in" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {wrapFace(
              <>
                {/* Reading Glasses Accessory */}
                <motion.g animate={{ scale: isHovered ? 1.05 : 1 }} transition={bounceTransition} style={{ transformOrigin: '100px 105px' }}>
                  <circle cx="72" cy="105" r="25" stroke={textColor} strokeWidth="4.5" fill="none" />
                  <circle cx="128" cy="105" r="25" stroke={textColor} strokeWidth="4.5" fill="none" />
                  <path d="M 97,105 L 103,105" stroke={textColor} strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M 47,105 L 32,96" stroke={textColor} strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 153,105 L 168,96" stroke={textColor} strokeWidth="3.5" strokeLinecap="round" />
                </motion.g>

                {/* Eyeballs */}
                <motion.circle cx="72" cy="105" animate={{ r: isHovered ? 23 : 19 }} transition={bounceTransition} fill="white" className="animate-blink-left" />
                <motion.circle cx="128" cy="105" animate={{ r: isHovered ? 23 : 19 }} transition={bounceTransition} fill="white" className="animate-blink-right" />
                {/* Pupils */}
                <motion.circle cx="72" cy="105" animate={{ r: isHovered ? 7 : 9 }} transition={bounceTransition} fill={textColor} style={{ x: pupilX, y: pupilY }} className="animate-blink-left" />
                <motion.circle cx="128" cy="105" animate={{ r: isHovered ? 7 : 9 }} transition={bounceTransition} fill={textColor} style={{ x: pupilX, y: pupilY }} className="animate-blink-right" />
                
                {/* Normal mouth */}
                <motion.path d="M 82,145 L 118,145" stroke={textColor} strokeWidth="8" strokeLinecap="round" animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.5 : 1 }} transition={bounceTransition} />
                {/* Surprised O mouth */}
                <motion.circle cx="100" cy="148" r="15" stroke={textColor} strokeWidth="8" fill="none" animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.4 }} transition={bounceTransition} />
              </>
            )}
          </svg>
        );
    }
  };

  const bgStyleColor = cardBackgrounds[card.id] || cardBackgrounds.identity;
  const textColor = textColors[card.id] || textColors.identity;
  const labelColor = labelColors[card.id] || labelColors.identity;
  const statColor = shapeColors[card.id] || shapeColors.identity;

  const isCardDark = card.id === 'trends' || card.id === 'meta' || card.id === 'identity';

  const colClass = cols === 2 ? 'sm:col-span-2 lg:col-span-2 col-span-1' : 'col-span-1';
  const rowClass = rows === 2 ? 'sm:row-span-2 lg:row-span-2 row-span-1' : 'row-span-1';

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
      animate={{ opacity: isDraggingThis ? 0.4 : 1 }}
      className={`agent-card group cursor-pointer hover:cursor-grab active:cursor-grabbing h-full ${colClass} ${rowClass}`}
    >
      <div
        ref={containerRef}
        className={`agent-card-inner h-full w-full rounded-none relative overflow-hidden flex items-center justify-center border transition-colors duration-300`}
        style={{ 
          backgroundColor: bgStyleColor,
          borderColor: isHovered ? hexToRgba(card.color, 0.35) : 'transparent',
          zIndex: isHovered ? 10 : 1
        }}
      >
        {/* Spotlight cursor reflection */}
        <motion.div
          className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(circle 140px at ${x}% ${y}%, rgba(255,255,255,1) 0%, transparent 100%)`
            )
          }}
        />

        {/* Noise Grain Overlay for texture */}
        <div
          className="agent-grain absolute inset-0 rounded-inherit opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.72' type='fractalNoise' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* --- DIALOGO GLOBITO DE PENSAMIENTO EN VIVO (GLASSMORPHIC TOOLTIP) --- */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.85, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="absolute top-4 left-1/2 w-[210px] text-center bg-slate-900/90 border border-white/10 backdrop-blur-md px-3 py-2 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.3)] z-30 pointer-events-none"
            >
              <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-slate-900/90 border-r border-b border-white/10 rotate-45" />
              
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

        {/* Clean Cartoon Geometric Face */}
        <div className="w-full h-full flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105">
          {renderCartoonFace(card.id)}
        </div>

        {/* Swiss Modernist Header - High Legibility */}
        <div 
          className="absolute top-6 left-6 right-6 flex justify-between items-start z-20 pointer-events-none select-none" 
        >
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-title font-black tracking-tight leading-none transition-colors duration-300 drop-shadow-[0_1px_2px_rgba(255,255,255,0.05)]" style={{ color: textColor }}>
              {card.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Premium Red Notification Badge */}
        {hasNotification && (
          <div 
            className="absolute top-16 right-6 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.25)] z-20 flex items-center gap-1 border border-white/10 animate-pulse" 
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>{badgeCount > 0 ? `${badgeCount} NUEVO${badgeCount > 1 ? 'S' : ''}` : '¡NUEVO!'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
