import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { generateIdeas } from '../../api/ai';
import { getClientBrandProfile, updateClientBrandProfile } from '../../api/clients';
import { getSpecialDatesForMonth } from '../../utils/specialDates';
import { toDateInputValue, normalizeFormat, normalizePlatform } from './scheduleUtils';
import { aiGenerationManager } from '../../utils/aiGenerationManager';
import { useLanguage, useEscapeClose } from '../../hooks';

const shiftIndexKeys = (stateObj, discardedIndex, length) => {
  const nextObj = {};
  for (let idx = 0; idx < length; idx++) {
    if (idx < discardedIndex) {
      if (stateObj[idx] !== undefined) {
        nextObj[idx] = stateObj[idx];
      }
    } else if (idx > discardedIndex) {
      if (stateObj[idx] !== undefined) {
        nextObj[idx - 1] = stateObj[idx];
      }
    }
  }
  return nextObj;
};

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

const buildImagePrompt = (idea, t) =>
  [
    t.schedule.aiGenerator.imagePromptBase,
    idea.title ? `${t.schedule.aiGenerator.imagePromptTitle}: ${idea.title}.` : '',
    idea.format ? `${t.schedule.aiGenerator.imagePromptFormat}: ${idea.format}.` : '',
    idea.channel ? `${t.schedule.aiGenerator.imagePromptChannel}: ${idea.channel}.` : '',
    idea.objective ? `${t.schedule.aiGenerator.imagePromptObjective}: ${idea.objective}.` : '',
    idea.copy ? `${t.schedule.aiGenerator.imagePromptCopy}: ${idea.copy}` : '',
    t.schedule.aiGenerator.imagePromptFooter,
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
  clientName,
}) => {
  useEscapeClose(isOpen, onClose);
  const { t, lang } = useLanguage();
  const [topic, setTopic] = useState('');
  const [quantity, setQuantity] = useState(8);
  const [ideas, setIdeas] = useState(() => aiGenerationManager.getIdeas(clientId));
  const [selected, setSelected] = useState({});
  const [generateImages, setGenerateImages] = useState({});
  const [chosenDates, setChosenDates] = useState([]);
  const [allowNextMonth, setAllowNextMonth] = useState(false);
  const [creating, setCreating] = useState(false);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    return currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
      ? currentDate
      : new Date();
  });
  const [selectedSpecialDates, setSelectedSpecialDates] = useState([]);
  const [showSpecialDates, setShowSpecialDates] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [individualRefinements, setIndividualRefinements] = useState({});
  const [individualRefining, setIndividualRefining] = useState({});

  const loading = aiGenerationManager.isGenerating(clientId);

  useEffect(() => {
    if (!isOpen) return;
    setChosenDates(prev => Array.from({ length: quantity }, (_, index) => prev[index] || ''));
    setCalendarViewDate(
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime()) ? currentDate : new Date()
    );
  }, [isOpen, quantity, currentDate]);

  useEffect(() => {
    // Cargar ideas de este cliente si ya existen
    setIdeas(aiGenerationManager.getIdeas(clientId));
    setSelected({});
    setGenerateImages({});
    setFeedback({});
    setIndividualRefinements({});
    setIndividualRefining({});
    setAllowNextMonth(false);
    setSelectedSpecialDates([]);
    setShowSpecialDates(false);

    // Suscribirse a cambios del manager
    const unsubscribe = aiGenerationManager.subscribe(() => {
      setIdeas(aiGenerationManager.getIdeas(clientId));
    });

    return unsubscribe;
  }, [currentDate, clientId]);

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
      missingMessage: t.schedule.aiGenerator.missingIdentity,
    };
  }, [brandProfile, t]);

  const monthContext = useMemo(() => {
    const monthDate =
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
        ? currentDate
        : new Date();
    const month = monthDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const pickedDates =
      chosenDates.filter(Boolean).join(', ') || t.schedule.aiGenerator.noChosenDates;
    const existing = (existingEvents || []).map(event => {
      const date = event.start ? new Date(event.start).toISOString().slice(0, 10) : t.schedule.aiGenerator.noDate;
      return `${date}: ${event.title}`;
    });

    return [
      `${t.schedule.aiGenerator.workMonth}: ${month}`,
      `${t.schedule.aiGenerator.allowedMonth}: ${monthKey}`,
      `${t.schedule.aiGenerator.desiredQuantity}: ${quantity}`,
      `${t.schedule.aiGenerator.chosenDatesLabel}: ${pickedDates}`,
      allowNextMonth
        ? t.schedule.aiGenerator.allowNextMonthLabel
        : t.schedule.aiGenerator.prioritizeWorkMonth,
      selectedSpecialDates.length > 0
        ? `${t.schedule.aiGenerator.specialDatesAlert}: ${selectedSpecialDates.map(d => `${d.day ? `${d.day} de ` : ''}${month}: ${d.title} (Categoría: ${d.category}, Descripción: ${d.desc})`).join('; ')}`
        : '',
      ...existing.slice(0, 20),
    ].filter(Boolean);
  }, [allowNextMonth, chosenDates, currentDate, existingEvents, quantity, selectedSpecialDates, t, lang]);

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
      monthLabel: monthDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }),
      nextMonthLabel: new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        1
      ).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }),
    };
  }, [allowNextMonth, chosenDates, currentDate, quantity, lang]);

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
        toast(t.schedule.aiGenerator.toastNextMonthEnabled);
      }
    }

    if (dateString < datePlanning.minDate || dateString > currentMaxDate) {
      toast.error(t.schedule.aiGenerator.toastOutsideRange);
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
        t.schedule.aiGenerator.toastMaxDates.replace('{quantity}', quantity)
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
    if (!str) return lang === 'es' ? 'Sin asignar (al azar)' : 'Unassigned (random)';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
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
    const msg = t.schedule.aiGenerator.confirmOverflow
      .replace('{quantity}', quantity)
      .replace('{remaining}', datePlanning.remainingDays)
      .replace('{month}', datePlanning.monthLabel)
      .replace('{nextMonth}', datePlanning.nextMonthLabel);
    const proceed = window.confirm(msg);
    if (proceed) setAllowNextMonth(true);
    return proceed;
  };

  const handleGenerate = async () => {
    if (!identityStatus.ready) {
      toast.error(identityStatus.missingMessage);
      return;
    }
    if (!ensureDateCapacity()) return;

    aiGenerationManager.triggerGeneration(clientId, {
      topic,
      quantity,
      monthContext,
      chosenDates,
      monthDate: datePlanning.monthDate,
      allowNextMonth,
      overflowsCurrentMonth: datePlanning.overflowsCurrentMonth,
      clientName: clientName
    });

    onClose();
  };

  const handleDiscardIndividual = (index) => {
    const confirmDiscard = window.confirm(t.schedule.aiGenerator.confirmDiscardIndividual);
    if (!confirmDiscard) return;

    const L = ideas.length;
    setIdeas(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      aiGenerationManager.setIdeas(clientId, next);
      return next;
    });
    setSelected(prev => shiftIndexKeys(prev, index, L));
    setGenerateImages(prev => shiftIndexKeys(prev, index, L));
    setFeedback(prev => shiftIndexKeys(prev, index, L));
    setIndividualRefinements(prev => shiftIndexKeys(prev, index, L));
    setIndividualRefining(prev => shiftIndexKeys(prev, index, L));
  };

  const handleRefineIndividual = async (index) => {
    const refinement = (individualRefinements[index] || '').trim();
    if (!refinement) return;
    if (!identityStatus.ready) {
      toast.error(identityStatus.missingMessage);
      return;
    }

    setIndividualRefining(prev => ({ ...prev, [index]: true }));
    try {
      const ideaToRefine = ideas[index];
      const response = await generateIdeas(clientId, {
        userPrompt: lang === 'es' ? 'Refinar una propuesta específica del calendario.' : 'Refine a specific calendar proposal.',
        monthContext,
        quantity: 1,
        currentIdeas: [{
          title: ideaToRefine.title,
          copy: ideaToRefine.copy,
          creative_idea: ideaToRefine.creative_idea,
          scheduled_at: ideaToRefine.scheduled_at,
          channel: ideaToRefine.channel,
          format: ideaToRefine.format,
          objective: ideaToRefine.objective,
          status: ideaToRefine.status,
        }],
        refinementPrompt: refinement,
      });

      const nextIdeas = Array.isArray(response) ? response : [];
      if (!nextIdeas.length || !nextIdeas[0]) {
        toast(t.schedule.aiGenerator.toastRefineNoIdea);
        return;
      }

      const newIdea = nextIdeas[0];
      setIdeas(prev => {
        const copy = [...prev];
        copy[index] = {
          ...newIdea,
          scheduled_at: newIdea.scheduled_at || prev[index].scheduled_at || toDateInputValue(datePlanning.monthDate),
          _dateWasChosen: prev[index]._dateWasChosen,
        };
        aiGenerationManager.setIdeas(clientId, copy);
        return copy;
      });

      setIndividualRefinements(prev => ({ ...prev, [index]: '' }));
      toast.success(t.schedule.aiGenerator.successRefine);
    } catch (error) {
      toast.error(error.message || t.schedule.aiGenerator.errorRefine);
    } finally {
      setIndividualRefining(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleToggleFeedback = async (index, type) => {
    const idea = ideas[index];
    if (!idea) return;

    const currentFeedback = feedback[index];
    const newFeedbackType = currentFeedback === type ? null : type;

    setFeedback(prev => ({
      ...prev,
      [index]: newFeedbackType,
    }));

    if (!brandProfile) return;

    const simplifiedIdea = {
      title: idea.title || '',
      copy: idea.copy || '',
      creative_idea: idea.creative_idea || '',
      format: idea.format || '',
      channel: idea.channel || '',
    };

    let updatedLikes = Array.isArray(brandProfile.ai_likes) ? [...brandProfile.ai_likes] : [];
    let updatedDislikes = Array.isArray(brandProfile.ai_dislikes) ? [...brandProfile.ai_dislikes] : [];

    const isSameIdea = (a, b) => a.title === b.title && a.copy === b.copy;

    updatedLikes = updatedLikes.filter(item => !isSameIdea(item, simplifiedIdea));
    updatedDislikes = updatedDislikes.filter(item => !isSameIdea(item, simplifiedIdea));

    if (newFeedbackType === 'like') {
      updatedLikes.push(simplifiedIdea);
      if (updatedLikes.length > 10) {
        updatedLikes.shift();
      }
    } else if (newFeedbackType === 'dislike') {
      updatedDislikes.push(simplifiedIdea);
      if (updatedDislikes.length > 10) {
        updatedDislikes.shift();
      }
    }

    const updatedProfile = {
      ...brandProfile,
      ai_likes: updatedLikes,
      ai_dislikes: updatedDislikes,
    };

    setBrandProfile(updatedProfile);

    try {
      await updateClientBrandProfile(clientId, updatedProfile);
    } catch (err) {
      console.error('Error saving AI feedback:', err);
    }
  };

  const handleCreateSelected = async () => {
    const selectedIdeaEntries = ideas
      .map((idea, index) => ({ idea, index }))
      .filter(({ index }) => selected[index]);

    if (!selectedIdeaEntries.length) {
      toast.error(t.schedule.aiGenerator.errorSelectOne);
      return;
    }

    const datedIdeas = selectedIdeaEntries.map(({ idea }) => idea);

    setCreating(true);
    try {
      await onCreateItems(
        datedIdeas.map((idea, index) => ({
          title: idea.title || t.schedule.aiGenerator.untitledPiece,
          copy: idea.copy || '',
          creative_idea: idea.creative_idea || idea.title || '',
          goal: idea.objective || '',
          format: normalizeFormat(idea.format),
          platforms: normalizePlatform(idea.channel),
          channel: idea.channel || 'IG',
          status: idea.status || 'en-diseño',
          scheduled_at: normalizeDateTime(idea.scheduled_at),
          generateImage: Boolean(generateImages[selectedIdeaEntries[index].index]),
          imagePrompt: buildImagePrompt(idea, t),
          imageAspectRatio: idea.channel === 'TikTok' ? '9:16' : '1:1',
        }))
      );
      aiGenerationManager.clearIdeas(clientId);
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
              <Dialog.Panel className='w-full max-w-3xl rounded-2xl border border-[color:var(--color-border-subtle)] bg-surface/95 p-6 shadow-2xl backdrop-blur-md'>
                <div className='flex items-center justify-between gap-4 border-b border-border-subtle pb-4'>
                  <Dialog.Title className='text-sm font-bold text-text-primary uppercase tracking-wider'>
                    {t.schedule.aiGenerator.titlePrompt}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className='text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-white/5'
                    aria-label='Cerrar modal'
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className='mt-6'>
                  <div className='flex gap-3'>
                    <input
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className='flex-1 rounded-xl border border-border-subtle bg-surface-soft px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/65 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-all font-sans'
                      placeholder={t.schedule.aiGenerator.inputPlaceholder}
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={loading || loadingProfile}
                      className='btn-cyber rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60 transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5'
                    >
                      {loading ? (
                        <>
                          <div className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                          <span>{t.schedule.aiGenerator.generating}</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className='w-4 h-4' />
                          <span>{t.schedule.aiGenerator.generateBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {ideas.length > 0 && (
                  <>
                    <div className='mt-5 max-h-[55vh] space-y-3 overflow-y-auto pr-1'>
                      {ideas.map((idea, index) => {
                        const isSelected = Boolean(selected[index]);
                        return (
                          <motion.div
                            key={`${idea.title}-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelected(prev => ({ ...prev, [index]: !prev[index] }))}
                            className={`block rounded-2xl border p-5 cursor-pointer transition-all duration-200 select-none ${
                              isSelected
                                ? 'bg-rose-500/5 border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.05)]'
                                : 'bg-surface-soft border-[color:var(--color-border-subtle)] hover:bg-surface-soft/80 hover:border-border-strong'
                            }`}
                          >
                            <div className='flex items-start gap-4'>
                              {/* Custom premium round checkbox */}
                              <div className='flex-shrink-0 flex items-center justify-center mt-0.5'>
                                <div
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-250 ${
                                    isSelected
                                      ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-105'
                                      : 'border-border-subtle bg-surface-strong hover:border-border-strong hover:bg-surface-soft'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              <div className='min-w-0 flex-1'>
                                  <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2.5 mb-2.5'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <h3 className='text-sm font-bold text-text-primary'>
                                      {idea.title || t.schedule.aiGenerator.untitledPiece}
                                    </h3>
                                    <span className='rounded-md bg-surface-strong px-2 py-0.5 text-[10px] font-semibold text-text-muted'>
                                      {idea.format || (lang === 'es' ? 'Formato libre' : 'Free format')}
                                    </span>
                                    
                                    {/* Selector de fecha inline, limpio, visualmente intuitivo */}
                                    <div className='flex items-center gap-1.5' onClick={e => e.stopPropagation()}>
                                      <span className='text-[9px] font-bold text-text-muted uppercase tracking-wider'>{t.schedule.importModal.colDate}:</span>
                                      <select
                                        value={idea.scheduled_at || ''}
                                        onChange={e => {
                                          const newDate = e.target.value;
                                          setIdeas(prev => {
                                            const copy = [...prev];
                                            copy[index] = { ...copy[index], scheduled_at: newDate };
                                            aiGenerationManager.setIdeas(clientId, copy);
                                            return copy;
                                          });
                                        }}
                                        className='rounded-md border border-border-subtle bg-surface-strong px-2 py-0.5 text-[10px] font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all cursor-pointer'
                                      >
                                        <option value=''>{lang === 'es' ? 'Sin asignar (al azar)' : 'Unassigned (random)'}</option>
                                        
                                        <optgroup label={`${lang === 'es' ? 'Días de' : 'Days of'} ${datePlanning.monthLabel}`}>
                                          {datePlanning.currentMonthPool.map(dateStr => (
                                            <option key={dateStr} value={dateStr}>
                                              {formatDateString(dateStr)}
                                            </option>
                                          ))}
                                        </optgroup>
                                        
                                        <optgroup label={`${lang === 'es' ? 'Mes siguiente' : 'Next month'} (${datePlanning.nextMonthLabel})`}>
                                          {buildMonthDatePool(new Date(datePlanning.monthDate.getFullYear(), datePlanning.monthDate.getMonth() + 1, 1), false).map(dateStr => (
                                            <option key={dateStr} value={dateStr}>
                                              {formatDateString(dateStr)}
                                            </option>
                                          ))}
                                        </optgroup>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Thumbs up / down feedback loop and Discard */}
                                  <div className='flex items-center gap-1.5' onClick={e => e.stopPropagation()}>
                                    <button
                                      type='button'
                                      onClick={() => handleToggleFeedback(index, 'like')}
                                      className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                                        feedback[index] === 'like'
                                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                          : 'border-border-subtle bg-surface-strong text-text-muted hover:text-text-primary hover:bg-surface-soft hover:border-border-strong'
                                      }`}
                                      title={lang === 'es' ? 'Me gusta esta propuesta' : 'I like this proposal'}
                                    >
                                      <svg className="w-3.5 h-3.5" fill={feedback[index] === 'like' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                                      </svg>
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => handleToggleFeedback(index, 'dislike')}
                                      className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                                        feedback[index] === 'dislike'
                                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                          : 'border-border-subtle bg-surface-strong text-text-muted hover:text-text-primary hover:bg-surface-soft hover:border-border-strong'
                                      }`}
                                      title={lang === 'es' ? 'No me gusta esta propuesta' : 'I dislike this proposal'}
                                    >
                                      <svg className="w-3.5 h-3.5" fill={feedback[index] === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" />
                                      </svg>
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => handleDiscardIndividual(index)}
                                      className='p-1.5 rounded-lg border border-border-subtle bg-surface-strong text-text-muted hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all active:scale-90'
                                      title={lang === 'es' ? 'Descartar propuesta' : 'Discard proposal'}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                {idea.creative_idea && (
                                  <div className='mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-1.5 leading-relaxed'>
                                    <span className='text-sm select-none'>💡</span>
                                    <div>
                                      <span className='text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide block mb-0.5'>
                                        {t.schedule.aiGenerator.creativeIdeaLabel}
                                      </span>
                                      {idea.creative_idea}
                                    </div>
                                  </div>
                                )}
                                <p className='mt-2 whitespace-pre-wrap text-xs leading-6 text-text-muted font-sans'>
                                  {idea.copy || t.schedule.aiGenerator.noCopy}
                                </p>
                                {idea.objective && (
                                  <p className='mt-2 text-[10px] text-text-muted/70'>
                                    {t.schedule.aiGenerator.objectiveLabel}: {idea.objective}
                                  </p>
                                )}
                                
                                {/* Selector de generación de imagen con checkbox redondeado */}
                                <div
                                  className='mt-3.5 inline-flex items-center gap-2.5 rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:border-border-strong transition-all'
                                  onClick={e => {
                                    e.stopPropagation();
                                    setGenerateImages(prev => ({ ...prev, [index]: !prev[index] }));
                                  }}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150 ${
                                      generateImages[index]
                                        ? 'border-rose-500 bg-rose-500 text-white'
                                        : 'border-border-subtle bg-surface-strong'
                                    }`}
                                  >
                                    {generateImages[index] && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={4.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className='text-[11px] font-medium'>{t.schedule.aiGenerator.generatePostImage}</span>
                                </div>

                                {/* Input para afinar/cambiar la idea individualmente */}
                                <div className='mt-3.5 border-t border-border-subtle pt-3.5' onClick={e => e.stopPropagation()}>
                                  <div className='flex gap-2 items-center'>
                                    <input
                                      value={individualRefinements[index] || ''}
                                      onChange={e => setIndividualRefinements(prev => ({ ...prev, [index]: e.target.value }))}
                                      className='flex-1 rounded-lg border border-border-subtle bg-surface-strong px-3 py-1.5 text-[11px] text-text-primary placeholder-text-muted/65 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-all font-sans'
                                      placeholder={t.schedule.aiGenerator.refinementPlaceholder}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && !individualRefining[index]) {
                                          handleRefineIndividual(index);
                                        }
                                      }}
                                    />
                                    <button
                                      type='button'
                                      onClick={() => handleRefineIndividual(index)}
                                      disabled={individualRefining[index] || !(individualRefinements[index] || '').trim()}
                                      className='rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap'
                                    >
                                      {individualRefining[index] ? (
                                        <>
                                          <div className='w-2.5 h-2.5 border border-rose-400 border-t-transparent rounded-full animate-spin' />
                                          <span>{t.schedule.aiGenerator.refiningBtn}</span>
                                        </>
                                      ) : (
                                        <>
                                          <SparklesIcon className='w-3.5 h-3.5' />
                                          <span>{t.schedule.aiGenerator.refineBtn}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className='mt-5 flex justify-between items-center border-t border-[color:var(--color-border-subtle)] pt-4'>
                      <button
                        onClick={() => {
                          const confirmClear = window.confirm(t.schedule.aiGenerator.confirmDiscardAll);
                          if (confirmClear) {
                            setIdeas([]);
                            setSelected({});
                            setGenerateImages({});
                            setFeedback({});
                            aiGenerationManager.clearIdeas(clientId);
                          }
                        }}
                        className='text-xs text-rose-400/80 hover:text-rose-400 transition-colors underline font-medium'
                      >
                        {t.schedule.aiGenerator.discardGenerationBtn}
                      </button>
                      <div className='flex gap-3'>
                        <button
                          onClick={onClose}
                          className='rounded-lg border border-[color:var(--color-border-subtle)] px-4 py-2 text-sm text-text-muted hover:text-text-primary'
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          onClick={handleCreateSelected}
                          disabled={creating || !ideas.length}
                          className='btn-cyber rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60'
                        >
                          {creating
                            ? selectedImageCount
                              ? t.schedule.aiGenerator.creatingAndGeneratingBtn
                              : t.schedule.aiGenerator.creatingBtn
                            : selectedImageCount
                              ? selectedImageCount === 1
                                ? t.schedule.aiGenerator.createAndGenerateImagesBtn.replace('{count}', selectedImageCount)
                                : t.schedule.aiGenerator.createAndGenerateImagesBtnPlural.replace('{count}', selectedImageCount)
                              : t.schedule.aiGenerator.createSelectedBtn}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
