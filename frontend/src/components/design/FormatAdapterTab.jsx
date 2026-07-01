import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentDuplicateIcon,
  SparklesIcon,
  PhotoIcon,
  ArrowPathIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../hooks';
import { CyberButton, Card, CardContent } from '../ui';

export const FormatAdapterTab = ({
  uploadedPostImage,
  adapting,
  analysis,
  adaptedFormats,
  adapterError,
  setPreviewImage,
  selectedRatios,
  setSelectedRatios,
  adaptationMode,
  setAdaptationMode,
  handleAdaptFormats,
  handleDownload
}) => {
  const { t } = useLanguage();
  const [showAnalysis, setShowAnalysis] = useState(false);

  const aspectRatios = [
    { id: '1:1', name: '1:1', label: t.design.ratioSquare },
    { id: '9:16', name: '9:16', label: t.design.ratioStories },
    { id: '16:9', name: '16:9', label: t.design.ratioBanner },
    { id: '4:5', name: '4:5', label: t.design.ratioPortrait },
    { id: '4:3', name: '4:3', label: t.design.ratioStandard }
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel de control izquierdo para configurar la adaptación */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[360px] flex-shrink-0"
        >
          <Card className="border border-border-subtle bg-surface-strong/50 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-accent-violet/10 to-accent-rose/5 border-b border-border-subtle flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-accent-violet/20 text-accent-violet flex items-center justify-center">
                <DocumentDuplicateIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-wide uppercase leading-none">{t.design.adapter}</h2>
                <span className="text-[9px] text-text-muted font-bold tracking-wider uppercase mt-1 block">{t.design.multiRatioDesign}</span>
              </div>
            </div>

            <CardContent className="p-5 flex flex-col gap-5">
              {/* Mini visualizador de post activo */}
              <div className="flex items-center gap-3 bg-surface/30 p-2.5 rounded-xl border border-border-subtle/50">
                <img
                  src={uploadedPostImage}
                  alt="Mini post"
                  className="w-12 h-12 rounded-lg object-cover border border-border-strong bg-black/40"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-extrabold tracking-widest text-accent-rose uppercase">{t.design.activePost}</span>
                  <span className="text-[10px] font-bold text-white truncate max-w-[180px]">{t.design.referenceImage}</span>
                </div>
              </div>

              {/* Método de Adaptación */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                  {t.design.adaptationMethod}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'recompose', label: t.design.recreatePost, icon: SparklesIcon, desc: t.design.recomposeDesc },
                    { id: 'padding', label: t.design.smartPadding, icon: PhotoIcon, desc: t.design.paddingDesc }
                  ].map((mode) => {
                    const IconComponent = mode.icon;
                    const isSel = adaptationMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setAdaptationMode(mode.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSel
                            ? 'border-accent-violet/60 bg-accent-violet/10 text-white'
                            : 'border-border-subtle bg-surface/30 text-text-muted hover:text-text-primary hover:border-border-strong'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 mb-1 ${isSel ? 'text-accent-violet' : 'text-text-muted'}`} />
                        <span className="text-[10px] font-bold">{mode.label}</span>
                        <span className="text-[7.5px] opacity-75 leading-tight mt-0.5 max-w-[120px] break-words">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formatos a Generar */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                  {t.design.targetFormats}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {aspectRatios.map((ratio) => {
                    const isSelected = selectedRatios.includes(ratio.id);
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRatios(selectedRatios.filter(r => r !== ratio.id));
                          } else {
                            setSelectedRatios([...selectedRatios, ratio.id]);
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

              {/* Submit button */}
              <CyberButton
                variant="glow"
                size="md"
                onClick={handleAdaptFormats}
                disabled={adapting || selectedRatios.length === 0}
                className="w-full mt-2 font-title font-black uppercase text-xs tracking-wider"
              >
                {adapting ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                    {t.design.adaptingFormats}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-yellow-300" />
                    {t.design.adaptFormatsBtn}
                  </span>
                )}
              </CyberButton>

              {adapterError && (
                <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg p-2.5 text-center">
                  {adapterError}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Panel de Análisis Vision (Colapsable) */}
          {analysis && (
            <div className="mt-4">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-strong/30 text-xs font-bold text-text-secondary hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-accent-rose animate-pulse" />
                  <span>{t.design.visualAnalysisDiag}</span>
                </div>
                {showAnalysis ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              
              {showAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <Card className="border border-border-subtle bg-surface-strong/20 rounded-xl overflow-hidden">
                    <CardContent className="p-4 flex flex-col gap-3.5 text-[10.5px]">
                      <div>
                        <span className="text-[8px] font-black uppercase text-accent-violet tracking-wide">{t.design.focusIdentity}</span>
                        <p className="text-text-muted mt-1 leading-relaxed">{analysis.product}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-accent-violet tracking-wide">{t.design.creativeDirection}</span>
                        <p className="text-text-muted mt-1 leading-relaxed">{analysis.style}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-accent-violet tracking-wide">{t.design.replicatedBackground}</span>
                        <p className="text-text-muted mt-1 leading-relaxed">{analysis.background}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-accent-violet tracking-wide">{t.design.registeredTexts}</span>
                        <p className="text-emerald-400 font-mono mt-1 leading-relaxed">"{analysis.text}"</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Grid de variantes */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col gap-6 min-w-0"
        >
          <Card className="border border-border-subtle bg-surface-strong/30 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden flex-1 flex flex-col">
            <div className="px-5 py-3.5 border-b border-border-subtle bg-black/[0.15] flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-accent-violet" />
              <h3 className="text-xs font-black tracking-widest text-text-secondary uppercase">{t.design.adaptedVariations}</h3>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-center bg-black/20">
              {uploadedPostImage ? (
                <div className="flex flex-col gap-5">
                  <p className="text-[10px] text-text-muted font-bold tracking-wide uppercase">
                    {t.design.adaptedFormatsHelp || 'La IA ha generado tu diseño adaptado en los siguientes formatos:'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aspectRatios.map((format) => {
                      const url = adaptedFormats[format.id];
                      const isSelected = selectedRatios.includes(format.id);
                      const isGenerating = adapting && isSelected && !url;

                      return (
                        <div key={format.id} className="flex flex-col gap-2">
                          <div className="flex justify-between items-baseline px-1">
                            <span className="text-[10px] font-black uppercase text-white truncate max-w-[140px]">{format.name}</span>
                            <span className="text-[9px] font-bold text-text-muted">{format.label}</span>
                          </div>
                          <div className={`rounded-xl border border-border-strong bg-black/40 overflow-hidden relative group flex items-center justify-center w-full ${
                            format.id === '9:16' ? 'aspect-[9/16]' :
                            format.id === '16:9' ? 'aspect-[16/9]' :
                            format.id === '4:5' ? 'aspect-[4/5]' :
                            format.id === '4:3' ? 'aspect-[4/3]' : 'aspect-square'
                          }`}>
                            {url ? (
                              <>
                                <img
                                  src={url}
                                  alt={format.name}
                                  className="w-full h-full object-cover cursor-zoom-in"
                                  onClick={() => setPreviewImage({ url, name: format.name, ratio: format.id })}
                                />
                                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 z-20">
                                  <button
                                    onClick={() => setPreviewImage({ url, name: format.name, ratio: format.id })}
                                    className="px-3 py-1.5 rounded-lg bg-accent-violet hover:bg-accent-violet/85 text-white flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider shadow-md cursor-pointer transition-all hover:scale-105"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    <span>{t.design.previewBtn || 'Previsualizar'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(url, format.id.replace(':', '-'))}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider shadow-md cursor-pointer transition-all hover:scale-105"
                                  >
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                    <span>{t.design.downloadShort}</span>
                                  </button>
                                </div>
                              </>
                            ) : isGenerating ? (
                              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                                <ArrowPathIcon className="w-5 h-5 animate-spin text-accent-violet" />
                                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{t.design.generatingState}</span>
                              </div>
                            ) : !isSelected ? (
                              <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-text-muted/40 select-none">
                                <XMarkIcon className="w-5.5 h-5.5 text-border-subtle" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted/65">{t.design.notRequestedState}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 p-4 text-center text-text-muted">
                                <PhotoIcon className="w-6 h-6 text-border-subtle" />
                                <span className="text-[9px] font-bold uppercase">{t.design.waitingState}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted min-h-[300px]">
                  <PhotoIcon className="w-12 h-12 text-border-strong mb-3" />
                  <span className="text-xs font-black uppercase text-text-secondary">{t.design.noActiveImage}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FormatAdapterTab;
