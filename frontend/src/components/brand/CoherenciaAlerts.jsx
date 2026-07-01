// src/components/brand/CoherenciaAlerts.jsx
import React from 'react';
import { useLanguage } from '../../hooks';

export const CoherenciaAlerts = ({
  consistencyReport,
  resolvedConflicts,
  onApplySuggestedFix,
}) => {
  const { t } = useLanguage();

  if (!consistencyReport) {
    return (
      <div className='h-full flex flex-col items-center justify-center text-center p-6 bg-surface-strong/20 rounded-xl border border-border-subtle min-h-[200px]'>
        <span className='text-3xl block mb-2 animate-bounce'>⚡</span>
        <h5 className='text-xs font-bold text-text-primary uppercase tracking-wider mb-1'>
          {t.brand.noActiveAnalysis}
        </h5>
        <p className='text-[10px] text-text-muted leading-relaxed max-w-[280px]'>
          {t.brand.noActiveAnalysisDesc}
        </p>
      </div>
    );
  }

  const { consistency_score, is_consistent, contradictions = [] } = consistencyReport;

  return (
    <div className='flex flex-col h-full space-y-3 min-h-0 text-left'>
      {/* Alertas Header Summary */}
      <div className='flex items-center justify-between border-b border-border-subtle pb-2 flex-shrink-0'>
        <div>
          <h4 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
            <span>⚖️</span> {t.brand.consistencyDiagnosis}
          </h4>
          <p className='text-[9.5px] text-text-muted mt-0.5 leading-normal'>
            {t.brand.alignmentLevel}: <strong>{consistency_score}%</strong>.
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
            consistency_score >= 90
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}
        >
          {is_consistent ? `✓ ${t.brand.aligned}` : `⚠️ ${t.brand.discrepanciesDetected}`}
        </span>
      </div>

      {/* Contradictions List Scrollable Container */}
      <div className='flex-1 overflow-y-auto pr-0.5 space-y-2.5 min-h-0'>
        {contradictions.length > 0 ? (
          contradictions.map((contra) => {
            const isResolved = resolvedConflicts.has(contra.id);
            return (
              <div
                key={contra.id}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isResolved
                    ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                    : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                <div className='flex items-center justify-between gap-4 mb-1.5'>
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wide ${
                      isResolved ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isResolved ? `✓ ${t.brand.harmonized}` : `⚠️ ${contra.title}`}
                  </span>
                  {isResolved && (
                    <span className='text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20'>
                      {t.brand.applied}
                    </span>
                  )}
                </div>

                <p className='text-[10.5px] text-white/90 leading-relaxed mb-2'>
                  {contra.description}
                </p>

                {!isResolved && (
                  <div className='mt-2 p-2.5 rounded-lg bg-black/35 border border-white/5 space-y-2 text-left'>
                    <span className='text-[9px] font-black text-[#7C5CFC] uppercase tracking-wider block'>
                      💡 {t.brand.strategistSuggestion}:
                    </span>
                    <p className='text-[10.5px] text-text-muted italic leading-relaxed'>
                      "{contra.consultation_question}"
                    </p>

                    {contra.suggested_fix && (
                      <div className='pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                        <span className='text-[8px] text-text-secondary font-bold uppercase text-left'>
                          {t.brand.integrateProposalPrompt}
                        </span>
                        <button
                          type='button'
                          onClick={() => onApplySuggestedFix(contra.id, contra.suggested_fix)}
                          className='inline-flex items-center gap-1.5 bg-[#7C5CFC] hover:bg-[#6b4dfc] text-white rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 whitespace-nowrap self-end sm:self-auto'
                        >
                          🧬 {t.brand.harmonizeProfile}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className='text-center py-6 bg-surface-strong/30 rounded-xl border border-border-subtle flex flex-col items-center justify-center min-h-[140px]'>
            <span className='text-2xl block mb-1 animate-pulse'>✨</span>
            <p className='text-[10.5px] font-bold text-text-primary block mb-0.5'>
              {t.brand.perfectCoherence}
            </p>
            <p className='text-[9.5px] text-text-muted leading-relaxed max-w-[240px] mx-auto'>
              {t.brand.perfectCoherenceDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
