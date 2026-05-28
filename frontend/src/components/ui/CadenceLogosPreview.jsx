import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Configuración de Paletas de Colores de Gradientes
const COLOR_PRESETS = {
  violet: {
    name: 'Royal Frequency',
    start: '#A78BFA',
    end: '#6366F1',
    glow: 'rgba(167, 139, 250, 0.4)',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
  },
  cyan: {
    name: 'Cyber Pulse',
    start: '#67E8F9',
    end: '#3B82F6',
    glow: 'rgba(103, 232, 249, 0.4)',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  },
  sunset: {
    name: 'Sunset Tempo',
    start: '#F59E0B',
    end: '#EC4899',
    glow: 'rgba(245, 158, 11, 0.4)',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  },
  emerald: {
    name: 'Forest Cadence',
    start: '#10B981',
    end: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
};

// ----------------------------------------------------------------------
// COMPONENTES DE LOGOS EN REACT JSX (EVITAN EL PARPADEO POR RECREACIÓN DOM)
// ----------------------------------------------------------------------

const Logo1Wave = ({ colors, strokeWidth, showGrids }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 md:w-36 md:h-36 drop-shadow-lg filter transition-transform duration-300 hover:scale-105 active:scale-95">
    <defs>
      <linearGradient id="logo1-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.start} />
        <stop offset="100%" stopColor={colors.end} />
      </linearGradient>
      <linearGradient id="logo1-grad-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={colors.start} stopOpacity={0.8} />
        <stop offset="100%" stopColor={colors.end} stopOpacity={0.15} />
      </linearGradient>
      <filter id="logo1-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {showGrids && (
      <>
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 4" />
      </>
    )}
    <path 
      d="M72,24 C54,10 24,18 18,44 C12,70 26,86 54,80 C68,77 74,68 74,68" 
      stroke="url(#logo1-grad-secondary)" 
      strokeWidth={strokeWidth + 2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <path 
      d="M68,30 C54,18 30,22 24,46 C18,70 32,80 58,74 C70,71 76,56 76,56" 
      stroke="url(#logo1-grad-primary)" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="76" cy="56" r="6.5" fill={colors.start} filter="url(#logo1-glow)" />
  </svg>
);

const Logo2Loop = ({ colors, strokeWidth, showGrids }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 md:w-36 md:h-36 drop-shadow-lg filter transition-transform duration-300 hover:scale-105 active:scale-95">
    <defs>
      <linearGradient id="logo2-grad-main" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={colors.end} />
        <stop offset="50%" stopColor={colors.start} />
        <stop offset="100%" stopColor={colors.start} />
      </linearGradient>
      <linearGradient id="logo2-grad-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.start} />
        <stop offset="100%" stopColor={colors.end} />
      </linearGradient>
    </defs>
    {showGrids && (
      <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 4" />
    )}
    <path 
      d="M68,32 C55,18 35,18 24,35 C13,52 16,72 32,80 C48,88 68,75 72,60" 
      stroke="#000000" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      opacity="0.18" 
      transform="translate(0, 3)"
      fill="none"
    />
    <path 
      d="M68,32 C55,18 35,18 24,35 C13,52 16,72 32,80 C48,88 68,75 72,60 C74,52 66,45 58,50" 
      stroke="url(#logo2-grad-main)" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M48,70 C58,74 72,66 76,50 C80,34 68,22 52,22 C40,22 30,30 28,40" 
      stroke="url(#logo2-grad-overlay)" 
      strokeWidth={Math.max(4, strokeWidth - 4)} 
      strokeLinecap="round"
      opacity="0.95"
      fill="none"
    />
  </svg>
);

