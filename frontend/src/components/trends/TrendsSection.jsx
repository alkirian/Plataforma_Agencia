// src/components/trends/TrendsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  BoltIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { runTrendsForClient, getTrendReports } from '../../api/trends.js';
import { apiFetch } from '../../api/apiFetch.js';

// Shared modular refactored components
import { groupReportsByDate } from './trendsHelpers.js';
import { CreateEventModal } from './CreateEventModal.jsx';
import { ReportView } from './ReportView.jsx';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className='flex flex-col items-center justify-center py-20 text-center bg-[#0F172A]/40 border border-white/[0.06] rounded-2xl p-8 max-w-2xl mx-auto'
  >
    <div className='w-16 h-16 rounded-xl bg-slate-800/60 border border-white/[0.08] flex items-center justify-center mb-6'>
      <ArrowTrendingUpIcon className='h-8 w-8 text-slate-400' />
    </div>
    <h3 className='text-base font-bold text-white mb-2'>Sin reportes generados</h3>
    <p className='text-xs text-slate-400 max-w-sm mb-8 leading-relaxed'>
      El sistema genera reportes automáticamente cada mañana, o puedes iniciar un análisis sobre tu
      marca en este instante.
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
      {isRunning ? 'Buscando tendencias...' : 'Generar tendencias ahora'}
    </button>
  </motion.div>
);

const HistoryItem = ({ report, isActive, onClick }) => {
  const title =
    report.title || `Análisis: ${(report.keywords || []).slice(0, 2).join(', ') || 'General'}`;
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
          className={`text-[11px] font-extrabold leading-snug line-clamp-2 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-355 group-hover:text-white'}`}
        >
          {title}
        </p>
      </div>
      <div className='flex items-center justify-between gap-2 w-full'>
        <span className='text-[9px] text-slate-500 font-semibold truncate max-w-[80%] uppercase tracking-wider'>
          {(report.keywords || []).slice(0, 2).join(' · ')}
        </span>
        <span className='text-[9px] text-slate-500 whitespace-nowrap font-medium bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/[0.03]'>
          {new Date(report.generated_at).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          hs
        </span>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// Main Section Component
// ─────────────────────────────────────────────

export const TrendsSection = ({ clientId }) => {
  const [reports, setReports] = useState([]);
  const [client, setClient] = useState(null);
  const [activeReportId, setActiveReportId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState('');

  // Cargar info del cliente
  const fetchClientInfo = useCallback(async () => {
    try {
      const allReports = await getTrendReports(clientId, 15);
      setReports(allReports);
      if (allReports.length > 0) setActiveReportId(allReports[0].id);

      // Fetch client details
      const cResp = await apiFetch(`/clients/${clientId}`);
      setClient(cResp?.data ?? cResp ?? null);
    } catch (e) {
      console.error('Error fetching client trend data', e);
    }
  }, [clientId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchClientInfo();
      setIsLoading(false);
    };
    load();
  }, [fetchClientInfo]);

  // Polling mientras el análisis corre
  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(async () => {
      const allReports = await getTrendReports(clientId, 15);
      setReports(allReports);
      if (allReports.length > 0) {
        if (!activeReportId || !allReports.find(r => r.id === activeReportId)) {
          setActiveReportId(allReports[0].id);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingActive, clientId, activeReportId]);

  const handleRun = async () => {
    setIsRunning(true);
    setPollingActive(true);
    try {
      await runTrendsForClient(clientId, customKeywords);
      toast.success(
        'Análisis de tendencias iniciado. Buscando información del último mes...',
        { duration: 4500 }
      );

      setTimeout(() => {
        setPollingActive(false);
        setIsRunning(false);
      }, 45000);
    } catch (e) {
      toast.error('Error: ' + e.message);
      setIsRunning(false);
      setPollingActive(false);
    }
  };

  const handleCreateEvent = insight => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  // Reporte activo
  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || null;
  const hasReports = reports.length > 0;

  // Agrupado de historial por fecha
  const groupedReports = groupReportsByDate(reports);

  return (
    <div className='w-full max-w-full py-6 px-4 sm:px-6 md:px-8 xl:px-12 space-y-6'>
      {/* Header & Search override */}
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
            <h1 className='text-xl font-bold text-white'>Monitoreo de Tendencias</h1>
            <p className='text-xs text-slate-400'>
              Escaneo inteligente diario de mercado · Segmentado por tus pilares e industria
            </p>
          </div>
          {pollingActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className='flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10'
            >
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
              Escaneando fuentes...
            </motion.div>
          )}
        </div>

        {/* Input custom keywords & Run button */}
        <div className='flex items-center gap-3 flex-wrap w-full sm:w-auto'>
          <div className='relative w-full sm:w-64'>
            <MagnifyingGlassIcon className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
            <input
              type='text'
              value={customKeywords}
              onChange={e => setCustomKeywords(e.target.value)}
              placeholder='Buscar conceptos customizados...'
              className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors'
              disabled={isRunning}
            />
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors flex items-center gap-1.5'
          >
            {isRunning ? (
              <ArrowPathIcon className='h-4 w-4 animate-spin' />
            ) : (
              <BoltIcon className='h-4 w-4' />
            )}
            {isRunning ? 'Escaneando...' : 'Buscar Tendencias'}
          </button>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className='flex items-center justify-center py-32'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-8 h-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin' />
            <p className='text-sm text-slate-400'>Recuperando reportes de tendencias...</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRun} isRunning={isRunning} />
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start'>
          {/* Grouped History Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className='rounded-xl border border-white/[0.06] bg-[#121A2C]/20 p-4 space-y-4 lg:sticky lg:top-24 max-h-[75vh] overflow-y-auto'
          >
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-b border-white/[0.04] pb-2'>
              Historial de Búsquedas
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
                        isActive={report.id === (activeReportId || reports[0]?.id)}
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
                  client={client}
                  onCreateEvent={handleCreateEvent}
                />
              ) : (
                <div className='text-center py-20 text-xs text-slate-400'>
                  Selecciona un reporte del historial para ver el análisis estratégico de mercado.
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
            clientId={clientId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
