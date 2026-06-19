// src/components/brand/SocialDock.jsx
import React, { useState, useEffect } from 'react';

export const SocialDock = ({ formData = {}, onChange, isAnalyzing }) => {
  const socialPlatforms = [
    {
      id: 'instagram_url',
      label: 'Instagram',
      placeholder: 'instagram.com/usuario',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
      activeStyle: 'border-[#E1306C]/40 bg-[#E1306C]/5 shadow-[0_0_15px_rgba(225,48,108,0.05)]',
      activeText: 'text-[#E1306C]',
    },
    {
      id: 'website_url',
      label: 'Sitio Web',
      placeholder: 'https://ejemplo.com',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
          />
        </svg>
      ),
      activeStyle: 'border-[#4ECDC4]/40 bg-[#4ECDC4]/5 shadow-[0_0_15px_rgba(78,205,196,0.05)]',
      activeText: 'text-[#4ECDC4]',
    },
    {
      id: 'tiktok_url',
      label: 'TikTok',
      placeholder: 'tiktok.com/@usuario',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
          />
        </svg>
      ),
      activeStyle: 'border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.02)]',
      activeText: 'text-white',
    },
    {
      id: 'linkedin_url',
      label: 'LinkedIn',
      placeholder: 'linkedin.com/company/nombre',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      ),
      activeStyle: 'border-[#0A66C2]/40 bg-[#0A66C2]/5 shadow-[0_0_15px_rgba(10,102,194,0.05)]',
      activeText: 'text-[#0A66C2]',
    },
    {
      id: 'facebook_url',
      label: 'Facebook',
      placeholder: 'facebook.com/pagina',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z'
          />
        </svg>
      ),
      activeStyle: 'border-[#1877F2]/40 bg-[#1877F2]/5 shadow-[0_0_15px_rgba(24,119,242,0.05)]',
      activeText: 'text-[#1877F2]',
    },
    {
      id: 'youtube_url',
      label: 'YouTube',
      placeholder: 'youtube.com/@canal',
      icon: (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M9.75 15.02l5.75-3.02-5.75-3.02v6.04z'
          />
        </svg>
      ),
      activeStyle: 'border-[#FF0000]/40 bg-[#FF0000]/5 shadow-[0_0_15px_rgba(255,0,0,0.05)]',
      activeText: 'text-[#FF0000]',
    },
  ];

  const [visiblePlatforms, setVisiblePlatforms] = useState(() => {
    const defaultVisible = ['instagram_url', 'website_url'];
    const extraPlatforms = ['tiktok_url', 'linkedin_url', 'facebook_url', 'youtube_url'];
    const activeExtras = extraPlatforms.filter(id => formData[id] && formData[id].trim() !== '');
    return [...defaultVisible, ...activeExtras];
  });

  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    const extraPlatforms = ['tiktok_url', 'linkedin_url', 'facebook_url', 'youtube_url'];
    const activeExtras = extraPlatforms.filter(id => formData[id] && formData[id].trim() !== '');
    setVisiblePlatforms(prev => {
      const merged = new Set([...prev, ...activeExtras]);
      return Array.from(merged);
    });
  }, [formData]);

  const handleAddPlatform = (id) => {
    if (!visiblePlatforms.includes(id)) {
      setVisiblePlatforms(prev => [...prev, id]);
    }
    setShowAddMenu(false);
  };

  const handleRemovePlatform = (id) => {
    onChange(id, ''); // Limpiar valor en el form
    setVisiblePlatforms(prev => prev.filter(p => p !== id));
  };

  const unusedPlatforms = socialPlatforms.filter(p => !visiblePlatforms.includes(p.id));
  const renderedPlatforms = socialPlatforms.filter(p => visiblePlatforms.includes(p.id));

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3.5 space-y-3.5 shadow-md relative overflow-hidden flex-shrink-0 text-left'>
      <div className='flex items-center justify-between'>
        <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
          <span>🔌</span> Canales de Marca
        </h3>

        {unusedPlatforms.length > 0 && (
          <div className='relative'>
            <button
              type='button'
              disabled={isAnalyzing}
              onClick={() => setShowAddMenu(!showAddMenu)}
              className='text-[9.5px] font-bold text-accent-lavender hover:text-white px-2 py-1 rounded-lg border border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/60 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed'
            >
              + Añadir canal
            </button>

            {showAddMenu && (
              <div className='absolute right-0 mt-1.5 w-32 rounded-xl bg-slate-950 border border-white/10 p-1.5 z-40 shadow-2xl animate-fade-in text-left'>
                {unusedPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    type='button'
                    onClick={() => handleAddPlatform(platform.id)}
                    className='w-full text-left px-2 py-1.5 text-[10px] text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all font-semibold'
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {renderedPlatforms.map((platform) => {
          const value = formData[platform.id] || '';
          const isConnected = value.trim().length > 0;
          const isDefault = platform.id === 'instagram_url' || platform.id === 'website_url';

          return (
            <div
              key={platform.id}
              className={`rounded-xl border transition-all duration-200 p-2 flex items-center gap-2 relative group/item ${
                isConnected
                  ? platform.activeStyle
                  : 'border-border-subtle bg-surface-strong/20 hover:border-white/10'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg bg-black/35 ${
                  isConnected ? platform.activeText : 'text-text-muted'
                }`}
              >
                {platform.icon}
              </div>

              <div className='flex-1 space-y-0.5 min-w-0 pr-4'>
                <div className='flex items-center gap-1 justify-between'>
                  <span className='text-[9.5px] font-bold uppercase tracking-wider text-text-primary truncate'>
                    {platform.label}
                  </span>
                </div>
                <input
                  type='text'
                  value={value}
                  onChange={(e) => onChange(platform.id, e.target.value)}
                  placeholder={platform.placeholder}
                  disabled={isAnalyzing}
                  className='w-full bg-transparent p-0 text-[11px] text-white placeholder-text-secondary border-none focus:ring-0 focus:outline-none truncate disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                />
              </div>

              {/* Botón de eliminación para canales opcionales (no fijos) */}
              {!isDefault && !isAnalyzing && (
                <button
                  type='button'
                  onClick={() => handleRemovePlatform(platform.id)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-75 hover:!opacity-100 text-text-muted hover:text-red-400 text-[10px] font-bold transition-all p-1 cursor-pointer select-none'
                  title={`Eliminar canal de ${platform.label}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
