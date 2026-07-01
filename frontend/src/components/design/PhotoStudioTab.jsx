import React from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../hooks';
import { CyberButton, Card, CardContent } from '../ui';
import { STYLE_TEMPLATES, ASPECT_RATIO_CLASSES } from './constants.js';
import ImageComparisonSlider from './ImageComparisonSlider.jsx';

export const PhotoStudioTab = ({
  uploadedImage,
  prompt,
  setPrompt,
  selectedAspectRatios,
  setSelectedAspectRatios,
  generating,
  generatedImage,
  setGeneratedImage,
  generatedStudioImages,
  activePreviewRatio,
  setActivePreviewRatio,
  transformError,
  sliderPosition,
  setSliderPosition,
  handleApplyTemplate,
  handleGeneratePhoto,
  handleDownload
}) => {
  const { t } = useLanguage();

  const aspectRatios = [
    { id: '1:1', name: '1:1', label: t.design.ratioSquare },
    { id: '9:16', name: '9:16', label: t.design.ratioStories },
    { id: '16:9', name: '16:9', label: t.design.ratioBanner },
    { id: '4:5', name: '4:5', label: t.design.ratioPortrait },
    { id: '4:3', name: '4:3', label: t.design.ratioStandard }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ESTUDIO DE FOTOS: PANEL DE CONTROLES */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-5"
      >
        <Card className="border border-border-subtle bg-surface-strong/50 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-accent-violet/10 to-accent-rose/5 border-b border-border-subtle flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-accent-violet/20 text-accent-violet flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-wide uppercase leading-none">{t.design.creativeStudio}</h2>
                <span className="text-[9px] text-text-muted font-bold tracking-wider uppercase mt-1 block">{t.design.premiumPhotosIa}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-5 flex flex-col gap-5">
            {/* Mini visualizador de producto activo */}
            <div className="flex items-center gap-3 bg-surface/30 p-2.5 rounded-xl border border-border-subtle/50">
              <img
                src={uploadedImage}
                alt="Mini producto"
                className="w-12 h-12 rounded-lg object-cover border border-border-strong bg-black/40"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-extrabold tracking-widest text-accent-violet uppercase">{t.design.activeProduct}</span>
                <span className="text-[10px] font-bold text-white truncate max-w-[180px]">{t.design.referenceImage}</span>
              </div>
            </div>

            {/* Formatos de Aspecto */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                {t.design.proportionsToGenerate}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aspectRatios.map((ratio) => {
                  const isSelected = selectedAspectRatios.includes(ratio.id);
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (selectedAspectRatios.length > 1) {
                            setSelectedAspectRatios(selectedAspectRatios.filter(r => r !== ratio.id));
                          }
                        } else {
                          setSelectedAspectRatios([...selectedAspectRatios, ratio.id]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'border-accent-violet bg-accent-violet/10 text-white font-bold'
                          : 'border-border-subtle bg-surface hover:border-border-strong text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="text-xs font-black">{ratio.name}</span>
                      <span className="text-[8px] opacity-75">{ratio.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Describe la Locación / Idea */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                {t.design.backgroundOrScenario}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.design.promptInputPlaceholder}
                className="w-full min-h-[90px] text-xs p-3 rounded-xl bg-surface-soft border border-border-subtle focus:border-accent-violet focus:ring-1 focus:ring-accent-violet text-white outline-none resize-none placeholder:text-text-muted/65 leading-relaxed"
              />
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {STYLE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2 py-1 rounded-lg bg-surface border border-border-subtle hover:border-accent-violet/30 text-[9px] font-bold text-text-secondary hover:text-white transition-colors cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Advertencia sutil */}
            <div className="text-[9.5px] leading-relaxed text-text-muted bg-white/5 rounded-xl p-3">
              {t.design.geminiWarning}
            </div>

            {/* Submit button */}
            <CyberButton
              variant="glow"
              size="lg"
              onClick={handleGeneratePhoto}
              disabled={generating}
              className="w-full mt-1 font-title font-black uppercase text-xs tracking-wider"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                  {t.design.generatingWithIa}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <SparklesIcon className="w-4.5 h-4.5 text-yellow-300" />
                  {t.design.generateStudioPhotoBtn}
                </span>
              )}
            </CyberButton>

            {transformError && (
              <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg p-2.5 text-center">
                {transformError}
              </span>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ESTUDIO DE FOTOS: VISOR COMPARATIVO */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col gap-6 min-w-0"
      >
        <Card className="border border-border-subtle bg-surface-strong/30 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[420px]">
          <div className="px-5 py-3.5 border-b border-border-subtle flex justify-between items-center bg-black/[0.15]">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-accent-rose" />
              <h3 className="text-xs font-black tracking-widest text-text-secondary uppercase">{t.design.studioCanvas}</h3>
            </div>
          </div>

          {Object.keys(generatedStudioImages).length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-border-subtle bg-black/[0.1] items-center">
              <span className="text-[9px] font-black uppercase text-text-muted tracking-wider mr-2">{t.design.generatedFormats}</span>
              {Object.keys(generatedStudioImages).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => {
                    setActivePreviewRatio(ratio);
                    setGeneratedImage(generatedStudioImages[ratio]);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                    activePreviewRatio === ratio
                      ? 'bg-accent-violet/20 border-accent-violet text-white shadow-sm'
                      : 'bg-surface/30 hover:bg-surface border-border-subtle text-text-muted hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black/20">
            {generating ? (
              <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-violet/20 to-accent-rose/10 blur-lg" />
                  <div className="w-full h-full rounded-full border-2 border-white/5 border-t-accent-violet animate-spin" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-black uppercase text-white tracking-widest">{t.design.generatingImageTitle}</span>
                  <span className="text-[9.5px] text-text-muted font-bold tracking-wide uppercase text-center max-w-[280px]">{t.design.generatingImageDesc}</span>
                </div>
              </div>
            ) : (generatedImage) ? (
              <ImageComparisonSlider
                uploadedImage={uploadedImage}
                currentGeneratedUrl={generatedImage}
                activePreviewRatio={activePreviewRatio}
                sliderPosition={sliderPosition}
                setSliderPosition={setSliderPosition}
                handleDownload={handleDownload}
              />
            ) : (
              <div className="w-full max-w-[400px] aspect-square rounded-2xl border border-border-subtle bg-surface overflow-hidden relative p-4 flex items-center justify-center">
                <img src={uploadedImage} alt="Preview" className="max-h-[300px] object-contain rounded-xl" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-5 text-center">
                  <span className="text-[10px] font-black uppercase text-accent-violet">{t.design.readyToProcess}</span>
                  <p className="text-[9.5px] text-text-muted mt-1 font-bold uppercase">{t.design.clickToStart}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PhotoStudioTab;
