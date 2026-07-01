// src/components/brand/ColorPaletteWidget.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../hooks';

export const ColorPaletteWidget = ({
  colorPalette = [],
  onAddColor,
  onRemoveColor,
  onUpdateColor,
  isAnalyzing,
  consistencyScore,
}) => {
  const { t } = useLanguage();
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingHex, setEditingHex] = useState('');

  const handleCopyColor = (hexColor) => {
    navigator.clipboard.writeText(hexColor);
    toast.success(t.brand.copiedHexToast.replace('{hex}', hexColor), { id: 'copy-color-toast' });
  };

  const handleColorChange = (e) => {
    const selectedColor = e.target.value;
    if (selectedColor) {
      onAddColor(selectedColor);
      // Reset color input value to allow selecting the same color again if deleted
      e.target.value = '#000000';
    }
  };

  // Default elegant palette if none exists yet
  const displayPalette = colorPalette.length > 0 ? colorPalette : ['#7C5CFC', '#4ECDC4', '#FFFFFF'];

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface-strong/40 p-3 space-y-2.5 relative overflow-visible flex-shrink-0 shadow-sm min-h-[76px]'>
      {/* Background soft lighting effect */}
      <div className='absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#7C5CFC]/5 blur-2xl pointer-events-none' />

      <div className='flex items-center justify-between gap-4'>
        <div className='text-left space-y-0.5'>
          <h5 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
            <span>🎨</span> {t.brand.colorPaletteTitle}
          </h5>
          <p className='text-[9px] text-text-muted leading-none'>
            {t.brand.colorPaletteDesc}
          </p>
        </div>

        {/* Dynamic Aesthetic vibe tags */}
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          {consistencyScore !== undefined && consistencyScore !== null ? (
            <div className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider border ${
              consistencyScore >= 90
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              📊 {t.brand.consistencyDiagnosis}: {consistencyScore}%
            </div>
          ) : (
            <div className='px-2 py-0.5 rounded-lg text-[8.5px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-text-secondary'>
              ✨ {t.brand.activeIdentity}
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2 pt-0.5'>
        {/* Color swatches */}
        {displayPalette.map((color, idx) => (
          <div
            key={`${color}-${idx}`}
            className='relative group flex items-center gap-1.5'
          >
            {/* Color swatch button */}
            <button
              type='button'
              disabled={isAnalyzing}
              onClick={() => {
                setEditingIdx(editingIdx === idx ? null : idx);
                setEditingHex(color);
              }}
              onDoubleClick={() => handleCopyColor(color)}
              style={{ backgroundColor: color }}
              className='h-8 w-8 rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3)] cursor-pointer active:scale-95 transition-all duration-200 focus:outline-none relative flex items-center justify-center hover:scale-105'
              title={`${t.brand.editColorHelp}: ${color}`}
            >
              {/* Tooltip showing hex on hover */}
              {editingIdx !== idx && (
                <span className='absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-black/90 backdrop-blur-[2px] text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 shadow-lg whitespace-nowrap transition-transform duration-200 pointer-events-none z-30'>
                  {t.brand.editingLabel}: {color}
                </span>
              )}
            </button>

            {/* SLEEK FLOATING EDIT POPOVER */}
            {editingIdx === idx && (
              <div className='absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-[#0c0c16] border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2 z-40 shadow-2xl animate-fade-in w-48 text-left'>
                <div className='flex items-center justify-between border-b border-white/5 pb-1.5'>
                  <span className='text-[8.5px] font-black uppercase text-text-muted tracking-wider'>{t.brand.editColorLabel}</span>
                  <button
                    type='button'
                    onClick={() => setEditingIdx(null)}
                    className='text-text-muted hover:text-white text-[9px] font-bold px-1'
                  >
                    ✕
                  </button>
                </div>

                <div className='flex items-center gap-2'>
                  <div
                    style={{ backgroundColor: editingHex }}
                    className='h-7 w-7 rounded-full border border-white/20 shadow-inner flex-shrink-0'
                  />
                  <div className='relative flex-1'>
                    <input
                      type='color'
                      id={`popover-picker-${idx}`}
                      value={editingHex}
                      onChange={(e) => setEditingHex(e.target.value.toUpperCase())}
                      className='sr-only'
                    />
                    <label
                      htmlFor={`popover-picker-${idx}`}
                      className='w-full h-7 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all select-none'
                    >
                      {t.brand.paletteSelector}
                    </label>
                  </div>
                </div>

                <div className='flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl px-2 py-1'>
                  <span className='text-text-muted font-mono text-[10px] font-bold select-none'>#</span>
                  <input
                    type='text'
                    value={editingHex.replace('#', '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingHex('#' + val.toUpperCase());
                    }}
                    placeholder='FFFFFF'
                    maxLength={6}
                    className='w-full bg-transparent p-0 text-[10.5px] font-mono text-white border-none focus:ring-0 focus:outline-none'
                  />
                </div>

                <div className='flex gap-1.5 pt-1'>
                  <button
                    type='button'
                    onClick={() => {
                      onUpdateColor(editingIdx, editingHex);
                      setEditingIdx(null);
                    }}
                    className='flex-1 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-sm'
                  >
                    {t.common.save}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      onRemoveColor(editingHex);
                      setEditingIdx(null);
                    }}
                    className='h-6 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[9px] font-bold transition-all'
                  >
                    {t.common.delete}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add custom color button */}
        {!isAnalyzing && (
          <div className='relative flex items-center'>
            <input
              type='color'
              id='palette-color-picker'
              className='sr-only'
              onChange={handleColorChange}
              disabled={isAnalyzing}
            />
            <label
              htmlFor='palette-color-picker'
              className='h-8 px-3 rounded-full border border-dashed border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/60 hover:border-white/15 text-text-muted hover:text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-inner'
            >
              <span>+</span>
              <span>{t.brand.colorAdd}</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
