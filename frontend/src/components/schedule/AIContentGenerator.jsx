import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateIdeas } from '../../api/ai';
import { getClientBrandProfile } from '../../api/clients';

const normalizeDateTime = date => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  parsed.setHours(9, 0, 0, 0);
  return parsed.toISOString();
};

const normalizeFormat = (formatStr) => {
  if (!formatStr) return 'Post Estático';
  const s = formatStr.toLowerCase();
  if (s.includes('reel') || s.includes('tiktok') || s.includes('short') || s.includes('video')) return 'Reel / TikTok';
  if (s.includes('carrusel') || s.includes('carousel')) return 'Carrusel';
  if (s.includes('historia') || s.includes('story')) return 'Historia';
  if (s.includes('entrevista')) return 'Entrevista';
  if (s.includes('influencer')) return 'Video Influencer';
  if (s.includes('cobertura')) return 'Cobertura de Evento';
  if (s.includes('estatico') || s.includes('post') || s.includes('imagen')) return 'Post Estático';
  return 'Post Estático';
};

const normalizePlatform = (channel) => {
  if (!channel) return 'Instagram';
  const c = channel.toUpperCase();
  if (c === 'IG' || c.includes('INSTAGRAM')) return 'Instagram';
  if (c === 'TIKTOK' || c.includes('TIKTOK')) return 'TikTok';
  if (c === 'YT' || c.includes('YOUTUBE') || c.includes('SHORTS')) return 'YouTube';
  if (c === 'FB' || c.includes('FACEBOOK')) return 'Facebook';
  if (c === 'LI' || c.includes('LINKEDIN')) return 'LinkedIn';
  return 'Instagram';
};

