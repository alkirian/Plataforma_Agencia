import React, { useState } from 'react';
import { apiFetch } from '../../api/apiFetch.js';
import { useQuery } from '@tanstack/react-query';
import { getClientById } from '../../api/clients';
import { PaintBrushIcon, DocumentDuplicateIcon, ArrowUpTrayIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PhotoStudioTab from './PhotoStudioTab.jsx';
import FormatAdapterTab from './FormatAdapterTab.jsx';
import PreviewModal from './PreviewModal.jsx';
import { useLanguage } from '../../hooks';
import { compressBrandLogo } from '../../utils/imageCompressor';

export const DesignSection = ({ clientId }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState('upload'); // 'upload' | 'select_action' | 'workspace'
  const [activeTab, setActiveTab] = useState('transform'); // 'transform' | 'adapter'

  const [sourceImage, setSourceImage] = useState(null);
  
  // --- 1. ESTADO DE ESTUDIO DE FOTOS (TRANSFORM) ---
  const [uploadedBgImage, setUploadedBgImage] = useState(null);
  const [uploadedSubjectImage, setUploadedSubjectImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [selectedAspectRatios, setSelectedAspectRatios] = useState(['1:1']);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedStudioImages, setGeneratedStudioImages] = useState({});
  const [activePreviewRatio, setActivePreviewRatio] = useState('1:1');
  const [transformError, setTransformError] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [aiEngine, setAiEngine] = useState('gemini'); // Default to gemini (Google Imagen 4 / nanobanana)

  // --- 2. ESTADO DE ADAPTADOR DE FORMATOS (GENERATIVO DIRECTO) ---
  const [adapting, setAdapting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [adaptedFormats, setAdaptedFormats] = useState({
    '1:1': null,
    '9:16': null,
    '16:9': null,
    '4:5': null,
    '4:3': null
  });
  const [adapterError, setAdapterError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // { url, name, ratio }
  const [layers, setLayers] = useState(null); // { texts: [], logo: {} }
  const [selectedRatios, setSelectedRatios] = useState(['1:1', '9:16', '16:9', '4:5', '4:3']);
  const [adaptationMode, setAdaptationMode] = useState('recompose'); // 'recompose' | 'padding'
  const [adapterAiEngine, setAdapterAiEngine] = useState('gemini'); // 'gemini' | 'fal-flux'

  // Obtener información del cliente
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId).then(res => res.data),
    enabled: !!clientId
  });

  const clientName = client?.name || t.design.clientFallback || 'Cliente';

  // --- CONTROLADORES DE ARCHIVOS ---
  const handleSourceFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressBrandLogo(file, 1200, 0.85);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result);
        setStep('select_action');
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
        setAnalysis(null);
        setAdaptedFormats({
          '1:1': null,
          '9:16': null,
          '16:9': null,
          '4:5': null,
          '4:3': null
        });
        setAdapterError(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error al comprimir la imagen de origen, usando la original:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result);
        setStep('select_action');
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
        setAnalysis(null);
        setAdaptedFormats({
          '1:1': null,
          '9:16': null,
          '16:9': null,
          '4:5': null,
          '4:3': null
        });
        setAdapterError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressBrandLogo(file, 1200, 0.85);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBgImage(reader.result);
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error al comprimir la imagen de fondo, usando la original:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBgImage(reader.result);
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubjectFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressBrandLogo(file, 1200, 0.85);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedSubjectImage(reader.result);
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error al comprimir la imagen de objeto, usando la original:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedSubjectImage(reader.result);
        setGeneratedImage(null);
        setGeneratedStudioImages({});
        setTransformError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setStep('upload');
    setUploadedBgImage(null);
    setUploadedSubjectImage(null);
    setGeneratedImage(null);
    setGeneratedStudioImages({});
    setPrompt('');
    setTransformError(null);
    setAnalysis(null);
    setAdaptedFormats({
      '1:1': null,
      '9:16': null,
      '16:9': null,
      '4:5': null,
      '4:3': null
    });
    setAdapterError(null);
  };

  const handleApplyTemplate = (tmpl) => {
    setPrompt(`En ${tmpl.prompt}`);
  };

  const handleUseDemo = (demo) => {
    setSourceImage(demo.thumbnail);
    setPrompt(demo.prompt);
    setStep('select_action');
    setGeneratedImage(null);
    setGeneratedStudioImages({});
    setTransformError(null);
  };

  const handleGeneratePhoto = async () => {
    if (!prompt.trim()) {
      setTransformError(t.design.promptRequired);
      return;
    }
    if (selectedAspectRatios.length === 0) {
      setTransformError(t.design.ratioRequired);
      return;
    }

    setGenerating(true);
    setTransformError(null);
    setGeneratedImage(null);
    setGeneratedStudioImages({});

    try {
      const res = await apiFetch(`/clients/${clientId}/design/transform-product`, {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: sourceImage || null,
          bgImageUrl: uploadedBgImage || null,
          subjectImageUrl: uploadedSubjectImage || null,
          prompt: prompt.trim(),
          aspectRatios: selectedAspectRatios,
          aiEngine
        })
      });

      if (res.success && res.data) {
        const returnedUrls = res.data.urls || {};
        setGeneratedStudioImages(returnedUrls);
        const firstRatio = selectedAspectRatios[0] || (Object.keys(returnedUrls).length > 0 ? Object.keys(returnedUrls)[0] : '1:1');
        setGeneratedImage(returnedUrls[firstRatio] || res.data.url);
        setActivePreviewRatio(firstRatio);
      } else {
        throw new Error(res.error || t.design.generateError);
      }
    } catch (err) {
      console.error(err);
      setTransformError(err.message || t.design.connectionError);
    } finally {
      setGenerating(false);
    }
  };

  const handleAdaptFormats = async () => {
    if (selectedRatios.length === 0) {
      setAdapterError(t.design.ratioRequiredAdapter);
      return;
    }
    setAdapting(true);
    setAdapterError(null);
    setAnalysis(null);
    setLayers(null);
    setAdaptedFormats({
      '1:1': null,
      '9:16': null,
      '16:9': null,
      '4:5': null,
      '4:3': null
    });

    try {
      const res = await apiFetch(`/clients/${clientId}/design/adapt-formats`, {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: sourceImage,
          selectedRatios: selectedRatios,
          adaptationMode,
          aiEngine: adapterAiEngine
        })
      });

      if (res.success && res.data) {
        setAnalysis(res.data.analysis);
        setAdaptedFormats(res.data.formats || {});
        setLayers(res.data.layers || null);
      } else {
        throw new Error(res.error || t.design.adaptFailed);
      }
    } catch (err) {
      console.error(err);
      setAdapterError(err.message || t.design.adaptError);
    } finally {
      setAdapting(false);
    }
  };

  const handleDownload = async (url, ratioLabel) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${clientName}-post-${ratioLabel}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // --- RENDERING ESTADOS ---
  if (step === 'upload') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto h-full overflow-y-auto font-sans select-none text-text-primary">
        <div className="w-full flex flex-col items-center justify-center text-center max-w-lg mb-8 animate-fade-in">
          <span className="text-[10px] font-extrabold tracking-widest text-accent-violet uppercase">{t.design.creativeStudioIa}</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mt-2">{t.design.uploadYourImage}</h2>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            {t.design.uploadDesc}
          </p>
        </div>

        <label className="w-full aspect-video md:aspect-[21/9] flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-accent-violet/50 rounded-2xl p-8 cursor-pointer bg-surface-strong/20 hover:bg-surface-soft/10 transition-all group">
          <ArrowUpTrayIcon className="w-10 h-10 text-text-muted group-hover:text-accent-violet transition-colors mb-3 animate-pulse" />
          <span className="text-sm font-black text-text-primary">{t.design.dragDropOrExplore}</span>
          <span className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-wider">{t.design.supportedFormats}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleSourceFileChange}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  if (step === 'select_action') {
    return (
      <div className="flex-1 flex flex-col lg:flex-row gap-10 items-center justify-center p-8 max-w-5xl mx-auto h-full overflow-y-auto font-sans select-none text-text-primary">
        {/* Vista previa de imagen subida */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3">
          <span className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">{t.design.uploadedImageLabel}</span>
          <div className="rounded-2xl border border-border-strong bg-black/40 overflow-hidden relative p-4 flex items-center justify-center aspect-square max-h-[400px]">
            <img src={sourceImage} alt="Preview" className="max-h-[360px] object-contain rounded-xl shadow-2xl" />
          </div>
          <button
            onClick={handleReset}
            className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest text-center mt-1 cursor-pointer transition-colors"
          >
            {t.design.uploadAnother}
          </button>
        </div>

        {/* Panel de elección de acción */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-accent-violet uppercase">{t.design.creativeStudio}</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mt-1.5">{t.design.whatToDo}</h2>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setActiveTab('transform');
                setStep('workspace');
              }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border-subtle bg-surface-strong/45 hover:bg-surface-strong/80 hover:border-accent-violet/60 transition-all text-left cursor-pointer group shadow-lg animate-slide-up"
            >
              <div className="p-3 rounded-xl bg-accent-violet/10 text-accent-violet group-hover:bg-accent-violet/20 transition-all">
                <PaintBrushIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-black text-white uppercase tracking-wider">{t.design.createStudioPhoto}</span>
                <span className="text-[10px] text-text-muted leading-relaxed">
                  {t.design.createStudioPhotoDesc}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('adapter');
                setStep('workspace');
              }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border-subtle bg-surface-strong/45 hover:bg-surface-strong/80 hover:border-accent-violet/60 transition-all text-left cursor-pointer group shadow-lg animate-slide-up [animation-delay:100ms]"
            >
              <div className="p-3 rounded-xl bg-accent-rose/10 text-accent-rose group-hover:bg-accent-rose/20 transition-all">
                <DocumentDuplicateIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-black text-white uppercase tracking-wider">{t.design.adaptToNetworks}</span>
                <span className="text-[10px] text-text-muted leading-relaxed">
                  {t.design.adaptToNetworksDesc}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'workspace'
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto h-full overflow-y-auto select-none font-sans text-text-primary">
      {/* Sidebar de Navegación Lateral Izquierda */}
      <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4">
        {/* Panel de Título */}
        <div className="p-4.5 rounded-2xl border border-border-subtle bg-surface-strong/35 backdrop-blur-md flex flex-col gap-1.5">
          <span className="text-[9px] font-extrabold tracking-widest text-accent-violet uppercase">{t.design.contentDesign}</span>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">{t.design.aiStudio}</h2>
          <button
            onClick={handleReset}
            className="mt-2 w-full p-2 text-center rounded-xl bg-white/5 border border-border-subtle text-[10px] font-black uppercase text-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {t.design.changeImage}
          </button>
        </div>

        {/* Botones de Navegación */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-3">
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all text-left group cursor-pointer relative overflow-hidden backdrop-blur-md w-full ${
              activeTab === 'transform'
                ? 'bg-accent-violet/10 border-accent-violet/60 shadow-[0_0_20px_rgba(124,92,252,0.12)]'
                : 'bg-surface-strong/35 border-border-subtle hover:bg-surface-strong/50 hover:border-border-strong'
            }`}
          >
            {activeTab === 'transform' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-violet rounded-l-2xl" />
            )}
            <div className={`p-2.5 rounded-xl transition-all ${
              activeTab === 'transform' 
                ? 'bg-accent-violet/20 text-accent-violet' 
                : 'bg-surface/60 text-text-muted group-hover:text-text-primary'
            }`}>
              <PaintBrushIcon className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-xs font-black uppercase tracking-wider ${
                activeTab === 'transform' ? 'text-white' : 'text-text-secondary'
              }`}>
                {t.design.tabStudio}
              </span>
              <span className="text-[9px] text-text-muted font-bold tracking-wide uppercase leading-tight mt-0.5">
                {t.design.productPhotos}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('adapter')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all text-left group cursor-pointer relative overflow-hidden backdrop-blur-md w-full ${
              activeTab === 'adapter'
                ? 'bg-accent-violet/10 border-accent-violet/60 shadow-[0_0_20px_rgba(124,92,252,0.12)]'
                : 'bg-surface-strong/35 border-border-subtle hover:bg-surface-strong/50 hover:border-border-strong'
            }`}
          >
            {activeTab === 'adapter' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-violet rounded-l-2xl" />
            )}
            <div className={`p-2.5 rounded-xl transition-all ${
              activeTab === 'adapter' 
                ? 'bg-accent-violet/20 text-accent-violet' 
                : 'bg-surface/60 text-text-muted group-hover:text-text-primary'
            }`}>
              <DocumentDuplicateIcon className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-xs font-black uppercase tracking-wider ${
                activeTab === 'adapter' ? 'text-white' : 'text-text-secondary'
              }`}>
                {t.design.tabAdapter}
              </span>
              <span className="text-[9px] text-text-muted font-bold tracking-wide uppercase leading-tight mt-0.5">
                {t.design.multiFormatPost}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Área de Trabajo de Diseño */}
      <div className="flex-1 min-w-0 animate-fade-in">
        {activeTab === 'transform' ? (
          <PhotoStudioTab
            uploadedImage={sourceImage}
            setUploadedImage={setSourceImage}
            uploadedBgImage={uploadedBgImage}
            setUploadedBgImage={setUploadedBgImage}
            uploadedSubjectImage={uploadedSubjectImage}
            setUploadedSubjectImage={setUploadedSubjectImage}
            prompt={prompt}
            setPrompt={setPrompt}
            selectedAspectRatios={selectedAspectRatios}
            setSelectedAspectRatios={setSelectedAspectRatios}
            generating={generating}
            generatedImage={generatedImage}
            setGeneratedImage={setGeneratedImage}
            generatedStudioImages={generatedStudioImages}
            setGeneratedStudioImages={setGeneratedStudioImages}
            activePreviewRatio={activePreviewRatio}
            setActivePreviewRatio={setActivePreviewRatio}
            transformError={transformError}
            setTransformError={setTransformError}
            sliderPosition={sliderPosition}
            setSliderPosition={setSliderPosition}
            aiEngine={aiEngine}
            setAiEngine={setAiEngine}
            handleFileChange={handleSourceFileChange}
            handleBgFileChange={handleBgFileChange}
            handleSubjectFileChange={handleSubjectFileChange}
            handleApplyTemplate={handleApplyTemplate}
            handleGeneratePhoto={handleGeneratePhoto}
            handleDownload={handleDownload}
          />
        ) : (
          <FormatAdapterTab
            uploadedPostImage={sourceImage}
            setUploadedPostImage={setSourceImage}
            adapting={adapting}
            analysis={analysis}
            setAnalysis={setAnalysis}
            adaptedFormats={adaptedFormats}
            setAdaptedFormats={setAdaptedFormats}
            adapterError={adapterError}
            setAdapterError={setAdapterError}
            setPreviewImage={setPreviewImage}
            selectedRatios={selectedRatios}
            setSelectedRatios={setSelectedRatios}
            adaptationMode={adaptationMode}
            setAdaptationMode={setAdaptationMode}
            adapterAiEngine={adapterAiEngine}
            handlePostFileChange={handleSourceFileChange}
            handleAdaptFormats={handleAdaptFormats}
            handleDownload={handleDownload}
            layers={layers}
            setLayers={setLayers}
            clientLogo={client?.logo_url}
          />
        )}
      </div>

      {/* Lightbox / Modal de Previsualización */}
      <PreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
        handleDownload={handleDownload}
      />
    </div>
  );
};

export default DesignSection;
