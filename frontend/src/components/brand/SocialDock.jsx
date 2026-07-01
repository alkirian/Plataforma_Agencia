// src/components/brand/SocialDock.jsx
import React, { useState } from 'react';
import { useLanguage } from '../../hooks';

export const SocialDock = ({ formData = {}, onChange, isAnalyzing }) => {
  const { t } = useLanguage();
  const [activePlatformId, setActivePlatformId] = useState(null);
  const [tempUrl, setTempUrl] = useState('');

  const socialPlatforms = [
    {
      id: 'instagram_url',
      label: 'Instagram',
      placeholder: 'instagram.com/usuario',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
      activeColor: 'text-[#E1306C] bg-[#E1306C]/10 border-[#E1306C]/40 shadow-[0_0_12px_rgba(225,48,108,0.2)]',
      hoverColor: 'hover:text-[#E1306C] hover:bg-[#E1306C]/5 hover:border-[#E1306C]/20',
    },
    {
      id: 'website_url',
      label: t.brand.sitioWebLabel || 'Sitio Web',
      placeholder: 'https://ejemplo.com',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
          />
        </svg>
      ),
      activeColor: 'text-[#4ECDC4] bg-[#4ECDC4]/10 border-[#4ECDC4]/40 shadow-[0_0_12px_rgba(78,205,196,0.2)]',
      hoverColor: 'hover:text-[#4ECDC4] hover:bg-[#4ECDC4]/5 hover:border-[#4ECDC4]/20',
    },
    {
      id: 'tiktok_url',
      label: 'TikTok',
      placeholder: 'tiktok.com/@usuario',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
          />
        </svg>
      ),
      activeColor: 'text-white bg-white/10 border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.1)]',
      hoverColor: 'hover:text-white hover:bg-white/5 hover:border-white/20',
    },
    {
      id: 'linkedin_url',
      label: 'LinkedIn',
      placeholder: 'linkedin.com/company/nombre',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      ),
      activeColor: 'text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/40 shadow-[0_0_12px_rgba(10,102,194,0.2)]',
      hoverColor: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:border-[#0A66C2]/20',
    },
    {
      id: 'facebook_url',
      label: 'Facebook',
      placeholder: 'facebook.com/pagina',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z'
          />
        </svg>
      ),
      activeColor: 'text-[#1877F2] bg-[#1877F2]/10 border-[#1877F2]/40 shadow-[0_0_12px_rgba(24,119,242,0.2)]',
      hoverColor: 'hover:text-[#1877F2] hover:bg-[#1877F2]/5 hover:border-[#1877F2]/20',
    },
    {
      id: 'youtube_url',
      label: 'YouTube',
      placeholder: 'youtube.com/@canal',
      icon: (
        <svg className='w-4.5 h-4.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9.75 15.02l5.75-3.02-5.75-3.02v6.04z'
          />
        </svg>
      ),
      activeColor: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/40 shadow-[0_0_12px_rgba(255,0,0,0.2)]',
      hoverColor: 'hover:text-[#FF0000] hover:bg-[#FF0000]/5 hover:border-[#FF0000]/20',
    },
  ];

  const handleOpenPopover = (platform) => {
    setActivePlatformId(platform.id);
    setTempUrl(formData[platform.id] || '');
  };

  const handleSave = () => {
    if (activePlatformId) {
      onChange(activePlatformId, tempUrl.trim());
      setActivePlatformId(null);
    }
  };

  const handleDisconnect = () => {
    if (activePlatformId) {
      onChange(activePlatformId, '');
      setActivePlatformId(null);
    }
  };

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3.5 space-y-2.5 shadow-md relative overflow-visible flex-shrink-0 text-left'>
      <div className='flex items-center justify-between'>
        <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5 select-none'>
          <span>🔌</span> {t.brand.brandChannelsTitle || 'Canales de Marca'}
        </h3>
      </div>

      <div className='flex flex-wrap items-center gap-3.5 py-1 justify-start'>
        {socialPlatforms.map((platform) => {
          const currentUrl = formData[platform.id] || '';
          const isConnected = currentUrl.trim().length > 0;
          const isPopoverOpen = activePlatformId === platform.id;

          return (
            <div key={platform.id} className='relative'>
              {/* Badge Button */}
              <button
                type='button'
                disabled={isAnalyzing}
                onClick={() => handleOpenPopover(platform)}
                className={`h-11 w-11 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none relative ${
                  isConnected
                    ? platform.activeColor
                    : 'border-border-subtle bg-surface-strong/20 text-text-muted hover:scale-105 ' + platform.hoverColor
                }`}
                title={`${platform.label}: ${isConnected ? currentUrl : 'Desconectado'}`}
              >
                {platform.icon}
                {/* Visual indicator (connected dot) */}
                {isConnected && (
                  <span className='absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#0d0d1e] animate-pulse' />
                )}
              </button>

              {/* URL Popover */}
              {isPopoverOpen && (
                <div className='absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-[#0c0c16] border border-white/10 rounded-2xl p-3 flex flex-col gap-2.5 z-50 shadow-2xl animate-fade-in w-56 text-left'>
                  <div className='flex items-center justify-between border-b border-white/5 pb-1.5'>
                    <span className='text-[9px] font-black uppercase text-text-muted tracking-wider'>
                      Conectar {platform.label}
                    </span>
                    <button
                      type='button'
                      onClick={() => setActivePlatformId(null)}
                      className='text-text-muted hover:text-white text-[9.5px] font-bold px-1 select-none'
                    >
                      ✕
                    </button>
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='text-[8.5px] font-black uppercase text-text-secondary tracking-widest px-0.5'>
                      Enlace / URL
                    </label>
                    <input
                      type='text'
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder={platform.placeholder}
                      className='w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent-lavender font-medium'
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setActivePlatformId(null);
                      }}
                    />
                  </div>

                  <div className='flex gap-1.5 pt-1'>
                    <button
                      type='button'
                      onClick={handleSave}
                      className='flex-grow h-7 rounded-lg bg-[#7C5CFC] hover:bg-[#6b4dfc] text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer'
                    >
                      {t.common.save || 'Conectar'}
                    </button>
                    {isConnected && (
                      <button
                        type='button'
                        onClick={handleDisconnect}
                        className='h-7 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[9px] font-bold transition-all cursor-pointer'
                      >
                        {t.common.delete || 'Borrar'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
