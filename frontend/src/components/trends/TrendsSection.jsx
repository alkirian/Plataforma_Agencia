// src/components/trends/TrendsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  LightBulbIcon,
  LinkIcon,
  CalendarDaysIcon,
  SignalIcon,
  BoltIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  FireIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { runTrendsForClient, getTrendReports } from '../../api/trends.js';
import { createScheduleItem } from '../../api/schedule.js';
import { generateCopyFromTrend } from '../../api/ai.js';
import { apiFetch } from '../../api/apiFetch.js';

// ─────────────────────────────────────────────
// Strategic Coherence Engine
// ─────────────────────────────────────────────

const computeStrategicMetrics = (insight, client) => {
  const brandInfo = client?.brand_info || {};
  const industry = (client?.industry || '').toLowerCase();
  const audience = (brandInfo.target_audience || '').toLowerCase();
  const pillars = (brandInfo.content_pillars || []).map(p => String(p || '').toLowerCase());
  const title = (insight.title || '').toLowerCase();
  const desc = (insight.description || '').toLowerCase();
  const action = (insight.suggested_action || '').toLowerCase();

  // 1. Calculate IMPACT POTENTIAL (Engagement/Reach)
  let impactScore = 55; // default base
  if (insight.relevance === 'alta') impactScore = 85;
  else if (insight.relevance === 'media') impactScore = 70;

  // Boosts based on strategic value matching target audience
  let impactReasons = [];
  if (audience) {
    if (
      audience.includes('joven') ||
      audience.includes('digital') ||
      audience.includes('millennial') ||
      audience.includes('gen z')
    ) {
      if (
        desc.includes('viral') ||
        desc.includes('meme') ||
        desc.includes('video') ||
        desc.includes('tendencia') ||
        action.includes('tiktok') ||
        action.includes('reel')
      ) {
        impactScore += 10;
        impactReasons.push('Alto enganche potencial en tu segmento demográfico digital joven.');
      }
    }
    if (
      audience.includes('profesional') ||
      audience.includes('b2b') ||
      audience.includes('empresa') ||
      audience.includes('corporativo')
    ) {
      if (
        desc.includes('estudio') ||
        desc.includes('informe') ||
        desc.includes('análisis') ||
        desc.includes('datos') ||
        action.includes('linkedin')
      ) {
        impactScore += 10;
        impactReasons.push(
          'Gran relevancia y autoridad estratégica para tu audiencia corporativa/B2B.'
        );
      }
    }
  }

  // Boosts based on matching brand content pillars
  let matchedPillar = null;
  for (const pillar of pillars) {
    if (
      pillar &&
      (title.includes(pillar) ||
        desc.includes(pillar) ||
        pillar
          .split(' ')
          .some(word => word.length > 4 && (title.includes(word) || desc.includes(word))))
    ) {
      impactScore += 12;
      matchedPillar = pillar;
      impactReasons.push(`Alineación directa con tu pilar de contenido "${pillar}".`);
      break;
    }
  }

  impactScore = Math.min(98, impactScore);

  // 2. Calculate FEASIBILITY (Viabilidad)
  let feasibilityScore = 75; // default base
  let formatLabel = 'Publicación Estándar';

  if (
    action.includes('video') ||
    action.includes('reel') ||
    action.includes('tiktok') ||
    action.includes('grabar') ||
    action.includes('grabación')
  ) {
    feasibilityScore = 60; // video requires recording
    formatLabel = 'Video Corto (Reel/TikTok)';
  } else if (
    action.includes('carrusel') ||
    action.includes('infografía') ||
    action.includes('diseño') ||
    action.includes('visual')
  ) {
    feasibilityScore = 80;
    formatLabel = 'Carrusel / Infografía';
  } else if (
    action.includes('post') ||
    action.includes('texto') ||
    action.includes('linkedin') ||
    action.includes('artículo')
  ) {
    feasibilityScore = 90;
    formatLabel = 'Post de Texto / Redacción';
  }

  // Adjust feasibility based on preferred platforms
  const preferredPlatforms = (brandInfo.preferred_platforms || []).map(p =>
    String(p || '').toLowerCase()
  );
  if (preferredPlatforms.length > 0) {
    if (
      formatLabel.includes('Video') &&
      (preferredPlatforms.includes('tiktok') ||
        preferredPlatforms.includes('instagram') ||
        preferredPlatforms.includes('youtube'))
    ) {
      feasibilityScore += 8; // set up for video!
    }
    if (formatLabel.includes('Carrusel') && preferredPlatforms.includes('instagram')) {
      feasibilityScore += 5;
    }
    if (formatLabel.includes('Post') && preferredPlatforms.includes('linkedin')) {
      feasibilityScore += 5;
    }
  }

  feasibilityScore = Math.min(95, feasibilityScore);

  // 3. Generate a deeply professional RATIONALE
  let rationale = '';
  if (matchedPillar) {
    rationale = `Esta tendencia es sumamente estratégica para ${client?.name || 'tu marca'} debido a su coincidencia directa con tu pilar de contenido "${matchedPillar.toUpperCase()}". `;
  } else if (industry) {
    rationale = `Al pertenecer al sector de ${industry.toUpperCase()}, esta temática representa un punto clave de conversación actual que permite posicionar a ${client?.name || 'tu marca'} como un referente actualizado en el rubro. `;
  } else {
    rationale = `Esta tendencia representa una oportunidad valiosa de posicionamiento oportuno. `;
  }

  if (formatLabel.includes('Video')) {
    rationale += `Implementar un ${formatLabel.toLowerCase()} impulsará el algoritmo de forma orgánica, ya que es el formato de mayor retención para captar la atención de tu audiencia.`;
  } else if (formatLabel.includes('Carrusel')) {
    rationale += `Diseñar un ${formatLabel.toLowerCase()} facilitará la educación de tu audiencia mediante slides visuales de alto valor, aumentando el número de guardados y compartidos.`;
  } else {
    rationale += `Publicar un post enfocado en este copy capitalizará la conversación activa del sector de manera rápida y sin complicaciones de producción.`;
  }

  let alignmentText = 'Alineación Estratégica';
  let alignmentCls = 'text-blue-400 bg-blue-500/5 border-blue-500/10';
  if (impactScore >= 85) {
    alignmentText = 'Oportunidad de Oro (Match Alto)';
    alignmentCls = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/15';
  } else if (impactScore < 70) {
    alignmentText = 'Alineación Específica';
    alignmentCls = 'text-slate-400 bg-slate-500/5 border-slate-500/10';
  }

  return {
    impactScore,
    feasibilityScore,
    rationale,
    formatLabel,
    alignmentText,
    alignmentCls,
    matchedPillar,
  };
};

