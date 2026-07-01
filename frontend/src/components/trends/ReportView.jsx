// src/components/trends/ReportView.jsx
import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LightBulbIcon,
  LinkIcon,
  SparklesIcon,
  BookmarkIcon as BookmarkOutline,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { computeStrategicMetrics } from './trendsHelpers.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';

// ─────────────────────────────────────────────
// Beautiful SVG Social Platform Icons
// ─────────────────────────────────────────────
const getPlatformFromUrl = (url) => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('facebook.com')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'x';
  return null;
};

const PlatformIcon = ({ platform, className = "h-5 w-5" }) => {
  const p = String(platform).toLowerCase();
  if (p === 'x' || p.includes('twitter')) {
    return (
      <svg className={`${className} text-purple-400 fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <svg className={`${className} text-[#0A66C2] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    );
  }
  if (p.includes('instagram') || p.includes('ig') || p.includes('reel')) {
    return (
      <svg className={`${className} text-pink-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (p.includes('tiktok')) {
    return (
      <svg className={`${className} text-[#00f2fe] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.28-.24-.53-.5-.77-.78-.07 1.94-.02 3.88-.04 5.82-.04 2.13-.53 4.34-1.95 5.96-1.54 1.83-3.97 2.76-6.31 2.58-2.44-.11-4.86-1.42-6.03-3.6-1.39-2.51-1.07-5.9 1.02-8.02 1.54-1.63 3.86-2.45 6.08-2.07v4.1c-1.12-.22-2.37.13-3.08 1.05-.79 1-.58 2.58.46 3.37 1 .8 2.63.56 3.29-.68.21-.4.27-.86.26-1.31V.02z"/>
      </svg>
    );
  }
  if (p.includes('youtube') || p.includes('yt') || p.includes('short')) {
    return (
      <svg className={`${className} text-[#FF0000] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.018 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  if (p.includes('facebook') || p.includes('fb')) {
    return (
      <svg className={`${className} text-[#1877F2] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }
  return (
    <svg className={`${className} text-blue-450`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
};

export const ReportView = ({ report, client, activeInsightId, onCloseActiveInsight, onCreateEvent }) => {
  if (!report) return null;
  const insights = report.insights || [];
  const id = useId();

  // Banco de Ideas: Cargar marcadores persistidos por cliente
  const [bookmarks, setBookmarks] = useState(() => {
    if (!client?.id) return [];
    const saved = localStorage.getItem(`cadence_bookmarks_client_${client.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Historial de tendencias leídas
  const [readTrendIds, setReadTrendIds] = useState(() => {
    const saved = localStorage.getItem('cadence_read_trends');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado de la tarjeta activa seleccionada (Aceternity UI)
  const [active, setActive] = useState(null);

  const handleClose = () => {
    setActive(null);
    if (onCloseActiveInsight) {
      onCloseActiveInsight();
    }
  };

  // Hook para cerrar al hacer click fuera o apretar Escape
  const ref = useClickOutside(handleClose, !!active);

  // Sincronizar estado local `active` con el prop `activeInsightId`
  useEffect(() => {
    if (activeInsightId) {
      const found = insights.find(ins => ins.id === activeInsightId);
      if (found) {
        setActive(found);
      }
    } else {
      setActive(null);
    }
  }, [activeInsightId, insights]);

  // Bloquear scroll del body al abrir una tarjeta
  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [active]);

  // Marcar como leído al abrir
  useEffect(() => {
    if (active && active.id) {
      if (!readTrendIds.includes(active.id)) {
        const nextIds = [...readTrendIds, active.id];
        setReadTrendIds(nextIds);
        localStorage.setItem('cadence_read_trends', JSON.stringify(nextIds));
      }
    }
  }, [active, readTrendIds]);

  if (insights.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-white/[0.08] bg-slate-900/20 p-8 text-center select-none'>
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

  // Datos analíticos para el insight activo (si lo hay)
  const activeMetrics = active ? computeStrategicMetrics(active, client) : null;
  const activeBookmarked = active ? bookmarks.some(b => b.id === active.id) : false;
  const activePlatform = active ? getPlatformFromUrl(active.source_url) : null;
  const activeXTrend = active ? (active.type === 'x_global' || activePlatform === 'x') : false;

  return (
    <>
      {/* 1. Backdrop Blur Overlay */}
      <AnimatePresence>
        {active && typeof active === 'object' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-50"
          />
        )}
      </AnimatePresence>

      {/* 2. Expanded Card Modal */}
      <AnimatePresence>
        {active && typeof active === 'object' ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4 sm:p-6 overflow-y-auto">
            {/* Close Button */}
            <motion.button
              key={`close-button-${active.id}-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute top-6 right-6 z-[110] flex items-center justify-center bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white rounded-full h-9 w-9 cursor-pointer transition-colors shadow-lg"
              onClick={handleClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </motion.button>

            {/* Modal Body Container */}
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[650px] bg-[#090D16] border border-white/[0.1] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl max-h-[85vh]"
            >
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 scrollbar-thin">
                {/* Header (Platform Tags) */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {activeXTrend ? (
                    <span className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/25 flex items-center gap-1 shadow-sm font-sans">
                      <PlatformIcon platform="x" className="h-3 w-3" />
                      X Global
                    </span>
                  ) : (
                    activePlatform && (
                      <span className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/60 text-slate-350 border border-white/[0.04] flex items-center gap-1.5 shadow-sm font-sans">
                        <PlatformIcon platform={activePlatform} className="h-3.5 w-3.5" />
                        <span className="capitalize">{activePlatform}</span>
                      </span>
                    )
                  )}
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <motion.h3
                    layoutId={`title-${active.id}-${id}`}
                    className="text-lg md:text-xl font-black text-white leading-tight tracking-tight font-sans"
                  >
                    {active.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${active.id}-${id}`}
                    className="text-sm text-slate-300 leading-relaxed font-medium"
                  >
                    {active.description}
                  </motion.p>
                </div>

                {/* Source Link */}
                {active.source_url && (
                  <div className="pt-1">
                    <a
                      href={active.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold transition-all border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-3.5 py-2 rounded-xl"
                    >
                      <LinkIcon className="h-4 w-4 text-slate-500" />
                      <span>Ver fuente original</span>
                    </a>
                  </div>
                )}

                {/* Métricas e Impacto Global */}
                <div className="border-t border-white/[0.06] pt-5 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <SparklesIcon className="h-4 w-4 text-indigo-400" />
                      Métricas e Impacto Global
                    </h4>

                    {/* Bookmark Toggle Button */}
                    <button
                      onClick={() => toggleBookmark(active)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeBookmarked
                          ? 'bg-purple-500/10 border-purple-500/35 text-purple-400'
                          : 'bg-white/5 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                      }`}
                    >
                      {activeBookmarked ? (
                        <BookmarkSolid className="h-4 w-4" />
                      ) : (
                        <BookmarkOutline className="h-4 w-4" />
                      )}
                      <span>{activeBookmarked ? 'Guardada' : 'Guardar Tendencia'}</span>
                    </button>
                  </div>

                  {/* Metrics Cards Banner */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950/40 border border-white/[0.04] p-4 rounded-2xl">
                    <div className="flex flex-col items-center justify-center p-2 text-center bg-slate-900/30 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">🔥 Viral Score</span>
                      <span className="text-sm font-black text-orange-400">{activeMetrics?.trendingScore}%</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 text-center bg-slate-900/30 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">📊 Impresiones</span>
                      <span className="text-[11.5px] font-black text-slate-200 truncate w-full">{activeMetrics?.estimatedImpressions}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 text-center bg-slate-900/30 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">🏷️ Categoría</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded truncate w-full text-center ${activeMetrics?.categoryCls}`}>
                        {activeMetrics?.categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* 3. Compact Grid View (Aceternity Grid Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {insights.map((insight, idx) => {
          const metrics = computeStrategicMetrics(insight, client);
          const platform = getPlatformFromUrl(insight.source_url);
          const isXTrend = insight.type === 'x_global' || platform === 'x';
          const isBookmarked = bookmarks.some(b => b.id === insight.id);
          const isRead = readTrendIds.includes(insight.id);

          return (
            <motion.div
              layoutId={`card-${insight.id}-${id}`}
              key={`card-${insight.id}-${id}`}
              onClick={() => setActive(insight)}
              className={`relative p-5 flex flex-col justify-between rounded-2xl cursor-pointer transition-all duration-300 shadow-md group overflow-hidden ${
                isXTrend
                  ? 'bg-gradient-to-br from-[#0B0F19]/60 to-[#1E1139]/40 border border-purple-500/20 hover:border-purple-500/50 hover:shadow-purple-500/[0.04] hover:bg-purple-950/[0.03]'
                  : 'bg-[#0B0F19]/40 border border-white/[0.06] hover:border-blue-500/40 hover:bg-white/[0.01] hover:shadow-blue-500/[0.03]'
              }`}
              whileHover={{ y: -3 }}
            >
              {/* Top Row (Badges & Bookmark Indicator) */}
              <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!isRead && (
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)] font-sans">
                      ✨ NUEVA
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${metrics.categoryCls}`}>
                    {metrics.categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/60 text-slate-350 border border-white/[0.04]">
                    📊 {metrics.estimatedImpressions}
                  </span>
                  {isXTrend ? (
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-sans">
                      <PlatformIcon platform="x" className="h-2.5 w-2.5" />
                      X Global
                    </span>
                  ) : (
                    platform && (
                      <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/60 text-slate-350 border border-white/[0.04] font-sans">
                        <PlatformIcon platform={platform} className="h-2.5 w-2.5" />
                        <span className="capitalize">{platform}</span>
                      </span>
                    )
                  )}
                </div>
                {isBookmarked && (
                  <BookmarkSolid className="h-4 w-4 text-purple-400 shrink-0" title="Idea Guardada" />
                )}
              </div>

              {/* Middle Section (Title & Snippet) */}
              <div className="space-y-1.5 mb-5 flex-grow">
                <motion.h3
                  layoutId={`title-${insight.id}-${id}`}
                  className={`font-bold text-sm leading-snug tracking-tight transition-colors ${
                    isXTrend ? 'group-hover:text-purple-400 text-white' : 'group-hover:text-blue-400 text-white'
                  }`}
                >
                  {insight.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${insight.id}-${id}`}
                  className="text-slate-400 text-[11.5px] leading-relaxed line-clamp-3"
                >
                  {insight.description}
                </motion.p>
              </div>

              {/* Bottom Row (Match Badge & Action Button) */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-auto">
                {/* Score badge */}
                <div className="flex items-center gap-1 border px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-orange-500/5 text-orange-400 border-orange-500/10">
                  <span>🔥 {metrics.trendingScore}% Viral Score</span>
                </div>

                {/* Fake action button matching Expandable Card styling */}
                <motion.button
                  layoutId={`button-${insight.id}-${id}`}
                  className={`px-3 py-1.5 text-[10.5px] rounded-lg font-bold bg-white/5 text-slate-300 transition-colors pointer-events-none ${
                    isXTrend
                      ? 'group-hover:bg-purple-600 group-hover:text-white'
                      : 'group-hover:bg-blue-600 group-hover:text-white'
                  }`}
                >
                  Ver Análisis
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
