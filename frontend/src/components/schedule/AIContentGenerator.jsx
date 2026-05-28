import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateIdeas } from '../../api/ai';
import { getClientBrandProfile } from '../../api/clients';
import { getSpecialDatesForMonth } from '../../utils/specialDates';
import { toDateInputValue, normalizeFormat, normalizePlatform } from './scheduleUtils';

const normalizeDateTime = date => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  parsed.setHours(9, 0, 0, 0);
  return parsed.toISOString();
};

const parseDateInput = value => {
  const dateText = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  const parsed = new Date(`${dateText}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonthHelper = (date, reference) => {
  if (!date || !reference) return false;
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
};

const buildMonthDatePool = (monthDate, includeNextMonth = false) => {
  const now = new Date();
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const firstDay = isSameMonthHelper(now, monthDate)
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : monthStart;
  const safeStart = firstDay > monthEnd ? monthStart : firstDay;
  const dates = [];

  for (let cursor = new Date(safeStart); cursor <= monthEnd; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(toDateInputValue(cursor));
  }

  if (includeNextMonth) {
    const nextMonthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0);
    for (
      let cursor = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      cursor <= nextMonthEnd;
      cursor.setDate(cursor.getDate() + 1)
    ) {
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
  const pool = shuffled(
    buildMonthDatePool(monthDate, includeNextMonth).filter(date => !requestedSet.has(date))
  );
  let poolIndex = 0;

  return ideas.map((idea, index) => {
    const assignedDate =
      validRequestedDates[index] || pool[poolIndex++] || toDateInputValue(monthDate);
    return {
      ...idea,
      scheduled_at: assignedDate,
      _dateWasChosen: Boolean(validRequestedDates[index]),
    };
  });
};

const buildImagePrompt = idea =>
  [
    `Imagen publicitaria para redes sociales.`,
    `Titulo del post: ${idea.title || 'Contenido de marca'}.`,
    idea.format ? `Formato editorial: ${idea.format}.` : '',
    idea.channel ? `Canal: ${idea.channel}.` : '',
    idea.objective ? `Objetivo: ${idea.objective}.` : '',
    idea.copy ? `Contexto del copy: ${idea.copy}` : '',
    'Crear una pieza visual profesional, coherente con la marca, sin texto pequeno ilegible y sin logos inventados.',
  ]
    .filter(Boolean)
    .join(' ');

export const AIContentGenerator = ({
  isOpen,
  onClose,
  clientId,
  currentDate,
  existingEvents,
  onCreateItems,
}) => {
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
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    return currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
      ? currentDate
      : new Date();
  });
  const [selectedSpecialDates, setSelectedSpecialDates] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setChosenDates(prev => Array.from({ length: quantity }, (_, index) => prev[index] || ''));
    setCalendarViewDate(
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime()) ? currentDate : new Date()
    );
  }, [isOpen, quantity, currentDate]);

  useEffect(() => {
    if (!isOpen) return;
    setIdeas([]);
    setSelected({});
    setGenerateImages({});
    setAllowNextMonth(false);
    setSelectedSpecialDates([]);
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
    const usefulText = values
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
    const ready = usefulText.length >= 80;

    return {
      ready,
      score: Math.min(100, Math.round((usefulText.length / 220) * 100)),
      missingMessage:
        'Completa la identidad del cliente antes de generar: negocio, audiencia, tono, pilares y productos/servicios.',
    };
  }, [brandProfile]);

  const monthContext = useMemo(() => {
    const monthDate =
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
        ? currentDate
        : new Date();
    const month = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const pickedDates =
      chosenDates.filter(Boolean).join(', ') || 'Sin fechas elegidas por el usuario';
    const existing = (existingEvents || []).map(event => {
      const date = event.start ? new Date(event.start).toISOString().slice(0, 10) : 'sin fecha';
      return `${date}: ${event.title}`;
    });

    return [
      `Mes de trabajo: ${month}`,
      `Mes permitido principal: ${monthKey}`,
      `Cantidad deseada: ${quantity}`,
      `Fechas elegidas por el usuario: ${pickedDates}`,
      allowNextMonth
        ? 'El usuario autorizo usar el proximo mes si faltan dias disponibles.'
        : 'Priorizar exclusivamente el mes de trabajo.',
      selectedSpecialDates.length > 0
        ? `Fechas especiales/feriados que DEBES conmemorar en la planificación (obligatoriamente): ${selectedSpecialDates.map(d => `${d.day ? `${d.day} de ` : ''}${month}: ${d.title} (Categoría: ${d.category}, Descripción: ${d.desc})`).join('; ')}`
        : '',
      ...existing.slice(0, 20),
    ].filter(Boolean);
  }, [allowNextMonth, chosenDates, currentDate, existingEvents, quantity, selectedSpecialDates]);

  const datePlanning = useMemo(() => {
    const monthDate =
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
        ? currentDate
        : new Date();
    const currentMonthPool = buildMonthDatePool(monthDate, false);
    const validChosenInMonth = chosenDates
      .map(parseDateInput)
      .filter(date => date && isSameMonthHelper(date, monthDate)).length;

    return {
      monthDate,
      currentMonthPool,
      remainingDays: currentMonthPool.length,
      overflowsCurrentMonth: Math.max(quantity - validChosenInMonth, 0) > currentMonthPool.length,
      minDate:
        currentMonthPool[0] ||
        toDateInputValue(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)),
      maxDate: toDateInputValue(
        new Date(monthDate.getFullYear(), monthDate.getMonth() + (allowNextMonth ? 2 : 1), 0)
      ),
      monthLabel: monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      nextMonthLabel: new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        1
      ).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    };
  }, [allowNextMonth, chosenDates, currentDate, quantity]);

  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: prevDate,
        dateString: toDateInputValue(prevDate),
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDayDate = new Date(year, month, day);
      days.push({
        date: currentDayDate,
        dateString: toDateInputValue(currentDayDate),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        dateString: toDateInputValue(nextDate),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarViewDate]);

  const handleCalendarDayClick = dateString => {
    const clickedDate = parseDateInput(dateString);
    const monthDate =
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
        ? currentDate
        : new Date();
    const isNextMonthClick = clickedDate && !isSameMonthHelper(clickedDate, monthDate);

    // Si hace clic en el próximo mes y no estaba habilitado, lo habilitamos dinámicamente
    let currentMaxDate = datePlanning.maxDate;
    if (isNextMonthClick && !allowNextMonth) {
      const nextMonthMaxDate = toDateInputValue(
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0)
      );
      if (dateString >= datePlanning.minDate && dateString <= nextMonthMaxDate) {
        setAllowNextMonth(true);
        currentMaxDate = nextMonthMaxDate;
        toast('Se habilitó el uso del próximo mes al seleccionar esta fecha.');
      }
    }

    if (dateString < datePlanning.minDate || dateString > currentMaxDate) {
      toast.error('Esta fecha está fuera del rango de planificación permitido.');
      return;
    }

    const existingIndex = chosenDates.indexOf(dateString);
    if (existingIndex !== -1) {
      setChosenDates(prev => {
        const next = [...prev];
        next[existingIndex] = '';
        return next;
      });
      return;
    }

    const firstEmptyIndex = chosenDates.findIndex(d => !d);
    if (firstEmptyIndex !== -1) {
      setChosenDates(prev => {
        const next = [...prev];
        next[firstEmptyIndex] = dateString;
        return next;
      });
    } else {
      toast.error(
        `Ya asignaste fechas para las ${quantity} piezas. Deselecciona una para elegir otra.`
      );
    }
  };

  const hasEventOnDay = dateString => {
    if (!existingEvents) return false;
    return existingEvents.some(event => {
      const eventDate = event.start ? new Date(event.start).toISOString().slice(0, 10) : '';
      return eventDate === dateString;
    });
  };

  const formatDateString = str => {
    if (!str) return 'Sin asignar (al azar)';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const specialDatesList = useMemo(() => {
    return getSpecialDatesForMonth(calendarViewDate, brandProfile?.industry || '');
  }, [calendarViewDate, brandProfile?.industry]);

  const nextMonthDate = useMemo(() => {
    return new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
  }, [calendarViewDate]);

  const nextMonthSpecialDatesList = useMemo(() => {
    return getSpecialDatesForMonth(nextMonthDate, brandProfile?.industry || '');
  }, [nextMonthDate, brandProfile?.industry]);

  const handleToggleSpecialDate = specialDate => {
    const isSelected = selectedSpecialDates.some(d => d.title === specialDate.title);

    if (isSelected) {
      setSelectedSpecialDates(prev => prev.filter(d => d.title !== specialDate.title));
    } else {
      setSelectedSpecialDates(prev => [...prev, specialDate]);
    }
  };

  const selectedImageCount = useMemo(
    () =>
      ideas.reduce(
        (count, _idea, index) => (selected[index] && generateImages[index] ? count + 1 : count),
        0
      ),
    [generateImages, ideas, selected]
  );

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
      await onCreateItems(
        datedIdeas.map((idea, index) => ({
          title: idea.title || 'Pieza sin titulo',
          copy: idea.copy || '',
          creative_idea: idea.creative_idea || idea.title || '',
          goal: idea.objective || '',
          format: normalizeFormat(idea.format),
          platforms: normalizePlatform(idea.channel),
          channel: idea.channel || 'IG',
          status: idea.status || 'en-diseño',
          scheduled_at: normalizeDateTime(idea.scheduled_at),
          generateImage: Boolean(generateImages[selectedIdeaEntries[index].index]),
          imagePrompt: buildImagePrompt(idea),
          imageAspectRatio: idea.channel === 'TikTok' ? '9:16' : '1:1',
        }))
      );
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
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/70' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-200'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-5xl rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-strong p-5 shadow-2xl'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <Dialog.Title className='text-xl font-semibold text-text-primary'>
                      Generar contenido con IA
                    </Dialog.Title>
                    <p className='mt-1 text-sm text-text-muted'>
                      La IA usa la identidad del cliente, documentos y eventos existentes.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className='rounded-md px-2 py-1 text-text-muted hover:bg-white/5 hover:text-text-primary'
                  >
                    Cerrar
                  </button>
                </div>

                <div className='mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_auto]'>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className='rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
                    placeholder='Ej: contenido educativo para captar leads'
                  />
                  <select
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className='rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
                  >
                    {[4, 6, 8, 10, 12].map(value => (
                      <option key={value} value={value}>
                        {value} piezas
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || loadingProfile || !identityStatus.ready}
                    className='btn-cyber rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'
                  >
                    {loading ? 'Generando...' : 'Generar'}
                  </button>
                </div>

                {/* 📅 Efemérides & Fechas Especiales (Mes Actual + Próximo Mes) */}
                {(specialDatesList.length > 0 || nextMonthSpecialDatesList.length > 0) && (
                  <div className='mt-4 rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 p-4 space-y-3.5'>
                    <div className='flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/10 pb-2.5'>
                      <div>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-base select-none'>📅</span>
                          <p className='text-sm font-semibold text-amber-300'>
                            Efemérides y Fechas Especiales Clave
                          </p>
                        </div>
                        <p className='mt-1 text-xs text-text-muted leading-relaxed'>
                          Hacé clic en las efemérides que querés que la IA conmemore o considere
                          para el calendario:
                        </p>
                      </div>
                      {brandProfile?.industry && (
                        <span className='rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[9px] font-bold text-amber-400'>
                          ✨ Filtrado para el sector: {brandProfile.industry}
                        </span>
                      )}
                    </div>

                    <div className='space-y-3.5 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar'>
                      {/* MES ACTUAL */}
                      {specialDatesList.length > 0 && (
                        <div className='space-y-1.5'>
                          <span className='text-[9px] font-extrabold text-amber-400/80 uppercase tracking-widest block capitalize'>
                            En {calendarViewDate.toLocaleDateString('es-ES', { month: 'long' })}{' '}
                            (Mes seleccionado):
                          </span>
                          <div className='flex flex-wrap gap-2'>
                            {specialDatesList.map((specialDate, index) => {
                              const isSelected = selectedSpecialDates.some(
                                d => d.title === specialDate.title
                              );
                              return (
                                <button
                                  key={`special-date-curr-${index}`}
                                  type='button'
                                  onClick={() => handleToggleSpecialDate(specialDate)}
                                  className={`
                                    px-3 py-1.5 text-xs rounded-xl border transition-all duration-200 text-left flex items-center gap-2 group hover:scale-[1.02] active:scale-98 cursor-pointer
                                    ${
                                      isSelected
                                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold shadow-sm shadow-amber-400/5'
                                        : specialDate.isRecommended
                                          ? 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40 text-gray-200'
                                          : 'border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:text-text-primary hover:border-white/20'
                                    }
                                  `}
                                >
                                  <input
                                    type='checkbox'
                                    checked={isSelected}
                                    readOnly
                                    className='h-3 w-3 rounded border-gray-600 text-amber-500 focus:ring-amber-500/30 bg-black/40 pointer-events-none'
                                  />
                                  <div className='leading-tight flex items-center'>
                                    <span className='font-bold'>
                                      {specialDate.isMonthLong
                                        ? '🗓️ Mes entero'
                                        : `${specialDate.day} de ${calendarViewDate.toLocaleDateString('es-ES', { month: 'short' })}`}
                                    </span>
                                    <span className='mx-1.5 opacity-40'>|</span>
                                    <span className='font-semibold text-gray-200'>
                                      {specialDate.title}
                                    </span>
                                    {specialDate.isRecommended && !isSelected && (
                                      <span className='ml-1.5 text-[8px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide'>
                                        Sugerido
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* MES SIGUIENTE */}
                      {nextMonthSpecialDatesList.length > 0 && (
                        <div className='space-y-1.5 pt-2 border-t border-amber-500/5'>
                          <span className='text-[9px] font-extrabold text-amber-400/80 uppercase tracking-widest block capitalize'>
                            En {nextMonthDate.toLocaleDateString('es-ES', { month: 'long' })}{' '}
                            (Próximo mes):
                          </span>
                          <div className='flex flex-wrap gap-2'>
                            {nextMonthSpecialDatesList.map((specialDate, index) => {
                              const isSelected = selectedSpecialDates.some(
                                d => d.title === specialDate.title
                              );
                              return (
                                <button
                                  key={`special-date-next-${index}`}
                                  type='button'
                                  onClick={() => handleToggleSpecialDate(specialDate)}
                                  className={`
                                    px-3 py-1.5 text-xs rounded-xl border transition-all duration-200 text-left flex items-center gap-2 group hover:scale-[1.02] active:scale-98 cursor-pointer
                                    ${
                                      isSelected
                                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold shadow-sm shadow-amber-400/5'
                                        : specialDate.isRecommended
                                          ? 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40 text-gray-200'
                                          : 'border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:text-text-primary hover:border-white/20'
                                    }
                                  `}
                                >
                                  <input
                                    type='checkbox'
                                    checked={isSelected}
                                    readOnly
                                    className='h-3 w-3 rounded border-gray-600 text-amber-500 focus:ring-amber-500/30 bg-black/40 pointer-events-none'
                                  />
                                  <div className='leading-tight flex items-center'>
                                    <span className='font-bold'>
                                      {specialDate.isMonthLong
                                        ? '🗓️ Mes entero'
                                        : `${specialDate.day} de ${nextMonthDate.toLocaleDateString('es-ES', { month: 'short' })}`}
                                    </span>
                                    <span className='mx-1.5 opacity-40'>|</span>
                                    <span className='font-semibold text-gray-200'>
                                      {specialDate.title}
                                    </span>
                                    {specialDate.isRecommended && !isSelected && (
                                      <span className='ml-1.5 text-[8px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide'>
                                        Sugerido
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className='mt-4 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border-subtle)] pb-3 mb-4'>
                    <div>
                      <p className='text-sm font-semibold text-text-primary'>
                        Fechas de Publicación
                      </p>
                      <p className='mt-1 text-xs text-text-muted'>
                        Hacé clic en los días del calendario para asignar fechas de publicación a
                        cada pieza.
                      </p>
                    </div>
                    <span className='rounded-md bg-white/5 px-2.5 py-1 text-[11px] font-mono text-text-muted'>
                      {chosenDates.filter(Boolean).length} de {quantity} asignadas
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6'>
                    {/* CALENDARIO INTERACTIVO */}
                    <div className='bg-surface-strong/40 border border-[color:var(--color-border-subtle)] rounded-xl p-4 flex flex-col justify-between'>
                      <div>
                        {/* Cabecera del Calendario */}
                        <div className='flex items-center justify-between mb-3 px-1'>
                          <button
                            type='button'
                            onClick={() =>
                              setCalendarViewDate(
                                prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                              )
                            }
                            className='p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-all text-xs font-bold leading-none'
                            title='Mes anterior'
                          >
                            ◀
                          </button>
                          <span className='text-xs font-bold text-text-primary uppercase tracking-wider select-none capitalize'>
                            {calendarViewDate.toLocaleDateString('es-ES', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            type='button'
                            onClick={() =>
                              setCalendarViewDate(
                                prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                              )
                            }
                            className='p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-all text-xs font-bold leading-none'
                            title='Mes siguiente'
                          >
                            ▶
                          </button>
                        </div>

                        {/* Días de la Semana */}
                        <div className='grid grid-cols-7 gap-1 text-center mb-2'>
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <span
                              key={d}
                              className='text-[10px] font-bold text-text-muted py-1 uppercase'
                            >
                              {d.slice(0, 1)}
                            </span>
                          ))}
                        </div>

                        {/* Grilla de Días */}
                        <div className='grid grid-cols-7 gap-1'>
                          {calendarDays.map((day, idx) => {
                            const isAssigned = chosenDates.includes(day.dateString);
                            const assignedIndex = chosenDates.indexOf(day.dateString);
                            const hasEvents = hasEventOnDay(day.dateString);
                            const isOutsideRange =
                              day.dateString < datePlanning.minDate ||
                              day.dateString > datePlanning.maxDate;

                            return (
                              <button
                                key={`cal-day-${idx}`}
                                type='button'
                                disabled={isOutsideRange}
                                onClick={() => handleCalendarDayClick(day.dateString)}
                                className={`
                                  relative aspect-square flex flex-col items-center justify-center text-xs font-semibold rounded-lg transition-all select-none
                                  ${day.isCurrentMonth ? 'text-text-primary' : 'text-text-muted/40'}
                                  ${
                                    isOutsideRange
                                      ? 'opacity-25 cursor-not-allowed bg-black/10'
                                      : 'hover:bg-white/5 active:scale-95'
                                  }
                                  ${
                                    isAssigned
                                      ? 'bg-[color:var(--color-accent-blue)] text-white hover:bg-[color:var(--color-accent-blue)]/80 font-bold shadow-md shadow-[color:var(--color-accent-blue)]/20'
                                      : ''
                                  }
                                `}
                              >
                                <span>{day.date.getDate()}</span>

                                {/* Indicador de pieza asignada */}
                                {isAssigned && (
                                  <span className='absolute top-1 right-1 text-[7px] leading-none bg-white text-[color:var(--color-accent-blue)] font-extrabold px-1 rounded-sm shadow-sm scale-90'>
                                    P{assignedIndex + 1}
                                  </span>
                                )}

                                {/* Indicador de post programado existente */}
                                {hasEvents && !isAssigned && (
                                  <span
                                    className='absolute bottom-1 w-1 h-1 bg-amber-400 rounded-full animate-pulse'
                                    title='Post existente'
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Leyendas */}
                      <div className='mt-4 pt-3 border-t border-[color:var(--color-border-subtle)] flex items-center justify-between text-[9px] text-text-muted select-none'>
                        <div className='flex items-center gap-1'>
                          <span className='w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent-blue)]' />
                          <span>Asignado</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <span className='w-1.5 h-1.5 rounded-full bg-amber-400' />
                          <span>Post programado</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <span className='w-1.5 h-1.5 rounded-full bg-black/30 border border-white/5' />
                          <span>Muted</span>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: LISTADO DE PIEZAS */}
                    <div className='flex flex-col gap-2 max-h-[310px] overflow-y-auto pr-1.5 custom-scrollbar'>
                      {Array.from({ length: quantity }, (_, index) => {
                        const dateVal = chosenDates[index];
                        return (
                          <div
                            key={`piece-date-slot-${index}`}
                            className={`
                              p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200
                              ${
                                dateVal
                                  ? 'bg-[color:var(--color-accent-blue)]/5 border-[color:var(--color-accent-blue)]/30'
                                  : 'bg-surface-strong/30 border-[color:var(--color-border-subtle)]'
                              }
                            `}
                          >
                            <div className='flex items-center gap-2.5 min-w-0'>
                              <span
                                className={`
                                w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold select-none
                                ${
                                  dateVal
                                    ? 'bg-[color:var(--color-accent-blue)] text-white shadow-sm'
                                    : 'bg-white/5 text-text-muted'
                                }
                              `}
                              >
                                P{index + 1}
                              </span>
                              <div className='min-w-0'>
                                <p className='text-xs font-bold text-text-primary'>
                                  Pieza {index + 1}
                                </p>
                                <p
                                  className={`text-[10px] truncate ${dateVal ? 'text-[color:var(--color-accent-blue)] font-medium' : 'text-text-muted'}`}
                                >
                                  {formatDateString(dateVal)}
                                </p>
                              </div>
                            </div>

                            <div className='flex items-center gap-1.5'>
                              {/* Selector manual por si quieren elegir directamente */}
                              <div className='relative'>
                                <input
                                  type='date'
                                  value={dateVal || ''}
                                  min={datePlanning.minDate}
                                  max={datePlanning.maxDate}
                                  onChange={e =>
                                    setChosenDates(prev => {
                                      const next = Array.from(
                                        { length: quantity },
                                        (_, itemIndex) => prev[itemIndex] || ''
                                      );
                                      next[index] = e.target.value;
                                      return next;
                                    })
                                  }
                                  className='absolute inset-0 opacity-0 cursor-pointer'
                                  title='Seleccionar fecha manualmente'
                                />
                                <button
                                  type='button'
                                  className='w-6 h-6 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:text-text-primary text-[10px] flex items-center justify-center hover:bg-white/5 transition-all'
                                  title='Seleccionar fecha manualmente'
                                >
                                  📅
                                </button>
                              </div>

                              {dateVal && (
                                <button
                                  type='button'
                                  onClick={() =>
                                    setChosenDates(prev => {
                                      const next = [...prev];
                                      next[index] = '';
                                      return next;
                                    })
                                  }
                                  className='p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-muted hover:text-red-400 rounded-md transition-all text-[10px]'
                                  title='Quitar fecha'
                                >
                                  ❌
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {datePlanning.overflowsCurrentMonth && !allowNextMonth && (
                    <div className='mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-100 leading-relaxed'>
                      Hay más piezas que días restantes en {datePlanning.monthLabel}. Al generar o
                      crear se pedirá confirmación para usar {datePlanning.nextMonthLabel}.
                    </div>
                  )}
                  {allowNextMonth && (
                    <div className='mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-100 font-medium'>
                      Autorizado usar {datePlanning.nextMonthLabel} si faltan fechas.
                    </div>
                  )}
                </div>

                <div
                  className={`mt-4 rounded-lg border p-3 text-sm ${identityStatus.ready ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/25 bg-amber-500/10 text-amber-100'}`}
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-semibold'>
                      {loadingProfile
                        ? 'Revisando identidad...'
                        : identityStatus.ready
                          ? 'Identidad lista para generar'
                          : 'Identidad incompleta'}
                    </span>
                    {!loadingProfile && <span>{identityStatus.score}% de contexto util</span>}
                  </div>
                  {!identityStatus.ready && (
                    <p className='mt-1 text-xs text-amber-100/80'>
                      {identityStatus.missingMessage}
                    </p>
                  )}
                </div>

                <div className='mt-5 max-h-[55vh] space-y-3 overflow-y-auto pr-1'>
                  {ideas.map((idea, index) => (
                    <motion.label
                      key={`${idea.title}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='block rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft p-4'
                    >
                      <div className='flex items-start gap-3'>
                        <input
                          type='checkbox'
                          checked={Boolean(selected[index])}
                          onChange={e =>
                            setSelected(prev => ({ ...prev, [index]: e.target.checked }))
                          }
                          className='mt-1 h-4 w-4'
                        />
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='text-sm font-semibold text-text-primary'>
                              {idea.title || 'Pieza sin titulo'}
                            </h3>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>
                              {idea.channel || 'IG'}
                            </span>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>
                              {idea.format || 'Formato libre'}
                            </span>
                            <span className='rounded-md bg-white/5 px-2 py-1 text-[11px] text-text-muted'>
                              {idea.scheduled_at || 'Sin fecha'}
                            </span>
                          </div>
                          {idea.creative_idea && (
                            <div className='mt-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-1.5 leading-relaxed'>
                              <span className='text-sm select-none'>💡</span>
                              <div>
                                <span className='text-[10px] font-bold text-amber-400 uppercase tracking-wide block mb-0.5'>
                                  Idea Creativa
                                </span>
                                {idea.creative_idea}
                              </div>
                            </div>
                          )}
                          <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted'>
                            {idea.copy || 'Sin copy generado.'}
                          </p>
                          {idea.objective && (
                            <p className='mt-2 text-xs text-text-muted'>
                              Objetivo: {idea.objective}
                            </p>
                          )}
                          <div
                            className='mt-3 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-strong px-3 py-2 text-xs text-text-muted'
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type='checkbox'
                              checked={Boolean(generateImages[index])}
                              onChange={e =>
                                setGenerateImages(prev => ({ ...prev, [index]: e.target.checked }))
                              }
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
                  <button
                    onClick={onClose}
                    className='rounded-lg border border-[color:var(--color-border-subtle)] px-4 py-2 text-sm text-text-muted hover:text-text-primary'
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSelected}
                    disabled={creating || !ideas.length}
                    className='btn-cyber rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'
                  >
                    {creating
                      ? selectedImageCount
                        ? 'Creando y generando...'
                        : 'Creando...'
                      : selectedImageCount
                        ? `Crear y generar ${selectedImageCount} imagen${selectedImageCount > 1 ? 'es' : ''}`
                        : 'Crear seleccionadas'}
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