const toDateInputValue = date => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDateInput = value => {
  const dateText = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  const parsed = new Date(`${dateText}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (date, reference) => (
  date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
);

const buildMonthDatePool = (monthDate, includeNextMonth = false) => {
  const now = new Date();
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const firstDay = isSameMonth(now, monthDate)
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : monthStart;
  const safeStart = firstDay > monthEnd ? monthStart : firstDay;
  const dates = [];

  for (let cursor = new Date(safeStart); cursor <= monthEnd; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(toDateInputValue(cursor));
  }

  if (includeNextMonth) {
    const nextMonthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0);
    for (let cursor = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1); cursor <= nextMonthEnd; cursor.setDate(cursor.getDate() + 1)) {
      dates.push(toDateInputValue(cursor));
    }
  }

  return dates;
};

const shuffled = values => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const assignDatesToIdeas = ({ ideas, requestedDates, monthDate, includeNextMonth }) => {
  const validRequestedDates = requestedDates
    .map(parseDateInput)
    .filter(Boolean)
    .map(toDateInputValue);
  const requestedSet = new Set(validRequestedDates);
  const pool = shuffled(buildMonthDatePool(monthDate, includeNextMonth).filter(date => !requestedSet.has(date)));
  let poolIndex = 0;

  return ideas.map((idea, index) => {
    const assignedDate = validRequestedDates[index] || pool[poolIndex++] || toDateInputValue(monthDate);
    return {
      ...idea,
      scheduled_at: assignedDate,
      _dateWasChosen: Boolean(validRequestedDates[index]),
    };
  });
};

const buildImagePrompt = idea => [
  `Imagen publicitaria para redes sociales.`,
  `Titulo del post: ${idea.title || 'Contenido de marca'}.`,
  idea.format ? `Formato editorial: ${idea.format}.` : '',
  idea.channel ? `Canal: ${idea.channel}.` : '',
  idea.objective ? `Objetivo: ${idea.objective}.` : '',
  idea.copy ? `Contexto del copy: ${idea.copy}` : '',
  'Crear una pieza visual profesional, coherente con la marca, sin texto pequeno ilegible y sin logos inventados.'
].filter(Boolean).join(' ');

export const AIContentGenerator = ({ isOpen, onClose, clientId, currentDate, existingEvents, onCreateItems }) => {
  const [topic, setTopic] = useState('Ideas para el calendario mensual');
  const [quantity, setQuantity] = useState(8);
  const [ideas, setIdeas] = useState([]);
  const [selected, setSelected] = useState({});
  const [generateImages, setGenerateImages] = useState({});
  const [chosenDates, setChosenDates] = useState([]);
  const [allowNextMonth, setAllowNextMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChosenDates(prev => Array.from({ length: quantity }, (_, index) => prev[index] || ''));
  }, [isOpen, quantity]);

  useEffect(() => {
    if (!isOpen) return;
    setIdeas([]);
    setSelected({});
    setGenerateImages({});
    setAllowNextMonth(false);
  }, [currentDate, isOpen]);

  useEffect(() => {
    if (!isOpen || !clientId) return;

    const loadBrandProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await getClientBrandProfile(clientId);
        setBrandProfile(response?.data || {});
      } catch (_error) {
        setBrandProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadBrandProfile();
  }, [clientId, isOpen]);

  const identityStatus = useMemo(() => {
    const profile = brandProfile || {};
    const values = [
      profile.business_description,
      profile.target_audience,
      profile.brand_voice,
      profile.reference_style,
      ...(Array.isArray(profile.content_pillars) ? profile.content_pillars : []),
      ...(Array.isArray(profile.content_goals) ? profile.content_goals : []),
      ...(Array.isArray(profile.products_services) ? profile.products_services : []),
    ];
    const usefulText = values.map(value => String(value || '').trim()).filter(Boolean).join(' ');
    const ready = usefulText.length >= 80;

    return {
      ready,
      score: Math.min(100, Math.round((usefulText.length / 220) * 100)),
      missingMessage: 'Completa la identidad del cliente antes de generar: negocio, audiencia, tono, pilares y productos/servicios.',
    };
  }, [brandProfile]);

  const monthContext = useMemo(() => {
    const monthDate = currentDate instanceof Date && !Number.isNaN(currentDate.getTime()) ? currentDate : new Date();
    const month = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const pickedDates = chosenDates.filter(Boolean).join(', ') || 'Sin fechas elegidas por el usuario';
    const existing = (existingEvents || []).map(event => {
      const date = event.start ? new Date(event.start).toISOString().slice(0, 10) : 'sin fecha';
      return `${date}: ${event.title}`;
    });

    return [
      `Mes de trabajo: ${month}`,
      `Mes permitido principal: ${monthKey}`,
      `Cantidad deseada: ${quantity}`,
      `Fechas elegidas por el usuario: ${pickedDates}`,
      allowNextMonth ? 'El usuario autorizo usar el proximo mes si faltan dias disponibles.' : 'Priorizar exclusivamente el mes de trabajo.',
      ...existing.slice(0, 20),
    ];
  }, [allowNextMonth, chosenDates, currentDate, existingEvents, quantity]);

  const datePlanning = useMemo(() => {
    const monthDate = currentDate instanceof Date && !Number.isNaN(currentDate.getTime()) ? currentDate : new Date();
    const currentMonthPool = buildMonthDatePool(monthDate, false);
    const validChosenInMonth = chosenDates
      .map(parseDateInput)
      .filter(date => date && isSameMonth(date, monthDate))
      .length;

    return {
      monthDate,
      currentMonthPool,
      remainingDays: currentMonthPool.length,
      overflowsCurrentMonth: Math.max(quantity - validChosenInMonth, 0) > currentMonthPool.length,
      minDate: currentMonthPool[0] || toDateInputValue(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)),
      maxDate: toDateInputValue(new Date(monthDate.getFullYear(), monthDate.getMonth() + (allowNextMonth ? 2 : 1), 0)),
      monthLabel: monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      nextMonthLabel: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    };
  }, [allowNextMonth, chosenDates, currentDate, quantity]);

  const selectedImageCount = useMemo(() => (
    ideas.reduce((count, _idea, index) => (
      selected[index] && generateImages[index] ? count + 1 : count
    ), 0)
  ), [generateImages, ideas, selected]);

  const ensureDateCapacity = () => {
    if (!datePlanning.overflowsCurrentMonth || allowNextMonth) return true;
    const proceed = window.confirm(
      `Hay ${quantity} piezas para generar, pero quedan ${datePlanning.remainingDays} dias disponibles en ${datePlanning.monthLabel}. ¿Quieres proseguir usando fechas de ${datePlanning.nextMonthLabel} para las piezas restantes?`
    );
    if (proceed) setAllowNextMonth(true);
    return proceed;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Escribe un tema o direccion para la IA.');
      return;
    }
    if (!identityStatus.ready) {
      toast.error(identityStatus.missingMessage);
      return;
    }
    if (!ensureDateCapacity()) return;

    setLoading(true);
    try {
      const response = await generateIdeas(clientId, {
        userPrompt: `${topic.trim()}. Genera ${quantity} piezas para ${datePlanning.monthLabel}.`,
        monthContext,
        quantity,
      });
      const nextIdeas = Array.isArray(response) ? response.slice(0, quantity) : [];
      const ideasWithDates = assignDatesToIdeas({
        ideas: nextIdeas,
        requestedDates: chosenDates,
        monthDate: datePlanning.monthDate,
        includeNextMonth: allowNextMonth || datePlanning.overflowsCurrentMonth,
      });
      setIdeas(ideasWithDates);
      setSelected(Object.fromEntries(nextIdeas.map((_, index) => [index, true])));
      setGenerateImages({});
      if (!nextIdeas.length) toast('La IA no devolvio ideas para revisar.');
    } catch (error) {
      toast.error(error.message || 'No se pudieron generar ideas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSelected = async () => {
    const selectedIdeaEntries = ideas
      .map((idea, index) => ({ idea, index }))
      .filter(({ index }) => selected[index]);

    if (!selectedIdeaEntries.length) {
      toast.error('Selecciona al menos una pieza.');
      return;
    }

    if (!ensureDateCapacity()) return;

    const datedIdeas = assignDatesToIdeas({
      ideas: selectedIdeaEntries.map(({ idea }) => idea),
      requestedDates: chosenDates.filter((_, index) => selected[index]),
      monthDate: datePlanning.monthDate,
      includeNextMonth: allowNextMonth || datePlanning.overflowsCurrentMonth,
    });

    setCreating(true);
    try {
      await onCreateItems(datedIdeas.map((idea, index) => ({
        title: idea.title || 'Pieza sin titulo',
        copy: idea.copy || '',
        creative_idea: idea.title || '',
        goal: idea.objective || '',
        format: normalizeFormat(idea.format),
        platforms: normalizePlatform(idea.channel),
        channel: idea.channel || 'IG',
        status: idea.status || 'en-diseño',
        scheduled_at: normalizeDateTime(idea.scheduled_at),
        generateImage: Boolean(generateImages[selectedIdeaEntries[index].index]),
        imagePrompt: buildImagePrompt(idea),
        imageAspectRatio: idea.channel === 'TikTok' ? '9:16' : '1:1',
      })));
      setIdeas([]);
      setSelected({});
      setGenerateImages({});
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0' enterTo='opacity-100' leave='ease-in duration-150' leaveFrom='opacity-100' leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/70' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0 scale-95' enterTo='opacity-100 scale-100' leave='ease-in duration-150' leaveFrom='opacity-100 scale-100' leaveTo='opacity-0 scale-95'>
              <Dialog.Panel className='w-full max-w-5xl rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-strong p-5 shadow-2xl'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <Dialog.Title className='text-xl font-semibold text-text-primary'>Generar contenido con IA</Dialog.Title>
                    <p className='mt-1 text-sm text-text-muted'>La IA usa la identidad del cliente, documentos y eventos existentes.</p>
                  </div>
                  <button onClick={onClose} className='rounded-md px-2 py-1 text-text-muted hover:bg-white/5 hover:text-text-primary'>Cerrar</button>
                </div>

                <div className='mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_auto]'>
                  <input value={topic} onChange={e => setTopic(e.target.value)} className='rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30' placeholder='Ej: contenido educativo para captar leads' />
                  <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className='rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'>
                    {[4, 6, 8, 10, 12].map(value => <option key={value} value={value}>{value} piezas</option>)}
                  </select>
                  <button onClick={handleGenerate} disabled={loading || loadingProfile || !identityStatus.ready} className='btn-cyber rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'>
                    {loading ? 'Generando...' : 'Generar'}
                  </button>
                </div>

                <div className='mt-4 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft p-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-text-primary'>Fechas opcionales</p>
                      <p className='mt-1 text-xs text-text-muted'>
                        Si eliges menos fechas que piezas, las restantes se ubican al azar en {datePlanning.monthLabel}.
                      </p>
                    </div>
                    <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>
                      {datePlanning.remainingDays} dias disponibles
                    </span>
                  </div>

                  <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
                    {Array.from({ length: quantity }, (_, index) => (
                      <label key={`ai-date-${index}`} className='block'>
                        <span className='mb-1 block text-[11px] text-text-muted'>Pieza {index + 1}</span>
                        <input
                          type='date'
                          value={chosenDates[index] || ''}
                          min={datePlanning.minDate}
                          max={datePlanning.maxDate}
                          onChange={e => setChosenDates(prev => {
                            const next = Array.from({ length: quantity }, (_, itemIndex) => prev[itemIndex] || '');
                            next[index] = e.target.value;
                            return next;
                          })}
                          className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-strong px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
                        />
                      </label>
                    ))}
                  </div>

                  {datePlanning.overflowsCurrentMonth && !allowNextMonth && (
                    <div className='mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100'>
                      Hay mas piezas que dias restantes en {datePlanning.monthLabel}. Al generar o crear se pedira confirmacion para usar {datePlanning.nextMonthLabel}.
                    </div>
                  )}
                  {allowNextMonth && (
                    <div className='mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100'>
                      Autorizado usar {datePlanning.nextMonthLabel} si faltan fechas.
                    </div>
                  )}
                </div>

                <div className={`mt-4 rounded-lg border p-3 text-sm ${identityStatus.ready ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/25 bg-amber-500/10 text-amber-100'}`}>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-semibold'>
                      {loadingProfile ? 'Revisando identidad...' : identityStatus.ready ? 'Identidad lista para generar' : 'Identidad incompleta'}
                    </span>
                    {!loadingProfile && <span>{identityStatus.score}% de contexto util</span>}
                  </div>
                  {!identityStatus.ready && (
                    <p className='mt-1 text-xs text-amber-100/80'>{identityStatus.missingMessage}</p>
                  )}
                </div>

                <div className='mt-5 max-h-[55vh] space-y-3 overflow-y-auto pr-1'>
                  {ideas.map((idea, index) => (
                    <motion.label key={`${idea.title}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='block rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft p-4'>
                      <div className='flex items-start gap-3'>
                        <input type='checkbox' checked={Boolean(selected[index])} onChange={e => setSelected(prev => ({ ...prev, [index]: e.target.checked }))} className='mt-1 h-4 w-4' />
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='text-sm font-semibold text-text-primary'>{idea.title || 'Pieza sin titulo'}</h3>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>{idea.channel || 'IG'}</span>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>{idea.format || 'Formato libre'}</span>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>{idea.scheduled_at || 'Sin fecha'}</span>
                          </div>
                          <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted'>{idea.copy || 'Sin copy generado.'}</p>
                          {idea.objective && <p className='mt-2 text-xs text-text-muted'>Objetivo: {idea.objective}</p>}
                          <div className='mt-3 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-strong px-3 py-2 text-xs text-text-muted' onClick={e => e.stopPropagation()}>
                            <input
                              type='checkbox'
                              checked={Boolean(generateImages[index])}
                              onChange={e => setGenerateImages(prev => ({ ...prev, [index]: e.target.checked }))}
                              className='h-4 w-4'
                            />
                            <span>Generar imagen del posteo al crear</span>
                          </div>
                        </div>
                      </div>
                    </motion.label>
                  ))}
                  {!ideas.length && (
                    <div className='rounded-lg border border-dashed border-[color:var(--color-border-subtle)] p-8 text-center text-sm text-text-muted'>
                      Genera propuestas para revisarlas antes de crear eventos.
                    </div>
                  )}
                </div>

                <div className='mt-5 flex justify-end gap-3 border-t border-[color:var(--color-border-subtle)] pt-4'>
                  <button onClick={onClose} className='rounded-lg border border-[color:var(--color-border-subtle)] px-4 py-2 text-sm text-text-muted hover:text-text-primary'>Cancelar</button>
                  <button onClick={handleCreateSelected} disabled={creating || !ideas.length} className='btn-cyber rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'>
                    {creating
                      ? selectedImageCount ? 'Creando y generando...' : 'Creando...'
                      : selectedImageCount ? `Crear y generar ${selectedImageCount} imagen${selectedImageCount > 1 ? 'es' : ''}` : 'Crear seleccionadas'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