const Logo3Chrono = ({ colors, strokeWidth, showGrids }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 md:w-36 md:h-36 drop-shadow-lg filter transition-transform duration-300 hover:scale-105 active:scale-95">
    <defs>
      <linearGradient id="logo3-grad-chrono" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.start} />
        <stop offset="50%" stopColor={colors.end} />
        <stop offset="100%" stopColor={colors.start} />
      </linearGradient>
      <filter id="logo3-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {showGrids && (
      <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
    )}
    <path 
      d="M72,28 A35,35 0 1,0 72,72" 
      stroke="url(#logo3-grad-chrono)" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeDasharray="1 14"
      fill="none"
    />
    <path 
      d="M72,28 A35,35 0 1,0 72,72" 
      stroke="url(#logo3-grad-chrono)" 
      strokeWidth="3" 
      strokeLinecap="round" 
      opacity="0.25"
      fill="none"
    />
    <rect x="32" y="44" width="5.5" height="14" rx="2.5" fill={colors.start} />
    <rect x="42.5" y="34" width="5.5" height="34" rx="2.5" fill={colors.end} />
    <rect x="53" y="39" width="5.5" height="24" rx="2.5" fill={colors.start} opacity="0.9" />
    <rect x="63.5" y="46" width="5.5" height="10" rx="2.5" fill={colors.end} opacity="0.65" />
    <circle cx="72.5" cy="27.5" r="5" fill={colors.start} filter="url(#logo3-glow)" />
    <circle cx="72.5" cy="72.5" r="5" fill={colors.end} filter="url(#logo3-glow)" />
  </svg>
);

const Logo4Spark = ({ colors, strokeWidth, showGrids }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 md:w-36 md:h-36 drop-shadow-lg filter transition-transform duration-300 hover:scale-105 active:scale-95">
    <defs>
      <linearGradient id="logo4-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.start} />
        <stop offset="100%" stopColor={colors.end} />
      </linearGradient>
      <linearGradient id="logo4-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={colors.start} stopOpacity={0.8} />
        <stop offset="100%" stopColor={colors.end} stopOpacity={0.2} />
      </linearGradient>
      <filter id="logo4-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {showGrids && (
      <>
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
      </>
    )}
    <path 
      d="M72,25 C56,10 32,12 20,28 C8,44 8,68 22,80 C36,92 60,90 74,77" 
      stroke="url(#logo4-grad-1)" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M66,35 C52,24 35,28 28,42 C21,56 26,70 38,74" 
      stroke="url(#logo4-grad-2)" 
      strokeWidth={Math.max(3, strokeWidth - 5)} 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M72,50 C62,50 60,48 60,38 C60,48 58,50 48,50 C58,50 60,52 60,62 C60,52 62,50 72,50 Z" 
      fill={colors.start} 
      filter="url(#logo4-glow)"
      opacity="0.95"
    />
    <path 
      d="M72,50 C62,50 60,48 60,38 C60,48 58,50 48,50 C58,50 60,52 60,62 C60,52 62,50 72,50 Z" 
      fill="#FFFFFF" 
    />
    <circle cx="34" cy="24" r="2.5" fill={colors.start} />
  </svg>
);

