// src/components/brand/StrategicCanvas.jsx
import React, { useState } from 'react';
import { ColorPaletteWidget } from './ColorPaletteWidget';
import { CoherenciaAlerts } from './CoherenciaAlerts';

export const StrategicCanvas = ({
  formData = {},
  onChange,
  onSave,
  saving,
  isAnalyzing,
  loadingMessageIndex,
  consistencyLoaderMsgs = [],
  consistencyReport,
  resolvedConflicts,
  onApplySuggestedFix,
  handleAddColor,
  handleRemoveColor,
  handleUpdateColor,
  activeTab,
  setActiveTab,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState('dna'); // Default open: ADN Estratégico

  // Helper to parse **bold** text within paragraphs and lists
  const parseBoldText = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      // Odd indices are the matches inside **
      if (index % 2 === 1) {
        return (
          <strong key={index} className='font-bold text-white'>
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Helper to parse and render Markdown lines within a section block
  const renderSectionBody = (contentLines) => {
    if (!contentLines || contentLines.length === 0) return null;

    return (
      <div className='space-y-2 select-text text-left'>
        {contentLines.map((line, idx) => {
          const trimmed = line.trim();

          // Horizontal lines
          if (trimmed === '---') {
            return <hr key={idx} className='border-border-subtle/40 my-2.5' />;
          }

          // bullet list items (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listItem = trimmed.substring(2);
            return (
              <li
                key={idx}
                className='text-[12.5px] text-text-secondary leading-relaxed ml-2 pl-1 list-none flex items-start gap-2 mb-1.5'
              >
                <span className='text-[#7C5CFC] text-[8px] mt-1.5 flex-shrink-0'>✦</span>
                <span className='flex-1'>{parseBoldText(listItem)}</span>
              </li>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={idx} className='h-1' />;
          }

          // Standard paragraphs
          return (
            <p
              key={idx}
              className='text-[12.5px] text-text-secondary leading-relaxed mb-2.5'
            >
              {parseBoldText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // 1. Parses raw markdown text into an structured list of sections
  const parseSectionsText = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split('\n');
    const parsed = [];
    let currentSection = null;

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        if (currentSection) {
          parsed.push(currentSection);
        }
        const title = trimmed.replace('### ', '');
        const matchNum = title.match(/^(\d+)\.\s+(.*)/);
        currentSection = {
          num: matchNum ? parseInt(matchNum[1], 10) : parsed.length + 1,
          title: matchNum ? matchNum[2].replace(/\*\*/g, '') : title,
          contentLines: [],
        };
      } else if (trimmed.startsWith('## ')) {
        if (currentSection) {
          parsed.push(currentSection);
        }
        const title = trimmed.replace('## ', '');
        currentSection = {
          num: null,
          title: title,
          isChapter: true,
          contentLines: [],
        };
      } else if (currentSection) {
        currentSection.contentLines.push(line);
      } else {
        // Collect initial text before first heading
        currentSection = {
          num: 0,
          title: 'Resumen Inicial',
          contentLines: [line],
        };
      }
    });

    if (currentSection) {
      parsed.push(currentSection);
    }

    return parsed;
  };

  // Dynamic grouping logic of 16-point Strategic Brief into 5 Chapters (Pillars)
  const renderDynamicPillars = (text) => {
    if (!text || !text.trim()) {
      return (
        <div className='flex flex-col items-center justify-center text-center py-20 px-4 text-text-muted select-none'>
          <span className='text-3xl block mb-2'>📝</span>
          <p className='text-xs font-black text-text-primary block mb-0.5 uppercase tracking-wider font-title'>
            Perfil Estratégico Vacío
          </p>
          <p className='text-[10px] text-text-muted leading-relaxed max-w-[260px] mx-auto'>
            Escribe el ADN estratégico del negocio o presiona el botón <strong>"Analizar"</strong> para extraer el perfil automáticamente de internet.
          </p>
        </div>
      );
    }

    const parsedSections = parseSectionsText(text);

    // Fallback: If AI hasn't structured the headings yet, render raw paragraphs cleanly
    if (parsedSections.length < 3) {
      return (
        <div className='bg-surface-strong/30 border border-white/5 rounded-xl p-4 text-left leading-relaxed text-[12.5px] text-text-secondary select-text whitespace-pre-wrap'>
          {parseBoldText(text)}
        </div>
      );
    }

    // Chapters definition (Pillars)
    const chapters = [
      {
        id: 'dna',
        title: 'ADN Estratégico de la Marca',
        icon: '🏛️',
        description: 'Resumen, propuesta de valor única y definición del cliente ideal.',
        sectionNums: [1, 3, 4],
      },
      {
        id: 'voice',
        title: 'Personalidad y Voz de la Comunicación',
        icon: '🎭',
        description: 'Tono emocional de marca, rasgos de personalidad y directrices de copia.',
        sectionNums: [2, 5, 6],
      },
      {
        id: 'visual',
        title: 'Canales Digitales e Identidad Visual',
        icon: '🎨',
        description: 'Vibra estética, paleta de colores y diagnósticos web y de redes.',
        sectionNums: [7, 8, 9],
      },
      {
        id: 'audit',
        title: 'Diagnóstico de Mercado y Competencia',
        icon: '🎯',
        description: 'Benchmarking, competidores, fortalezas, debilidades y oportunidades.',
        sectionNums: [10, 11, 12, 13],
      },
      {
        id: 'direction',
        title: 'Dirección Comercial y Frases Clave',
        icon: '🚀',
        description: 'Línea de acción recomendada, Claims comerciales, copies y preguntas.',
        sectionNums: [14, 15, 16],
      },
    ];

    // Assign parsed sections to corresponding chapters
    const assignedNums = chapters.flatMap((c) => c.sectionNums);
    
    const groupedChapters = chapters.map((chap) => {
      const sectionsInChapter = parsedSections.filter(
        (sec) => sec.num !== null && chap.sectionNums.includes(sec.num)
      );
      return {
        ...chap,
        sections: sectionsInChapter,
      };
    }).filter((chap) => chap.sections.length > 0);

    // Collect leftovers (generic headers, chapter 0 or other metadata)
    const leftoverSections = parsedSections.filter(
      (sec) => sec.num === null || sec.num === 0 || !assignedNums.includes(sec.num)
    );

    if (leftoverSections.length > 0) {
      groupedChapters.push({
        id: 'other',
        title: 'Otros Aspectos Estratégicos',
        icon: '📝',
        description: 'Información y notas de referencia adicionales del negocio.',
        sections: leftoverSections,
      });
    }

    return (
      <div className='space-y-3 pb-6'>
        {groupedChapters.map((chap) => {
          const isExpanded = expandedChapter === chap.id;

          return (
            <div
              key={chap.id}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? 'border-[#7C5CFC]/30 bg-[#0d0d1e]/50 shadow-[0_4px_20px_rgba(124,92,252,0.06)]'
                  : 'border-white/5 bg-[#0b0b14]/20 hover:bg-[#121225]/30'
              }`}
            >
              {/* ACCORDION PILLAR HEADER */}
              <div
                onClick={() => setExpandedChapter(isExpanded ? null : chap.id)}
                className='w-full flex items-center justify-between p-3.5 cursor-pointer select-none text-left'
              >
                <div className='flex items-center gap-3.5 min-w-0'>
                  <span className='text-2xl flex-shrink-0'>{chap.icon}</span>
                  <div className='min-w-0'>
                    <h4 className='text-[13px] font-black text-white tracking-wide font-title truncate'>
                      {chap.title}
                    </h4>
                    <p className='text-[10px] text-text-muted mt-0.5 truncate max-w-[420px]'>
                      {chap.description}
                    </p>
                  </div>
                </div>

                {/* Interactive dropdown arrow */}
                <svg
                  className={`w-4 h-4 text-text-muted transition-transform duration-300 flex-shrink-0 ${
                    isExpanded ? 'transform rotate-180 text-white' : ''
                  }`}
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M19 9l-7 7-7-7' />
                </svg>
              </div>

              {/* PILLAR BODY CONTENT (VISIBLE ONLY WHEN EXPANDED) */}
              {isExpanded && (
                <div className='p-4 border-t border-white/[0.04] bg-slate-950/20 space-y-5 animate-fade-in max-h-[300px] overflow-y-auto scrollbar-thin'>
                  {chap.sections.map((sec, idx) => (
                    <div key={idx} className='space-y-2 border-b border-white/[0.03] pb-4 last:border-none last:pb-0'>
                      {/* Section Heading Title inside Pillar */}
                      <h5 className='text-[12.5px] font-black text-[#4ECDC4] uppercase tracking-widest pb-1 border-b border-white/[0.03] mb-2 flex items-center gap-1.5'>
                        <span className='h-1.5 w-1.5 rounded-full bg-[#7C5CFC]' />
                        {sec.num ? `${sec.num}. ` : ''} {sec.title}
                      </h5>

                      {/* Render formatted markdown lines for this section */}
                      {renderSectionBody(sec.contentLines)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const hasContradictions =
    consistencyReport?.contradictions && consistencyReport.contradictions.length > 0;
  const contradictionsCount = hasContradictions
    ? consistencyReport.contradictions.filter((c) => !resolvedConflicts.has(c.id)).length
    : 0;

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2.5 shadow-md relative overflow-hidden flex flex-col flex-1 min-h-0 h-full'>
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-lavender via-accent-sage to-accent-sand' />

      {/* WORKSPACE HEADER TABS */}
      <div className='flex items-center justify-between border-b border-border-subtle pb-1 flex-shrink-0'>
        <div className='flex items-center gap-1.5'>
          {/* Tab 1: Brief Profile */}
          <button
            type='button'
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'brief'
                ? 'bg-surface-strong text-white border border-border-subtle shadow-inner'
                : 'text-text-muted hover:text-white'
            }`}
          >
            🧬 Perfil de Marca
          </button>

          {/* Tab 2: Coherence Alerts */}
          <button
            type='button'
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-surface-strong text-white border border-border-subtle shadow-inner'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <span>⚖️ Alertas de Coherencia</span>
            {contradictionsCount > 0 && (
              <span className='bg-amber-500 text-black text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-black animate-pulse'>
                {contradictionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Save Button (only visible in Brief tab) */}
        {activeTab === 'brief' && (
          <button
            type='button'
            onClick={onSave}
            disabled={saving || isAnalyzing}
            className='inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-3.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]'
          >
            {saving ? (
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Guardando...</span>
              </div>
            ) : (
              <>
                <span>💾 Guardar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div className='flex-1 flex flex-col min-h-0 relative overflow-hidden'>
        {activeTab === 'brief' ? (
          <div className='flex-1 flex flex-col space-y-2.5 min-h-0 h-full overflow-hidden'>
            {/* Aesthetic DNA palette row */}
            <ColorPaletteWidget
              colorPalette={formData.color_palette || []}
              onAddColor={handleAddColor}
              onRemoveColor={handleRemoveColor}
              onUpdateColor={handleUpdateColor}
              isAnalyzing={isAnalyzing}
              consistencyScore={consistencyReport?.consistency_score}
            />

            {/* Custom styled Strategic Canvas Card */}
            <div className='relative flex-1 min-h-0 flex flex-col rounded-xl border border-border-subtle bg-surface-strong/20 overflow-hidden'>
              {/* Preview vs Edit toggle panel (only show if not analyzing) */}
              {!isAnalyzing && (
                <div className='absolute bottom-3 right-3 z-20 flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => setEditMode(!editMode)}
                    className='rounded-xl bg-black/75 backdrop-blur-[2px] border border-white/10 hover:bg-black text-white hover:text-[#4ECDC4] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider shadow-md transition-all active:scale-95'
                  >
                    {editMode ? '👁️ Previsualizar' : '📝 Editar'}
                  </button>
                </div>
              )}

              {/* Strategic Brief Text Area / Preview Canvas */}
              <div className='flex-grow overflow-hidden h-full flex flex-col'>
                {editMode ? (
                  <textarea
                    value={formData.business_description || ''}
                    onChange={(e) => onChange('business_description', e.target.value)}
                    placeholder='El lienzo de identidad está vacío. Redacta el ADN comercial de tu marca o presiona "Analizar" en la columna de la izquierda para que el estratega IA construya un brief estratégico a partir de tus redes y capturas...'
                    disabled={isAnalyzing}
                    className='w-full rounded-xl bg-transparent p-3.5 text-xs text-white placeholder-text-secondary focus:outline-none focus:ring-0 leading-relaxed transition-all duration-300 flex-1 resize-none min-h-0 h-full border-none disabled:opacity-30'
                  />
                ) : (
                  <div className='w-full overflow-y-auto p-4 flex-1 h-full max-h-full scroll-smooth select-text pr-2'>
                    {renderDynamicPillars(formData.business_description)}
                  </div>
                )}
              </div>

              {/* ASYNCHRONOUS BACKGROUND PROCESS OVERLAY (IN SPANISH) */}
              {isAnalyzing && (
                <div className='absolute inset-0 bg-[#0d0d1e]/85 backdrop-blur-[6px] rounded-xl flex flex-col items-center justify-center p-6 text-center z-10 border border-white/5 animate-fade-in overflow-y-auto'>
                  <div className='relative mb-4 flex items-center justify-center'>
                    {/* Pulsing glow background */}
                    <div className='absolute -inset-4 rounded-full bg-gradient-to-r from-[#7C5CFC]/30 to-[#4ECDC4]/30 opacity-75 blur-xl animate-pulse'></div>
                    <div className='relative h-14 w-14 rounded-full border-2 border-t-[#7C5CFC] border-r-[#4ECDC4] border-b-transparent border-l-transparent animate-spin flex items-center justify-center bg-black/60 shadow-inner'>
                      <span className='text-xl animate-bounce'>🧬</span>
                    </div>
                  </div>

                  <div className='space-y-2 max-w-sm'>
                    <h5 className='text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5'>
                      <span>⚙️</span> Análisis en Segundo Plano
                    </h5>

                    <p className='text-[10px] text-text-muted leading-relaxed font-medium'>
                      El estratega senior está recopilando datos de tus redes, sitio web e industria en internet.
                    </p>

                    <div className='inline-flex items-center gap-1.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-lg px-2.5 py-1 text-[9px] text-[#9b82ff] font-bold'>
                      <span>⚡</span> Ejecución remota activa
                    </div>

                    <div className='bg-surface-strong/60 rounded-xl p-2.5 border border-white/5 space-y-1.5 mt-2'>
                      <p className='text-[9px] text-text-secondary uppercase tracking-wider font-bold'>
                        Etapa técnica:
                      </p>
                      <p className='text-[10px] text-white font-bold animate-pulse leading-normal'>
                        {consistencyLoaderMsgs[loadingMessageIndex]}
                      </p>
                    </div>

                    <p className='text-[9px] text-text-muted/80 leading-normal border-t border-white/5 pt-2 mt-2'>
                      🔒 <strong className='text-white'>Puedes cerrar esta pestaña o el navegador de forma segura.</strong> El proceso continuará de fondo y el lienzo se actualizará solo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Tab 2: Coherence Alerts list */
          <div className='flex-1 h-full min-h-0 overflow-hidden flex flex-col p-1.5 bg-surface-strong/20 border border-border-subtle/50 rounded-xl'>
            <CoherenciaAlerts
              consistencyReport={consistencyReport}
              resolvedConflicts={resolvedConflicts}
              onApplySuggestedFix={onApplySuggestedFix}
            />
          </div>
        )}
      </div>
    </div>
  );
};
