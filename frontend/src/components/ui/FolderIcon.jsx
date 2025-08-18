import React from 'react';
import {
  PhotoIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  BriefcaseIcon,
  PaintBrushIcon,
  ChartBarIcon,
  FolderIcon as HeroFolderIcon,
  // Iconos adicionales para carpetas personalizadas
  CogIcon,
  HeartIcon,
  StarIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  CameraIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  HomeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const ICON_MAP = {
  // Iconos predefinidos
  'photo': PhotoIcon,
  'document-text': DocumentTextIcon,
  'clipboard-document': ClipboardDocumentIcon,
  'briefcase': BriefcaseIcon,
  'paint-brush': PaintBrushIcon,
  'chart-bar': ChartBarIcon,
  'folder': HeroFolderIcon,
  
  // Iconos adicionales para carpetas personalizadas
  'cog': CogIcon,
  'heart': HeartIcon,
  'star': StarIcon,
  'lightbulb': LightBulbIcon,
  'music': MusicalNoteIcon,
  'video': VideoCameraIcon,
  'book': BookOpenIcon,
  'currency': CurrencyDollarIcon,
  'scale': ScaleIcon,
  'wrench': WrenchScrewdriverIcon,
  'camera': CameraIcon,
  'megaphone': MegaphoneIcon,
  'academic': AcademicCapIcon,
  'home': HomeIcon,
  'globe': GlobeAltIcon
};

export const FolderIcon = ({ 
  iconType = 'folder', 
  className = 'h-8 w-8', 
  gradient = 'from-gray-400 to-slate-500',
  withGlow = false,
  animated = false 
}) => {
  const IconComponent = ICON_MAP[iconType] || HeroFolderIcon;
  
  return (
    <div className={`relative ${animated ? 'transition-all duration-300' : ''}`}>
      <IconComponent 
        className={`${className} bg-gradient-to-br ${gradient} bg-clip-text text-transparent ${
          withGlow ? 'drop-shadow-sm' : ''
        }`}
        style={{
          filter: withGlow ? `drop-shadow(0 0 8px ${gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.3)' : 'rgba(59, 130, 246, 0.3)'})` : 'none'
        }}
      />
      
      {/* Glow effect adicional para modo hover */}
      {withGlow && (
        <div 
          className="absolute inset-0 opacity-30 blur-md -z-10"
          style={{
            background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
          }}
        >
          <IconComponent className={className} />
        </div>
      )}
    </div>
  );
};

// Componente para mostrar todos los iconos disponibles (útil para selección)
export const FolderIconPicker = ({ selectedIcon, onSelect, className = '' }) => {
  const availableIcons = Object.keys(ICON_MAP);
  
  return (
    <div className={`grid grid-cols-6 gap-2 ${className}`}>
      {availableIcons.map((iconType) => (
        <button
          key={iconType}
          type="button"
          onClick={() => onSelect(iconType)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            selectedIcon === iconType
              ? 'bg-primary-500/20 ring-2 ring-primary-500/50'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <FolderIcon 
            iconType={iconType} 
            className="h-6 w-6"
            gradient="from-cyan-400 to-blue-500"
          />
        </button>
      ))}
    </div>
  );
};

// Lista de iconos disponibles para export
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);