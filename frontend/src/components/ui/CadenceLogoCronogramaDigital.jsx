import React from 'react';
import { motion } from 'framer-motion';

export const CadenceLogoCronogramaDigital = ({ 
  className = "w-10 h-10", 
  startColor = "#A78BFA", 
  endColor = "#6366F1",
  animated = false
}) => {
  return (
    <motion.svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animated ? { rotate: -45, scale: 0.85 } : {}}
      animate={animated ? { rotate: 0, scale: 1 } : {}}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id="react-logo-grad-chrono" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="50%" stopColor={endColor} />
          <stop offset="100%" stopColor={startColor} />
        </linearGradient>
        <filter id="react-logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Thin translucent backing path (draws first) */}
      <motion.path 
        d="M72,28 A35,35 0 1,0 72,72" 
        stroke="url(#react-logo-grad-chrono)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : { opacity: 0.25 }}
        animate={animated ? { pathLength: 1, opacity: 0.25 } : {}}
        transition={{ duration: 1.0, ease: "easeOut" }}
      />

      {/* 2. Dotted outer circle path (staggered dot drawing) */}
      <motion.path 
        d="M72,28 A35,35 0 1,0 72,72" 
        stroke="url(#react-logo-grad-chrono)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeDasharray="1 14" 
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : {}}
        animate={animated ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.3, ease: "easeInOut", delay: 0.1 }}
      />

      {/* 3. Middle vertical bars (fly in from below, spin 180 degrees, and bounce) */}
      {/* Bar 1 */}
      <motion.rect 
        x="32" 
        y="44" 
        width="5.5" 
        height="14" 
        rx="2.5" 
        fill={startColor} 
        initial={animated ? { y: 45, opacity: 0, rotate: -180 } : {}}
        animate={animated ? { y: 0, opacity: 1, rotate: 0 } : {}}
        transition={animated ? { 
          type: "spring", 
          stiffness: 110, 
          damping: 12, 
          delay: 0.35 
        } : {}}
        style={{ transformOrigin: "34.75px 51px" }}
      />

      {/* Bar 2 (Central Tallest) */}
      <motion.rect 
        x="42.5" 
        y="34" 
        width="5.5" 
        height="34" 
        rx="2.5" 
        fill={endColor} 
        initial={animated ? { y: 55, opacity: 0, rotate: 180 } : {}}
        animate={animated ? { y: 0, opacity: 1, rotate: 0 } : {}}
        transition={animated ? { 
          type: "spring", 
          stiffness: 110, 
          damping: 12, 
          delay: 0.45 
        } : {}}
        style={{ transformOrigin: "45.25px 51px" }}
      />

      {/* Bar 3 */}
      <motion.rect 
        x="53" 
        y="39" 
        width="5.5" 
        height="24" 
        rx="2.5" 
        fill={startColor} 
        opacity="0.9" 
        initial={animated ? { y: 50, opacity: 0, rotate: -180 } : {}}
        animate={animated ? { y: 0, opacity: 0.9, rotate: 0 } : {}}
        transition={animated ? { 
          type: "spring", 
          stiffness: 110, 
          damping: 12, 
          delay: 0.55 
        } : {}}
        style={{ transformOrigin: "55.75px 51px" }}
      />

      {/* Bar 4 */}
      <motion.rect 
        x="63.5" 
        y="46" 
        width="5.5" 
        height="10" 
        rx="2.5" 
        fill={endColor} 
        opacity="0.65" 
        initial={animated ? { y: 40, opacity: 0, rotate: 180 } : {}}
        animate={animated ? { y: 0, opacity: 0.65, rotate: 0 } : {}}
        transition={animated ? { 
          type: "spring", 
          stiffness: 110, 
          damping: 12, 
          delay: 0.65 
        } : {}}
        style={{ transformOrigin: "66.25px 51px" }}
      />

      {/* 4. Glowing Circle Terminals (fly out from center in orbit and breathe) */}
      {/* Top Glow Terminal */}
      <motion.circle 
        cx="72.5" 
        cy="27.5" 
        r="5" 
        fill={startColor} 
        filter="url(#react-logo-glow)" 
        initial={animated ? { x: -30, y: 22.5, scale: 0, opacity: 0 } : {}}
        animate={animated ? { 
          x: 0, 
          y: 0, 
          scale: 1, 
          opacity: [1, 0.6, 1] 
        } : {}}
        transition={animated ? {
          x: { type: "spring", stiffness: 90, damping: 11, delay: 0.75 },
          y: { type: "spring", stiffness: 90, damping: 11, delay: 0.75 },
          scale: { type: "spring", stiffness: 90, damping: 11, delay: 0.75 },
          opacity: { repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1.8 }
        } : {}}
        style={{ transformOrigin: "72.5px 27.5px" }}
      />

      {/* Bottom Glow Terminal */}
      <motion.circle 
        cx="72.5" 
        cy="72.5" 
        r="5" 
        fill={endColor} 
        filter="url(#react-logo-glow)" 
        initial={animated ? { x: -30, y: -22.5, scale: 0, opacity: 0 } : {}}
        animate={animated ? { 
          x: 0, 
          y: 0, 
          scale: 1, 
          opacity: [1, 0.6, 1] 
        } : {}}
        transition={animated ? {
          x: { type: "spring", stiffness: 90, damping: 11, delay: 0.85 },
          y: { type: "spring", stiffness: 90, damping: 11, delay: 0.85 },
          scale: { type: "spring", stiffness: 90, damping: 11, delay: 0.85 },
          opacity: { repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1.9 }
        } : {}}
        style={{ transformOrigin: "72.5px 72.5px" }}
      />
    </motion.svg>
  );
};
