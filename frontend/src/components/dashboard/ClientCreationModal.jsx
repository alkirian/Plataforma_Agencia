import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { createClient, updateClientBrandProfile, autoFillBrandProfile, searchCompanyBrandProfile } from '../../api/clients';
import { TagInput } from '../common/TagInput';

// Estado inicial de la Identidad de Marca
const DEFAULT_PROFILE = {
  business_description: '',
  target_audience: '',
  brand_voice: '',
  content_pillars: [],
  content_goals: [],
  products_services: [],
  preferred_platforms: [],
  preferred_formats: [],
  avoid_topics: [],
  reference_style: '',
  source_links: [],
  source_notes: '',
};

const SOCIAL_PLATFORMS = [
  { id: 'Instagram', label: 'Instagram', icon: '📸' },
  { id: 'TikTok', label: 'TikTok', icon: '🎵' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
  { id: 'Facebook', label: 'Facebook', icon: '👥' },
  { id: 'YouTube', label: 'YouTube', icon: '📺' },
  { id: 'WhatsApp', label: 'WhatsApp', icon: '💬' }
];

const SUGGESTIONS = {
  content_pillars: ['Educación', 'Detrás de escena', 'Promoción/Venta', 'Testimonios', 'Estilo de vida', 'Humor', 'Noticias'],
  preferred_formats: ['Reels', 'Carruseles', 'Historias', 'Post estáticos', 'Videos largos', 'Infografías'],
  avoid_topics: ['Religión', 'Política', 'Competidores directos', 'Controversias', 'Precios explícitos', 'Hype exagerado'],
  brand_voice: ['Cercano y Cálido', 'Profesional y Corporativo', 'Divertido e Informal', 'Educativo y Experto', 'Elegante y Sofisticado', 'Inspirador y Cercano']
};

const SUGGESTED_INDUSTRIES = [
  'Gastronomía',
  'Moda y Belleza',
  'Tecnología',
  'Salud y Fitness',
  'E-commerce',
  'Inmobiliaria',
  'Educación',
  'Servicios'
];

export const ClientCreationModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Estados del Wizard
  // 1: Datos Básicos, 2: Elección de Identidad, 3A: Buscar Empresa IA, 3B: Brief IA, 4: Refinamiento, 5: Éxito
  const [step, setStep] = useState(1);
  const [createdClient, setCreatedClient] = useState(null);
  
  // Datos de formulario
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [brandProfile, setBrandProfile] = useState(DEFAULT_PROFILE);
  const [activeRefinementTab, setActiveRefinementTab] = useState('adn');

  // Estados específicos de IA
  const [searchQuery, setSearchQuery] = useState('');
  const [briefText, setBriefText] = useState('');
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoaderPhase, setAiLoaderPhase] = useState(0);

  // Reset del wizard al cerrar o abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreatedClient(null);
      setClientName('');
      setClientIndustry('');
      setBrandProfile(DEFAULT_PROFILE);
      setSearchQuery('');
      setBriefText('');
      setAiPreviewData(null);
      setIsAiLoading(false);
      setAiLoaderPhase(0);
      setActiveRefinementTab('adn');
    }
  }, [isOpen]);

  // Simulación interactiva de las etapas del agente Gemini mientras carga
  useEffect(() => {
    let t1, t2, t3;
    if (isAiLoading) {
      setAiLoaderPhase(0);
      t1 = setTimeout(() => setAiLoaderPhase(1), 2200);
      t2 = setTimeout(() => setAiLoaderPhase(2), 5200);
      t3 = setTimeout(() => setAiLoaderPhase(3), 8500);
    } else {
      setAiLoaderPhase(0);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isAiLoading]);

  // MUTACIONES DE REACT QUERY
  // 1. Crear cliente (Paso 1)
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // La API retorna el UUID del cliente en response.data
      const rawData = response?.data || response;
      const clientId = typeof rawData === 'string' ? rawData : (rawData?.id || rawData);

      // Armamos un objeto de cliente completo con los datos locales
      const clientObj = {
        id: clientId,
        name: clientName.trim(),
        industry: clientIndustry.trim() || null
      };

      setCreatedClient(clientObj);
      setSearchQuery(clientName.trim());
      setStep(2);
    },
    onError: (error) => {
      toast.error(error.message || 'No se pudo crear el cliente.');
    }
  });

  // 2. Buscar empresa en internet con Gemini
  const searchCompanyMutation = useMutation({
    mutationFn: async ({ clientId, companyName }) => {
      if (!clientId) throw new Error('Cliente no inicializado');
      return await searchCompanyBrandProfile(clientId, companyName);
    },
    onSuccess: (response) => {
      const data = response?.data || response;
      setAiPreviewData(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al buscar la empresa.');
    }
  });

  // 3. Auto-completar perfil de marca con brief (Gemini)
  const autoFillProfileMutation = useMutation({
    mutationFn: async ({ clientId, text }) => {
      if (!clientId) throw new Error('Cliente no inicializado');
      return await autoFillBrandProfile(clientId, { rawText: text, documentId: '' });
    },
    onSuccess: (response) => {
      const data = response?.data || response;
      setAiPreviewData(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar el brief.');
    }
  });

  // 4. Guardar perfil de marca refinado (Paso 4)
  const saveBrandProfileMutation = useMutation({
    mutationFn: async ({ clientId, profileData }) => {
      if (!clientId) throw new Error('Cliente no inicializado');
      return await updateClientBrandProfile(clientId, profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setStep(5);
    },
    onError: (error) => {
      toast.error(error.message || 'No se pudo guardar la identidad.');
    }
  });

  // MANEJADORES DE EVENTOS
  // Paso 1: Confirmar datos básicos y crear en base de datos
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Por favor escribe un nombre.');
      return;
    }
    createClientMutation.mutate({
      name: clientName.trim(),
      industry: clientIndustry.trim() || null
    });
  };

  // Paso 2: Opción "Completar más tarde"
  const handleCompleteLater = () => {
    toast.success(`Cliente "${createdClient.name}" creado. Podrás configurar su identidad de marca más tarde.`);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    onClose();
    // Redirigir directamente a la ficha del cliente
    navigate(`/clients/${createdClient.id}`);
  };

  // Paso 3A: Buscar empresa en internet con Gemini
  const handleSearchCompany = async () => {
    if (!searchQuery.trim()) {
      toast.error('Por favor escribe el nombre de la empresa a buscar.');
      return;
    }
    setIsAiLoading(true);
    try {
      await searchCompanyMutation.mutateAsync({
        clientId: createdClient?.id,
        companyName: searchQuery.trim()
      });
    } catch (_e) {
      // Manejado por onError de la mutación
    } finally {
      setIsAiLoading(false);
    }
  };

  // Paso 3B: Pegar brief
  const handleProcessBrief = async () => {
    if (!briefText.trim()) {
      toast.error('Por favor introduce notas o un brief de la marca.');
      return;
    }
    setIsAiLoading(true);
    try {
      await autoFillProfileMutation.mutateAsync({
        clientId: createdClient?.id,
        text: briefText.trim()
      });
    } catch (_e) {
      // Manejado por onError de la mutación
    } finally {
      setIsAiLoading(false);
    }
  };

  // Confirmar y aplicar datos extraídos por la IA (Pasos 3A / 3B)
  const handleConfirmAiData = () => {
    if (aiPreviewData) {
      setBrandProfile({
        ...DEFAULT_PROFILE,
        ...aiPreviewData
      });
    }
    setStep(4);
  };

  // Paso 4: Guardar perfil completo refinado
  const handleSaveBrandProfile = () => {
    saveBrandProfileMutation.mutate({
      clientId: createdClient?.id,
      profileData: brandProfile
    });
  };

  // Modificar perfil de marca localmente en Step 4
  const handleProfileFieldChange = (field, value) => {
    setBrandProfile(prev => ({ ...prev, [field]: value }));
  };

  // Toggle de plataformas en Step 4
  const handleTogglePlatform = (platformId) => {
    const active = brandProfile.preferred_platforms || [];
    const next = active.includes(platformId)
      ? active.filter(p => p !== platformId)
      : [...active, platformId];
    handleProfileFieldChange('preferred_platforms', next);
  };

  // Renderizador de chips sugeridos
  const renderSuggestions = (suggestions, field) => {
    const currentList = brandProfile[field] || [];
    const filtered = suggestions.filter(s => !currentList.includes(s));
    if (filtered.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        <span className="text-[10px] text-gray-500 mr-1 self-center">Sugeridos:</span>
        {filtered.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => {
              handleProfileFieldChange(field, [...currentList, item]);
            }}
            className="rounded bg-[#28262B] hover:bg-[#F3F2F4] hover:text-[#161517] border border-[#2C2930] px-1.5 py-0.5 text-[10px] text-gray-400 transition-all"
          >
            + {item}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={() => {
        // Solo permitir cerrar haciendo click fuera si estamos en paso 1, 2 o 5.
        // En los pasos intermedios de carga o refinamiento es mejor forzar la interacción para evitar pérdidas accidentales.
        if (step === 1 || step === 2 || step === 5) {
          onClose();
        }
      }}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-250'
              enterFrom='opacity-0 scale-95 y-4'
              enterTo='opacity-100 scale-100 y-0'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100 y-0'
              leaveTo='opacity-0 scale-95 y-4'
            >
              <Dialog.Panel className={`w-full ${step === 4 ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] p-6 shadow-2xl transition-all`}>
                
                {/* INDICADOR DE PROGRESO DE PASOS (Solo visible en pasos 1 a 4) */}
                {step <= 4 && (
                  <div className="w-full mb-6">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[color:var(--color-text-secondary)] mb-2">
                      <span>Progreso de Configuración</span>
                      <span className="text-[color:var(--color-accent-sage)] font-mono">Paso {step === 4 ? 3 : step} de 3</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] flex overflow-hidden">
                      <div className={`h-full bg-[color:var(--color-accent-sage)] transition-all duration-300`} style={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }} />
                    </div>
                  </div>
                )}

                {/* ANIMACIÓN Y RENDERING DE PASOS */}
                <AnimatePresence mode="wait">
                  
                  {/* ========================================================= */}
                  {/* PASO 1: DATOS BÁSICOS */}
                  {/* ========================================================= */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Dialog.Title className='text-xl font-bold text-white mb-1 flex items-center gap-2'>
                        <span>¡Empecemos con tu nuevo cliente! 🚀</span>
                      </Dialog.Title>
                      <p className="text-xs text-[color:var(--color-text-muted)] mb-5">
                        Ingresa los datos generales del cliente para poder registrarlo y estructurar su estrategia de contenido.
                      </p>

                      <form onSubmit={handleStep1Submit} className='space-y-4'>
                        <div className="space-y-1.5">
                          <label className='text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'>
                            Nombre del Cliente o Marca <span className="text-red-400">*</span>
                          </label>
                          <input
                            type='text'
                            className='input-cyber'
                            placeholder='Ej: Cafe Store, Nike Argentina, Inmobiliaria Central'
                            value={clientName || ''}
                            onChange={e => setClientName(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className='text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'>
                            Sector o Industria (Opcional)
                          </label>
                          <input
                            type='text'
                            className='input-cyber'
                            placeholder='Ej: Gastronomía, Bienes Raíces, Moda...'
                            value={clientIndustry || ''}
                            onChange={e => setClientIndustry(e.target.value)}
                          />
                          
                          {/* Sugerencias Rápidas de Industria */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {SUGGESTED_INDUSTRIES.map(ind => (
                              <button
                                key={ind}
                                type="button"
                                onClick={() => setClientIndustry(ind)}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                                  clientIndustry === ind
                                    ? 'bg-[color:var(--color-accent-sage)] text-[#161517] border-[color:var(--color-accent-sage)]'
                                    : 'bg-[color:var(--color-surface)] border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:border-gray-500 hover:text-white'
                                }`}
                              >
                                {ind}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className='flex justify-end gap-3 pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                          <button
                            type='button'
                            onClick={onClose}
                            className='btn-cyber border border-transparent text-[color:var(--color-text-muted)] hover:text-white hover:bg-[color:var(--color-surface)]'
                          >
                            Cancelar
                          </button>
                          <button
                            type='submit'
                            disabled={createClientMutation.isPending}
                            className='btn-cyber btn-tone btn-tone--green min-w-[140px] flex items-center justify-center gap-1.5 font-bold'
                          >
                            {createClientMutation.isPending ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#161517] border-t-transparent" />
                                <span>Creando…</span>
                              </>
                            ) : (
                              <>
                                <span>Siguiente: Identidad ✨</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* ========================================================= */}
                  {/* PASO 2: SELECCIÓN DE MÉTODO */}
                  {/* ========================================================= */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <Dialog.Title className='text-xl font-bold text-white mb-1'>
                        ¿Cómo quieres configurar la identidad de <span className="text-[color:var(--color-accent-sage)]">{createdClient?.name}</span>? 🧬
                      </Dialog.Title>
                      <p className="text-xs text-[color:var(--color-text-muted)]">
                        La identidad de marca enseña a la IA el tono de voz, propuesta de valor y pilares para que tus copys y calendarios sean 100% personalizados y precisos.
                      </p>

                      {/* Cartas de Selección */}
                      <div className="space-y-3 pt-2">
                        {/* Opción 1: Gemini Web Search */}
                        <button
                          type="button"
                          onClick={() => setStep(3.1)} // 3.1 represents step 3A (Search)
                          className="w-full text-left p-4 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-border-strong)] transition-all flex gap-4 group"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[color:var(--color-accent-sage)]/10 border border-[color:var(--color-accent-sage)]/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                            🌐
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-white">Búsqueda Web con IA (¡Recomendado!)</span>
                              <span className="rounded bg-[color:var(--color-accent-sage)]/10 border border-[color:var(--color-accent-sage)]/30 px-2 py-0.5 text-[9px] font-bold text-[color:var(--color-accent-sage)]">
                                Rápido y Completo ✨
                              </span>
                            </div>
                            <p className="text-[11px] text-[color:var(--color-text-muted)] mt-1">
                              Gemini investigará internet (sitio web, redes activas, noticias) y completará el perfil completo en 15 segundos.
                            </p>
                          </div>
                        </button>

                        {/* Opción 2: brief libre */}
                        <button
                          type="button"
                          onClick={() => setStep(3.2)} // 3.2 represents step 3B (Brief)
                          className="w-full text-left p-4 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-border-strong)] transition-all flex gap-4 group"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[color:var(--color-accent-lavender)]/10 border border-[color:var(--color-accent-lavender)]/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                            ✍️
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-white">Pegar un Brief o Apuntes libres</span>
                              <span className="rounded bg-[color:var(--color-accent-lavender)]/10 border border-[color:var(--color-accent-lavender)]/30 px-2 py-0.5 text-[9px] font-bold text-[color:var(--color-accent-lavender)]">
                                Extracción IA 🪄
                              </span>
                            </div>
                            <p className="text-[11px] text-[color:var(--color-text-muted)] mt-1">
                              Pega apuntes informales de WhatsApp, notas de reuniones o un archivo PDF. Gemini los procesará para estructurar la marca.
                            </p>
                          </div>
                        </button>

                        {/* Opción 3: Manual */}
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="w-full text-left p-4 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-border-strong)] transition-all flex gap-4 group"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[color:var(--color-accent-sand)]/10 border border-[color:var(--color-accent-sand)]/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                            🛠️
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-white block">Configurar Manualmente</span>
                            <p className="text-[11px] text-[color:var(--color-text-muted)] mt-1">
                              Prefiero saltarme los asistentes automatizados y rellenar los datos de identidad (redes, pilares, etc.) manualmente.
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* Botón de "Completar más tarde" */}
                      <div className="flex flex-col items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6">
                        <button
                          type="button"
                          onClick={handleCompleteLater}
                          className="text-xs font-semibold text-[color:var(--color-text-muted)] hover:text-white flex items-center gap-1.5 transition-colors group"
                        >
                          <span>Quiero hacer esto en otro momento.</span>
                          <span className="text-[color:var(--color-accent-sage)] font-bold group-hover:translate-x-0.5 transition-transform">Completar más tarde ➔</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ========================================================= */}
                  {/* PASO 3A: BÚSQUEDA WEB CON IA */}
                  {/* ========================================================= */}
                  {step === 3.1 && (
                    <motion.div
                      key="step3a"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <Dialog.Title className='text-xl font-bold text-white mb-1 flex items-center gap-2'>
                        <span>Buscar <span className="text-[color:var(--color-accent-sage)]">{createdClient?.name}</span> en Internet 🌐</span>
                      </Dialog.Title>
                      
                      {!isAiLoading && !aiPreviewData ? (
                        <>
                          <p className="text-xs text-[color:var(--color-text-muted)] mb-4">
                            Escribe el nombre comercial exacto de la empresa para que Gemini busque perfiles públicos en la web (Instagram, Sitio Web, etc.) y estruture la propuesta.
                          </p>

                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)] block">Término de búsqueda</label>
                              <input
                                type="text"
                                className="input-cyber"
                                placeholder="Ej: Starbucks Argentina, Inmobiliaria Lider Cordoba..."
                                value={searchQuery || ''}
                                onChange={e => setSearchQuery(e.target.value)}
                              />
                            </div>

                            <div className='flex justify-between items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                              <button
                                type='button'
                                onClick={() => setStep(2)}
                                className='btn-cyber text-xs border border-transparent text-[color:var(--color-text-secondary)] hover:text-white flex items-center gap-1'
                              >
                                <span>← Volver atrás</span>
                              </button>
                              <button
                                type='button'
                                onClick={handleSearchCompany}
                                className='btn-cyber btn-tone btn-tone--green min-w-[150px] font-bold flex items-center justify-center gap-1.5'
                              >
                                <span>Buscar e Inicializar ✨</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : isAiLoading ? (
                        /* PANTALLA DE CARGA CYBER IA INTERACTIVA */
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                          <div className="relative h-16 w-16 flex items-center justify-center">
                            {/* Círculo giratorio cyberpunk */}
                            <span className="absolute inset-0 rounded-full border-4 border-[color:var(--color-border-subtle)] border-t-[color:var(--color-accent-sage)] animate-spin" />
                            <span className="text-xl">🪄</span>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-white">Gemini está investigando la marca...</h3>
                            <p className="text-xs text-[color:var(--color-text-secondary)] max-w-sm">
                              Este proceso tarda de 10 a 15 segundos porque buscamos información real en internet.
                            </p>
                          </div>

                          {/* Consola de pasos en tiempo real */}
                          <div className="w-full max-w-sm rounded-lg bg-[color:var(--color-surface-strong)] border border-[color:var(--color-border-subtle)] p-3 text-left font-mono text-[10px] space-y-1.5 text-gray-500">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">✔</span>
                              <span className="text-white">Conectando con Gemini 1.5 Pro...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={aiLoaderPhase >= 1 ? "text-green-400" : "text-yellow-500 animate-pulse"}>
                                {aiLoaderPhase >= 1 ? "✔" : "⚙"}
                              </span>
                              <span className={aiLoaderPhase >= 1 ? "text-white" : "text-gray-400"}>
                                Buscando perfiles comerciales en Google Search...
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={aiLoaderPhase >= 2 ? "text-green-400" : aiLoaderPhase === 1 ? "text-yellow-500 animate-pulse" : "•"}>
                                {aiLoaderPhase >= 2 ? "✔" : aiLoaderPhase === 1 ? "⚙" : " "}
                              </span>
                              <span className={aiLoaderPhase >= 2 ? "text-white" : aiLoaderPhase === 1 ? "text-gray-400" : "text-gray-600"}>
                                Analizando propuesta de valor y tono editorial...
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={aiLoaderPhase >= 3 ? "text-green-400" : aiLoaderPhase === 2 ? "text-yellow-500 animate-pulse" : "•"}>
                                {aiLoaderPhase >= 3 ? "✔" : aiLoaderPhase === 2 ? "⚙" : " "}
                              </span>
                              <span className={aiLoaderPhase >= 3 ? "text-white" : aiLoaderPhase === 2 ? "text-gray-400" : "text-gray-600"}>
                                Estructurando pilares sugeridos de marca...
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* VISTA PREVIA DE DATOS EXTRAÍDOS POR BÚSQUEDA WEB */
                        <div className="space-y-4">
                          <div className="rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] p-4 space-y-3.5 max-h-[350px] overflow-y-auto">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-accent-sage)] mb-1">
                              Resultados de Investigación de IA
                            </h3>
                            
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Descripción del Negocio</h4>
                              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                {aiPreviewData?.business_description || 'No especificado.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Audiencia Objetivo</h4>
                                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                  {aiPreviewData?.target_audience || 'No especificado.'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Tono de Voz Detectado</h4>
                                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                  {aiPreviewData?.brand_voice || 'No especificado.'}
                                </p>
                              </div>
                            </div>

                            {aiPreviewData?.content_pillars?.length > 0 && (
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Pilares Sugeridos</h4>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {aiPreviewData.content_pillars.map(tag => (
                                    <span key={tag} className="rounded bg-[#28262B] border border-[#2C2930] px-2 py-0.5 text-[10px] text-gray-300 font-semibold">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className='flex justify-between items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                            <button
                              type='button'
                              onClick={() => { setAiPreviewData(null); }}
                              className='btn-cyber text-xs border border-transparent text-[color:var(--color-text-secondary)] hover:text-white'
                            >
                              ↺ Buscar otra empresa
                            </button>
                            <button
                              type='button'
                              onClick={handleConfirmAiData}
                              className='btn-cyber btn-tone btn-tone--green min-w-[150px] font-bold flex items-center justify-center gap-1'
                            >
                              <span>Confirmar e Ir al ADN ➔</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ========================================================= */}
                  {/* PASO 3B: PEGAR BRIEF CON IA */}
                  {/* ========================================================= */}
                  {step === 3.2 && (
                    <motion.div
                      key="step3b"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <Dialog.Title className='text-xl font-bold text-white mb-1 flex items-center gap-2'>
                        <span>Cuéntale a Gemini sobre <span className="text-[color:var(--color-accent-sage)]">{createdClient?.name}</span> ✍️</span>
                      </Dialog.Title>
                      
                      {!isAiLoading && !aiPreviewData ? (
                        <>
                          <p className="text-xs text-[color:var(--color-text-muted)] mb-4">
                            Pega un brief informal, tus apuntes rápidos de la primera llamada con el cliente o un resumen. Gemini estructurará todo el ADN automáticamente.
                          </p>

                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)] block">Apuntes o Brief del Cliente</label>
                              <textarea
                                className="w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] p-3 text-xs text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all resize-none"
                                rows={6}
                                placeholder="Ej: Es un gimnasio boutique de CrossFit llamado Iron Box. Queremos apuntar a un público joven-adulto de 20-35 años en el barrio. Tono motivador pero amigable. Queremos subir videos de los entrenamientos a Reels de Instagram y TikTok, y fotos de la comunidad..."
                                value={briefText || ''}
                                onChange={e => setBriefText(e.target.value)}
                              />
                            </div>

                            <div className='flex justify-between items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                              <button
                                type='button'
                                onClick={() => setStep(2)}
                                className='btn-cyber text-xs border border-transparent text-[color:var(--color-text-secondary)] hover:text-white'
                              >
                                <span>← Volver atrás</span>
                              </button>
                              <button
                                type='button'
                                onClick={handleProcessBrief}
                                className='btn-cyber btn-tone btn-tone--green min-w-[150px] font-bold flex items-center justify-center gap-1.5'
                              >
                                <span>Estructurar con IA ✨</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : isAiLoading ? (
                        /* PANTALLA DE CARGA CYBER IA INTERACTIVA */
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                          <div className="relative h-16 w-16 flex items-center justify-center">
                            <span className="absolute inset-0 rounded-full border-4 border-[color:var(--color-border-subtle)] border-t-[color:var(--color-accent-lavender)] animate-spin" />
                            <span className="text-xl">🪄</span>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-white">Gemini está analizando tu brief...</h3>
                            <p className="text-xs text-[color:var(--color-text-secondary)] max-w-sm">
                              Estamos interpretando tus apuntes y estructurando pilares editoriales y tono de voz.
                            </p>
                          </div>

                          <div className="w-full max-w-sm rounded-lg bg-[color:var(--color-surface-strong)] border border-[color:var(--color-border-subtle)] p-3 text-left font-mono text-[10px] space-y-1.5 text-gray-500">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">✔</span>
                              <span className="text-white">Conectando con Gemini 1.5 Pro...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={aiLoaderPhase >= 1 ? "text-green-400" : "text-yellow-500 animate-pulse"}>
                                {aiLoaderPhase >= 1 ? "✔" : "⚙"}
                              </span>
                              <span className={aiLoaderPhase >= 1 ? "text-white" : "text-gray-400"}>
                                Leyendo y extrayendo apuntes de marca...
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={aiLoaderPhase >= 2 ? "text-green-400" : aiLoaderPhase === 1 ? "text-yellow-500 animate-pulse" : "•"}>
                                {aiLoaderPhase >= 2 ? "✔" : aiLoaderPhase === 1 ? "⚙" : " "}
                              </span>
                              <span className={aiLoaderPhase >= 2 ? "text-white" : aiLoaderPhase === 1 ? "text-gray-400" : "text-gray-600"}>
                                Estructurando perfil de identidad comercial...
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* VISTA PREVIA DE DATOS BRIEF */
                        <div className="space-y-4">
                          <div className="rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] p-4 space-y-3.5 max-h-[350px] overflow-y-auto">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-accent-lavender)] mb-1">
                              ADN Extrído por la IA
                            </h3>
                            
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Descripción del Negocio</h4>
                              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                {aiPreviewData?.business_description || 'No especificado.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Audiencia Objetivo</h4>
                                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                  {aiPreviewData?.target_audience || 'No especificado.'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Tono de Voz</h4>
                                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed bg-[color:var(--color-surface-strong)]/40 p-2 rounded border border-[color:var(--color-border-subtle)]/50">
                                  {aiPreviewData?.brand_voice || 'No especificado.'}
                                </p>
                              </div>
                            </div>

                            {aiPreviewData?.content_pillars?.length > 0 && (
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Pilares Sugeridos</h4>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {aiPreviewData.content_pillars.map(tag => (
                                    <span key={tag} className="rounded bg-[#28262B] border border-[#2C2930] px-2 py-0.5 text-[10px] text-gray-300 font-semibold">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className='flex justify-between items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                            <button
                              type='button'
                              onClick={() => { setAiPreviewData(null); }}
                              className='btn-cyber text-xs border border-transparent text-[color:var(--color-text-secondary)] hover:text-white'
                            >
                              ↺ Editar Brief
                            </button>
                            <button
                              type='button'
                              onClick={handleConfirmAiData}
                              className='btn-cyber btn-tone btn-tone--green min-w-[150px] font-bold flex items-center justify-center gap-1'
                            >
                              <span>Confirmar e Ir al ADN ➔</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ========================================================= */}
                  {/* PASO 4: REFINAMIENTO Y PERSONALIZACIÓN */}
                  {/* ========================================================= */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-[color:var(--color-border-subtle)]">
                        <div>
                          <Dialog.Title className='text-lg font-bold text-white flex items-center gap-2'>
                            <span>Personalizar Identidad: <span className="text-[color:var(--color-accent-sage)]">{createdClient?.name}</span></span>
                          </Dialog.Title>
                          <p className="text-[11px] text-[color:var(--color-text-secondary)] mt-0.5">
                            Revisa y perfecciona el ADN estructurado de tu cliente. Puedes cambiar lo que quieras.
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-400">
                          ✓ Listo para Guardar
                        </span>
                      </div>

                      {/* Tabs de Refinamiento */}
                      <div className="flex border-b border-[color:var(--color-border-subtle)] gap-2 overflow-x-auto pb-px">
                        {[
                          { id: 'adn', label: '1. ADN y Tono 🧬' },
                          { id: 'canales', label: '2. Canales y Formatos 📱' },
                          { id: 'pilares', label: '3. Pilares y Catálogo 📦' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveRefinementTab(tab.id)}
                            className={`whitespace-nowrap px-4 py-2 text-xs font-bold border-b-2 transition-all -mb-px ${
                              activeRefinementTab === tab.id
                                ? 'border-[color:var(--color-text-primary)] text-white'
                                : 'border-transparent text-[color:var(--color-text-muted)] hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1">
                        
                        {/* TAB 1: ADN Y TONO */}
                        {activeRefinementTab === 'adn' && (
                          <div className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider">Negocio y propuesta de valor</label>
                              <textarea
                                rows={3}
                                value={brandProfile.business_description || ''}
                                onChange={e => handleProfileFieldChange('business_description', e.target.value)}
                                className="w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-2.5 text-xs text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all resize-none"
                                placeholder="¿A qué se dedica el negocio, qué vende y cuál es su factor diferenciador?"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider">Audiencia objetivo</label>
                                <textarea
                                  rows={3}
                                  value={brandProfile.target_audience || ''}
                                  onChange={e => handleProfileFieldChange('target_audience', e.target.value)}
                                  className="w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-2.5 text-xs text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all resize-none"
                                  placeholder="¿Quién es su cliente ideal? Edad, intereses, motivaciones..."
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider">Tono de voz</label>
                                <textarea
                                  rows={3}
                                  value={brandProfile.brand_voice || ''}
                                  onChange={e => handleProfileFieldChange('brand_voice', e.target.value)}
                                  className="w-full rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-2.5 text-xs text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all resize-none"
                                  placeholder="Ej: Alegre, cercano, educativo, formal..."
                                />
                                {/* Sugerencias rápidas de tono */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {SUGGESTIONS.brand_voice.map(tone => {
                                    const isActive = brandProfile.brand_voice?.includes(tone);
                                    return (
                                      <button
                                        key={tone}
                                        type="button"
                                        onClick={() => {
                                          const prev = brandProfile.brand_voice || '';
                                          const next = prev ? `${prev}, ${tone}` : tone;
                                          handleProfileFieldChange('brand_voice', next);
                                        }}
                                        className="rounded bg-[#28262B] border border-[#2C2930] px-1.5 py-0.5 text-[9px] text-gray-400 hover:text-white"
                                      >
                                        + {tone}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: CANALES Y FORMATOS */}
                        {activeRefinementTab === 'canales' && (
                          <div className="space-y-4 pt-1">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Redes Sociales Principales</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {SOCIAL_PLATFORMS.map((platform) => {
                                  const isSelected = (brandProfile.preferred_platforms || []).includes(platform.id);
                                  return (
                                    <button
                                      key={platform.id}
                                      type="button"
                                      onClick={() => handleTogglePlatform(platform.id)}
                                      className={`rounded-xl border p-3 text-center transition-all ${
                                        isSelected
                                          ? 'border-[color:var(--color-accent-sage)] bg-[color:var(--color-accent-sage)]/10 text-white font-bold'
                                          : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] text-gray-300 hover:border-gray-500'
                                      }`}
                                    >
                                      <div className="text-lg mb-0.5">{platform.icon}</div>
                                      <div className="text-[10px]">{platform.label}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Formatos preferidos</label>
                                <TagInput
                                  tags={brandProfile.preferred_formats || []}
                                  onChange={tags => handleProfileFieldChange('preferred_formats', tags)}
                                  placeholder="Ej: Reels, Carruseles, Stories..."
                                />
                                {renderSuggestions(SUGGESTIONS.preferred_formats, 'preferred_formats')}
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Temas a evitar</label>
                                <TagInput
                                  tags={brandProfile.avoid_topics || []}
                                  onChange={tags => handleProfileFieldChange('avoid_topics', tags)}
                                  placeholder="Ej: Religión, Política, Hype..."
                                />
                                {renderSuggestions(SUGGESTIONS.avoid_topics, 'avoid_topics')}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: PILARES Y CATÁLOGO */}
                        {activeRefinementTab === 'pilares' && (
                          <div className="space-y-4 pt-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Pilares de Contenido</label>
                                <TagInput
                                  tags={brandProfile.content_pillars || []}
                                  onChange={tags => handleProfileFieldChange('content_pillars', tags)}
                                  placeholder="Añadir pilar de contenido..."
                                />
                                {renderSuggestions(SUGGESTIONS.content_pillars, 'content_pillars')}
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Objetivos de Contenido</label>
                                <TagInput
                                  tags={brandProfile.content_goals || []}
                                  onChange={tags => handleProfileFieldChange('content_goals', tags)}
                                  placeholder="Ej: Generar engagement, Ventas..."
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-[color:var(--color-text-muted)] uppercase tracking-wider block">Servicios y Productos clave</label>
                              <TagInput
                                tags={brandProfile.products_services || []}
                                onChange={tags => handleProfileFieldChange('products_services', tags)}
                                placeholder="Añadir un producto o servicio de tu catálogo y presiona Enter..."
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='flex justify-between items-center pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                        <button
                          type='button'
                          onClick={() => {
                            // Volver al paso anterior según lo que haya elegido
                            if (searchQuery) setStep(3.1);
                            else if (briefText) setStep(3.2);
                            else setStep(2);
                          }}
                          className='btn-cyber text-xs border border-transparent text-[color:var(--color-text-secondary)] hover:text-white'
                        >
                          ← Volver atrás
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCompleteLater}
                            className="btn-cyber text-xs border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:text-white"
                          >
                            Hacer más tarde
                          </button>
                          <button
                            type='button'
                            onClick={handleSaveBrandProfile}
                            disabled={saveBrandProfileMutation.isPending}
                            className='btn-cyber btn-tone btn-tone--green min-w-[150px] font-bold flex items-center justify-center gap-1.5'
                          >
                            {saveBrandProfileMutation.isPending ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#161517] border-t-transparent" />
                                <span>Guardando…</span>
                              </>
                            ) : (
                              <>
                                <span>Guardar y Finalizar 🎉</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ========================================================= */}
                  {/* PASO 5: EXITO */}
                  {/* ========================================================= */}
                  {step === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-6 text-center space-y-6"
                    >
                      <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto animate-bounce">
                        🎉
                      </div>

                      <div className="space-y-2">
                        <Dialog.Title className='text-2xl font-bold text-white'>
                          ¡{createdClient?.name} configurado con éxito!
                        </Dialog.Title>
                        <p className="text-xs text-[color:var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
                          La identidad de marca ha sido registrada y estructurada. Gemini ya cuenta con toda la información necesaria para generar ideas y calendarios adaptados a su tono.
                        </p>
                        <p className="text-[11px] mt-4 text-[color:var(--color-accent-sage)] bg-[color:var(--color-accent-sage)]/5 border border-[color:var(--color-accent-sage)]/10 rounded-lg p-2.5 max-w-sm mx-auto leading-relaxed">
                          💡 <strong>Tip Profesional:</strong> Puedes vincular sus cuentas de redes sociales (Instagram, TikTok, etc.) y fotos de referencia en la Ficha de Identidad para auditar y perfeccionar la consistencia de su marca con IA.
                        </p>
                      </div>

                      {/* Botones de acción final */}
                      <div className="max-w-xs mx-auto space-y-2.5 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/clients/${createdClient.id}?tab=schedule`);
                          }}
                          className="w-full btn-cyber btn-tone btn-tone--green font-bold text-xs py-3 flex items-center justify-center gap-2"
                        >
                          📅 Ir al Calendario de Contenidos
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/clients/${createdClient.id}?tab=identity`);
                          }}
                          className="w-full btn-cyber font-semibold text-xs py-3 border border-[color:var(--color-border-subtle)] hover:bg-[color:var(--color-surface)] transition-all flex items-center justify-center gap-2 text-white"
                        >
                          🧬 Ver Ficha de Identidad Completa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                          }}
                          className="text-xs font-semibold text-[color:var(--color-text-secondary)] hover:text-white transition-colors"
                        >
                          Volver al Dashboard
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
