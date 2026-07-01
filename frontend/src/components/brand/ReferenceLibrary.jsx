// src/components/brand/ReferenceLibrary.jsx
import React from 'react';
import { useLanguage } from '../../hooks';

export const ReferenceLibrary = ({
  brandAssets = [],
  documents = [],
  loadingAssets,
  loadingDocs,
  uploadingAssets,
  isDragging,
  isAnalyzing,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadAssets,
  onDeleteAsset,
  onDeleteDoc,
}) => {
  const { t, lang } = useLanguage();

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3.5 space-y-3.5 shadow-md relative overflow-hidden flex-shrink-0 text-left'>
      <div>
        <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5 select-none'>
          <span>📎</span> {t.brand.referencesTitle || 'Biblioteca de Archivos'}
        </h3>
      </div>

      {/* Unified Drag & Drop zone */}
      <div
        onDragOver={isAnalyzing ? undefined : onDragOver}
        onDragLeave={isAnalyzing ? undefined : onDragLeave}
        onDrop={isAnalyzing ? undefined : onDrop}
        className={`rounded-xl border border-dashed p-3 text-center transition-all duration-300 relative ${
          isAnalyzing
            ? 'border-border-subtle bg-surface-strong/10 opacity-50 cursor-not-allowed'
            : isDragging
            ? 'cursor-pointer border-[#7C5CFC] bg-[#7C5CFC]/10 text-white'
            : 'cursor-pointer border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/50 hover:border-white/15'
        }`}
      >
        <input
          type='file'
          multiple
          id='brand-file-uploader'
          className='hidden'
          accept='image/*,application/pdf,.doc,.docx,.txt'
          onChange={(e) => onUploadAssets(e.target.files)}
          disabled={uploadingAssets || isAnalyzing}
        />
        <label
          htmlFor={isAnalyzing ? undefined : 'brand-file-uploader'}
          className={`w-full flex flex-col items-center justify-center gap-1 text-text-muted ${
            isAnalyzing ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {uploadingAssets ? (
            <div className='flex flex-col items-center gap-1.5 py-1'>
              <div className='h-4.5 w-4.5 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin'></div>
              <span className='text-[9.5px] font-bold text-white'>{t.brand.uploadingFiles || 'Subiendo archivos...'}</span>
            </div>
          ) : (
            <>
              <div className='w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-sm border border-white/5 shadow-inner mb-0.5 select-none'>
                📥
              </div>
              <div className='space-y-0.5 select-none'>
                <span className='text-[9.5px] font-black text-text-primary block leading-none'>
                  {t.brand.dragDropPdfs || 'Arrastra PDFs, logos o imágenes'}
                </span>
                <span className='text-[8px] text-text-muted block leading-none pt-0.5'>
                  {t.brand.orClickExplore || 'o haz clic para explorar tu ordenador'}
                </span>
              </div>
            </>
          )}
        </label>
      </div>

      {/* File lists section */}
      <div className='space-y-3 max-h-[220px] overflow-y-auto pr-0.5 select-text'>
        {/* 1. VISUAL REFERENCES (IMAGES/LOGOS) */}
        {brandAssets.length > 0 && (
          <div className='space-y-1.5 text-left'>
            <span className='text-[8.5px] font-black uppercase tracking-wider text-text-muted select-none block px-0.5'>
              {lang === 'es' ? 'Recursos Visuales y Logos' : 'Visual Assets & Logos'}
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
              {brandAssets.map((asset) => (
                <div
                  key={asset.id}
                  className='group overflow-hidden rounded-xl border border-border-subtle bg-surface-strong/30 p-2 flex items-center justify-between gap-2 shadow-xs transition-all hover:border-white/10'
                >
                  <div className='flex items-center gap-1.5 min-w-0'>
                    <span className='text-[10px] flex-shrink-0 select-none'>🖼️</span>
                    <p className='truncate text-[9px] text-white/95 font-bold leading-tight' title={asset.file_name || asset.name}>
                      {asset.file_name || asset.name}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => onDeleteAsset(asset)}
                    className='opacity-40 hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] p-0.5 font-bold transition-all cursor-pointer'
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SUPPORTING DOCUMENTS (PDF/DOCX RAG) */}
        {documents.length > 0 && (
          <div className='space-y-1.5 text-left pt-1 border-t border-white/5 first:border-none first:pt-0'>
            <span className='text-[8.5px] font-black uppercase tracking-wider text-text-muted select-none block px-0.5'>
              {lang === 'es' ? 'Documentos de Soporte (IA)' : 'Supporting Documents (AI)'}
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
              {documents.map((doc) => {
                const isProcessing = doc.ai_status === 'processing';
                return (
                  <div
                    key={doc.id}
                    className='group overflow-hidden rounded-xl border border-border-subtle bg-surface-strong/30 p-2 flex items-center justify-between gap-2 shadow-xs transition-all hover:border-white/10'
                  >
                    <div className='flex items-center gap-1.5 min-w-0'>
                      {isProcessing ? (
                        <div className='h-3 w-3 border border-accent-lavender border-t-transparent rounded-full animate-spin flex-shrink-0' />
                      ) : (
                        <span className='text-[10px] flex-shrink-0 select-none'>📄</span>
                      )}
                      <p className='truncate text-[9px] text-white/95 font-bold leading-tight' title={doc.file_name}>
                        {doc.file_name}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => onDeleteDoc(doc.id)}
                      className='opacity-40 hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] p-0.5 font-bold transition-all cursor-pointer'
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {brandAssets.length === 0 && documents.length === 0 && (
          <div className='py-6 text-center text-text-muted text-[10px] leading-relaxed select-none border border-white/5 rounded-xl bg-surface-strong/10'>
            {lang === 'es' 
              ? 'No hay archivos cargados. Arrastra manuales o logos para iniciar.'
              : 'No files uploaded yet. Drag manuals or logos to begin.'}
          </div>
        )}
      </div>
    </div>
  );
};
