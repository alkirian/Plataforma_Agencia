// src/components/trends/TrendsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  LightBulbIcon,
  LinkIcon,
  CalendarDaysIcon,
  BoltIcon,
  ClockIcon,
  SignalIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { runTrendsForClient, getTrendReports } from '../../api/trends.js';
import { createScheduleItem } from '../../api/schedule.js';

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
// Empty State Component
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center bg-[#1A181C] border border-[#2C2930] rounded-2xl p-8"
  >
    <div className="w-16 h-16 rounded-2xl bg-[#222024] border border-[#2C2930] flex items-center justify-center mb-5">
      <ArrowTrendingUpIcon className="h-8 w-8 text-[#A19EA6]" />
    </div>
    <h3 className="text-lg font-semibold text-[#F3F2F4] mb-2">Sin reportes de tendencias</h3>
    <p className="text-sm text-[#A19EA6] max-w-sm mb-6 leading-relaxed">
      El sistema genera reportes automáticamente cada mañana, o podés iniciar un análisis manual sobre tu marca en este instante.
    </p>
    <button
      onClick={onRun}
      disabled={isRunning}
      className="btn-cyber flex items-center gap-2 px-5 py-2 text-sm font-semibold disabled:opacity-50"
    >
      {isRunning ? (
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
      ) : (
        <BoltIcon className="h-4 w-4" />
      )}
      {isRunning ? 'Generando...' : 'Analizar tendencias ahora'}
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────
// Modal for Event Creation
// ─────────────────────────────────────────────

const CreateEventModal = ({ isOpen, onClose, insight, clientId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('IG');
  const [priority, setPriority] = useState('medium');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar campos al abrir
  useEffect(() => {
    if (insight) {
      setTitle(`Post: ${insight.title.slice(0, 40)}`);
      setDescription(
        `💡 Tendencia: ${insight.title}\n\n📝 Descripción: ${insight.description}\n\n🚀 Acción sugerida: ${insight.suggested_action || 'N/A'}\n\n🔗 Fuente: ${insight.source_url || 'N/A'}`
      );
      setChannel('IG');
      setPriority('medium');
      // Prefilar para mañana a las 10:00 AM local
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      // Formato local YYYY-MM-DDTHH:MM para datetime-local
      const tzOffset = tomorrow.getTimezoneOffset() * 60000; // en ms
      const localISODate = (new Date(tomorrow.getTime() - tzOffset)).toISOString().slice(0, 16);
      setScheduledAt(localISODate);
    }
  }, [insight]);

  if (!isOpen || !insight) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toast.error('Por favor, completa el título y la fecha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createScheduleItem(clientId, {
        title: title.trim(),
        description: description.trim(),
        channel,
        priority,
        scheduled_at: new Date(scheduledAt),
        status: 'pendiente',
      });
      toast.success('¡Idea de contenido agregada al Cronograma con éxito!');
      onClose();
    } catch (err) {
      toast.error(`Error al agregar al cronograma: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#161517] border border-[#2C2930] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2C2930] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F3F2F4]">Generar Contenido para Calendario</h3>
          <button onClick={onClose} className="text-[#A19EA6] hover:text-[#F3F2F4] text-xs">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A19EA6] uppercase tracking-wider mb-1.5">Título del Evento</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-cyber w-full py-2 px-3 text-sm"
              placeholder="Ej. Post sobre tendencia IA"
              required
            />
          </div>

          {/* Grid: Channel & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A19EA6] uppercase tracking-wider mb-1.5">Canal</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="input-cyber w-full py-2 px-3 text-sm cursor-pointer"
              >
                <option value="IG">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="YT">YouTube</option>
                <option value="FB">Facebook</option>
                <option value="Twitter">X / Twitter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A19EA6] uppercase tracking-wider mb-1.5">Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="input-cyber w-full py-2 px-3 text-sm cursor-pointer"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-xs font-semibold text-[#A19EA6] uppercase tracking-wider mb-1.5">Fecha y Hora de Publicación</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="input-cyber w-full py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Description / Copy */}
          <div>
            <label className="block text-xs font-semibold text-[#A19EA6] uppercase tracking-wider mb-1.5">Estructura & Copia (Draft)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-cyber w-full py-2 px-3 text-xs h-32 resize-none"
              placeholder="Descripción del post..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2930] mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#A19EA6] hover:text-[#F3F2F4] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyber px-5 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarIcon className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Creando...' : 'Generar en Calendario'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Insight Card Component
// ─────────────────────────────────────────────

const InsightCard = ({ insight, index, onCreateEvent }) => {
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

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-[#2C2930]/30">
        {/* Source link */}
        {insight.source_url ? (
          <a
            href={insight.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#9BA1BA] hover:text-[#F3F2F4] transition-colors truncate max-w-[50%]"
          >
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{insight.source_url.replace(/^https?:\/\//, '').split('/')[0]}</span>
          </a>
        ) : (
          <span />
        )}

        {/* Generate event button */}
        <button
          onClick={() => onCreateEvent(insight)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#8FA89B] hover:text-[#F3F2F4] bg-[#8FA89B]/10 hover:bg-[#8FA89B]/20 border border-[#8FA89B]/30 px-2.5 py-1 rounded-md transition-all duration-150"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Crear Contenido
        </button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Report View Component
// ─────────────────────────────────────────────

const ReportView = ({ report, onCreateEvent }) => {
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
          <p className="text-sm text-[#F3F2F4] font-medium mb-1">Sin tendencias nuevas hoy</p>
          <p className="text-xs text-[#A19EA6] max-w-md mx-auto leading-relaxed">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highInsights.map((ins, i) => (
              <InsightCard key={ins.id || i} insight={ins} index={i} onCreateEvent={onCreateEvent} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restInsights.map((ins, i) => (
              <InsightCard key={ins.id || i} insight={ins} index={highInsights.length + i} onCreateEvent={onCreateEvent} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// History Item Component
// ─────────────────────────────────────────────

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
// Main Section Component
// ─────────────────────────────────────────────

export const TrendsSection = ({ clientId }) => {
  const [client, setClient] = useState(null);
  const [reports, setReports] = useState([]);
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
      const { data } = await getTrendReports(clientId, 1); // solo para tener contexto rápido
      // Si hay reportes anteriores, los cargamos
      const allReports = await getTrendReports(clientId, 10);
      setReports(allReports);
      if (allReports.length > 0) setActiveReportId(allReports[0].id);
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
      const allReports = await getTrendReports(clientId, 10);
      setReports(allReports);
      if (allReports.length > 0) {
        // Si hay un reporte nuevo, ponerlo como activo
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
      // Cargamos el cliente actual para pasárselo a la API
      const resp = await fetch(`/api/v1/clients/${clientId}`).then(r => r.json());
      const clientObj = resp?.data ?? resp;

      if (!clientObj) throw new Error('No se pudo obtener la información de marca del cliente.');

      await runTrendsForClient(clientId, customKeywords);
      toast.success('Análisis de tendencias iniciado. Esto tomará unos segundos...', { duration: 4000 });

      // Detener polling luego de 60s
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

  const handleCreateEvent = (insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  // Reporte activo
  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || null;
  const hasReports = reports.length > 0;

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2930]/30 pb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#222024] border border-[#2C2930] flex items-center justify-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-[#9BA1BA]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F3F2F4]">Tendencias del Último Mes</h2>
            <p className="text-xs text-[#A19EA6]">
              Monitoreo web diario automatizado · Filtrado por industria y pilares de contenido
            </p>
          </div>
          {pollingActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 text-xs text-[#8FA89B]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FA89B]" />
              Analizando...
            </motion.div>
          )}
        </div>

        {/* Run button and Custom Keywords input */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <input
            type="text"
            value={customKeywords}
            onChange={e => setCustomKeywords(e.target.value)}
            placeholder="Conceptos/palabras clave (opcional)"
            className="input-cyber py-2 px-3 text-xs w-full sm:w-64"
            disabled={isRunning}
          />
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="btn-cyber flex items-center gap-2 px-4 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isRunning ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BoltIcon className="h-3.5 w-3.5" />
            )}
            {isRunning ? 'Analizando...' : 'Buscar Tendencias'}
          </button>
        </div>
      </motion.div>

      {/* ─── Main Content ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#9BA1BA] border-t-transparent animate-spin" />
            <p className="text-xs text-[#A19EA6]">Cargando tendencias del cliente...</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRun} isRunning={isRunning} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* History Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-[#2C2930] bg-[#1A181C] p-4 space-y-1 lg:sticky lg:top-24"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A19EA6] px-1 mb-3">
              Análisis Anteriores
            </p>
            {reports.map(report => (
              <HistoryItem
                key={report.id}
                report={report}
                isActive={report.id === (activeReportId || reports[0]?.id)}
                onClick={() => setActiveReportId(report.id)}
              />
            ))}
          </motion.div>

          {/* Main report view */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {activeReport ? (
                <ReportView
                  key={activeReport.id}
                  report={activeReport}
                  onCreateEvent={handleCreateEvent}
                />
              ) : (
                <div className="text-center py-20 text-xs text-[#A19EA6]">
                  Selecciona un análisis de la barra lateral para explorar los insights.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── Event Drafting Modal ─── */}
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
