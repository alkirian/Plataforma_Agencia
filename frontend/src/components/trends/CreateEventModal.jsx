// src/components/trends/CreateEventModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createScheduleItem } from '../../api/schedule.js';
import { generateCopyFromTrend } from '../../api/ai.js';

export const CreateEventModal = ({ isOpen, onClose, insight, clientId }) => {
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