export const CadenceLogosPreview = () => {
  const [activePreset, setActivePreset] = useState('violet');
  const [bgType, setBgType] = useState('dark-grad'); // dark-grad, deep-slate, solid-white, glass
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [showGrids, setShowGrids] = useState(true);

  const colors = COLOR_PRESETS[activePreset];

  // Helper para copiar al portapapeles
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado con éxito!`, {
      style: {
        background: '#1F2937',
        color: '#F9FAFB',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600'
      }
    });
  };

  // Helper para generar el código SVG puro para exportar/copiar
  const getRawSvgCode = (logoId) => {
    switch (logoId) {
      case 'rhythmic-wave':
        return `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logo1-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" />
      <stop offset="100%" stop-color="${colors.end}" />
    </linearGradient>
    <linearGradient id="logo1-grad-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${colors.end}" stop-opacity="0.15" />
    </linearGradient>
    <filter id="logo1-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <path d="M72,24 C54,10 24,18 18,44 C12,70 26,86 54,80 C68,77 74,68 74,68" stroke="url(#logo1-grad-secondary)" stroke-width="${strokeWidth + 2}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M68,30 C54,18 30,22 24,46 C18,70 32,80 58,74 C70,71 76,56 76,56" stroke="url(#logo1-grad-primary)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="76" cy="56" r="6.5" fill="${colors.start}" filter="url(#logo1-glow)" />
</svg>`;
      case 'infinite-loop':
        return `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logo2-grad-main" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.end}" />
      <stop offset="50%" stop-color="${colors.start}" />
      <stop offset="100%" stop-color="${colors.start}" />
    </linearGradient>
    <linearGradient id="logo2-grad-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" />
      <stop offset="100%" stop-color="${colors.end}" />
    </linearGradient>
  </defs>
  <path d="M68,32 C55,18 35,18 24,35 C13,52 16,72 32,80 C48,88 68,75 72,60" stroke="#000000" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.18" transform="translate(0, 3)" />
  <path d="M68,32 C55,18 35,18 24,35 C13,52 16,72 32,80 C48,88 68,75 72,60 C74,52 66,45 58,50" stroke="url(#logo2-grad-main)" stroke-width="${strokeWidth}" stroke-linecap="round" />
  <path d="M48,70 C58,74 72,66 76,50 C80,34 68,22 52,22 C40,22 30,30 28,40" stroke="url(#logo2-grad-overlay)" stroke-width="${Math.max(4, strokeWidth - 4)}" stroke-linecap="round" opacity="0.95" />
</svg>`;
      case 'chrono-timeline':
        return `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logo3-grad-chrono" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" />
      <stop offset="50%" stop-color="${colors.end}" />
      <stop offset="100%" stop-color="${colors.start}" />
    </linearGradient>
    <filter id="logo3-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <path d="M72,28 A35,35 0 1,0 72,72" stroke="url(#logo3-grad-chrono)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="1 14" />
  <path d="M72,28 A35,35 0 1,0 72,72" stroke="url(#logo3-grad-chrono)" stroke-width="3" stroke-linecap="round" opacity="0.25" />
  <rect x="32" y="44" width="5.5" height="14" rx="2.5" fill="${colors.start}" />
  <rect x="42.5" y="34" width="5.5" height="34" rx="2.5" fill="${colors.end}" />
  <rect x="53" y="39" width="5.5" height="24" rx="2.5" fill="${colors.start}" opacity="0.9" />
  <rect x="63.5" y="46" width="5.5" height="10" rx="2.5" fill="${colors.end}" opacity="0.65" />
  <circle cx="72.5" cy="27.5" r="5" fill="${colors.start}" filter="url(#logo3-glow)" />
  <circle cx="72.5" cy="72.5" r="5" fill="${colors.end}" filter="url(#logo3-glow)" />
</svg>`;
      case 'creative-spark':
        return `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logo4-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" />
      <stop offset="100%" stop-color="${colors.end}" />
    </linearGradient>
    <linearGradient id="logo4-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.start}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${colors.end}" stop-opacity="0.2" />
    </linearGradient>
    <filter id="logo4-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <path d="M72,25 C56,10 32,12 20,28 C8,44 8,68 22,80 C36,92 60,90 74,77" stroke="url(#logo4-grad-1)" stroke-width="${strokeWidth}" stroke-linecap="round" />
  <path d="M66,35 C52,24 35,28 28,42 C21,56 26,70 38,74" stroke="url(#logo4-grad-2)" stroke-width="${Math.max(3, strokeWidth - 5)}" stroke-linecap="round" />
  <path d="M72,50 C62,50 60,48 60,38 C60,48 58,50 48,50 C58,50 60,52 60,62 C60,52 62,50 72,50 Z" fill="${colors.start}" filter="url(#logo4-glow)" opacity="0.95" />
  <path d="M72,50 C62,50 60,48 60,38 C60,48 58,50 48,50 C58,50 60,52 60,62 C60,52 62,50 72,50 Z" fill="#FFFFFF" />
  <circle cx="34" cy="24" r="2.5" fill="${colors.start}" />
</svg>`;
      default:
        return '';
    }
  };

  // Helper para generar el componente React listo para usar
  const getReactComponentCode = (logoName, rawCode) => {
    return `import React from 'react';

export const CadenceLogo${logoName} = ({ 
  className = "w-10 h-10", 
  startColor = "${colors.start}", 
  endColor = "${colors.end}" 
}) => {
  return (
    ${rawCode.replace(/url\(#logo\d/g, 'url(#react-logo')
            .replace(/id="logo\d/g, 'id="react-logo')
            .replace(new RegExp(colors.start, 'g'), '{startColor}')
            .replace(new RegExp(colors.end, 'g'), '{endColor}')
            .replace('className="w-32 h-32 md:w-36 md:h-36 drop-shadow-lg filter transition-transform duration-300 hover:scale-105 active:scale-95"', 'className={className}')}
  );
};`;
  };

  // Estilos de Background en el Playground
  const getBgStyle = () => {
    switch (bgType) {
      case 'dark-grad':
        return 'bg-gradient-to-br from-[#0D0F1E] via-[#080912] to-[#040409] border border-white/5';
      case 'deep-slate':
        return 'bg-[#0B0F19] border border-white/5';
      case 'solid-white':
        return 'bg-[#F9FAFB] border border-gray-200';
      case 'glass':
        return 'bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-glass';
      default:
        return 'bg-[#0B0F19]';
    }
  };

  const isLight = bgType === 'solid-white';

  const logoOptions = [
    {
      id: 'rhythmic-wave',
      title: 'Onda Armónica',
      subtitle: 'Rhythmic Flow',
      description: 'Representa ritmo, fluidez digital y la frecuencia constante de ideas, contenido y sincronización con el cliente. Su trazado simula una letra "C" orgánica nacida de dos ondas en fase.',
      renderSvg: () => <Logo1Wave colors={colors} strokeWidth={strokeWidth} showGrids={showGrids} />
    },
    {
      id: 'infinite-loop',
      title: 'Bucle Infinito',
      subtitle: 'Infinite Beat',
      description: 'Simboliza la mejora continua, la retroalimentación sin fin y los flujos integrados de automatización. Dos lazos que se cruzan con sombras 3D y forman un contorno premium de la letra "C".',
      renderSvg: () => <Logo2Loop colors={colors} strokeWidth={strokeWidth} showGrids={showGrids} />
    },
    {
      id: 'chrono-timeline',
      title: 'Cronograma Digital',
      subtitle: 'Chrono Beat',
      description: 'Inspirado en la naturaleza organizadora de Cadence: los calendarios editoriales, los plazos de entrega y la sincronización. La C se forma mediante hitos discretos y barras radiales de volumen.',
      renderSvg: () => <Logo3Chrono colors={colors} strokeWidth={strokeWidth} showGrids={showGrids} />
    },
    {
      id: 'creative-spark',
      title: 'Destello Creativo',
      subtitle: 'Creative Spark',
      description: 'Orientado al impacto estelar y la chispa creadora de las agencias. Una estructura curva y afilada que envuelve un destello resplandeciente en el corazón geométrico de la marca Cadence.',
      renderSvg: () => <Logo4Spark colors={colors} strokeWidth={strokeWidth} showGrids={showGrids} />
    }
  ];

  return (
    <div className="w-full space-y-8 font-sans antialiased text-text-primary p-1">
      {/* Cabecera Interactiva */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-accent-violet">Brand Assets</span>
          <h2 className="text-2xl font-black tracking-tight font-title text-text-primary mt-1">
            Propuestas de Logotipos SVG para Cadence
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Diseños vectoriales modernos y premium, optimizados para fondos oscuros y claros con variables de color integradas.
          </p>
        </div>

        {/* Selector de Presets de Color */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-soft/40 p-1.5 rounded-2xl border border-white/5 self-start">
          {Object.entries(COLOR_PRESETS).map(([key, value]) => {
            const isSelected = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePreset(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isSelected 
                    ? 'bg-surface border border-border-strong text-text-primary shadow-sm scale-[1.02]' 
                    : 'text-text-muted hover:text-text-primary border border-transparent'
                }`}
              >
                <div 
                  className="w-3.5 h-3.5 rounded-full transition-transform duration-300" 
                  style={{ 
                    background: `linear-gradient(135deg, ${value.start}, ${value.end})`,
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
                <span>{value.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controles de Vista Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface/30 p-4 rounded-2xl border border-border-subtle">
        {/* Fondo de Vista */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Fondo de Visualización</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'dark-grad', label: 'Grad', title: 'Gradiente Oscuro' },
              { id: 'deep-slate', label: 'Slate', title: 'Pizarra Profunda' },
              { id: 'glass', label: 'Glass', title: 'Efecto Cristal' },
              { id: 'solid-white', label: 'Claro', title: 'Fondo Blanco' }
            ].map(bg => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBgType(bg.id)}
                title={bg.title}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-black tracking-tight border transition-all ${
                  bgType === bg.id 
                    ? 'bg-text-primary text-app-bg border-text-primary shadow-sm'
                    : 'bg-transparent text-text-muted hover:text-text-primary border-border-subtle'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ancho del Trazo */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Grosor de Línea</label>
            <span className="text-xs font-bold text-accent-cyan">{strokeWidth}px</span>
          </div>
          <input 
            type="range" 
            min="6" 
            max="14" 
            step="1"
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-full h-1 bg-surface-strong rounded-lg appearance-none cursor-pointer accent-accent-cyan"
          />
        </div>

        {/* Guías Geométricas */}
        <div className="space-y-2 flex flex-col justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">Configuración Visual</label>
          <button
            type="button"
            onClick={() => setShowGrids(!showGrids)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-150 ${
              showGrids 
                ? 'bg-accent-violet/10 text-accent-violet border-accent-violet/30' 
                : 'bg-transparent text-text-muted border-border-subtle'
            }`}
          >
            {showGrids ? 'Ocultar Guías de Trazado' : 'Mostrar Guías de Trazado'}
          </button>
        </div>
      </div>

      {/* Grid de Propuestas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {logoOptions.map((logo, idx) => {
          const rawSvg = getRawSvgCode(logo.id);
          const reactCode = getReactComponentCode(logo.title.replace(' ', ''), rawSvg);
          
          return (
            <motion.div
              key={logo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="flex flex-col bg-surface/50 border border-border-subtle rounded-3xl overflow-hidden shadow-soft hover:shadow-halo transition-all duration-300"
            >
              {/* Visualizador del SVG */}
              <div className={`aspect-video flex items-center justify-center p-8 transition-all duration-300 relative ${getBgStyle()}`}>
                {/* Marca de Agua con ÍNDICE */}
                <div className={`absolute top-4 left-4 text-[42px] font-black font-title select-none leading-none pointer-events-none opacity-[0.03] ${isLight ? 'text-black' : 'text-white'}`}>
                  0{idx + 1}
                </div>

                {/* El SVG renderizado en vivo */}
                {logo.renderSvg()}

                {/* Tag del Gradient Activo */}
                <div className={`absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border backdrop-blur-md ${colors.badge}`}>
                  {colors.name}
                </div>
              </div>

              {/* Ficha Técnica y Explicación */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black font-title text-text-primary flex items-center gap-2">
                      <span className="text-accent-violet">Propuesta {idx + 1}:</span> {logo.title}
                    </h3>
                    <span className="text-xs font-semibold text-text-muted italic">{logo.subtitle}</span>
                  </div>
                  <p className="text-text-muted text-[13px] leading-relaxed mt-2">
                    {logo.description}
                  </p>
                </div>

                {/* Acciones de Copiado / Integración */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(rawSvg, 'Código SVG')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-surface hover:bg-surface-strong text-text-primary border border-border-subtle transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copiar SVG Puro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(reactCode, 'Componente React (JSX)')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-accent-violet to-brand-500 hover:from-accent-violet/90 hover:to-brand-500/90 text-white shadow-md transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Copiar React JSX</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Guía de Integración Rápida */}
      <div className="bg-surface/30 border border-border-subtle p-6 rounded-3xl space-y-4">
        <h4 className="font-title font-black text-sm text-text-primary flex items-center gap-2">
          <span className="text-accent-cyan">★</span> Guía Rápida de Aplicación
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-muted leading-relaxed">
          <div className="space-y-1">
            <span className="font-extrabold text-text-primary block">¿Cómo reemplazar el logo actual?</span>
            <p>
              Abre el componente <span className="text-accent-violet">Sidebar.jsx</span>, ubica la zona del logo de Cadence (línea 87) y sustituye la caja de texto <span className="font-mono text-[11px] bg-surface px-1 py-0.5 rounded">{"C"}</span> por uno de estos SVGs o importa el componente React correspondiente.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-extrabold text-text-primary block">Diseño Adaptativo</span>
            <p>
              Todos los SVGs están diseñados en una cuadrícula de 100x100 píxeles con coordenadas relativas, lo que significa que escalarán perfectamente a cualquier tamaño usando propiedades CSS estándares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
