// src/components/trends/ReportView.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LightBulbIcon,
  LinkIcon,
  CalendarIcon,
  SparklesIcon,
  BookmarkIcon as BookmarkOutline,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { computeStrategicMetrics, getChannelInfo } from './trendsHelpers.js';

export const ReportView = ({ report, client, onCreateEvent }) => {
  if (!report) return null;
  const insights = report.insights || [];

  const [selectedPlatform, setSelectedPlatform] = useState('Todas');
  const [expandedCardId, setExpandedCardId] = useState(null);
  
  // 💡 Banco de Ideas: Cargar marcadores persistidos por cliente
  const [bookmarks, setBookmarks] = useState(() => {
    if (!client?.id) return [];
    const saved = localStorage.getItem(`cadence_bookmarks_client_${client.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar marcadores al cambiar
  const toggleBookmark = (insight) => {
    if (!client?.id) return;
    const isBookmarked = bookmarks.some(b => b.id === insight.id);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => b.id !== insight.id);
      toast.success('Idea removida de tu Banco de Ideas');
    } else {
      newBookmarks = [...bookmarks, insight];
      toast.success('¡Idea guardada en tu Banco de Ideas! 🔖');
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(`cadence_bookmarks_client_${client.id}`, JSON.stringify(newBookmarks));
  };

  if (insights.length === 0 && selectedPlatform !== 'Guardadas') {
    return (
      <div className='rounded-xl border border-dashed border-white/[0.08] bg-slate-900/20 p-8 text-center'>
        <LightBulbIcon className='h-8 w-8 text-slate-500 mx-auto mb-3' />
        <p className='text-sm text-white font-semibold mb-1'>Sin tendencias nuevas hoy</p>
        <p className='text-xs text-slate-400 max-w-md mx-auto leading-relaxed'>
          La búsqueda web del último mes no arrojó tendencias nuevas o diferentes respecto al
          análisis anterior. ¡El mercado se mantiene estable! Volveremos a buscar automáticamente
          mañana.
        </p>
      </div>
    );
  }

  const getPlatformFromChannel = (insight) => {
    const act = String(insight.suggested_action || '').toLowerCase();
    if (act.includes('tiktok')) return 'TikTok';
    if (act.includes('linkedin')) return 'LinkedIn';
    if (act.includes('instagram') || act.includes('ig') || act.includes('reel') || act.includes('carrusel')) return 'Instagram';
    if (act.includes('youtube') || act.includes('yt') || act.includes('short')) return 'YouTube';
    if (act.includes('facebook') || act.includes('fb')) return 'Facebook';

    const preferred = (client?.brand_info?.preferred_platforms || []).map(p => String(p).toLowerCase());
    if (preferred.includes('instagram')) return 'Instagram';
    if (preferred.includes('tiktok')) return 'TikTok';
    if (preferred.includes('linkedin')) return 'LinkedIn';
    if (preferred.includes('youtube')) return 'YouTube';
    if (preferred.includes('facebook')) return 'Facebook';
    return 'Instagram'; // default fallback
  };

  const brandColor = client?.brand_info?.card_color || '#3B82F6';
  const handle = `@${(client?.name || 'marca').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  const nameHash = (client?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const followersCount = ((nameHash % 90) + 10).toFixed(1);
  const followers = `${followersCount}k seguidores`;

  // Filtrado de insights según la plataforma o el Banco de Ideas
  const filteredInsights = selectedPlatform === 'Guardadas'
    ? bookmarks
    : insights.filter(insight => {
        if (selectedPlatform === 'Todas') return true;
        return getPlatformFromChannel(insight) === selectedPlatform;
      });

  return (
    <div className='space-y-6'>
      {/* Dynamic Brand/Client Banner (Screenshot-style) */}
      <div 
        className='rounded-xl border border-white/[0.05] bg-[#1E293B]/10 p-5 flex items-center justify-between'
        style={{ borderLeft: `4px solid ${brandColor}` }}
      >
        <div className='flex items-center gap-2.5 text-slate-200 font-bold text-sm'>
          <span style={{ color: brandColor }}>{client?.name || 'Cliente'}</span>
          <span className='text-slate-400'>·</span>
          <span className='text-slate-400 font-medium'>{handle}</span>
          <span className='text-slate-400'>·</span>
          <span className='text-slate-400 font-medium'>{followers}</span>
        </div>
        <div className='text-slate-400 text-[11px] font-bold bg-slate-955/40 border border-white/[0.05] px-3 py-1.5 rounded-lg'>
          <span className='text-white font-extrabold mr-1'>{insights.length}</span> tendencias
        </div>
      </div>

      {/* Platform & Ideas Filters */}
      <div className='flex flex-wrap items-center gap-2.5 py-1'>
        {['Todas', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'YouTube'].map(p => {
          const isSelected = selectedPlatform === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10'
                  : 'bg-[#1E293B]/30 border-white/[0.06] text-slate-400 hover:text-white hover:bg-[#1E293B]/50'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Separator Line */}
        <div className='h-6 w-px bg-white/[0.08] mx-1 hidden sm:block' />

        {/* Dynamic Bookmarks Filter Tab */}
        <button
          onClick={() => setSelectedPlatform(selectedPlatform === 'Guardadas' ? 'Todas' : 'Guardadas')}
          className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
            selectedPlatform === 'Guardadas'
              ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/10'
              : 'bg-[#1E293B]/30 border-white/[0.06] text-purple-400 hover:text-purple-300 hover:bg-[#1E293B]/50'
          }`}
        >
          <BookmarkSolid className='h-3.5 w-3.5' />
          <span>Banco de Ideas ({bookmarks.length})</span>
        </button>
      </div>

      {/* Grid of Trend Cards */}
      {filteredInsights.length === 0 ? (
        <div className='rounded-xl border border-dashed border-white/[0.08] bg-slate-900/20 p-8 text-center'>
          <LightBulbIcon className='h-8 w-8 text-slate-500 mx-auto mb-3' />
          {selectedPlatform === 'Guardadas' ? (
            <>
              <p className='text-sm text-white font-semibold mb-1'>Tu Banco de Ideas está vacío</p>
              <p className='text-xs text-slate-400 max-w-md mx-auto leading-relaxed'>
                Haz clic en el icono de marcador 🔖 en cualquier tendencia para guardarla aquí y planificar tus contenidos más tarde.
              </p>
            </>
          ) : (
            <>
              <p className='text-sm text-white font-semibold mb-1'>No hay tendencias para este canal</p>
              <p className='text-xs text-slate-400 max-w-md mx-auto leading-relaxed'>
                No se encontraron tendencias recomendadas para {selectedPlatform} en este escaneo. ¡Prueba seleccionando otra plataforma!
              </p>
            </>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {filteredInsights.map((insight, idx) => {
            const metrics = computeStrategicMetrics(insight, client);
            const channel = getChannelInfo(insight.suggested_action, client);
            const isExpanded = expandedCardId === (insight.id || idx);
            const isBookmarked = bookmarks.some(b => b.id === insight.id);

            // Circular progress badge metrics
            const radiusBadge = 14;
            const circBadge = 2 * Math.PI * radiusBadge;
            const offsetBadge = circBadge - (metrics.impactScore / 100) * circBadge;

            return (
              <motion.div
                key={insight.id || idx}
                layout
                onClick={() => setExpandedCardId(isExpanded ? null : (insight.id || idx))}
                className='bg-slate-900/40 border border-white/[0.06] hover:border-blue-500/20 rounded-[20px] p-5 flex flex-col gap-4 shadow-xl hover:shadow-blue-500/[0.01] transition-all relative overflow-hidden backdrop-blur-md cursor-pointer select-none group'
              >
                {/* Decorative glow */}
                <div className='absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none' />

                {/* Header row: Badge + Percentage Ring & Bookmark button */}
                <div className='flex items-center justify-between gap-3'>
                  <span
                    className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${channel.cls}`}
                  >
                    {channel.label}
                  </span>

                  <div className='flex items-center gap-2 shrink-0'>
                    {/* Bookmark Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevenir colapso/expansión de tarjeta
                        toggleBookmark(insight);
                      }}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                        isBookmarked
                          ? 'bg-purple-500/10 border-purple-500/35 text-purple-400'
                          : 'bg-white/5 border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]'
                      }`}
                      title={isBookmarked ? 'Quitar de Banco de Ideas' : 'Guardar en Banco de Ideas'}
                    >
                      {isBookmarked ? (
                        <BookmarkSolid className='h-4 w-4' />
                      ) : (
                        <BookmarkOutline className='h-4 w-4' />
                      )}
                    </button>

                    {/* Match Score percentage */}
                    <div className='relative w-9 h-9 flex items-center justify-center shrink-0' title={`Match score: ${metrics.impactScore}%`}>
                      <svg className='w-full h-full transform -rotate-90'>
                        <circle cx='18' cy='18' r={radiusBadge} className='stroke-white/[0.04]' strokeWidth='2' fill='transparent' />
                        <circle cx='18' cy='18' r={radiusBadge} stroke='currentColor' className='text-purple-400' strokeWidth='2' strokeDasharray={circBadge} strokeDashoffset={offsetBadge} strokeLinecap='round' fill='transparent' />
                      </svg>
                      <span className='absolute text-[9px] font-black text-white'>{metrics.impactScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Title & Short Description */}
                <div className='space-y-1.5'>
                  <h4 className='text-[14px] font-bold text-white leading-snug tracking-tight group-hover:text-blue-400 transition-colors'>
                    {insight.title}
                  </h4>
                  <p className={`text-[12px] text-slate-400 leading-relaxed font-medium transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {insight.description}
                  </p>
                </div>

                {/* Collapsed view footer row */}
                {!isExpanded && (
                  <div className='flex items-center justify-between gap-3 pt-2.5 border-t border-white/[0.04] mt-1'>
                    <span className='text-[9.5px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded border border-white/[0.03]'>
                      {metrics.formatLabel || 'Contenido'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEvent(insight);
                      }}
                      className='flex items-center gap-1 text-[11px] font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg px-3 py-1.5 transition-colors shadow-sm'
                    >
                      <span>+ Usar</span>
                    </button>
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details
                    className='space-y-4 pt-3.5 border-t border-white/[0.05] mt-1 cursor-default'
                  >
                    {/* Progress bars (Impact & Feasibility) */}
                    <div className='space-y-3 py-1'>
                      {/* Impact */}
                      <div className='space-y-1.5'>
                        <div className='flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider'>
                          <span>🎯 Potencial de Impacto</span>
                          <span className='text-blue-400 font-bold'>{metrics.impactScore}%</span>
                        </div>
                        <div className='w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-white/[0.04]'>
                          <div
                            className='bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500'
                            style={{ width: `${metrics.impactScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Feasibility */}
                      <div className='space-y-1.5'>
                        <div className='flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider'>
                          <span>🛠️ Viabilidad de Producción</span>
                          <span className='text-[#10B981] font-bold'>{metrics.feasibilityScore}%</span>
                        </div>
                        <div className='w-full bg-slate-955/60 rounded-full h-1.5 overflow-hidden border border-white/[0.04]'>
                          <div
                            className='bg-gradient-to-r from-[#10B981] to-[#06B6D4] h-full rounded-full transition-all duration-500'
                            style={{ width: `${metrics.feasibilityScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 📊 NUEVO: Desglose de Coherencia de Marca (Coherence Breakdown) */}
                    <div className='rounded-xl bg-slate-950/30 border border-white/[0.03] p-3.5 space-y-2.5'>
                      <span className='text-[9.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5'>
                        📊 Desglose de Coherencia de Marca
                      </span>
                      
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
                        {/* Público Objetivo */}
                        <div className='space-y-1'>
                          <div className='flex justify-between items-center text-[9px] font-bold text-slate-450 uppercase tracking-wide'>
                            <span>Público Objetivo</span>
                            <span className='text-emerald-400 font-extrabold'>{metrics.audienceScore}%</span>
                          </div>
                          <div className='w-full bg-slate-900/60 rounded-full h-1 overflow-hidden border border-white/[0.03]'>
                            <div className='bg-emerald-550 h-full rounded-full transition-all duration-500' style={{ width: `${metrics.audienceScore}%` }} />
                          </div>
                        </div>

                        {/* Pilares Estratégicos */}
                        <div className='space-y-1'>
                          <div className='flex justify-between items-center text-[9px] font-bold text-slate-450 uppercase tracking-wide'>
                            <span>Pilares de Contenido</span>
                            <span className='text-purple-400 font-extrabold'>{metrics.pillarsScore}%</span>
                          </div>
                          <div className='w-full bg-slate-900/60 rounded-full h-1 overflow-hidden border border-white/[0.03]'>
                            <div className='bg-purple-500 h-full rounded-full transition-all duration-500' style={{ width: `${metrics.pillarsScore}%` }} />
                          </div>
                        </div>

                        {/* Tono de Voz */}
                        <div className='space-y-1'>
                          <div className='flex justify-between items-center text-[9px] font-bold text-slate-450 uppercase tracking-wide'>
                            <span>Tono de Voz</span>
                            <span className='text-cyan-400 font-extrabold'>{metrics.voiceScore}%</span>
                          </div>
                          <div className='w-full bg-slate-900/60 rounded-full h-1 overflow-hidden border border-white/[0.03]'>
                            <div className='bg-cyan-500 h-full rounded-full transition-all duration-500' style={{ width: `${metrics.voiceScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match & Alignment Badges */}
                    <div className='flex flex-wrap gap-2'>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded border ${metrics.alignmentCls}`}>
                        {metrics.alignmentText}
                      </span>
                      {metrics.matchedPillar && (
                        <span className='text-[9px] font-extrabold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2.5 py-0.5 rounded'>
                          Match Pilar: {metrics.matchedPillar}
                        </span>
                      )}
                    </div>

                    {/* Rationale "Por qué funciona" */}
                    <div className='rounded-xl bg-slate-950/50 border border-white/[0.04] p-3 text-[12px] leading-relaxed text-slate-350 space-y-1'>
                      <span className='text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1'>
                        <SparklesIcon className='h-3 w-3 text-indigo-400' /> Por qué funciona para esta marca
                      </span>
                      <p className='font-medium text-slate-200 leading-relaxed'>{metrics.rationale}</p>
                    </div>

                    {/* Copy draft */}
                    <div className='rounded-xl bg-blue-500/[0.02] border-l-2 border-blue-500 p-3 text-[12px] leading-relaxed text-slate-350 space-y-1'>
                      <span className='text-[10px] font-black uppercase tracking-wider text-blue-400'>
                        💡 Borrador de Copia / Acción
                      </span>
                      <p className='font-semibold text-slate-100'>{insight.suggested_action || 'Crear publicación enfocada sobre este ángulo en las redes.'}</p>
                    </div>

                    {/* Source link & Action Button */}
                    <div className='flex items-center justify-between gap-3 pt-3 border-t border-white/[0.04] mt-2'>
                      {insight.source_url ? (
                        <a
                          href={insight.source_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 font-bold transition-colors truncate max-w-[45%]'
                        >
                          <LinkIcon className='h-3.5 w-3.5 flex-shrink-0' />
                          <span className='truncate'>Ver fuente</span>
                        </a>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={() => onCreateEvent(insight)}
                        className='flex items-center gap-2 text-[11.5px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2 transition-all shadow-md'
                      >
                        <CalendarIcon className='h-3.5 w-3.5' />
                        Calendarizar Idea
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
