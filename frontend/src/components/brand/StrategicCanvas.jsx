// src/components/brand/StrategicCanvas.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorPaletteWidget } from './ColorPaletteWidget';
import { useLanguage } from '../../hooks';

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
  autosaveStatus = 'idle',
  onOpenDnaAssistant,
}) => {
  const { t, lang } = useLanguage();
  const [editMode, setEditMode] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [editingSecNum, setEditingSecNum] = useState(null); // ID de la sección siendo editada
  const [editSecValue, setEditSecValue] = useState(''); // Valor temporal del editor

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

  // Parses raw markdown text into an structured list of sections
  const parseSectionsText = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split('\n');
    const parsed = [];
    let currentSection = null;

    lines.forEach((line) => {
      const match = line.match(/^##\s+(\d+)\.\s+(.*)$/);
      if (match) {
        if (currentSection) {
          parsed.push(currentSection);
        }
        currentSection = {
          num: parseInt(match[1], 10),
          title: match[2],
          contentLines: []
        };
      } else if (currentSection) {
        currentSection.contentLines.push(line);
      }
    });

    if (currentSection) {
      parsed.push(currentSection);
    }

    return parsed;
  };

  const parsedSections = useMemo(() => parseSectionsText(formData.business_description || ''), [formData.business_description]);

  // Reconstructs the complete markdown text from structured sections array
  const reconstructMarkdown = (sections) => {
    return sections.map(sec => `## ${sec.num}. ${sec.title}\n${sec.contentLines.join('\n')}`).join('\n\n');
  };

  // Saves inline strategic section and auto-persists in background
  const handleSaveSection = (secNum) => {
    const updatedSections = parsedSections.map(sec => {
      if (sec.num === secNum) {
        return {
          ...sec,
          contentLines: editSecValue.split('\n')
        };
      }
      return sec;
    });

    const newMarkdownText = reconstructMarkdown(updatedSections);
    onChange('business_description', newMarkdownText);
    setEditingSecNum(null);
    
    // Auto-save call
    setTimeout(() => {
      onSave();
    }, 100);
  };

  // Classifies contradictions to respective chapters based on keywords
  const getContradictionChapter = (contra) => {
    const textToAnalyze = `${contra.title} ${contra.description}`.toLowerCase();
    
    if (textToAnalyze.includes('tono') || textToAnalyze.includes('voz') || textToAnalyze.includes('personalidad') || textToAnalyze.includes('copia') || textToAnalyze.includes('redacción') || textToAnalyze.includes('comunicación')) {
      return 'voice';
    }
    if (textToAnalyze.includes('color') || textToAnalyze.includes('paleta') || textToAnalyze.includes('visual') || textToAnalyze.includes('estética') || textToAnalyze.includes('diseño') || textToAnalyze.includes('gráfico') || textToAnalyze.includes('logo') || textToAnalyze.includes('imagen')) {
      return 'visual';
    }
    if (textToAnalyze.includes('web') || textToAnalyze.includes('sitio') || textToAnalyze.includes('landing') || textToAnalyze.includes('página')) {
      return 'visual'; 
    }
    if (textToAnalyze.includes('competidor') || textToAnalyze.includes('competencia') || textToAnalyze.includes('mercado') || textToAnalyze.includes('ventaja')) {
      return 'audit';
    }
    if (textToAnalyze.includes('claim') || textToAnalyze.includes('comercial') || textToAnalyze.includes('llamado') || textToAnalyze.includes('frase') || textToAnalyze.includes('acción') || textToAnalyze.includes('copyw')) {
      return 'direction';
    }
    return 'dna';
  };

  const getChaptersList = (text) => {
    if (!text || !text.trim()) return [];

    const parsedSections = parseSectionsText(text);
    if (parsedSections.length < 3) return [];

    const chapters = [
      {
        id: 'dna',
        title: t.brand.chapters?.dna?.title || 'ADN Estratégico',
        icon: '🏛️',
        description: t.brand.chapters?.dna?.description || 'Resumen, propuesta de valor única y público objetivo.',
        sectionNums: [1, 3, 4],
      },
      {
        id: 'voice',
        title: t.brand.chapters?.voice?.title || 'Personalidad y Voz',
        icon: '🎭',
        description: t.brand.chapters?.voice?.description || 'Tono de marca, rasgos y directrices de redacción.',
        sectionNums: [2, 5, 6],
      },
      {
        id: 'visual',
        title: t.brand.chapters?.visual?.title || 'Identidad Visual',
        icon: '🎨',
        description: t.brand.chapters?.visual?.description || 'Estilo de diseño, paleta y diagnósticos de canales.',
        sectionNums: [7, 8, 9],
      },
      {
        id: 'audit',
        title: t.brand.chapters?.audit?.title || 'Auditoría de Mercado',
        icon: '🎯',
        description: t.brand.chapters?.audit?.description || 'Benchmarking, competidores directos y fortalezas.',
        sectionNums: [10, 11, 12, 13],
      },
      {
        id: 'direction',
        title: t.brand.chapters?.direction?.title || 'Dirección Comercial',
        icon: '🚀',
        description: t.brand.chapters?.direction?.description || 'Plan estratégico comercial, Claims y copys clave.',
        sectionNums: [14, 15, 16],
      },
    ];

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

    const leftoverSections = parsedSections.filter(
      (sec) => sec.num === null || sec.num === 0 || !assignedNums.includes(sec.num)
    );

    if (leftoverSections.length > 0) {
      groupedChapters.push({
        id: 'other',
        title: t.brand.chapters?.other?.title || 'Otros Aspectos',
        icon: '📝',
        description: t.brand.chapters?.other?.description || 'Información de soporte complementaria.',
        sections: leftoverSections,
      });
    }

    return groupedChapters;
  };

  const groupedChapters = getChaptersList(formData.business_description || '');

  // Filter unresolved contradictions
  const activeContradictions = (consistencyReport?.contradictions || []).filter(
    (c) => !resolvedConflicts?.has(c.id)
  );

  const scrollToChapter = (chapId) => {
    const el = document.getElementById(`chapter-${chapId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className='rounded-2xl border border-border-subtle bg-surface p-3.5 space-y-2.5 shadow-md relative overflow-hidden flex flex-col flex-1 min-h-0 h-full text-left'>
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-lavender via-accent-sage to-accent-sand' />

      {/* WORKSPACE HEADER */}
      <div className='flex items-center justify-between border-b border-border-subtle pb-1.5 flex-shrink-0 select-none'>
        <h4 className='text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1 py-1'>
          <span>🧬</span> {t.brand.strategicProfileTitle || 'ADN Estratégico'}
        </h4>

        {/* Read / Edit Switch & Copilot Warning indicator */}
        <div className='flex items-center gap-3'>
          {/* Active Copilot Warnings Badge */}
          {activeContradictions.length > 0 && (
            <button
              type='button'
              onClick={() => setIsCopilotOpen(true)}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9.5px] font-black uppercase tracking-wider animate-pulse transition-all shadow-xs cursor-pointer'
            >
              <span>⚠️</span>
              <span>{activeContradictions.length} {lang === 'es' ? 'Alertas' : 'Alerts'}</span>
            </button>
          )}

          {/* Asistente de ADN */}
          <button
            type='button'
            onClick={onOpenDnaAssistant}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#9b82ff] text-[9.5px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer'
          >
            <span>💬</span>
            <span>{lang === 'es' ? 'Asistente de ADN' : 'DNA Assistant'}</span>
          </button>

          {/* Toggle Switch */}
          <div className='flex items-center gap-1 bg-surface-soft p-0.5 rounded-xl border border-border-subtle'>
            <button
              type='button'
              onClick={() => setEditMode(false)}
              className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                !editMode
                  ? 'bg-[#7C5CFC]/20 text-[#9b82ff] border border-[#7C5CFC]/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              👁️ {lang === 'es' ? 'Lectura' : 'Read'}
            </button>
            <button
              type='button'
              onClick={() => setEditMode(true)}
              className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                editMode
                  ? 'bg-[#7C5CFC]/20 text-[#9b82ff] border border-[#7C5CFC]/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              ✍️ {lang === 'es' ? 'Edición' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div className='flex-grow flex flex-col min-h-0 relative overflow-visible'>
        <div className='flex-1 flex flex-col space-y-2.5 min-h-0 h-full overflow-visible'>
          
          {/* Aesthetic DNA palette row */}
          <ColorPaletteWidget
            colorPalette={formData.color_palette || []}
            onAddColor={handleAddColor}
            onRemoveColor={handleRemoveColor}
            onUpdateColor={handleUpdateColor}
            isAnalyzing={isAnalyzing}
            consistencyScore={consistencyReport?.consistency_score}
          />

          {/* Continuous Strategic Canvas Grid */}
          <div className='relative flex-grow min-h-0 flex flex-row rounded-xl border border-border-subtle bg-surface-strong/20 overflow-hidden'>
            
            {/* Left: Continuous Strategic Brief Scroll */}
            <div className='flex-grow overflow-y-auto p-4 scroll-smooth pr-3 min-h-0 h-full select-text' id='strategic-canvas-scrollable'>
              {!formData.business_description || !formData.business_description.trim() ? (
                <div className='flex flex-col items-center justify-center text-center py-20 px-4 text-text-muted select-none h-full'>
                  <span className='text-3xl block mb-2'>📝</span>
                  <p className='text-xs font-black text-text-primary block mb-0.5 uppercase tracking-wider font-title'>
                    {t.brand.emptyProfileTitle || 'Perfil Estratégico Vacío'}
                  </p>
                  <p className='text-[10px] text-text-muted leading-relaxed max-w-[260px] mx-auto'>
                    {lang === 'es' ? (
                      <>Escribe el ADN estratégico del negocio o presiona el botón <strong>"Analizar"</strong> para extraer el perfil automáticamente de internet.</>
                    ) : (
                      <>Write the strategic DNA of the business or press the <strong>"Analyze"</strong> button to automatically extract the profile from the internet.</>
                    )}
                  </p>
                </div>
              ) : groupedChapters.length < 3 ? (
                <div className='bg-surface-strong/30 border border-white/5 rounded-xl p-4 text-left leading-relaxed text-[12.5px] text-text-secondary select-text whitespace-pre-wrap'>
                  {parseBoldText(formData.business_description)}
                </div>
              ) : (
                <div className='space-y-4 pb-6'>
                  {groupedChapters.map((chap) => (
                    <div
                      key={chap.id}
                      id={`chapter-${chap.id}`}
                      className='rounded-xl border border-white/5 bg-[#0b0b14]/25 p-4 space-y-4 shadow-sm text-left'
                    >
                      {/* Pillar Header */}
                      <div className='flex items-center gap-3 pb-3 border-b border-white/5 select-none'>
                        <span className='text-2xl flex-shrink-0'>{chap.icon}</span>
                        <div className='min-w-0'>
                          <h4 className='text-[13px] font-black text-white tracking-wide font-title'>
                            {chap.title}
                          </h4>
                          <p className='text-[10px] text-text-muted mt-0.5 leading-relaxed truncate max-w-[460px]'>
                            {chap.description}
                          </p>
                        </div>
                      </div>

                      {/* Pillar Sections */}
                      <div className='space-y-5 pt-1'>
                        {chap.sections.map((sec, idx) => {
                          const secKey = sec.num !== null ? String(sec.num) : sec.title;
                          const isEditing = editingSecNum === secKey;
                          const isPending = (sec.contentLines || []).some(line => line.includes('⚠️ [Información pendiente'));

                          return (
                            <div 
                              key={idx} 
                              className={`space-y-2 border-b border-white/[0.03] pb-4 last:border-none last:pb-0 text-left relative group/sec transition-all duration-200 ${
                                isPending 
                                  ? 'bg-amber-500/[0.01] border border-amber-500/10 p-3 rounded-xl shadow-xs' 
                                  : ''
                              }`}
                            >
                              {isEditing ? (
                                <>
                                  <h5 className='text-[12.5px] font-black text-[#4ECDC4] uppercase tracking-widest pb-1 border-b border-white/[0.03] mb-2 flex items-center gap-1.5 select-none'>
                                    <span className='h-1.5 w-1.5 rounded-full bg-[#7C5CFC]' />
                                    {sec.num ? `${sec.num}. ` : ''} {sec.title} ({t.brand.editingLabel || 'Editando'})
                                  </h5>
                                  <textarea
                                    value={editSecValue}
                                    onChange={(e) => setEditSecValue(e.target.value)}
                                    className='w-full rounded-xl bg-slate-900 border border-white/10 p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/20 min-h-[120px] resize-y'
                                  />
                                  <div className='flex items-center gap-1.5 justify-end pt-1 select-none'>
                                    <button
                                      type='button'
                                      onClick={() => handleSaveSection(sec)}
                                      className='px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-[9.5px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer'
                                    >
                                      {t.common.save}
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => setEditingSecNum(null)}
                                      className='px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[9.5px] font-bold transition-all cursor-pointer'
                                    >
                                      {t.common.cancel || 'Cancelar'}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className='flex items-center justify-between gap-2 pb-1 border-b border-white/[0.03] mb-2 select-none'>
                                    <h5 className='text-[12.5px] font-black text-[#4ECDC4] uppercase tracking-widest flex items-center gap-1.5'>
                                      <span className='h-1.5 w-1.5 rounded-full bg-[#7C5CFC]' />
                                      {sec.num ? `${sec.num}. ` : ''} {sec.title}
                                    </h5>
                                    {editMode && !isAnalyzing && (
                                      <button
                                        type='button'
                                        onClick={() => {
                                          setEditingSecNum(secKey);
                                          setEditSecValue(sec.contentLines.join('\n'));
                                        }}
                                        className='opacity-0 group-hover/sec:opacity-100 text-accent-lavender hover:text-white text-[9.5px] font-bold transition-all px-2 py-0.5 rounded-lg border border-border-subtle bg-surface-strong/20 hover:bg-surface-strong/60 cursor-pointer'
                                      >
                                        {lang === 'es' ? 'Editar ✏_' : 'Edit ✏_'}
                                      </button>
                                    )}
                                  </div>
                                  {renderSectionBody(sec.contentLines)}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Lateral navigation dots index (Visible only if chapters loaded) */}
            {groupedChapters.length > 0 && (
              <div className='w-10 border-l border-white/5 bg-black/15 flex flex-col items-center py-4 gap-4 flex-shrink-0 select-none h-full justify-start'>
                {groupedChapters.map((chap) => (
                  <button
                    key={chap.id}
                    type='button'
                    onClick={() => scrollToChapter(chap.id)}
                    className='w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-white/10 transition-colors group relative cursor-pointer active:scale-90'
                  >
                    <span>{chap.icon}</span>
                    {/* Tooltip on hover */}
                    <span className='absolute right-full mr-2 scale-0 group-hover:scale-100 bg-black/95 text-white text-[9px] font-bold px-2 py-1 rounded border border-white/10 shadow-lg whitespace-nowrap transition-all duration-150 z-30 pointer-events-none'>
                      {chap.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ASYNCHRONOUS BACKGROUND PROCESS OVERLAY */}
            {isAnalyzing && (
              <div className='absolute inset-0 bg-[#0d0d1e]/85 backdrop-blur-[6px] rounded-xl flex flex-col items-center justify-center p-6 text-center z-40 border border-white/5 animate-fade-in overflow-y-auto'>
                <div className='relative mb-4 flex items-center justify-center select-none'>
                  <div className='absolute -inset-4 rounded-full bg-gradient-to-r from-[#7C5CFC]/30 to-[#4ECDC4]/30 opacity-75 blur-xl animate-pulse'></div>
                  <div className='relative h-14 w-14 rounded-full border-2 border-t-[#7C5CFC] border-r-[#4ECDC4] border-b-transparent border-l-transparent animate-spin flex items-center justify-center bg-black/60 shadow-inner'>
                    <span className='text-xl animate-bounce'>🧬</span>
                  </div>
                </div>

                <div className='space-y-2 max-w-sm text-center'>
                  <h5 className='text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 select-none'>
                    <span>⚙️</span> {t.brand.bgAnalysisTitle || 'Análisis en Segundo Plano'}
                  </h5>

                  <p className='text-[10px] text-text-muted leading-relaxed font-medium select-none'>
                    {t.brand.bgAnalysisDesc}
                  </p>

                  <div className='inline-flex items-center gap-1.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-lg px-2.5 py-1 text-[9px] text-[#9b82ff] font-bold select-none'>
                    <span>⚡</span> {t.brand.activeRemoteExecution || 'Ejecución activa'}
                  </div>

                  <div className='bg-surface-strong/60 rounded-xl p-2.5 border border-white/5 space-y-1.5 mt-2 w-full select-none'>
                    <p className='text-[9px] text-text-secondary uppercase tracking-wider font-bold'>
                      {t.brand.technicalStage || 'Etapa técnica:'}:
                    </p>
                    <p className='text-[10px] text-white font-bold animate-pulse leading-normal'>
                      {consistencyLoaderMsgs[loadingMessageIndex]}
                    </p>
                  </div>

                  <p className='text-[9px] text-text-muted/80 leading-normal border-t border-white/5 pt-2 mt-2 w-full select-none'>
                    {t.brand.bgAnalysisFooter}
                  </p>
                </div>
              </div>
            )}

            {/* COPILOT DRAWER (SLIDE-OUT ALERTS PANEL) */}
            <AnimatePresence>
              {isCopilotOpen && (
                <>
                  {/* Backdrop overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCopilotOpen(false)}
                    className='absolute inset-0 bg-black z-40 cursor-pointer'
                  />
                  {/* Slideout Panel */}
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className='absolute top-0 right-0 h-full w-80 sm:w-96 bg-[#090910] border-l border-white/10 z-50 p-4 shadow-2xl flex flex-col overflow-hidden text-left'
                  >
                    <div className='flex items-center justify-between pb-3 border-b border-white/10 mb-4 flex-shrink-0 select-none'>
                      <h5 className='text-[11.5px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5'>
                        <span>⚠️</span> {t.brand.discrepanciesDetected || 'Alertas de Coherencia'}
                      </h5>
                      <button
                        type='button'
                        onClick={() => setIsCopilotOpen(false)}
                        className='text-text-muted hover:text-white text-[11px] font-bold px-1 select-none cursor-pointer'
                      >
                        {t.common.close || 'Cerrar'}
                      </button>
                    </div>

                    <div className='flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin'>
                      {activeContradictions.map((contra) => (
                        <div key={contra.id} className='p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3'>
                          <div className='space-y-1 text-left'>
                            <span className='text-[8.5px] font-black uppercase text-amber-400 tracking-wider select-none'>
                              {lang === 'es' ? 'Punto en Conflicto' : 'Conflict Area'}
                            </span>
                            <h6 className='text-[11px] font-bold text-white leading-snug'>
                              {contra.title}
                            </h6>
                            <p className='text-[10px] text-text-muted leading-relaxed'>
                              {contra.description}
                            </p>
                          </div>

                          <div className='rounded-lg bg-black/35 p-2.5 space-y-1 border border-white/5 text-left'>
                            <p className='text-[9px] text-[#4ECDC4] font-black uppercase tracking-wider leading-none select-none'>
                              {lang === 'es' ? 'Consulta al cliente:' : 'Client consultation:'}
                            </p>
                            <p className='text-[10px] text-white/90 leading-relaxed font-semibold italic'>
                              "{contra.consultation_question}"
                            </p>
                          </div>

                          <div className='rounded-lg bg-[#7C5CFC]/10 p-2.5 space-y-2 border border-[#7C5CFC]/20 text-left'>
                            <div className='space-y-0.5'>
                              <span className='text-[9px] font-black uppercase tracking-wider text-accent-lavender select-none'>
                                ✨ {t.brand.harmonized || 'Propuesta:'}
                              </span>
                              <p className='text-[10px] text-white/95 leading-relaxed font-medium'>
                                {contra.suggested_fix}
                              </p>
                            </div>
                            <button
                              type='button'
                              onClick={() => {
                                onApplySuggestedFix(contra.id, contra.suggested_fix);
                                if (activeContradictions.length <= 1) {
                                  setIsCopilotOpen(false);
                                }
                              }}
                              className='w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6b4dfc] text-white text-[9.5px] font-bold shadow-xs transition-all cursor-pointer'
                            >
                              <span>🤝</span> {t.brand.harmonizeProfile || 'Armonizar Perfil'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
