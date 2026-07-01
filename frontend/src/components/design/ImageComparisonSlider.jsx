import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ASPECT_RATIO_CLASSES } from './constants.js';

export const ImageComparisonSlider = ({
  uploadedImage,
  currentGeneratedUrl,
  activePreviewRatio,
  sliderPosition,
  setSliderPosition,
  handleDownload
}) => {
  return (
    <div className={`w-full max-w-[440px] ${ASPECT_RATIO_CLASSES[activePreviewRatio] || 'aspect-square'} rounded-2xl border border-border-strong overflow-hidden relative shadow-2xl bg-black/40`}>
      {/* Imagen antes */}
      <img src={uploadedImage} alt="Original" className="w-full h-full object-cover" />
      {/* Imagen después */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img src={currentGeneratedUrl} alt="AI Generated" className="w-full h-full object-cover" />
      </div>
      {/* Slider input */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
      />
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl font-bold text-xs select-none">
          ↔
        </div>
      </div>

      <span className="absolute bottom-4 left-4 px-2 py-1 rounded bg-accent-violet/90 text-[9px] font-bold uppercase tracking-wider text-white z-35">
        Stock IA ({activePreviewRatio})
      </span>
      <span className="absolute bottom-4 right-4 px-2 py-1 rounded bg-black/70 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white z-35">
        Antes
      </span>

      {/* Botón de descarga de la foto de stock generada */}
      <button
        onClick={() => handleDownload(currentGeneratedUrl, activePreviewRatio.replace(':', '-'))}
        className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 hover:bg-black/90 text-white border border-white/10 transition-colors z-30 cursor-pointer"
        title="Descargar Foto"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ImageComparisonSlider;
