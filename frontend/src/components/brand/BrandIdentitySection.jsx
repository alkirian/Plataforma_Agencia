// src/components/brand/BrandIdentitySection.jsx
import React from 'react';
import { useBrandIdentity } from './useBrandIdentity';
import { SocialDock } from './SocialDock';
import { ReferenceLibrary } from './ReferenceLibrary';
import { StrategicCanvas } from './StrategicCanvas';

export const BrandIdentitySection = ({ clientId }) => {
  const {
    formData,
    loading,
    saving,
    consistencyReport,
    isAnalyzingConsistency,
    resolvedConflicts,
    loadingMessageIndex,
    brandAssets,
    loadingAssets,
    uploadingAssets,
    isDragging,
    activeTab,
    setActiveTab,
    setIsDragging,
    CONSISTENCY_LOADER_MSGS,
    handleChange,
    handleConsistencyCheck,
    handleApplySuggestedFix,
    handleUploadAssets,
    handleDeleteAsset,
    handleSubmit,
    handleAddColor,
    handleRemoveColor,
    handleUpdateColor,
  } = useBrandIdentity(clientId);

  if (loading) {
    return (
      <div className='w-full flex flex-col items-center justify-center py-32 gap-5 text-text-muted'>
        <div className='relative flex items-center justify-center'>
          <div className='h-12 w-12 border-[3px] border-accent-lavender/10 border-t-accent-lavender rounded-full animate-spin'></div>
          <div className='absolute h-6 w-6 border-[3px] border-accent-sage/10 border-t-accent-sage rounded-full animate-spin animate-reverse'></div>
        </div>
        <p className='text-sm font-semibold tracking-wide animate-pulse uppercase text-text-muted/80'>
          Cargando ficha de identidad estratégica...
        </p>
      </div>
    );
  }

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUploadAssets(files);
    }
  };

  return (
    <section className='w-full max-w-[1600px] mx-auto px-4 pt-1 pb-2 space-y-2 h-full overflow-hidden flex flex-col justify-start text-left'>
      {/* ================= MAIN TWO-COLUMN WORKSPACE GRID ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 items-start flex-1 overflow-hidden h-full'>
        {/* ================= COLUMNA IZQUIERDA: DOCK, BIBLIOTECA Y BOTÓN (5/12) ================= */}
        <div className='lg:col-span-5 space-y-2 overflow-y-auto max-h-full pr-1 pb-2 flex flex-col justify-start'>
          {/* GUÍA DE ONBOARDING */}
          <div className='rounded-2xl border border-border-subtle bg-gradient-to-br from-[#121228] to-[#1a1a3b] p-2.5 space-y-1 relative overflow-hidden shadow-md border-l-[3.5px] border-l-[#7C5CFC] text-left flex-shrink-0'>
            <div className='absolute top-0 right-0 p-2 text-2xl opacity-10 pointer-events-none'>🧬</div>
            <h3 className='text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5'>
              <span>ℹ️</span> Identidad de Marca
            </h3>
            <p className='text-[10.5px] text-text-muted leading-relaxed'>
              Conecta los canales oficiales y sube manuales o capturas. Al pulsar <strong>Analizar</strong>, la IA asimilará el material y consolidará tu perfil de marca en la Casilla Única.
            </p>
          </div>

          {/* SOCIAL NETWORK GRID CHANNELS */}
          <SocialDock
            formData={formData}
            onChange={handleChange}
            isAnalyzing={isAnalyzingConsistency}
          />

          {/* REFERENCE DOCUMENTS LIBRARY */}
          <ReferenceLibrary
            brandAssets={brandAssets}
            loadingAssets={loadingAssets}
            uploadingAssets={uploadingAssets}
            isDragging={isDragging}
            isAnalyzing={isAnalyzingConsistency}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onUploadAssets={handleUploadAssets}
            onDeleteAsset={handleDeleteAsset}
          />

          {/* MAIN ANALYZE ACTION BUTTON */}
          <button
            type='button'
            disabled={isAnalyzingConsistency}
            onClick={handleConsistencyCheck}
            className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#4ECDC4] hover:from-[#6b4dfc] hover:to-[#3ec3ba] text-white py-2.5 text-xs font-black uppercase tracking-widest shadow-md shadow-[#7C5CFC]/10 hover:shadow-[#7C5CFC]/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98] flex-shrink-0'
          >
            {isAnalyzingConsistency ? (
              <div className='flex flex-col items-center gap-1 py-0.5'>
                <div className='flex items-center justify-center gap-1.5'>
                  <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  <span>Analizando de fondo...</span>
                </div>
                <span className='text-[8.5px] text-white/70 font-semibold animate-pulse'>
                  {CONSISTENCY_LOADER_MSGS[loadingMessageIndex]}
                </span>
              </div>
            ) : (
              <>
                <span>🧠 Analizar</span>
              </>
            )}
          </button>
        </div>

        {/* ================= COLUMNA DERECHA: LIENZO ESTRATÉGICO Y ALERTAS (7/12) ================= */}
        <div className='lg:col-span-7 space-y-2 h-full flex flex-col justify-start overflow-hidden'>
          <StrategicCanvas
            formData={formData}
            onChange={handleChange}
            onSave={handleSubmit}
            saving={saving}
            isAnalyzing={isAnalyzingConsistency}
            loadingMessageIndex={loadingMessageIndex}
            consistencyLoaderMsgs={CONSISTENCY_LOADER_MSGS}
            consistencyReport={consistencyReport}
            resolvedConflicts={resolvedConflicts}
            onApplySuggestedFix={handleApplySuggestedFix}
            handleAddColor={handleAddColor}
            handleRemoveColor={handleRemoveColor}
            handleUpdateColor={handleUpdateColor}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    </section>
  );
};