const getChannelInfo = (suggestedAction, client) => {
  const act = (suggestedAction || '').toLowerCase();

  if (act.includes('tiktok')) {
    return {
      label: 'TikTok Video',
      cls: 'bg-slate-950/80 text-cyan-400 border border-cyan-400/30',
    };
  } else if (act.includes('linkedin')) {
    return {
      label: 'LinkedIn Post',
      cls: 'bg-[#0077B5]/10 text-blue-400 border border-[#0077B5]/35',
    };
  } else if (
    act.includes('carrusel') ||
    act.includes('reel') ||
    act.includes('instagram') ||
    act.includes('ig')
  ) {
    const isReel = act.includes('video') || act.includes('reel');
    return {
      label: isReel ? 'Instagram Reel' : 'Instagram Carrusel',
      cls: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 border border-pink-500/25',
    };
  } else if (act.includes('youtube') || act.includes('yt') || act.includes('short')) {
    return {
      label: 'YouTube Short',
      cls: 'bg-red-500/10 text-red-400 border border-red-500/25',
    };
  }

  // Fallback based on client platforms
  const platforms = (client?.brand_info?.preferred_platforms || []).map(p =>
    String(p || '').toLowerCase()
  );
  if (platforms.includes('instagram')) {
    return {
      label: 'Instagram Post',
      cls: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 border border-pink-500/25',
    };
  } else if (platforms.includes('linkedin')) {
    return {
      label: 'LinkedIn Post',
      cls: 'bg-[#0077B5]/10 text-blue-400 border border-[#0077B5]/35',
    };
  }

  return {
    label: 'Post Recomendado',
    cls: 'bg-slate-800 text-slate-300 border border-white/[0.06]',
  };
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const relativeDate = iso => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Hace unos momentos';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const relevanceBadge = rel => {
  const map = {
    alta: {
      label: 'Relevancia Alta',
      cls: 'bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25',
    },
    media: {
      label: 'Relevancia Media',
      cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    },
    baja: {
      label: 'Relevancia Baja',
      cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    },
  };
  return map[rel] || map.media;
};

