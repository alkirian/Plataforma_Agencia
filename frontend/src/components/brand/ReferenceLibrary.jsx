// src/components/brand/ReferenceLibrary.jsx
import React from 'react';

export const ReferenceLibrary = ({
  brandAssets = [],
  loadingAssets,
  uploadingAssets,
  isDragging,
  isAnalyzing,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadAssets,
  onDeleteAsset,
}) => {
  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2 shadow-md relative overflow-hidden flex-shrink-0'>
      <div className='text-left'>
        <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
          <span>📎</span> Referencias y Gráficos
        </h3>
      </div>

      {/* Drag & Drop zone */}
      <div
        onDragOver={isAnalyzing ? undefined : onDragOver}
        onDragLeave={isAnalyzing ? undefined : onDragLeave}
        onDrop={isAnalyzing ? undefined : onDrop}
        className={`rounded-xl border border-dashed p-2.5 text-center transition-all duration-300 relative ${
          isAnalyzing
            ? 'border-border-subtle bg-surface-strong/10 opacity-50 cursor-not-allowed'
            : isDragging
            ? 'cursor-pointer border-accent-lavender bg-accent-lavender/10 text-accent-lavender'
            : 'cursor-pointer border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/50 hover:border-white/15'
        }`}
      >
        <input
          type='file'
          multiple
          id='brand-file-uploader'
          className='hidden'
          accept='image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt'
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
            <div className='flex flex-col items-center gap-1.5'>
              <div className='h-4 w-4 border-2 border-accent-lavender border-t-transparent rounded-full animate-spin'></div>
              <span className='text-[9.5px] font-bold text-white'>Subiendo...</span>
            </div>
          ) : (
            <>
              <div className='w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-xs border border-white/5 shadow-inner'>
                📥
              </div>
              <div className='space-y-0.5'>
                <span className='text-[9.5px] font-black text-text-primary block'>
                  Arrastra PDFs o Capturas
                </span>
                <span className='text-[8px] text-text-muted block'>
                  o haz clic para explorar
                </span>
              </div>
            </>
          )}
        </label>
      </div>

      {/* Visual File Grid */}
      {brandAssets.length > 0 && (
        <div className='grid grid-cols-2 gap-1.5 pt-0.5 max-h-[85px] overflow-y-auto pr-0.5'>
          {brandAssets.map((asset) => {
            const isImage = asset.file_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
            return (
              <div
                key={asset.id}
                className='group overflow-hidden rounded-lg border border-border-subtle bg-surface-strong p-1 flex items-center justify-between gap-1.5 relative shadow-sm transition-all hover:border-white/10'
              >
                <div className='flex items-center gap-1 min-w-0 text-left'>
                  <span className='text-[10px] flex-shrink-0'>{isImage ? '🖼️' : '📄'}</span>
                  <p className='truncate text-[8.5px] text-white/90 font-bold leading-tight'>
                    {asset.file_name || asset.name}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => onDeleteAsset(asset)}
                  className='opacity-60 hover:opacity-100 text-red-400 hover:text-red-300 text-[9px] p-0.5 font-bold transition-all'
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
