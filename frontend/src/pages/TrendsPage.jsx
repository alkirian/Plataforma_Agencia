// src/pages/TrendsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  LightBulbIcon,
  LinkIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  SignalIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  runTrendsNow,
  runTrendsForClient,
  getTrendReports,
  getLatestTrendReports,
} from '../api/trends.js';
import { apiFetch } from '../api/apiFetch.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const relativeDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Hace menos de 1 hora';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const relevanceBadge = (rel) => {
  const map = {
    alta:  { label: 'Alta',  cls: 'bg-[#8FA89B]/20 text-[#8FA89B] border border-[#8FA89B]/30' },
    media: { label: 'Media', cls: 'bg-[#9BA1BA]/20 text-[#9BA1BA] border border-[#9BA1BA]/30' },
    baja:  { label: 'Baja',  cls: 'bg-[#A19EA6]/20 text-[#A19EA6] border border-[#A19EA6]/30' },
  };
  return map[rel] || map.media;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center"
  >
    <div className="w-20 h-20 rounded-2xl bg-[#222024] border border-[#2C2930] flex items-center justify-center mb-6">
      <ArrowTrendingUpIcon className="h-10 w-10 text-[#A19EA6]" />
    </div>
    <h3 className="text-xl font-semibold text-[#F3F2F4] mb-2">Sin reportes todavía</h3>
    <p className="text-[#A19EA6] max-w-sm mb-8 leading-relaxed">
      El sistema genera reportes automáticamente cada mañana, o podés iniciar uno ahora manualmente.
    </p>
    <button
      onClick={onRun}
      disabled={isRunning}
      id="empty-run-trends-btn"
      className="btn-cyber flex items-center gap-2 px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
    >
      {isRunning ? (
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
      ) : (
        <BoltIcon className="h-4 w-4" />
      )}
      {isRunning ? 'Generando...' : 'Generar tendencias ahora'}
    </button>
  </motion.div>
);

