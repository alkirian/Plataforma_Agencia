import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createClient, updateClient, updateClientBrandProfile, analyzeBrandConsistency, updateClientCardColor } from '../../api/clients';
import { useMetaOAuth } from '../../hooks/useMetaOAuth';
import { apiFetch } from '../../api/apiFetch';
import { useModalGsap } from '../../hooks/useModalGsap';
import { compressBrandLogo } from '../../utils/imageCompressor';
import { extractDominantColor } from '../../utils/colorExtractor';
import { useLanguage, useEscapeClose } from '../../hooks';


// Icons from Heroicons (Outline)
import {
  UserIcon,
  GlobeAltIcon,
  LinkIcon,
  SparklesIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const SUGGESTED_INDUSTRIES_MAP = {
  es: [
    'Gastronomía',
    'Moda y Belleza',
    'Tecnología',
    'Salud y Fitness',
    'E-commerce',
    'Inmobiliaria',
    'Educación',
    'Servicios',
  ],
  en: [
    'Gastronomy',
    'Fashion & Beauty',
    'Technology',
    'Health & Fitness',
    'E-commerce',
    'Real Estate',
    'Education',
    'Services',
  ]
};

const STEPS_MAP = {
  es: [
    { id: 1, name: 'Identificación' },
    { id: 2, name: 'Canales Web' },
    { id: 3, name: 'Conexión Meta' },
    { id: 4, name: 'Auditoría Aura' },
  ],
  en: [
    { id: 1, name: 'Identification' },
    { id: 2, name: 'Web Channels' },
    { id: 3, name: 'Meta Connection' },
    { id: 4, name: 'Aura Audit' },
  ]
};

const ANALYSIS_LOGS_MAP = {
  es: [
    '🔗 Conectando con los canales públicos provistos...',
    '🌐 Extrayendo estructura web e indexando competidores...',
    '📸 Analizando feed de Instagram y consistencia de marca...',
    '🧠 Generando propuesta inicial de ADN y Tono de Voz...',
    '🧬 Estructurando pilares estratégicos de contenido...',
    '✨ ¡Auditoría inicial de Aura completada con éxito!',
  ],
  en: [
    '🔗 Connecting with provided public channels...',
    '🌐 Extracting web structure and indexing competitors...',
    '📸 Analyzing Instagram feed and brand consistency...',
    '🧠 Generating initial DNA and Voice Tone proposal...',
    '🧬 Structuring strategic content pillars...',
    '✨ Initial Aura Audit completed successfully!',
  ]
};

export const ClientCreationModal = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const SUGGESTED_INDUSTRIES = SUGGESTED_INDUSTRIES_MAP[lang] || SUGGESTED_INDUSTRIES_MAP['es'];
  const STEPS = STEPS_MAP[lang] || STEPS_MAP['es'];
  const ANALYSIS_LOGS = ANALYSIS_LOGS_MAP[lang] || ANALYSIS_LOGS_MAP['es'];

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const backdropRef = useRef(null);
  const modalPanelRef = useRef(null);

  // Call premium GSAP modal transition hook
  useModalGsap(isOpen, backdropRef, modalPanelRef);
  useEscapeClose(isOpen, onClose);

  // Control del Asistente
  const [step, setStep] = useState(1);
  const [createdClientId, setCreatedClientId] = useState('');
  const [savingStep, setSavingStep] = useState(false);

  // Paso 1: Datos Básicos
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [clientLogo, setClientLogo] = useState(null);
  const [extractedColor, setExtractedColor] = useState(null);

  // Paso 2: Redes y Web
  const [socials, setSocials] = useState({
    website: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    linkedin: '',
    youtube: '',
  });

  // Paso 4: Log de Análisis Cognitivo y Barra de Progreso
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  // Integración con Meta Ads/CM usando el hook unificado
  const {
    connecting: connectingOAuth,
    oauthStep,
    setOauthStep,
    adAccountsList,
    pagesList,
    selectedAccountId,
    setSelectedAccountId,
    selectedPageId,
    setSelectedPageId,
    tempAccessToken,
    handleFacebookOAuth,
    qrMode,
    setQrMode,
    qrLoading,
    startQrFlow,
    deviceUserCode,
    deviceStatus,
  } = useMetaOAuth(createdClientId, 'modal-meta-oauth-toast');

  // Filtrado de industrias sugeridas (solo muestra si el usuario está escribiendo y coincide)
  const filteredIndustries =
    clientIndustry.trim() === ''
      ? []
      : SUGGESTED_INDUSTRIES.filter(
          ind =>
            ind.toLowerCase().includes(clientIndustry.toLowerCase()) &&
            ind.toLowerCase() !== clientIndustry.trim().toLowerCase()
        );

  // Reset del formulario completo al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreatedClientId('');
      setClientName('');
      setClientIndustry('');
      setSocials({
        website: '',
        instagram: '',
        tiktok: '',
        facebook: '',
        linkedin: '',
        youtube: '',
      });
      setAnalysisProgress(0);
      setActiveLogIndex(0);
      setClientLogo(null);
      setExtractedColor(null);
    }
  }, [isOpen]);

  // Manejo de la barra de progreso animada en el Paso 4
  useEffect(() => {
    let progressTimer;
    let logTimer;

    if (step === 4) {
      // Incrementar progreso hasta 100% en 6 segundos
      progressTimer = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + 1;
        });
      }, 60);

      // Rotar logs cada 1.2 segundos
      logTimer = setInterval(() => {
        setActiveLogIndex(prev => {
          if (prev >= ANALYSIS_LOGS.length - 1) {
            clearInterval(logTimer);
            return ANALYSIS_LOGS.length - 1;
          }
          return prev + 1;
        });
      }, 1100);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(logTimer);
    };
  }, [step]);

  // Redirección automática después de completar el análisis del Paso 4
  useEffect(() => {
    if (step === 4 && analysisProgress === 100) {
      const redirectTimer = setTimeout(() => {
        handleFinalizeAndRedirect();
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [step, analysisProgress]);

  // MUTACIONES DE REACT QUERY PARA CREAR CLIENTE
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const rawData = response?.data || response;
      const clientId = typeof rawData === 'string' ? rawData : rawData?.id || rawData;
      setCreatedClientId(clientId);

      if (extractedColor) {
        updateClientCardColor(clientId, extractedColor).catch(err => console.error("Error updating client color:", err));
      }

      setStep(2);
      toast.success(
        lang === 'es'
          ? `Cliente "${clientName.trim()}" creado de forma básica.`
          : `Client "${clientName.trim()}" created successfully.`
      );
    },
    onError: error => {
      toast.error(error.message || (lang === 'es' ? 'No se pudo crear el cliente.' : 'Could not create client.'));
    },
  });

  // SUBMIT DEL PASO 1 (Identificación)
  const handleStep1Submit = async e => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error(lang === 'es' ? 'Por favor escribe un nombre.' : 'Please write a brand name.');
      return;
    }

    if (createdClientId) {
      // Si ya se creó en este modal y volvieron atrás, lo actualizamos en vez de duplicarlo
      try {
        setSavingStep(true);
        await updateClient(createdClientId, {
          name: clientName.trim(),
          industry: clientIndustry.trim() || null,
          logo_url: clientLogo,
        });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        setStep(2);
      } catch (error) {
        toast.error(lang === 'es' ? 'Error al actualizar datos básicos.' : 'Error updating basic details.');
      } finally {
        setSavingStep(false);
      }
    } else {
      createClientMutation.mutate({
        name: clientName.trim(),
        industry: clientIndustry.trim() || null,
        logo_url: clientLogo,
      });
    }
  };

  // SUBMIT DEL PASO 2 (Canales Web & Redes)
  const handleStep2Submit = async e => {
    e.preventDefault();
    setSavingStep(true);

    try {
      const payload = {
        website_url: socials.website.trim(),
        instagram_url: socials.instagram.trim(),
        tiktok_url: socials.tiktok.trim(),
        facebook_url: socials.facebook.trim(),
        linkedin_url: socials.linkedin.trim(),
        youtube_url: socials.youtube.trim(),
      };

      await updateClientBrandProfile(createdClientId, payload);
      toast.success(lang === 'es' ? 'Canales de identidad digital guardados.' : 'Digital identity channels saved.');
      setStep(3);
    } catch (error) {
      toast.error(lang === 'es' ? 'Error al guardar los canales digitales.' : 'Error saving digital channels.');
    } finally {
      setSavingStep(false);
    }
  };

  // SUBMIT DEL PASO 3 (Meta OAuth Connection & Finalize)
  const handleStep3Confirm = async () => {
    if (!selectedAccountId) {
      toast.error(lang === 'es' ? 'Por favor selecciona una cuenta publicitaria o presiona Omitir.' : 'Please select an ad account or press Skip.');
      return;
    }
    if (!selectedPageId) {
      toast.error(lang === 'es' ? 'Por favor selecciona tu página o presiona Omitir.' : 'Please select your page or press Skip.');
      return;
    }

    setSavingStep(true);
    try {
      // Registrar la integración de Meta
      await apiFetch(`/clients/${createdClientId}/meta-integration`, {
        method: 'POST',
        body: JSON.stringify({
          meta_ad_account_id: selectedAccountId,
          meta_page_id: selectedPageId,
          access_token: tempAccessToken,
        }),
      });
      toast.success(lang === 'es' ? '¡Integración de Meta Ads y CM completada con éxito!' : 'Meta Ads & CM integration completed successfully!');
      triggerBackgroundAnalysis();
    } catch (error) {
      toast.error(error.message || (lang === 'es' ? 'No se pudo guardar la vinculación de Meta.' : 'Could not save Meta integration.'));
    } finally {
      setSavingStep(false);
    }
  };

  // Disparar análisis de fondo asíncrono
  const triggerBackgroundAnalysis = async () => {
    try {
      const reconstructedSourceLinks = [
        { type: 'website', url: socials.website },
        { type: 'instagram', url: socials.instagram },
        { type: 'tiktok', url: socials.tiktok },
        { type: 'facebook', url: socials.facebook },
        { type: 'linkedin', url: socials.linkedin },
        { type: 'youtube', url: socials.youtube },
      ]
        .filter(l => l.url && l.url.trim())
        .map((l, i) => ({
          id: `source-link-${l.type}-${i}`,
          type: l.type,
          url: l.url.trim(),
          notes: '',
        }));

      const currentProfile = {
        website_url: socials.website.trim(),
        instagram_url: socials.instagram.trim(),
        tiktok_url: socials.tiktok.trim(),
        facebook_url: socials.facebook.trim(),
        linkedin_url: socials.linkedin.trim(),
        youtube_url: socials.youtube.trim(),
      };

      // Si cargaron al menos una red, disparamos la auditoría profunda de IA
      if (reconstructedSourceLinks.length > 0) {
        await analyzeBrandConsistency(createdClientId, currentProfile, reconstructedSourceLinks);
      }
    } catch (err) {
      console.error('Error al disparar el análisis asíncrono:', err);
    } finally {
      setStep(4);
    }
  };

  // Finalizar y redirigir
  const handleFinalizeAndRedirect = () => {
    onClose();
    navigate(`/clients/${createdClientId}?tab=identity`);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter=''
          enterFrom=''
          enterTo=''
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div ref={backdropRef} className='fixed inset-0 bg-black/75 backdrop-blur-md' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter=''
              enterFrom=''
              enterTo=''
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100 y-0'
              leaveTo='opacity-0 scale-95 y-4'
            >
              <Dialog.Panel
                ref={modalPanelRef}
                className={`w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] rounded-3xl p-6 md:p-8 shadow-2xl transition-[max-width] duration-300 relative overflow-hidden ${
                  step === 2 || step === 3 ? 'max-w-2xl' : 'max-w-lg'
                }`}
              >
                {/* Neon glow effect inside modal */}
                <div className='absolute -right-32 -top-32 w-64 h-64 rounded-full bg-[#7C5CFC]/10 blur-3xl pointer-events-none' />
                <div className='absolute -left-32 -bottom-32 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none' />

                {/* Paso / Progress Indicators */}
                <div className='flex items-center justify-between mb-8 px-1 relative z-10'>
                  {STEPS.map((s, idx) => {
                    const isCompleted = step > s.id;
                    const isActive = step === s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                : isActive
                                ? 'bg-[#0ea5e9] text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                                : 'bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)]'
                            }`}
                          >
                            {isCompleted ? <CheckIcon className='w-4.5 h-4.5' /> : s.id}
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline ${
                              isActive
                                ? 'text-[color:var(--color-text-primary)] font-bold'
                                : isCompleted
                                ? 'text-emerald-500 font-bold'
                                : 'text-[color:var(--color-text-muted)]'
                            }`}
                          >
                            {s.name}
                          </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-px mx-3 transition-all duration-500 ${
                              isCompleted ? 'bg-emerald-500/40' : 'bg-[color:var(--color-border-subtle)]'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className='relative z-10'>
                  {/* ==========================================
                      PASO 1: IDENTIFICACIÓN (DATOS BÁSICOS)
                      ========================================== */}
                  {step === 1 && (
                    <form onSubmit={handleStep1Submit} className='space-y-6'>
                      <div className='text-center flex flex-col items-center justify-center'>
                        <Dialog.Title className='text-xl font-extrabold text-[color:var(--color-text-primary)] font-title mb-1.5 flex items-center gap-2 justify-center'>
                          <UserIcon className='w-5 h-5 text-[#0ea5e9]' />
                          <span>{t.dashboard.createClientTitle || 'Identificar Nueva Marca'}</span>
                        </Dialog.Title>
                      </div>

                      <div className='space-y-6 max-w-sm mx-auto flex flex-col items-center'>
                        {/* Logo de la Marca */}
                        <div className="flex flex-col items-center gap-2">
                           <label className="text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] block text-center">
                            {t.dashboard.logoLabel || 'Logo de la Marca'}
                          </label>
                          <div className="relative group w-20 h-20 rounded-[20px] overflow-hidden border border-[color:var(--color-border-subtle)] flex items-center justify-center bg-[color:var(--color-surface-soft)] shadow-inner">
                            {clientLogo ? (
                              <img src={clientLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-[color:var(--color-text-muted)]">
                                {clientName.substring(0, 2).toUpperCase() || 'CL'}
                              </span>
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-200">
                              <span>{lang === 'es' ? 'Subir' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressedFile = await compressBrandLogo(file, 400, 0.8);
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        const result = reader.result;
                                        setClientLogo(result);
                                        const color = await extractDominantColor(result);
                                        if (color) {
                                          setExtractedColor(color);
                                          toast.success(lang === 'es' ? 'Color de marca sugerido a partir del logotipo' : 'Suggested brand color from logo');
                                        }
                                      };
                                      reader.readAsDataURL(compressedFile);
                                    } catch (err) {
                                      console.error('Error compressing brand logo, using original:', err);
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        const result = reader.result;
                                        setClientLogo(result);
                                        const color = await extractDominantColor(result);
                                        if (color) {
                                          setExtractedColor(color);
                                          toast.success(lang === 'es' ? 'Color de marca sugerido a partir del logotipo' : 'Suggested brand color from logo');
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {clientLogo && (
                            <button
                              type="button"
                              onClick={() => setClientLogo(null)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                            >
                              {lang === 'es' ? 'Quitar Logo' : 'Remove Logo'}
                            </button>
                          )}
                        </div>

                        <div className='space-y-2 text-center w-full'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] block text-center'>
                            {t.dashboard.clientNameLabel || 'Nombre'} <span className='text-[#0ea5e9]'>*</span>
                          </label>
                          <input
                            type='text'
                            className='input-cyber text-center w-full'
                            value={clientName || ''}
                            onChange={e => setClientName(e.target.value)}
                            placeholder={t.dashboard.clientNamePlaceholder || 'Ej. Starbucks'}
                            required
                            autoFocus
                          />
                        </div>

                        <div className='space-y-2 text-center relative'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] block text-center'>
                            {t.dashboard.industryLabel || 'Sector o Industria'}
                          </label>
                          <div className='relative'>
                            <input
                              type='text'
                              className='input-cyber text-center w-full'
                              value={clientIndustry || ''}
                              placeholder={t.dashboard.industryPlaceholder || 'Ej. Tecnología'}
                              onChange={e => setClientIndustry(e.target.value)}
                            />

                            {/* Sugerencias Rápidas */}
                            {filteredIndustries.length > 0 && (
                              <div className='absolute z-20 left-0 right-0 mt-1.5 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] backdrop-blur-md shadow-2xl max-h-48 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin'>
                                {filteredIndustries.map(ind => (
                                  <button
                                    key={ind}
                                    type='button'
                                    onClick={() => setClientIndustry(ind)}
                                    className='w-full text-left px-4 py-2.5 text-xs font-semibold text-[color:var(--color-text-secondary)] hover:text-[#0ea5e9] hover:bg-[color:var(--color-surface-soft)] transition-all flex items-center justify-between group'
                                  >
                                    <span>{ind}</span>
                                    <span className='opacity-0 group-hover:opacity-100 text-[10px] text-[color:var(--color-text-muted)] transition-opacity font-normal'>
                                      {lang === 'es' ? 'Autocompletar ↵' : 'Autocomplete ↵'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-center gap-3 pt-5 border-t border-[color:var(--color-border-subtle)] mt-6'>
                        <button
                          type='button'
                          onClick={onClose}
                          className='btn-cyber border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)]'
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type='submit'
                          disabled={createClientMutation.isPending || savingStep}
                          className='px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] active:scale-[0.98] min-w-[140px] flex items-center justify-center gap-2 cursor-pointer'
                        >
                          {createClientMutation.isPending || savingStep ? (
                            <>
                              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                              <span>{t.common.saving || 'Creando…'}</span>
                            </>
                          ) : (
                            <>
                              <span>{lang === 'es' ? 'Siguiente' : 'Next'}</span>
                              <ChevronRightIcon className='w-4 h-4' />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ==========================================
                      PASO 2: IDENTIDAD DIGITAL (SOCIALS & WEB)
                      ========================================== */}
                  {step === 2 && (
                    <form onSubmit={handleStep2Submit} className='space-y-6'>
                      <div>
                        <Dialog.Title className='text-xl font-extrabold text-[color:var(--color-text-primary)] font-title mb-1.5 flex items-center gap-2'>
                          <GlobeAltIcon className='w-5 h-5 text-[#0ea5e9]' />
                          <span>{lang === 'es' ? 'Ecosistema e Identidad Digital' : 'Digital Ecosystem & Identity'}</span>
                        </Dialog.Title>
                        <p className='text-xs text-[color:var(--color-text-muted)] leading-relaxed'>
                          {lang === 'es'
                            ? 'Carga los canales digitales de tu marca. Aura auditará estos links de forma asíncrona para deducir y armar el ADN, tono de voz y pilares estratégicos en segundo plano.'
                            : 'Load your brand\'s digital channels. Aura will audit these links asynchronously to deduce and build the brand DNA, voice tone, and strategic pillars in the background.'}
                        </p>
                      </div>

                      {/* 2-Column Inputs Grid */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4.5'>
                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                            {lang === 'es' ? 'Sitio Web Oficial' : 'Official Website'}
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://tusitio.com'
                            value={socials.website}
                            onChange={e => setSocials(prev => ({ ...prev, website: e.target.value }))}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-[#E1306C]' />
                            Instagram URL
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://instagram.com/usuario'
                            value={socials.instagram}
                            onChange={e => setSocials(prev => ({ ...prev, instagram: e.target.value }))}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-[#1877F2]' />
                            Facebook URL
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://facebook.com/pagina'
                            value={socials.facebook}
                            onChange={e => setSocials(prev => ({ ...prev, facebook: e.target.value }))}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-black border border-white/20' />
                            TikTok URL
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://tiktok.com/@usuario'
                            value={socials.tiktok}
                            onChange={e => setSocials(prev => ({ ...prev, tiktok: e.target.value }))}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-[#0A66C2]' />
                            LinkedIn URL
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://linkedin.com/company/nombre'
                            value={socials.linkedin}
                            onChange={e => setSocials(prev => ({ ...prev, linkedin: e.target.value }))}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <label className='text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--color-text-muted)] flex items-center gap-1.5'>
                            <span className='w-1.5 h-1.5 rounded-full bg-[#FF0000]' />
                            {lang === 'es' ? 'YouTube Canal' : 'YouTube Channel'}
                          </label>
                          <input
                            type='url'
                            className='input-cyber'
                            placeholder='https://youtube.com/@canal'
                            value={socials.youtube}
                            onChange={e => setSocials(prev => ({ ...prev, youtube: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className='flex justify-between items-center pt-5 border-t border-[color:var(--color-border-subtle)] mt-6'>
                        <button
                          type='button'
                          onClick={() => setStep(1)}
                          className='btn-cyber flex items-center gap-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)] font-bold cursor-pointer'
                        >
                          <ChevronLeftIcon className='w-4 h-4' />
                          <span>{lang === 'es' ? 'Atrás' : 'Back'}</span>
                        </button>

                        <div className='flex gap-3'>
                          <button
                            type='button'
                            onClick={() => setStep(3)}
                            className='btn-cyber text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)] font-bold cursor-pointer'
                          >
                            {lang === 'es' ? 'Omitir Paso' : 'Skip Step'}
                          </button>
                          <button
                            type='submit'
                            disabled={savingStep}
                            className='px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] active:scale-[0.98] min-w-[140px] flex items-center justify-center gap-2 cursor-pointer'
                          >
                            {savingStep ? (
                              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                            ) : (
                              <>
                                <span>{lang === 'es' ? 'Siguiente' : 'Next'}</span>
                                <ChevronRightIcon className='w-4 h-4' />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* ==========================================
                      PASO 3: CONEXIÓN SECURA CON META
                      ========================================== */}
                  {step === 3 && (
                    <div className='space-y-6'>
                      <div>
                        <Dialog.Title className='text-xl font-extrabold text-[color:var(--color-text-primary)] font-title mb-1.5 flex items-center gap-2'>
                          <SparklesIcon className='w-5 h-5 text-[#0ea5e9]' />
                          <span>{lang === 'es' ? 'Conectar con Meta Ads y CM' : 'Connect with Meta Ads & CM'}</span>
                        </Dialog.Title>
                        <p className='text-xs text-[color:var(--color-text-muted)] leading-relaxed'>
                          {lang === 'es'
                            ? 'Vincula las cuentas publicitarias y de redes de Meta en un clic para activar campañas automáticas y el auto-respondedor de comentarios de Aura de inmediato.'
                            : 'Link Meta advertising and network accounts in one click to activate automated campaigns and Aura\'s auto-responder for comments immediately.'}
                        </p>
                      </div>

                      {/* Transparencia y Consentimiento Panel */}
                      <div className='bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-subtle)] p-4.5 rounded-2xl space-y-3.5 relative overflow-hidden'>
                        <div className='absolute right-2 top-2 opacity-5 pointer-events-none'>
                          <ShieldCheckIcon className='w-20 h-20 text-[color:var(--color-accent-sage)]' />
                        </div>
                        <h4 className='text-xs font-bold text-[color:var(--color-accent-sage)] flex items-center gap-1.5 uppercase tracking-wider'>
                          <ShieldCheckIcon className='w-4 h-4' />
                          {lang === 'es' ? 'Transparencia y Uso de Datos de Meta:' : 'Transparency & Meta Data Usage:'}
                        </h4>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px] text-[color:var(--color-text-secondary)] leading-relaxed'>
                          <div className='flex gap-2 items-start'>
                            <span className='text-[color:var(--color-accent-sage)] text-xs font-bold'>✓</span>
                            <span>
                              {lang === 'es'
                                ? <strong>Auditoría de Ads: Leeremos métricas de rendimiento y configuraciones de campañas para diagnosticar pauta comercial.</strong>
                                : <strong>Ads Audit: We will read performance metrics and campaign settings to diagnose commercial ads.</strong>}
                            </span>
                          </div>
                          <div className='flex gap-2 items-start'>
                            <span className='text-[color:var(--color-accent-sage)] text-xs font-bold'>✓</span>
                            <span>
                              {lang === 'es'
                                ? <strong>Comentarios en Vivo: Escucharemos el feedback en tus publicaciones para detectar intenciones y sentimientos.</strong>
                                : <strong>Live Comments: We will monitor feedback on your posts to detect intent and sentiments.</strong>}
                            </span>
                          </div>
                          <div className='flex gap-2 items-start'>
                            <span className='text-[color:var(--color-accent-sage)] text-xs font-bold'>✓</span>
                            <span>
                              {lang === 'es'
                                ? <strong>CM Inteligente: Responderemos las consultas de usuarios usando borradores que tú debes autorizar o editar.</strong>
                                : <strong>Smart CM: We will reply to user inquiries using drafts that you must authorize or edit.</strong>}
                            </span>
                          </div>
                          <div className='flex gap-2 items-start'>
                            <span className='text-[color:var(--color-accent-sage)] text-xs font-bold'>✓</span>
                            <span>
                              {lang === 'es'
                                ? <strong>Seguridad Cifrada: Las credenciales OAuth se almacenan encriptadas con protocolo SSL/TLS bajo la seguridad de Supabase.</strong>
                                : <strong>Encrypted Security: OAuth credentials are stored encrypted with SSL/TLS protocol under Supabase security.</strong>}
                            </span>
                          </div>
                        </div>
                        <div className='text-[10px] text-[color:var(--color-text-muted)] flex items-start gap-1.5 pt-2.5 border-t border-[color:var(--color-border-subtle)]'>
                          <LockClosedIcon className='w-3.5 h-3.5 text-[color:var(--color-accent-sage)]/70 flex-shrink-0' />
                          <span>
                            {lang === 'es'
                              ? 'Cadence jamás realizará acciones no autorizadas, posts autónomos ni cobrará importes sin tu estricto consentimiento.'
                              : 'Cadence will never perform unauthorized actions, autonomous posts, or charge fees without your strict consent.'}
                          </span>
                        </div>
                      </div>

                      {/* OAuth Status and Flow */}
                      <div className='space-y-4'>
                        {qrMode ? (
                          /* VISTA DEVICE LOGIN — el usuario escribe el código en facebook.com/device */
                          <div className='space-y-5 max-w-md mx-auto text-center flex flex-col items-center p-5 bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-subtle)] rounded-2xl'>
                            <div className='bg-[color:var(--color-surface)] border border-purple-500/20 p-4 rounded-2xl flex items-start gap-3 text-left w-full'>
                              <SparklesIcon className='h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5' />
                              <p className='text-[11px] text-purple-200 leading-relaxed'>
                                {lang === 'es'
                                  ? <>Abre <strong className='text-white'>facebook.com/device</strong> en tu celular e ingresa el siguiente código para vincular tu cuenta.</>
                                  : <>Open <strong className='text-white'>facebook.com/device</strong> on your phone and enter the following code to link your account.</>}
                              </p>
                            </div>

                            {qrLoading ? (
                              <div className='w-full h-28 bg-[color:var(--color-surface)] rounded-2xl flex items-center justify-center border border-[color:var(--color-border-subtle)] shadow-inner'>
                                <ArrowPathIcon className='h-8 w-8 animate-spin text-purple-500' />
                              </div>
                            ) : (
                              <div className='w-full flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-2 border-purple-500/40 rounded-2xl py-5 px-6 shadow-xl shadow-purple-900/20'>
                                {/* Código QR con user_code pre-completado */}
                                <div className='relative p-2 bg-white rounded-2xl shadow-md border-2 border-purple-500/20 overflow-hidden flex-shrink-0'>
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=0b0b14&data=${encodeURIComponent('https://www.facebook.com/device?user_code=' + deviceUserCode)}`}
                                    alt="Código QR de Conexión"
                                    className='w-28 h-28 rounded-xl select-none'
                                  />
                                </div>
                                {/* Código de texto */}
                                <div className='flex-1 text-center sm:text-left'>
                                  <p className='text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1'>
                                    {lang === 'es' ? 'Tu código de acceso' : 'Your access code'}
                                  </p>
                                  <p className='text-3xl font-black tracking-[0.2em] text-white select-all font-mono'>{deviceUserCode || '------'}</p>
                                  <p className='text-[9px] text-purple-300/70 mt-2 leading-relaxed'>
                                    {lang === 'es'
                                      ? 'Escanea el código QR con tu celular para abrir Facebook con el código ya pre-completado de forma automática.'
                                      : 'Scan the QR code with your phone to open Facebook with the code already pre-filled automatically.'}
                                  </p>
                                </div>
                              </div>
                            )}

                            <a
                              href='https://www.facebook.com/device'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl'
                            >
                              <svg className='w-4 h-4 fill-current' viewBox='0 0 24 24'>
                                <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                              </svg>
                              {lang === 'es' ? 'Abrir facebook.com/device' : 'Open facebook.com/device'}
                            </a>

                            <div className='flex flex-col items-center gap-1.5'>
                              <div className='flex items-center gap-2'>
                                <span className='h-2.5 w-2.5 rounded-full bg-yellow-500 animate-ping' />
                                <span className='text-xs font-bold text-[color:var(--color-text-primary)]'>
                                  {lang === 'es' ? 'Esperando que ingreses el código...' : 'Waiting for code entry...'}
                                </span>
                              </div>
                              <span className='text-[10px] text-[color:var(--color-text-muted)] max-w-xs'>
                                {lang === 'es'
                                  ? 'Esta pantalla avanzará automáticamente cuando autorices en tu celular.'
                                  : 'This screen will automatically advance when you authorize on your phone.'}
                              </span>
                            </div>

                            <button
                              type='button'
                              onClick={() => setQrMode(false)}
                              className='w-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-soft)] text-[color:var(--color-text-secondary)] font-bold text-xs py-3 rounded-xl transition-all duration-200 cursor-pointer'
                            >
                              {lang === 'es' ? 'Cancelar y Volver' : 'Cancel and Go Back'}
                            </button>
                          </div>
                        ) : oauthStep === 'connect' ? (
                          <div className='max-w-md mx-auto space-y-3.5'>
                            <button
                               type='button'
                               onClick={handleFacebookOAuth}
                               disabled={connectingOAuth || savingStep}
                               className='w-full bg-[#1877F2] hover:bg-[#1565C0] text-white font-bold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-2.5 transform hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(24,119,242,0.2)] cursor-pointer'
                            >
                              {connectingOAuth ? (
                                <ArrowPathIcon className='h-4 w-4 animate-spin' />
                              ) : (
                                <svg className='w-4.5 h-4.5 fill-current' viewBox='0 0 24 24'>
                                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                                </svg>
                              )}
                              <span>{lang === 'es' ? 'Autorizar y Conectar con Facebook & Meta' : 'Authorize & Connect with Facebook & Meta'}</span>
                            </button>

                            {/* Botón para iniciar flujo Device Login */}
                            <button
                              type='button'
                              onClick={startQrFlow}
                              disabled={connectingOAuth || savingStep || qrLoading}
                              className='w-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 font-bold text-xs py-3 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.01] cursor-pointer'
                            >
                              {qrLoading ? (
                                <ArrowPathIcon className='w-4 h-4 animate-spin text-purple-400' />
                              ) : (
                                <svg className='w-4.5 h-4.5 text-purple-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' />
                                </svg>
                              )}
                              <span>{lang === 'es' ? 'Conectar desde el Celular (sin contraseña)' : 'Connect from Phone (without password)'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className='space-y-4 max-w-lg mx-auto bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-subtle)] p-5 rounded-2xl'>
                            <div className='flex items-center gap-2 pb-3.5 border-b border-[color:var(--color-border-subtle)]'>
                              <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                              <span className='text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono'>
                                {lang === 'es' ? 'Meta Autenticado' : 'Meta Authenticated'}
                              </span>
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-[9px] font-extrabold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-1.5'>
                                  {lang === 'es' ? '1. Cuenta Publicitaria (Meta Ads)' : '1. Ad Account (Meta Ads)'}
                                </label>
                                {adAccountsList.length > 0 ? (
                                  <select
                                    value={selectedAccountId}
                                    onChange={e => setSelectedAccountId(e.target.value)}
                                    className='w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] rounded-xl px-3 py-2.5 text-xs text-[color:var(--color-text-primary)] font-bold cursor-pointer focus:outline-none focus:border-[#0ea5e9]'
                                  >
                                    {adAccountsList.map(acc => (
                                      <option key={acc.id} value={acc.id} className='bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)]'>
                                        {acc.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className='text-xs text-rose-500 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10'>
                                    {lang === 'es' ? 'No se hallaron cuentas publicitarias.' : 'No ad accounts found.'}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className='block text-[9px] font-extrabold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-1.5'>
                                  {lang === 'es' ? '2. Página de FB & Cuenta Instagram' : '2. FB Page & Instagram Account'}
                                </label>
                                {pagesList.length > 0 ? (
                                  <select
                                    value={selectedPageId}
                                    onChange={e => setSelectedPageId(e.target.value)}
                                    className='w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] rounded-xl px-3 py-2.5 text-xs text-[color:var(--color-text-primary)] font-bold cursor-pointer focus:outline-none focus:border-[#0ea5e9]'
                                  >
                                    {pagesList.map(page => (
                                      <option key={page.id} value={page.id} className='bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)]'>
                                        {page.name} {page.instagram ? `(@${page.instagram.username})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className='text-xs text-rose-500 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10'>
                                    {lang === 'es' ? 'No se hallaron páginas vinculadas.' : 'No linked pages found.'}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className='pt-3 flex gap-3'>
                              <button
                                type='button'
                                onClick={handleStep3Confirm}
                                disabled={savingStep || adAccountsList.length === 0 || pagesList.length === 0}
                                className='flex-1 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer'
                              >
                                {savingStep ? (
                                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                                ) : (
                                  <>
                                    <CheckIcon className='w-4 h-4' />
                                    <span>{lang === 'es' ? 'Vincular y Proceder' : 'Link & Proceed'}</span>
                                  </>
                                )}
                              </button>
                              <button
                                type='button'
                                onClick={() => setOauthStep('connect')}
                                className='px-4 border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-soft)] text-[color:var(--color-text-secondary)] font-bold text-xs rounded-xl transition-all cursor-pointer'
                              >
                                {lang === 'es' ? 'Atrás' : 'Back'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className='flex justify-between items-center pt-5 border-t border-[color:var(--color-border-subtle)] mt-6'>
                        <button
                          type='button'
                          onClick={() => setStep(2)}
                          className='btn-cyber flex items-center gap-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)] font-bold cursor-pointer'
                        >
                          <ChevronLeftIcon className='w-4 h-4' />
                          <span>{lang === 'es' ? 'Atrás' : 'Back'}</span>
                        </button>

                        <button
                          type='button'
                          onClick={triggerBackgroundAnalysis}
                          className='btn-cyber text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)] font-bold cursor-pointer'
                        >
                          {lang === 'es' ? 'Omitir y Finalizar' : 'Skip & Finish'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      PASO 4: AUDITORÍA AURA (SEGUNDO PLANO)
                      ========================================== */}
                  {step === 4 && (
                    <div className='space-y-6 py-4 flex flex-col items-center justify-center text-center'>
                      {/* Aura Orbital Hologram Sphere */}
                      <div className='relative w-28 h-28 mb-4 flex items-center justify-center'>
                        <div className='absolute inset-0 rounded-full bg-gradient-to-br from-[#7C5CFC]/20 to-emerald-500/10 blur-xl animate-pulse' />
                        <div className='absolute inset-0 rounded-full border border-dashed border-[#7C5CFC]/30 animate-spin' style={{ animationDuration: '10s' }} />
                        <div className='absolute inset-2 rounded-full border border-dashed border-emerald-500/20 animate-spin' style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                        <div className='w-20 h-20 rounded-full border border-white/10 bg-black/40 flex items-center justify-center shadow-inner relative z-10'>
                          <SparklesIcon className='w-8 h-8 text-[#7C5CFC] animate-pulse' />
                        </div>
                      </div>

                      <div className='space-y-2.5 max-w-md'>
                        <Dialog.Title className='text-xl font-black text-[color:var(--color-text-primary)] font-title'>
                          {lang === 'es' ? 'Aura está analizando tu marca' : 'Aura is analyzing your brand'}
                        </Dialog.Title>
                        <p className='text-xs text-[color:var(--color-text-muted)] leading-relaxed px-4'>
                          {lang === 'es'
                            ? 'Estamos procesando la información del cliente y auditando sus canales públicos en la web. La IA estructurará su ADN de marca en segundo plano.'
                            : 'We are processing the client\'s information and auditing their public web channels. The AI will structure their brand DNA in the background.'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className='w-full max-w-sm space-y-2 mt-4'>
                        <div className='h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative'>
                          <div
                            className='h-full bg-gradient-to-r from-[#7C5CFC] to-emerald-400 rounded-full shadow-[0_0_10px_rgba(124,92,252,0.4)] transition-all duration-300'
                            style={{ width: `${analysisProgress}%` }}
                          />
                        </div>
                        <div className='flex justify-between text-[9px] font-mono text-[color:var(--color-text-muted)] px-1 uppercase tracking-wider font-semibold'>
                          <span>{lang === 'es' ? 'Indexando Ecosistema' : 'Indexing Ecosystem'}</span>
                          <span>{analysisProgress}%</span>
                        </div>
                      </div>

                      {/* Dynamic Audit Logger */}
                      <div className='w-full max-w-md h-12 bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-center relative overflow-hidden mt-2'>
                        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent pointer-events-none' />
                        <div className='text-xs font-mono font-bold text-emerald-400 transition-all duration-300 flex items-center gap-2 select-none animate-pulse'>
                          <span>{ANALYSIS_LOGS[activeLogIndex]}</span>
                        </div>
                      </div>

                      {/* Instant redirection button */}
                      <div className='pt-6 w-full max-w-xs'>
                        <button
                          type='button'
                          onClick={handleFinalizeAndRedirect}
                          className='w-full px-6 py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] transition-transform'
                        >
                          <span>{lang === 'es' ? 'Acceder de inmediato' : 'Access immediately'}</span>
                          <ChevronRightIcon className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
