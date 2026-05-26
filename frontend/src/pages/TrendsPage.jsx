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
  CalendarIcon,
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
import { createScheduleItem } from '../api/schedule.js';
import { generateCopyFromTrend } from '../api/ai.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const relativeDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Hace unos momentos';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const relevanceBadge = (rel) => {
  const map = {
    alta:  { label: 'Relevancia Alta',  cls: 'bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25' },
    media: { label: 'Relevancia Media', cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
    baja:  { label: 'Relevancia Baja',  cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
  };
  return map[rel] || map.media;
};

const groupReportsByDate = (reportsList) => {
  const groups = {};
  reportsList.forEach(report => {
    const d = new Date(report.generated_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    let dateStr = '';
    if (d.toDateString() === today.toDateString()) {
      dateStr = 'Hoy';
    } else if (d.toDateString() === yesterday.toDateString()) {
      dateStr = 'Ayer';
    } else {
      dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(report);
  });
  return groups;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center bg-[#0F172A]/40 border border-white/[0.06] rounded-2xl p-8 max-w-2xl mx-auto"
  >
    <div className="w-16 h-16 rounded-xl bg-slate-800/60 border border-white/[0.08] flex items-center justify-center mb-6">
      <ArrowTrendingUpIcon className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="text-base font-bold text-white mb-2">Sin reportes generados</h3>
    <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed">
      El sistema genera reportes automáticamente cada mañana, o puedes iniciar un análisis global sobre tu marca en este instante.
    </p>
    <button
      onClick={onRun}
      disabled={isRunning}
      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
    >
      {isRunning ? (
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
      ) : (
        <BoltIcon className="h-4 w-4" />
      )}
      {isRunning ? 'Buscando tendencias...' : 'Generar tendencias ahora'}
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────
// Modal for Event Creation
// ─────────────────────────────────────────────

const CreateEventModal = ({ isOpen, onClose, insight, clientId }) => {
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [creativeIdea, setCreativeIdea] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('IG');
  const [priority, setPriority] = useState('medium');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Trigger AI copy generation when insight or channel changes
  useEffect(() => {
    if (!insight || !clientId) return;

    // Set fallback/initial values first
    setTitle(`Idea: ${insight.title.slice(0, 45)}`);
    setCopy(`💡 Tendencia: ${insight.title}\n\n📝 Descripción: ${insight.description}\n\n🚀 Acción sugerida: ${insight.suggested_action || 'N/A'}`);
    setCreativeIdea(`Crear una publicación o video sobre "${insight.title}".`);
    setGoal('Aprovechar tendencia hiper-reciente de mercado.');
    setDescription(`💡 Tendencia original: ${insight.title}\n🔗 Fuente: ${insight.source_url || 'N/A'}`);
    
    // Set scheduled date for tomorrow at 10:00 AM local
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const tzOffset = tomorrow.getTimezoneOffset() * 60000; // in ms
    const localISODate = (new Date(tomorrow.getTime() - tzOffset)).toISOString().slice(0, 16);
    setScheduledAt(localISODate);

    // Call AI to generate professional copy and creative idea
    const fetchAICopy = async () => {
      setIsGeneratingAI(true);
      try {
        const response = await generateCopyFromTrend(clientId, {
          trendTitle: insight.title,
          trendDescription: insight.description,
          suggestedAction: insight.suggested_action,
          channel,
        });

        if (response) {
          if (response.title) setTitle(response.title);
          if (response.copy) setCopy(response.copy);
          if (response.creative_idea) setCreativeIdea(response.creative_idea);
          if (response.objective) setGoal(response.objective);
        }
      } catch (err) {
        console.warn('Error fetching AI copy, using fallback:', err.message);
      } finally {
        setIsGeneratingAI(false);
      }
    };

    fetchAICopy();
  }, [insight, clientId, channel]);

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
        copy: copy.trim(),
        creative_idea: creativeIdea.trim(),
        goal: goal.trim(),
        description: description.trim(),
        channel,
        priority,
        scheduled_at: new Date(scheduledAt),
        status: 'pendiente',
      });
      toast.success('¡Idea de contenido calendarizada con éxito!');
      onClose();
    } catch (err) {
      toast.error(`Error al agregar al cronograma: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-[#0F172A] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-slate-900/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📅</span> Calendarizar Contenido Sugerido
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">La IA redactará contenido específico adaptado al tono de tu cliente</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm transition-colors">✕</button>
        </div>

        {/* AI Processing Status Banner */}
        <div className="px-6 py-2.5 bg-[#1E293B]/60 border-b border-white/[0.04] flex items-center justify-between text-[11px]">
          {isGeneratingAI ? (
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span>🤖 Redactando copy e idea creativa con IA para {channel}...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#10B981] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>✨ ¡Borrador optimizado con IA y alineado con la identidad de marca!</span>
            </div>
          )}
          <span className="text-[9px] text-slate-500 font-bold uppercase">OpenAI GPT-4o</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título de la Publicación</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              placeholder="Ej. Post sobre tendencia de mercado"
              required
            />
          </div>

          {/* Grid: Channel, Priority & Scheduled Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Red Social / Canal</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Social Media Post Copy */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Copia / Copy de Redes Sociales (Redactado por IA)</label>
              {isGeneratingAI && <span className="text-[9px] text-blue-400 animate-pulse font-medium">Re-redactando...</span>}
            </div>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors h-28 resize-none leading-relaxed"
              placeholder="El copy completo listo para publicar..."
            />
          </div>

          {/* Creative Idea / Visual Focus */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Idea Creativa / Enfoque de Diseño Visual (Sugerido por IA)</label>
            <textarea
              value={creativeIdea}
              onChange={e => setCreativeIdea(e.target.value)}
              className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-colors h-16 resize-none leading-relaxed"
              placeholder="Detalle visual o idea del formato del video/imagen..."
            />
          </div>

          {/* Strategic Goal / Objective */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Objetivo Estratégico de la Publicación</label>
            <input
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              placeholder="Ej. Aumentar alcance orgánico"
            />
          </div>

          {/* Context original read-only */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Contexto de la Tendencia (Original)</span>
            <p className="text-[10px] text-slate-400 leading-relaxed font-normal truncate">{insight.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06] mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingAI}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarIcon className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Agregando...' : 'Programar en Calendario'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Report View Component with Premium Carousel
// ─────────────────────────────────────────────

const ReportView = ({ report, onCreateEvent }) => {
  if (!report) return null;
  const insights = report.insights || [];
  const [activeSlide, setActiveSlide] = useState(0);

  // Reiniciar slide al cambiar de reporte
  useEffect(() => {
    setActiveSlide(0);
  }, [report.id]);

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] bg-slate-900/20 p-8 text-center">
        <LightBulbIcon className="h-8 w-8 text-slate-500 mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">Sin tendencias nuevas hoy</p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          La búsqueda web del último mes no arrojó tendencias nuevas o diferentes respecto al análisis anterior. ¡El mercado se mantiene estable! Volveremos a buscar automáticamente mañana.
        </p>
      </div>
    );
  }

  const activeInsight = insights[activeSlide];
  const badge = relevanceBadge(activeInsight.relevance);
  const reportTitle = report.title || `Análisis: ${(report.keywords || []).slice(0, 3).join(', ') || 'General'}`;

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % insights.length);
  };

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + insights.length) % insights.length);
  };

  return (
    <div className="space-y-6">
      {/* Title & Metadata */}
      <div className="border-b border-white/[0.04] pb-4">
        <h3 className="text-lg font-bold text-white tracking-tight">{reportTitle}</h3>
        
        <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-900/60 border border-white/[0.05] px-3 py-1 rounded-lg">
            <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
            {formatDate(report.generated_at)}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 border border-white/[0.05] px-3 py-1 rounded-lg">
            <SignalIcon className="h-3.5 w-3.5 text-slate-500" />
            <span>{insights.length} tendencia{insights.length !== 1 ? 's' : ''} detectada{insights.length !== 1 ? 's' : ''}</span>
          </span>
        </div>

        {/* Keywords */}
        {report.keywords && report.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {report.keywords.map((kw, idx) => (
              <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-300 border border-white/[0.04] px-2 py-0.5 rounded">
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1E293B]/10 p-4">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Resumen Ejecutivo del Escaneo</p>
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{report.summary}</p>
      </div>

      {/* CAROUSEL CONTROLLER */}
      <div className="relative max-w-2xl mx-auto w-full pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-[#1E293B]/15 border border-white/[0.08] rounded-2xl p-6 md:p-8 flex flex-col gap-5 min-h-[460px] shadow-lg relative overflow-hidden"
          >
            {/* Header info inside slide */}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10">
                Tendencia {activeSlide + 1} de {insights.length}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-base md:text-lg font-bold text-white leading-snug">{activeInsight.title}</h4>

            {/* Description */}
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">{activeInsight.description}</p>

            {/* Extra information & Mockup draft */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="rounded-xl bg-slate-900/60 border border-white/[0.04] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1">
                  <span>💡</span> Borrador de Copia / Acción
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {activeInsight.suggested_action || "Crear publicación enfocada sobre este ángulo en las redes."}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/60 border border-white/[0.04] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#10B981] mb-1 flex items-center gap-1">
                  <span>🎯</span> Enfoque y Justificación
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Esta idea aprovecha el interés hiper-reciente del último mes detectado en internet, adaptándose al tono e identidad de la marca.
                </p>
              </div>
            </div>

            {/* Source & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto pt-4 border-t border-white/[0.04]">
              {/* Source Link */}
              {activeInsight.source_url ? (
                <a
                  href={activeInsight.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors truncate max-w-full sm:max-w-[45%]"
                >
                  <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{activeInsight.source_url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                </a>
              ) : (
                <span />
              )}

              {/* Calendarize trigger */}
              <button
                onClick={() => onCreateEvent(activeInsight)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl px-5 py-2.5 transition-colors shadow-md"
              >
                <CalendarIcon className="h-4 w-4" />
                Calendarizar esta Idea
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation buttons */}
        <div className="flex items-center justify-between gap-4 mt-4 px-2">
          <button
            onClick={prevSlide}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/20 bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold"
            title="Anterior"
          >
            ←
          </button>
          
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {insights.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeSlide ? 'bg-blue-500 w-4' : 'bg-white/10 hover:bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/20 bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold"
            title="Siguiente"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// History Item Component with Larger Titles
// ─────────────────────────────────────────────

const HistoryItem = ({ report, isActive, onClick, isGlobal }) => {
  const title = report.title || `Análisis: ${(report.keywords || []).slice(0, 2).join(', ') || 'General'}`;
  const subtitle = isGlobal && report.clients?.name
    ? report.clients.name
    : (report.keywords || []).slice(0, 2).join(' · ');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 ${
        isActive
          ? 'bg-slate-800/40 border-white/[0.08] text-white shadow-md'
          : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`}>
          {title}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className={`text-[10px] font-medium truncate max-w-[80%] ${isGlobal && report.clients?.name ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
          {subtitle}
        </span>
        <span className="text-[9px] text-slate-500 whitespace-nowrap">
          {new Date(report.generated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
        </span>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
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
  const [customKeywords, setCustomKeywords] = useState('');
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const data = await getTrendReports(clientId, 15);
      setClientReports(data);
      if (data.length > 0) {
        setActiveReportId(data[0].id);
      }
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
    setCustomKeywords('');
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
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingActive, selectedClientId, fetchClientReports, fetchLatestReports]);

  const handleRunAll = async () => {
    setIsRunning(true);
    setPollingActive(true);
    try {
      await runTrendsNow();
      toast.success('Análisis global iniciado para todos los clientes de la agencia.', { duration: 4000 });
      // Detener polling luego de 60s
      setTimeout(() => {
        setPollingActive(false);
        setIsRunning(false);
      }, 60000);
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
      await runTrendsForClient(selectedClientId, customKeywords);
      toast.success('Análisis de tendencias iniciado. Buscando información hiper-reciente del último mes...', { duration: 4500 });
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

  const handleRun = selectedClientId === 'all' ? handleRunAll : handleRunForClient;

  const handleCreateEvent = (insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

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

  // Agrupado de historial por fecha
  const groupedReports = groupReportsByDate(historyList);

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4 space-y-6">
      {/* ─── Page Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E293B]/40 border border-white/[0.08] flex items-center justify-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Monitoreo General de Tendencias</h1>
            <p className="text-xs text-slate-400">
              Escaneo web diario mediante inteligencia artificial para tu cartera de clientes
            </p>
          </div>
          {pollingActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Escaneando fuentes...
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Client selector */}
          <div className="relative">
            <select
              id="trends-client-selector"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl pl-3 pr-9 py-2 text-sm text-white focus:outline-none transition-colors cursor-pointer appearance-none min-w-[200px]"
            >
              <option value="all">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Custom Keywords Search Override (Only for specific client) */}
          {selectedClientId !== 'all' && (
            <div className="relative w-full sm:w-64">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={customKeywords}
                onChange={e => setCustomKeywords(e.target.value)}
                placeholder="Buscar conceptos customizados..."
                className="w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                disabled={isRunning}
              />
            </div>
          )}

          {/* Run button */}
          <button
            id="run-trends-btn"
            onClick={handleRun}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            {isRunning ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <BoltIcon className="h-4 w-4" />
            )}
            {isRunning
              ? 'Escaneando...'
              : selectedClientId === 'all'
                ? 'Actualizar Todos'
                : 'Buscar Tendencias'}
          </button>
        </div>
      </motion.div>

      {/* ─── Main content layout ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Recuperando reportes de tendencias...</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRun} isRunning={isRunning} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          {/* ─── Sidebar: History / Client list grouped by Date ─── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-white/[0.06] bg-[#121A2C]/20 p-4 space-y-4 lg:sticky lg:top-24 max-h-[75vh] overflow-y-auto"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-b border-white/[0.04] pb-2">
              {selectedClientId === 'all' ? 'Último reporte por cliente' : 'Historial de Búsquedas'}
            </p>

            <div className="space-y-4">
              {Object.keys(groupedReports).map((dateGroup) => (
                <div key={dateGroup} className="space-y-1">
                  {/* Date marker Header with Larger Title */}
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-1 py-0.5">
                    {dateGroup}
                  </h4>
                  
                  <div className="space-y-1 pl-0.5 border-l border-white/[0.03]">
                    {groupedReports[dateGroup].map(report => (
                      <HistoryItem
                        key={report.id}
                        report={report}
                        isActive={report.id === (activeReportId || historyList[0]?.id)}
                        onClick={() => setActiveReportId(report.id)}
                        isGlobal={selectedClientId === 'all'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Main report view ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0 bg-[#0F172A]/20 border border-white/[0.04] rounded-2xl p-6 lg:p-8"
          >
            {/* Client name badge (when viewing all) */}
            {selectedClientId === 'all' && activeClientName && (
              <div className="flex items-center gap-2 mb-4 bg-slate-900/50 border border-white/[0.05] w-fit px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cliente analizado:</span>
                <span className="text-xs text-white font-bold">
                  {activeClientName}
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeReport ? (
                <ReportView
                  key={activeReport.id}
                  report={activeReport}
                  onCreateEvent={handleCreateEvent}
                />
              ) : (
                <motion.div
                  key="no-report"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-24 text-slate-400 text-xs"
                >
                  Selecciona un reporte de tendencias para ver los detalles estratégicos.
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
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#1E293B]/20 p-5 text-xs text-slate-400 max-w-4xl"
      >
        <CalendarDaysIcon className="h-5 w-5 flex-shrink-0 text-slate-500 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white">Monitoreo Automatizado de Tendencias</span>
          {' '}— Cada mañana a las 7:00 AM, el sistema ejecuta de forma automática una consulta web hiper-reciente del último mes a través de Tavily y GPT, adaptándose a la industria y pilares de marca de cada cliente para identificar oportunidades estratégicas de marketing digital.
        </div>
      </motion.div>

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
            clientId={selectedClientId === 'all' ? activeReport?.client_id : selectedClientId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