const InsightCard = ({ insight, index }) => {
  const badge = relevanceBadge(insight.relevance);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card-cyber p-5 flex flex-col gap-3 group hover:border-[#38343D] transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#28262B] border border-[#2C2930] flex items-center justify-center flex-shrink-0">
            <LightBulbIcon className="h-4 w-4 text-[#9BA1BA]" />
          </div>
          <p className="text-sm font-semibold text-[#F3F2F4] leading-tight line-clamp-2">{insight.title}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-[#A19EA6] leading-relaxed">{insight.description}</p>

      {/* Suggested action */}
      {insight.suggested_action && (
        <div className="rounded-lg bg-[#222024] border border-[#2C2930] px-3 py-2">
          <p className="text-xs text-[#8FA89B] font-medium mb-0.5">Acción sugerida</p>
          <p className="text-xs text-[#F3F2F4] leading-relaxed">{insight.suggested_action}</p>
        </div>
      )}

      {/* Source link */}
      {insight.source_url && (
        <a
          href={insight.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#9BA1BA] hover:text-[#F3F2F4] transition-colors mt-auto"
        >
          <LinkIcon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{insight.source_url.replace(/^https?:\/\//, '').split('/')[0]}</span>
        </a>
      )}
    </motion.div>
  );
};

const ReportView = ({ report }) => {
  if (!report) return null;
  const insights = report.insights || [];
  const highInsights = insights.filter(i => i.relevance === 'alta');
  const restInsights = insights.filter(i => i.relevance !== 'alta');

  return (
    <motion.div
      key={report.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A19EA6]">
        <span className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          {formatDate(report.generated_at)}
        </span>
        <span className="w-1 h-1 rounded-full bg-[#38343D]" />
        <span className="flex items-center gap-1.5">
          <SignalIcon className="h-3.5 w-3.5" />
          {(report.keywords || []).join(' · ')}
        </span>
        <span className="w-1 h-1 rounded-full bg-[#38343D]" />
        <span>{insights.length} insight{insights.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-[#2C2930] bg-[#1A181C] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#A19EA6] mb-3">Resumen del análisis</p>
        <p className="text-sm text-[#F3F2F4] leading-relaxed">{report.summary}</p>
      </div>

      {/* Empty State when no new insights */}
      {insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-[#2C2930] bg-[#1A181C]/50 p-8 text-center"
        >
          <LightBulbIcon className="h-8 w-8 text-[#A19EA6]/40 mx-auto mb-3" />
          <p className="text-sm text-[#F3F2F4] font-medium mb-1">Sin tendencias nuevas</p>
          <p className="text-xs text-[#A19EA6] max-w-md mx-auto">
            La búsqueda web del último mes no arrojó tendencias nuevas o diferentes respecto al análisis anterior. ¡El mercado se mantiene estable! Volveremos a buscar automáticamente mañana.
          </p>
        </motion.div>
      )}

      {/* High relevance section */}
      {highInsights.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8FA89B] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8FA89B]" />
            Relevancia alta
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highInsights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Rest */}
      {restInsights.length > 0 && (
        <div>
          {highInsights.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A19EA6] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A19EA6]" />
              Otros insights
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restInsights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} index={highInsights.length + i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const HistoryItem = ({ report, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
      isActive
        ? 'bg-[#28262B] border-[#38343D] text-[#F3F2F4]'
        : 'border-transparent text-[#A19EA6] hover:bg-[#222024] hover:text-[#F3F2F4]'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium">
        {new Date(report.generated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
      </span>
      <span className="text-xs text-[#A19EA6]">{relativeDate(report.generated_at)}</span>
    </div>
    <p className="text-xs text-[#88858C] mt-0.5 line-clamp-1">{(report.keywords || []).join(', ')}</p>
  </button>
);

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export const TrendsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [latestReports, setLatestReports] = useState([]);
  const [clientReports, setClientReports] = useState([]);
  const [activeReportId, setActiveReportId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  // Obtener clientes de la agencia
  const fetchClients = useCallback(async () => {
    try {
      const resp = await apiFetch('/clients');
      setClients(resp?.data ?? resp ?? []);
    } catch (e) {
      console.error('Error fetching clients', e);
    }
  }, []);

  // Obtener reporte más reciente de cada cliente
  const fetchLatestReports = useCallback(async () => {
    try {
      const data = await getLatestTrendReports();
      setLatestReports(data);
    } catch (e) {
      console.error('Error fetching latest reports', e);
    }
  }, []);

  // Obtener reportes de un cliente específico
  const fetchClientReports = useCallback(async (clientId) => {
    try {
      const data = await getTrendReports(clientId, 7);
      setClientReports(data);
      if (data.length > 0) setActiveReportId(data[0].id);
    } catch (e) {
      console.error('Error fetching client reports', e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchLatestReports()]);
      setIsLoading(false);
    };
    load();
  }, [fetchClients, fetchLatestReports]);

  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'all') {
      fetchClientReports(selectedClientId);
    } else {
      setClientReports([]);
      setActiveReportId(null);
    }
  }, [selectedClientId, fetchClientReports]);

  // Polling mientras el job está corriendo
  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(async () => {
      if (selectedClientId !== 'all') {
        await fetchClientReports(selectedClientId);
      }
      await fetchLatestReports();
    }, 6000);
    return () => clearInterval(interval);
  }, [pollingActive, selectedClientId, fetchClientReports, fetchLatestReports]);

  const handleRunAll = async () => {
    setIsRunning(true);
    setPollingActive(true);
    try {
      await runTrendsNow();
      toast.success('Análisis iniciado. Los resultados aparecerán en unos segundos.', { duration: 4000 });
      // Detener polling luego de 90s
      setTimeout(() => {
        setPollingActive(false);
        setIsRunning(false);
      }, 90000);
    } catch (e) {
      toast.error('Error al iniciar el análisis: ' + e.message);
      setIsRunning(false);
      setPollingActive(false);
    }
  };

  const handleRunForClient = async () => {
    if (!selectedClientId || selectedClientId === 'all') return;
    setIsRunning(true);
    setPollingActive(true);
    try {
      await runTrendsForClient(selectedClientId);
      toast.success('Análisis iniciado para este cliente.', { duration: 4000 });
      setTimeout(() => {
        setPollingActive(false);
        setIsRunning(false);
      }, 60000);
    } catch (e) {
      toast.error('Error: ' + e.message);
      setIsRunning(false);
      setPollingActive(false);
    }
  };

  const handleRun = selectedClientId === 'all' ? handleRunAll : handleRunForClient;

  // Reporte activo a mostrar
  const activeReport = selectedClientId === 'all'
    ? latestReports.find(r => r.id === activeReportId) || latestReports[0] || null
    : clientReports.find(r => r.id === activeReportId) || null;

  const historyList = selectedClientId === 'all' ? latestReports : clientReports;
  const hasReports = historyList.length > 0;

  // Nombre del cliente activo en vista "all"
  const activeClientName = selectedClientId === 'all'
    ? activeReport?.clients?.name || null
    : clients.find(c => c.id === selectedClientId)?.name || null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4 space-y-6">
      {/* ─── Page Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#222024] border border-[#2C2930] flex items-center justify-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-[#9BA1BA]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F3F2F4]">Tendencias</h1>
            <p className="text-xs text-[#A19EA6]">
              Búsqueda diaria automática · Actualizado a las 7:00 AM
            </p>
          </div>
          {pollingActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 text-xs text-[#8FA89B]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FA89B]" />
              Procesando...
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Client selector */}
          <div className="relative">
            <select
              id="trends-client-selector"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="input-cyber appearance-none pr-8 pl-3 py-2 text-sm cursor-pointer min-w-[180px]"
            >
              <option value="all">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A19EA6] pointer-events-none" />
          </div>

          {/* Run button */}
          <button
            id="run-trends-btn"
            onClick={handleRun}
            disabled={isRunning}
            className="btn-cyber flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <BoltIcon className="h-4 w-4" />
            )}
            {isRunning
              ? 'Generando...'
              : selectedClientId === 'all'
                ? 'Actualizar todos'
                : 'Actualizar cliente'}
          </button>
        </div>
      </motion.div>

      {/* ─── Main content ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#9BA1BA] border-t-transparent animate-spin" />
            <p className="text-sm text-[#A19EA6]">Cargando reportes...</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRun} isRunning={isRunning} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

          {/* ─── Sidebar: History / Client list ─── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-[#2C2930] bg-[#1A181C] p-4 space-y-1 lg:sticky lg:top-24"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A19EA6] px-1 mb-3">
              {selectedClientId === 'all' ? 'Por cliente' : 'Historial'}
            </p>

            {historyList.map(report => (
              <HistoryItem
                key={report.id}
                report={report}
                isActive={report.id === (activeReportId || historyList[0]?.id)}
                onClick={() => setActiveReportId(report.id)}
              />
            ))}
          </motion.div>

          {/* ─── Main report view ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0"
          >
            {/* Client name badge (when viewing all) */}
            {selectedClientId === 'all' && activeClientName && (
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A19EA6]">Cliente</span>
                <span className="px-2 py-0.5 rounded-full bg-[#222024] border border-[#2C2930] text-xs text-[#F3F2F4] font-medium">
                  {activeClientName}
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeReport ? (
                <ReportView key={activeReport.id} report={activeReport} />
              ) : (
                <motion.div
                  key="no-report"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-24 text-[#A19EA6] text-sm"
                >
                  Seleccioná un reporte para ver los detalles.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ─── Info footer ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 rounded-xl border border-[#2C2930] bg-[#1A181C] p-4 text-xs text-[#A19EA6]"
      >
        <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#9BA1BA]" />
        <div>
          <span className="font-semibold text-[#F3F2F4]">Actualización automática diaria</span>
          {' '}— El sistema ejecuta una búsqueda cada mañana a las 7:00 AM usando Tavily + GPT para analizar 
          tendencias relevantes a la industria y pilares de contenido de cada cliente.
          Los resultados se guardan automáticamente en Supabase.
        </div>
      </motion.div>
    </div>
  );
};