const groupReportsByDate = reportsList => {
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
// Empty State Component
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
    if (!insight) return;

    // Set fallback/initial values first
    setTitle(`Idea: ${insight.title.slice(0, 45)}`);
    setCopy(
      `💡 Tendencia: ${insight.title}\n\n📝 Descripción: ${insight.description}\n\n🚀 Acción sugerida: ${insight.suggested_action || 'N/A'}`
    );
    setCreativeIdea(`Crear una publicación o video sobre "${insight.title}".`);
    setGoal('Aprovechar tendencia hiper-reciente de mercado.');
    setDescription(
      `💡 Tendencia original: ${insight.title}\n🔗 Fuente: ${insight.source_url || 'N/A'}`
    );

    // Set scheduled date for tomorrow at 10:00 AM local
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const tzOffset = tomorrow.getTimezoneOffset() * 60000; // in ms
    const localISODate = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
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

  const handleSubmit = async e => {
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className='w-full max-w-2xl bg-[#0F172A] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]'
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-slate-900/40'>
          <div>
            <h3 className='text-sm font-bold text-white flex items-center gap-2'>
              <span>📅</span> Calendarizar Contenido Sugerido
            </h3>
            <p className='text-[10px] text-slate-400 mt-0.5'>
              La IA redactará contenido específico adaptado al tono de tu cliente
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-white text-sm transition-colors'
          >
            ✕
          </button>
        </div>

        {/* AI Processing Status Banner */}
        <div className='px-6 py-2.5 bg-[#1E293B]/60 border-b border-white/[0.04] flex items-center justify-between text-[11px]'>
          {isGeneratingAI ? (
            <div className='flex items-center gap-2 text-blue-400 font-medium'>
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping' />
              <span>🤖 Redactando copy e idea creativa con IA para {channel}...</span>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-[#10B981] font-medium'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#10B981]' />
              <span>✨ ¡Borrador optimizado con IA y alineado con la identidad de marca!</span>
            </div>
          )}
          <span className='text-[9px] text-slate-500 font-bold uppercase'>OpenAI GPT-4o</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4 overflow-y-auto flex-1'>
          {/* Title */}
          <div>
            <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
              Título de la Publicación
            </label>
            <input
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
              placeholder='Ej. Post sobre tendencia de mercado'
              required
            />
          </div>

          {/* Grid: Channel, Priority & Scheduled Date */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
                Red Social / Canal
              </label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer'
              >
                <option value='IG'>Instagram</option>
                <option value='TikTok'>TikTok</option>
                <option value='LinkedIn'>LinkedIn</option>
                <option value='YT'>YouTube</option>
                <option value='FB'>Facebook</option>
                <option value='Twitter'>X / Twitter</option>
              </select>
            </div>
            <div>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
                Prioridad
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer'
              >
                <option value='low'>Baja</option>
                <option value='medium'>Media</option>
                <option value='high'>Alta</option>
                <option value='urgente'>Urgente</option>
              </select>
            </div>
            <div>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
                Fecha y Hora
              </label>
              <input
                type='datetime-local'
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors'
                required
              />
            </div>
          </div>

          {/* Social Media Post Copy */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                Copia / Copy de Redes Sociales (Redactado por IA)
              </label>
              {isGeneratingAI && (
                <span className='text-[9px] text-blue-400 animate-pulse font-medium'>
                  Re-redactando...
                </span>
              )}
            </div>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors h-28 resize-none leading-relaxed'
              placeholder='El copy completo listo para publicar...'
            />
          </div>

          {/* Creative Idea / Visual Focus */}
          <div>
            <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
              Idea Creativa / Enfoque de Diseño Visual (Sugerido por IA)
            </label>
            <textarea
              value={creativeIdea}
              onChange={e => setCreativeIdea(e.target.value)}
              className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-colors h-16 resize-none leading-relaxed'
              placeholder='Detalle visual o idea del formato del video/imagen...'
            />
          </div>

          {/* Strategic Goal / Objective */}
          <div>
            <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
              Objetivo Estratégico de la Publicación
            </label>
            <input
              type='text'
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className='w-full bg-[#1E293B]/40 border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
              placeholder='Ej. Aumentar alcance orgánico'
            />
          </div>

          {/* Context original read-only */}
          <div className='p-3 bg-slate-950/60 rounded-xl border border-white/[0.03] space-y-1'>
            <span className='text-[9px] font-bold text-slate-500 uppercase tracking-wide'>
              Contexto de la Tendencia (Original)
            </span>
            <p className='text-[10px] text-slate-400 leading-relaxed font-normal truncate'>
              {insight.description}
            </p>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06] mt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSubmitting || isGeneratingAI}
              className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {isSubmitting ? (
                <ArrowPathIcon className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <CalendarIcon className='h-3.5 w-3.5' />
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
// Report View Component with Premium 2-Column Grid
// ─────────────────────────────────────────────

const ReportView = ({ report, client, onCreateEvent }) => {
  if (!report) return null;
  const insights = report.insights || [];

  const [selectedPlatform, setSelectedPlatform] = useState('Todas');
  const [expandedCardId, setExpandedCardId] = useState(null);

  if (insights.length === 0) {
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

    // Fallback based on client preference if available
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
  
  // Stable follower count simulation based on client name
  const nameHash = (client?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const followersCount = ((nameHash % 90) + 10).toFixed(1);
  const followers = `${followersCount}k seguidores`;

  const filteredInsights = insights.filter(insight => {
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

      {/* Platform filters */}
      <div className='flex flex-wrap gap-2.5 py-1'>
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
      </div>

      {/* Grid of Trend Cards */}
      {filteredInsights.length === 0 ? (
        <div className='rounded-xl border border-dashed border-white/[0.08] bg-slate-900/20 p-8 text-center'>
          <LightBulbIcon className='h-8 w-8 text-slate-500 mx-auto mb-3' />
          <p className='text-sm text-white font-semibold mb-1'>No hay tendencias para este canal</p>
          <p className='text-xs text-slate-400 max-w-md mx-auto leading-relaxed'>
            No se encontraron tendencias recomendadas para {selectedPlatform} en este escaneo. ¡Prueba seleccionando otra plataforma!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {filteredInsights.map((insight, idx) => {
            const metrics = computeStrategicMetrics(insight, client);
            const channel = getChannelInfo(insight.suggested_action, client);
            const isExpanded = expandedCardId === (insight.id || idx);

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

                {/* Header row: Badge + Percentage Ring */}
                <div className='flex items-center justify-between gap-3'>
                  <span
                    className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${channel.cls}`}
                  >
                    {channel.label}
                  </span>

                  <div className='relative w-9 h-9 flex items-center justify-center shrink-0' title={`Match score: ${metrics.impactScore}%`}>
                    <svg className='w-full h-full transform -rotate-90'>
                      <circle cx='18' cy='18' r={radiusBadge} className='stroke-white/[0.04]' strokeWidth='2' fill='transparent' />
                      <circle cx='18' cy='18' r={radiusBadge} stroke='currentColor' className='text-purple-400' strokeWidth='2' strokeDasharray={circBadge} strokeDashoffset={offsetBadge} strokeLinecap='round' fill='transparent' />
                    </svg>
                    <span className='absolute text-[9px] font-black text-white'>{metrics.impactScore}%</span>
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
                    {/* Progress bars */}
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


// ─────────────────────────────────────────────
// History Item Component
// ─────────────────────────────────────────────

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

      // Fetch client details in parallel/sequence
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
      await runTrendsForClient(clientId, customKeywords);
      toast.success(
        'Análisis de tendencias iniciado. Buscando información hiper-reciente del último mes...',
        { duration: 4505 }
      );

      // Detener polling luego de 45s
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
      {/* ─── Header & Search override ─── */}
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

      {/* ─── Main Content Layout ─── */}
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
                  {/* Date marker Header */}
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
