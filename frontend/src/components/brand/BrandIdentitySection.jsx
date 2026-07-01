// src/components/brand/BrandIdentitySection.jsx
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBrandIdentity } from './useBrandIdentity';
import { SocialDock } from './SocialDock';
import { ReferenceLibrary } from './ReferenceLibrary';
import { StrategicCanvas } from './StrategicCanvas';
import { BrandDnaAssistantDrawer } from './BrandDnaAssistantDrawer';
import { useLanguage } from '../../hooks';

export const BrandIdentitySection = ({ clientId }) => {
  const { t } = useLanguage();
  const [isDnaAssistantOpen, setIsDnaAssistantOpen] = useState(false);
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
    documents,
    loadingDocs,
    handleDeleteDoc,
    autosaveStatus,
  } = useBrandIdentity(clientId);

  if (loading) {
    return (
      <div className='w-full flex flex-col items-center justify-center py-32 gap-5 text-text-muted'>
        <div className='relative flex items-center justify-center'>
          <div className='h-12 w-12 border-[3px] border-accent-lavender/10 border-t-accent-lavender rounded-full animate-spin'></div>
          <div className='absolute h-6 w-6 border-[3px] border-accent-sage/10 border-t-accent-sage rounded-full animate-spin animate-reverse'></div>
        </div>
        <p className='text-sm font-semibold tracking-wide animate-pulse uppercase text-text-muted/80'>
          {t.brand.loadingStrategic}
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
    <section className='w-full max-w-[1600px] mx-auto px-4 pt-1 pb-2 space-y-3 h-full overflow-hidden flex flex-col justify-start text-left'>
      {/* ================= MAIN TWO-COLUMN WORKSPACE GRID ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 items-start h-full overflow-hidden flex-grow min-h-0'>
        {/* ================= COLUMNA IZQUIERDA: DOCK, BIBLIOTECA Y BOTÓN (5/12) ================= */}
        <div className='lg:col-span-5 space-y-2 overflow-y-auto max-h-full pr-1 pb-2 flex flex-col justify-start'>
          {/* SOCIAL NETWORK GRID CHANNELS */}
          <SocialDock
            formData={formData}
            onChange={handleChange}
            isAnalyzing={isAnalyzingConsistency}
          />

          {/* REFERENCE DOCUMENTS LIBRARY */}
          <ReferenceLibrary
            brandAssets={brandAssets}
            documents={documents}
            loadingAssets={loadingAssets}
            loadingDocs={loadingDocs}
            uploadingAssets={uploadingAssets}
            isDragging={isDragging}
            isAnalyzing={isAnalyzingConsistency}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onUploadAssets={handleUploadAssets}
            onDeleteAsset={handleDeleteAsset}
            onDeleteDoc={handleDeleteDoc}
          />

          {/* MAIN ANALYZE ACTION BUTTON */}
          <button
            type='button'
            disabled={isAnalyzingConsistency}
            onClick={handleConsistencyCheck}
            className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#4ECDC4] hover:from-[#6b4dfc] hover:to-[#3ec3ba] text-white py-2.5 text-xs font-black uppercase tracking-widest shadow-md shadow-[#7C5CFC]/10 hover:shadow-[#7C5CFC]/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98] flex-shrink-0 cursor-pointer'
          >
            {isAnalyzingConsistency ? (
              <div className='flex flex-col items-center gap-1 py-0.5'>
                <div className='flex items-center justify-center gap-1.5'>
                  <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  <span>{t.brand.analyzingBackground}</span>
                </div>
                <span className='text-[8.5px] text-white/70 font-semibold animate-pulse'>
                  {CONSISTENCY_LOADER_MSGS[loadingMessageIndex]}
                </span>
              </div>
            ) : (
              <>
                <span>{t.brand.analyzeBtn}</span>
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
            autosaveStatus={autosaveStatus}
            onOpenDnaAssistant={() => setIsDnaAssistantOpen(true)}
          />
        </div>
      </div>

      <AnimatePresence>
        {isDnaAssistantOpen && (
          <BrandDnaAssistantDrawer
            clientId={clientId}
            businessDescription={formData.business_description}
            onClose={() => setIsDnaAssistantOpen(false)}
            onBrandProfileUpdated={(newDesc) => handleChange('business_description', newDesc)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
