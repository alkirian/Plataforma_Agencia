// src/pages/TrendsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  BoltIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  runTrendsNow,
  runTrendsForClient,
  getTrendReports,
  getLatestTrendReports,
} from '../api/trends.js';
import { apiFetch } from '../api/apiFetch.js';

// Shared modular refactored components
import { groupReportsByDate } from '../components/trends/trendsHelpers.js';
import { CreateEventModal } from '../components/trends/CreateEventModal.jsx';
import { ReportView } from '../components/trends/ReportView.jsx';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning }) => {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center justify-center py-20 text-center bg-[#0F172A]/40 border border-white/[0.06] rounded-2xl p-8 max-w-2xl mx-auto'
    >
      <div className='w-16 h-16 rounded-xl bg-slate-800/60 border border-white/[0.08] flex items-center justify-center mb-6'>
        <ArrowTrendingUpIcon className='h-8 w-8 text-slate-400' />
      </div>
      <h3 className='text-base font-bold text-white mb-2'>{t.trends.emptyTitle}</h3>
      <p className='text-xs text-slate-400 max-w-sm mb-8 leading-relaxed'>
        {t.trends.emptyDesc}
      </p>
      <button
        onClick={onRun}
        disabled={isRunning}
        className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-2'
      >
        {isRunning ? (
          <ArrowPathIcon className='h-4 w-4 animate-spin' />
        ) : (
          <BoltIcon className='h-4 w-4' />
        )}
        {isRunning ? t.trends.emptyActionBtnLoading : t.trends.emptyActionBtn}
      </button>
    </motion.div>
  );
};

const HistoryItem = ({ report, isActive, onClick }) => {
  const { t, lang } = useLanguage();
  const title =
    report.title || `${t.trends.analysis}: ${(report.keywords || []).slice(0, 2).join(', ') || t.trends.general}`;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 hover:translate-x-1 flex flex-col gap-1.5 ${
        isActive
          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-white shadow-lg shadow-blue-500/[0.02]'
          : 'border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-white'
      }`}
    >
      <div className='flex items-center gap-2 w-full'>
        {isActive && (
          <span className='w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0' />
        )}
        <p
          className={`text-[11px] font-extrabold leading-snug line-clamp-2 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-350 group-hover:text-white'}`}
        >
          {title}
        </p>
      </div>
      <div className='flex items-center justify-between gap-2 w-full'>
        <span className='text-[9px] text-slate-500 font-semibold truncate max-w-[80%] uppercase tracking-wider'>
          {(report.keywords || []).slice(0, 2).join(' · ')}
        </span>
        <span className='text-[9px] text-slate-500 whitespace-nowrap font-medium bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/[0.03]'>
          {new Date(report.generated_at).toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          {lang === 'es' ? 'hs' : 'hrs'}
        </span>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export const TrendsPage = () => {
  const { t, lang } = useLanguage();
  const [latestReports, setLatestReports] = useState([]);
  const [activeReportId, setActiveReportId] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Cargar info inicial
  const fetchLatestReports = useCallback(async () => {
    try {
      const all = await getLatestTrendReports();
      setLatestReports(all);
      if (all.length > 0 && !activeReportId) {
        setActiveReportId(all[0].id);
      }
    } catch (e) {
      console.error('Error fetching latest reports', e);
    }
  }, [activeReportId]);

  useEffect(() => {
    const loadInit = async () => {
      setIsLoading(true);
      await fetchLatestReports();
      setIsLoading(false);
    };
    loadInit();
  }, [fetchLatestReports]);

  // Polling para tareas activas
  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(async () => {
      await fetchLatestReports();
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingActive, fetchLatestReports]);

  const handleRunAll = async () => {
    setIsRunning(true);
    setPollingActive(true);
    try {
      await runTrendsNow();
      toast.success(t.trends.globalAnalysisStarted || 'Análisis global de tendencias iniciado.', {
        duration: 4000,
      });
      setTimeout(() => {
        setPollingActive(false);
        setIsRunning(false);
        fetchLatestReports();
      }, 60000);
    } catch (e) {
      toast.error(t.trends.errorScan + e.message);
      setIsRunning(false);
      setPollingActive(false);
    }
  };

  const handleCreateEvent = insight => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  // Reporte activo a mostrar
  const activeReport = latestReports.find(r => r.id === activeReportId) || latestReports[0] || null;

  const historyList = latestReports;
  const hasReports = historyList.length > 0;

  // Agrupado de historial por fecha
  const groupedReports = groupReportsByDate(historyList);

  return (
    <div className='w-full max-w-full py-6 px-4 sm:px-6 md:px-8 xl:px-12 space-y-6'>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5'
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-[#1E293B]/40 border border-white/[0.08] flex items-center justify-center'>
            <ArrowTrendingUpIcon className='h-5 w-5 text-blue-400' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-white'>{t.trends.globalTitle}</h1>
            <p className='text-xs text-slate-400'>
              {t.trends.globalDesc}
            </p>
          </div>
          {pollingActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className='flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10'
            >
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
              {t.trends.scanningSources}
            </motion.div>
          )}
        </div>

        {/* Global trigger button */}
        <div className='flex items-center gap-3 flex-wrap w-full sm:w-auto'>
          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-md'
          >
            {isRunning ? (
              <ArrowPathIcon className='h-4 w-4 animate-spin' />
            ) : (
              <BoltIcon className='h-4 w-4' />
            )}
            {isRunning ? t.trends.scanningBtn : t.trends.searchBtn}
          </button>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className='flex items-center justify-center py-32'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-8 h-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin' />
            <p className='text-sm text-slate-400'>{t.trends.loadingReports}</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRunAll} isRunning={isRunning} />
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start'>
          {/* Grouped History Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className='rounded-xl border border-white/[0.06] bg-[#121A2C]/20 p-4 space-y-4 lg:sticky lg:top-24 max-h-[75vh] overflow-y-auto'
          >
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-b border-white/[0.04] pb-2'>
              {t.trends.searchHistory}
            </p>

            <div className='space-y-4'>
              {Object.keys(groupedReports).map(dateGroup => (
                <div key={dateGroup} className='space-y-1'>
                  <h4 className='text-[10px] font-bold text-blue-400 uppercase tracking-wider px-1 py-0.5'>
                    {dateGroup}
                  </h4>

                  <div className='space-y-1 pl-0.5 border-l border-white/[0.03]'>
                    {groupedReports[dateGroup].map(report => (
                      <HistoryItem
                        key={report.id}
                        report={report}
                        isActive={report.id === (activeReportId || historyList[0]?.id)}
                        onClick={() => setActiveReportId(report.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main report view */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='min-w-0 bg-[#0F172A]/20 border border-white/[0.04] rounded-2xl p-6 lg:p-8'
          >
            <AnimatePresence mode='wait'>
              {activeReport ? (
                <ReportView
                  key={activeReport.id}
                  report={activeReport}
                  client={null}
                  onCreateEvent={handleCreateEvent}
                />
              ) : (
                <div className='text-center py-20 text-xs text-slate-400'>
                  {t.trends.selectReportHistory}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Event Drafting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateEventModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedInsight(null);
            }}
            insight={selectedInsight}
            clientId={undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
