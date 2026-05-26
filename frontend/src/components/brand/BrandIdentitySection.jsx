import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getClientBrandProfile,
  updateClientBrandProfile,
  autoFillBrandProfile,
  searchCompanyBrandProfile,
  analyzeBrandConsistency,
} from '../../api/clients';
import {
  deleteBrandAsset,
  getBrandAssetsWithPreview,
  uploadBrandAsset,
} from '../../api/brandAssets';
import { getDocumentsForClient } from '../../api/documents';
import { TagInput } from '../common/TagInput';

const DEFAULT_PROFILE = {
  business_description: '',
  target_audience: '',
  brand_voice: '',
  reference_style: '',
  brand_values: '',
  competitors: '',
  instagram_url: '',
  website_url: '',
  tiktok_url: '',
  youtube_url: '',
  facebook_url: '',
  linkedin_url: '',
  source_notes: '',
  content_pillars: [],
  content_goals: [],
  products_services: [],
  preferred_platforms: [],
  preferred_formats: [],
  avoid_topics: [],
  source_links: [],
  ai_insights: {
    summary: '',
    tone_detected: '',
    visual_style: '',
    products_detected: [],
    content_pillars_suggested: [],
    last_analyzed_at: null,
  },
};

const ensureHttpProtocol = (rawUrl = '') => {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const BrandIdentitySection = ({ clientId }) => {
  // Estados generales del formulario
  const [formData, setFormData] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para el verificador de coherencia multicanal
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [isAnalyzingConsistency, setIsAnalyzingConsistency] = useState(false);
  const [resolvedConflicts, setResolvedConflicts] = useState(new Set());
  const [highlightedField, setHighlightedField] = useState(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const CONSISTENCY_LOADER_MSGS = [
    '🔌 Conectando con los canales públicos...',
    '🧠 Analizando el ADN y estilo de marca...',
    '📡 Evaluando coherencia estratégica...',
    '✨ Consolidando reporte de Co-Pilot...',
  ];

  // Rotador de mensajes de carga
  useEffect(() => {
    let interval;
    if (isAnalyzingConsistency) {
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % CONSISTENCY_LOADER_MSGS.length);
      }, 1800);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzingConsistency]);

  // Estados para el panel de autocompletado con IA
  const [aiInputMode, setAiInputMode] = useState('text'); // 'text' | 'doc'
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [aiHighlightFields, setAiHighlightFields] = useState(false);

  // Estado para búsqueda de empresa en internet
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Estados para material de referencia y archivos
  const [brandAssets, setBrandAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Carga inicial de datos
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getClientBrandProfile(clientId);
      const data = response?.data || {};

      // Mapear de source_links antiguos si no existen inputs dedicados
      const mapped = { ...data };
      if (Array.isArray(data.source_links) && data.source_links.length > 0) {
        data.source_links.forEach(link => {
          if (link.type === 'instagram' && !data.instagram_url) mapped.instagram_url = link.url;
          if (link.type === 'website' && !data.website_url) mapped.website_url = link.url;
          if (link.type === 'tiktok' && !data.tiktok_url) mapped.tiktok_url = link.url;
          if (link.type === 'youtube' && !data.youtube_url) mapped.youtube_url = link.url;
          if (link.type === 'facebook' && !data.facebook_url) mapped.facebook_url = link.url;
          if (link.type === 'linkedin' && !data.linkedin_url) mapped.linkedin_url = link.url;
        });
      }

      setFormData({
        ...DEFAULT_PROFILE,
        ...mapped,
      });
    } catch (error) {
      toast.error('No se pudo cargar la identidad del cliente.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      setLoadingAssets(true);
      const assets = await getBrandAssetsWithPreview(clientId);
      setBrandAssets(assets);
    } catch (_error) {
      setBrandAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAssets();
  }, [clientId]);

  // Cálculo del porcentaje de completado de identidad
  const completion = useMemo(() => {
    const fields = [
      formData.business_description,
      formData.target_audience,
      formData.brand_voice,
      formData.reference_style,
      formData.brand_values,
      formData.competitors,
    ];
    const filled = fields.filter(value => String(value || '').trim().length > 0).length;
    const totalFields = fields.length;
    return Math.min(100, Math.round((filled / totalFields) * 100));
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsistencyCheck = async () => {
    setIsAnalyzingConsistency(true);
    setConsistencyReport(null);
    setResolvedConflicts(new Set());

    try {
      const reconstructedSourceLinks = [
        { type: 'instagram', url: formData.instagram_url },
        { type: 'website', url: formData.website_url },
        { type: 'tiktok', url: formData.tiktok_url },
        { type: 'youtube', url: formData.youtube_url },
        { type: 'facebook', url: formData.facebook_url },
        { type: 'linkedin', url: formData.linkedin_url },
      ]
        .filter(l => l.url && l.url.trim())
        .map((l, i) => ({
          id: `source-link-${l.type}-${i}`,
          type: l.type,
          url: ensureHttpProtocol(l.url),
          notes: '',
        }));

      if (reconstructedSourceLinks.length === 0) {
        toast.error('Por favor agrega al menos un enlace de canal público antes de auditar.');
        setIsAnalyzingConsistency(false);
        return;
      }

      const response = await analyzeBrandConsistency(clientId, formData, reconstructedSourceLinks);

      if (response?.success && response?.data) {
        setConsistencyReport(response.data);
        if (response.data.is_consistent) {
          toast.success('✨ ¡Co-Pilot: Identidad perfectamente alineada con tus canales públicos!');
        } else {
          toast.success(
            `⚠️ Co-Pilot: Auditoría completada. Consistencia al ${response.data.consistency_score}%.`
          );
        }
      } else {
        throw new Error('No se pudo procesar el diagnóstico de consistencia.');
      }
    } catch (error) {
      toast.error(error.message || 'Error al realizar la auditoría.');
    } finally {
      setIsAnalyzingConsistency(false);
    }
  };

  const resolveConflict = (conflictId, field, value) => {
    handleChange(field, value);

    setResolvedConflicts(prev => {
      const next = new Set(prev);
      next.add(conflictId);
      return next;
    });

    setHighlightedField(field);
    setTimeout(() => setHighlightedField(null), 2500);

    toast.success(`✨ ¡Sugerencia aplicada y fusionada en ${getFieldLabel(field)} con éxito!`);
  };

  // Inyectar perfil completo detectado en 1-Clic
  const handleAdoptEntireProfile = () => {
    if (!consistencyReport?.detected_profile) return;
    const dp = consistencyReport.detected_profile;
    setFormData(prev => ({
      ...prev,
      business_description: dp.business_description || prev.business_description,
      target_audience: dp.target_audience || prev.target_audience,
      brand_voice: dp.brand_voice || prev.brand_voice,
      reference_style: dp.reference_style || prev.reference_style,
      brand_values: dp.brand_values || prev.brand_values,
      competitors: dp.competitors || prev.competitors,
    }));
    toast.success('🧬 ¡ADN de marca completo inyectado en el formulario con éxito!');

    setAiHighlightFields(true);
    setTimeout(() => setAiHighlightFields(false), 3500);
  };

  const getFieldLabel = field => {
    const labels = {
      business_description: 'Negocio y Propuesta',
      target_audience: 'Público Objetivo',
      brand_voice: 'Tono de Voz y Expresión',
      reference_style: 'Estilo Visual y Estética',
      brand_values: 'Valores y Filosofía',
      competitors: 'Competidores',
    };
    return labels[field] || field;
  };

  // Carga de material de referencia
  const handleUploadAssets = async files => {
    const validFiles = Array.from(files || []);
    if (!validFiles.length) return;
    setUploadingAssets(true);
    try {
      for (const file of validFiles) {
        await uploadBrandAsset(clientId, file, { asset_type: 'reference' });
      }
      await loadAssets();
      toast.success(
        `¡${validFiles.length} archivo${validFiles.length > 1 ? 's' : ''} cargado${validFiles.length > 1 ? 's' : ''} con éxito!`
      );
    } catch (error) {
      toast.error(error.message || 'No se pudieron subir los archivos.');
    } finally {
      setUploadingAssets(false);
    }
  };

  const handleDeleteAsset = async asset => {
    try {
      await deleteBrandAsset(clientId, asset.id);
      setBrandAssets(prev => prev.filter(item => item.id !== asset.id));
      toast.success('Archivo eliminado de las referencias.');
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el archivo.');
    }
  };

  // Guardar identidad en base de datos
  const handleSubmit = async e => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const reconstructedSourceLinks = [
        { type: 'instagram', url: formData.instagram_url },
        { type: 'website', url: formData.website_url },
        { type: 'tiktok', url: formData.tiktok_url },
        { type: 'youtube', url: formData.youtube_url },
        { type: 'facebook', url: formData.facebook_url },
        { type: 'linkedin', url: formData.linkedin_url },
      ]
        .filter(l => l.url && l.url.trim())
        .map((l, i) => ({
          id: `source-link-${l.type}-${i}`,
          type: l.type,
          url: ensureHttpProtocol(l.url),
          notes: '',
        }));

      const payload = {
        ...formData,
        source_links: reconstructedSourceLinks,
        source_notes: String(formData.source_notes || '').trim(),
      };

      await updateClientBrandProfile(clientId, payload);
      toast.success('✨ ¡Ficha de Identidad de Marca guardada con éxito!');
      setFormData(prev => ({
        ...prev,
        source_links: reconstructedSourceLinks,
      }));
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la identidad.');
    } finally {
      setSaving(false);
    }
  };

  // Buscar empresa en internet con Gemini + Google Search
  const handleCompanySearch = async () => {
    if (!companySearchQuery.trim()) {
      toast.error('Por favor ingresa el nombre de la empresa para realizar la búsqueda.');
      return;
    }
    setIsSearching(true);
    try {
      const response = await searchCompanyBrandProfile(clientId, companySearchQuery.trim());
      if (response?.success && response?.data) {
        const generated = response.data;
        setFormData(prev => ({
          ...prev,
          business_description: generated.business_description || prev.business_description,
          target_audience: generated.target_audience || prev.target_audience,
          brand_voice: generated.brand_voice || prev.brand_voice,
          brand_values: generated.brand_values || prev.brand_values || '',
          competitors: generated.competitors || prev.competitors || '',
          reference_style: generated.reference_style || prev.reference_style,
        }));
        toast.success(`✨ Perfil extraído con éxito para "${companySearchQuery}".`);
        setAiHighlightFields(true);
        setTimeout(() => setAiHighlightFields(false), 3500);
      } else {
        throw new Error('No se pudo obtener información de la empresa.');
      }
    } catch (err) {
      toast.error(err.message || 'Error al buscar la empresa.');
    } finally {
      setIsSearching(false);
    }
  };

  // Lanzar asistente de autocompletado con IA
  const handleAiAutoFill = async () => {
    if (!aiTextPrompt.trim()) {
      toast.error('Por favor pega el brief, notas o apuntes de la marca.');
      return;
    }

    setIsAutoFilling(true);
    try {
      const payload = {
        rawText: aiTextPrompt,
        documentId: '',
      };

      const response = await autoFillBrandProfile(clientId, payload);

      if (response?.success && response?.data) {
        const generated = response.data;
        setFormData(prev => ({
          ...prev,
          business_description: generated.business_description || prev.business_description,
          target_audience: generated.target_audience || prev.target_audience,
          brand_voice: generated.brand_voice || prev.brand_voice,
          brand_values: generated.brand_values || prev.brand_values || '',
          competitors: generated.competitors || prev.competitors || '',
          reference_style: generated.reference_style || prev.reference_style,
        }));

        toast.success('✨ ¡Identidad comercial estructurada a partir del brief con éxito!');
        setAiTextPrompt('');

        setAiHighlightFields(true);
        setTimeout(() => setAiHighlightFields(false), 3500);
      } else {
        throw new Error('La IA no retornó información de marca válida.');
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar con IA.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async e => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUploadAssets(files);
    }
  };

  // Círculo de progreso radial exacto
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  // Títulos e iconos para las fichas de ADN de marca
  const dnaFields = [
    {
      id: 'business_description',
      title: 'Negocio y Propuesta Estratégica',
      description: 'A qué se dedica la marca, su propuesta de valor única y oferta principal.',
      placeholder:
        'Ej: Empresa de café artesanal enfocado en granos de origen único, tueste medio local y venta online directa...',
      icon: (
        <svg
          className='w-5 h-5 text-[#4ECDC4]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
          />
        </svg>
      ),
      accentColor: '#4ECDC4',
    },
    {
      id: 'target_audience',
      title: 'Público Objetivo y Segmentos',
      description:
        'Quién es el cliente ideal, demografía, intereses clave, dolores y aspiraciones.',
      placeholder:
        'Ej: Profesionales jóvenes de 25-40 años, amantes de la tecnología, teletrabajadores que valoran el café de alta calidad...',
      icon: (
        <svg
          className='w-5 h-5 text-[#ffd166]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
          />
        </svg>
      ),
      accentColor: '#ffd166',
    },
    {
      id: 'brand_voice',
      title: 'Tono de Voz y Personalidad',
      description:
        'Estilo comunicacional de la redacción, adjetivos de tono y directrices de copia.',
      placeholder:
        'Ej: Cercano pero experto, inspirador, con humor sutil e inteligente. Evitar sonar corporativo o excesivamente formal...',
      icon: (
        <svg
          className='w-5 h-5 text-[#7C5CFC]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z'
          />
        </svg>
      ),
      accentColor: '#7C5CFC',
    },
    {
      id: 'reference_style',
      title: 'Dirección Estética y Visual',
      description:
        'Paleta de colores sugerida, vibra visual, estilo de fotografía e identidad visual.',
      placeholder:
        'Ej: Minimalista y orgánico, tonos tierra con toques de verde salvia. Fotografía de producto iluminada con luz natural, encuadres limpios...',
      icon: (
        <svg
          className='w-5 h-5 text-[#ff6b6b]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      ),
      accentColor: '#ff6b6b',
    },
    {
      id: 'brand_values',
      title: 'Valores Centrales y Filosofía',
      description:
        'Los pilares éticos de la empresa, su visión a largo plazo y principios irrenunciables.',
      placeholder:
        'Ej: Sustentabilidad (café de comercio justo), autenticidad radical en el proceso y obsesión con la frescura total del producto...',
      icon: (
        <svg
          className='w-5 h-5 text-[#A855F7]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.827m11.379-8.16l1.15-.827M8.14 21.27l.707-1.03m10.748-7.848l.707-1.03M12 3v1.5m0 15V21m-3.077-2.543l-.513-1.41m5.13-14.095l-.513-1.41m-8.16 11.379l-.827-1.15m8.16-11.379l-.827-1.15m-7.848 10.748l-1.03-.707m7.848-10.748l-1.03-.707'
          />
        </svg>
      ),
      accentColor: '#A855F7',
    },
    {
      id: 'competitors',
      title: 'Competidores y Benchmarks',
      description: 'Competencia local e internacional, cuentas que sirven de inspiración o guía.',
      placeholder:
        'Ej: Competidores: Blue Bottle Coffee, Nespresso (antítesis comercial). Inspiración estética: Cuentas de té orgánico y minimalismo japonés...',
      icon: (
        <svg
          className='w-5 h-5 text-[#06B6D4]'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      ),
      accentColor: '#06B6D4',
    },
  ];

  if (loading) {
    return (
      <div className='w-full flex flex-col items-center justify-center py-32 gap-5 text-text-muted'>
        <div className='relative flex items-center justify-center'>
          <div className='h-12 w-12 border-[3px] border-accent-lavender/10 border-t-accent-lavender rounded-full animate-spin'></div>
          <div className='absolute h-6 w-6 border-[3px] border-accent-sage/10 border-t-accent-sage rounded-full animate-spin animate-reverse'></div>
        </div>
        <p className='text-sm font-semibold tracking-wide animate-pulse uppercase text-text-muted/80'>
          Cargando ficha de identidad estratégica...
        </p>
      </div>
    );
  }

  return (
    <section className='w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8 pb-32'>
      {/* ================= HEADER CONTROL BAR ================= */}
      <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border-subtle pb-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-title font-black text-text-primary tracking-tight flex items-center gap-2'>
            🧬 Identidad de Marca
          </h1>
          <p className='text-xs text-text-muted'>
            Configura y audita el ADN estratégico del cliente para asegurar coherencia absoluta con
            el Co-Pilot de IA.
          </p>
        </div>

        {/* Circular Gauge Completion */}
        <div className='flex items-center gap-4 bg-surface-soft border border-border-subtle p-3 rounded-2xl shadow-sm'>
          <div className='relative flex items-center justify-center w-14 h-14'>
            <svg className='w-full h-full transform -rotate-90'>
              <defs>
                <linearGradient id='completion-grad' x1='0%' y1='0%' x2='100%' y2='100%'>
                  <stop offset='0%' stopColor='#7C5CFC' />
                  <stop offset='100%' stopColor='#4ECDC4' />
                </linearGradient>
              </defs>
              <circle
                cx='28'
                cy='28'
                r={radius}
                className='stroke-white/[0.04]'
                strokeWidth='4.5'
                fill='transparent'
              />
              <circle
                cx='28'
                cy='28'
                r={radius}
                stroke='url(#completion-grad)'
                strokeWidth='4.5'
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap='round'
                fill='transparent'
                className='transition-all duration-500'
              />
            </svg>
            <span className='absolute text-xs font-black text-white'>{completion}%</span>
          </div>

          <div className='text-left'>
            <div className='text-xs font-extrabold text-text-primary uppercase tracking-wider'>
              ADN de Marca
            </div>
            <div className='text-[10px] text-text-muted mt-0.5'>
              {completion === 100
                ? '¡Ficha estratégica completada al 100%!'
                : 'Completa los 6 pilares para optimizar la IA.'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN TWO-COLUMN WORKSPACE GRID ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ================= COLUMNA IZQUIERDA: SOCiAL DOCK & CO-PILOT (4/12) ================= */}
        <div className='lg:col-span-4 space-y-6 lg:sticky lg:top-4'>
          {/* CARD 1: CANALES PÚBLICOS (SOCIAL DOCK) */}
          <div className='rounded-3xl border border-border-subtle bg-surface p-6 space-y-6 shadow-xl relative overflow-hidden'>
            <div>
              <h3 className='text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2'>
                <span>🔌</span> Canales del Cliente
              </h3>
              <p className='text-[10px] text-text-muted mt-1 leading-normal'>
                Conecta enlaces públicos del cliente. La IA los usará para extraer su ADN real.
              </p>
            </div>

            {/* Social Grid Container */}
            <div className='grid grid-cols-1 gap-3.5'>
              {[
                {
                  id: 'instagram_url',
                  label: 'Instagram',
                  placeholder: 'instagram.com/usuario',
                  icon: (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-[#E1306C]/40 bg-[#E1306C]/5 shadow-[0_0_15px_rgba(225,48,108,0.05)]',
                  activeText: 'text-[#E1306C]',
                },
                {
                  id: 'website_url',
                  label: 'Sitio Web',
                  placeholder: 'https://ejemplo.com',
                  icon: (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-[#4ECDC4]/40 bg-[#4ECDC4]/5 shadow-[0_0_15px_rgba(78,205,196,0.05)]',
                  activeText: 'text-[#4ECDC4]',
                },
                {
                  id: 'tiktok_url',
                  label: 'TikTok',
                  placeholder: 'tiktok.com/@usuario',
                  icon: (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.02)]',
                  activeText: 'text-white',
                },
                {
                  id: 'linkedin_url',
                  label: 'LinkedIn',
                  placeholder: 'linkedin.com/company/nombre',
                  icon: (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-[#0A66C2]/40 bg-[#0A66C2]/5 shadow-[0_0_15px_rgba(10,102,194,0.05)]',
                  activeText: 'text-[#0A66C2]',
                },
              ].map(platform => {
                const value = formData[platform.id] || '';
                const isConnected = value.trim().length > 0;
                return (
                  <div
                    key={platform.id}
                    className={`rounded-2xl border transition-all duration-300 p-3.5 flex items-center gap-4 ${
                      isConnected
                        ? platform.activeStyle
                        : 'border-border-subtle bg-surface-strong/30 hover:border-white/10'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl bg-black/40 ${isConnected ? platform.activeText : 'text-text-muted'}`}
                    >
                      {platform.icon}
                    </div>

                    <div className='flex-1 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[10px] font-extrabold uppercase tracking-wider text-text-primary'>
                          {platform.label}
                        </span>
                        <span
                          className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/5 text-text-muted'
                          }`}
                        >
                          {isConnected ? '🟢 Conectado' : '⚪ Vacío'}
                        </span>
                      </div>
                      <input
                        type='text'
                        value={value}
                        onChange={e => handleChange(platform.id, e.target.value)}
                        placeholder={platform.placeholder}
                        className='w-full bg-transparent p-0 text-xs text-white placeholder-text-secondary border-none focus:ring-0 focus:outline-none'
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 2: CO-PILOT AUDIT & IA CHECK */}
          <div className='rounded-3xl border border-border-subtle bg-surface p-6 space-y-6 shadow-xl relative overflow-hidden'>
            {/* Background glowing blur for premium effect */}
            <div className='absolute -top-10 -right-10 w-24 h-24 rounded-full bg-accent-lavender/5 filter blur-2xl pointer-events-none' />

            <div className='flex items-center justify-between border-b border-border-subtle pb-4'>
              <div>
                <h3 className='text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2'>
                  <span>🧠</span> Co-Pilot de Consistencia
                </h3>
                <p className='text-[10px] text-text-muted mt-1 leading-normal'>
                  Compara y audita la coherencia entre tu ADN interno y los canales activos.
                </p>
              </div>

              {consistencyReport && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    consistencyReport.consistency_score >= 90
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  {consistencyReport.consistency_score}%
                </span>
              )}
            </div>

            {/* Audit Status Graphic */}
            <div className='space-y-4'>
              {!consistencyReport ? (
                <div className='text-center py-6 space-y-3 bg-surface-strong/30 rounded-2xl border border-border-subtle'>
                  <span className='text-2xl block animate-bounce-slow'>🛰️</span>
                  <p className='text-[10.5px] text-text-muted leading-relaxed max-w-[240px] mx-auto'>
                    Conecta al menos un canal público y escanea con el Co-Pilot para verificar
                    discrepancias.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* High level status banner */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      consistencyReport.consistency_score >= 90
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    <h4 className='text-[10px] font-black uppercase tracking-wider'>
                      {consistencyReport.consistency_score >= 90
                        ? '✨ Alineación Excelente'
                        : '⚠️ Discrepancias Detectadas'}
                    </h4>
                    <p className='text-[9.5px] text-text-muted mt-1 leading-normal'>
                      {consistencyReport.consistency_score >= 90
                        ? 'La IA no detecta contradicciones importantes entre tu ADN y tus canales de comunicación públicos.'
                        : 'Se encontraron inconsistencias entre tu ADN guardado y tus perfiles. Puedes revisarlas y fusionarlas a la derecha.'}
                    </p>
                  </div>

                  {/* Adopt entire profile in one click */}
                  {consistencyReport.detected_profile && (
                    <button
                      type='button'
                      onClick={handleAdoptEntireProfile}
                      className='w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/25 text-emerald-400 py-3 text-xs font-bold transition-all active:scale-[0.98] shadow-md'
                    >
                      🧬 Aplicar Diagnóstico Completo IA (1-Clic)
                    </button>
                  )}
                </div>
              )}

              {/* Botón de Ejecutar Auditoría */}
              <button
                type='button'
                disabled={isAnalyzingConsistency}
                onClick={handleConsistencyCheck}
                className='w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C5CFC] to-[#4ECDC4] hover:from-[#6b4dfc] hover:to-[#3ec3ba] text-white py-3.5 text-xs font-black shadow-lg shadow-accent-lavender/10 hover:shadow-accent-lavender/25 transition-all duration-300 disabled:opacity-50'
              >
                {isAnalyzingConsistency ? (
                  <div className='flex flex-col items-center gap-2 py-0.5'>
                    <div className='flex items-center justify-center gap-2'>
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                      <span>Analizando Canales...</span>
                    </div>
                    <span className='text-[9px] text-white/70 font-semibold animate-pulse'>
                      {CONSISTENCY_LOADER_MSGS[loadingMessageIndex]}
                    </span>
                  </div>
                ) : (
                  <>
                    <span>🧠 Auditar con Co-Pilot</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: BIBLIOTECA DE MATERIALES DE REFERENCIA */}
          <div className='rounded-3xl border border-border-subtle bg-surface p-6 space-y-6 shadow-xl relative overflow-hidden'>
            <div>
              <h3 className='text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2'>
                <span>📎</span> Materiales de Referencia
              </h3>
              <p className='text-[10px] text-text-muted mt-1 leading-normal'>
                Sube PDF, manuales de marca o imágenes. La IA asimilará el material para guiar las
                propuestas.
              </p>
            </div>

            {/* Drag & Drop zone styled like a pro canvas */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-2xl border border-dashed p-6 text-center transition-all duration-300 relative ${
                isDragging
                  ? 'border-accent-lavender bg-accent-lavender/10 text-accent-lavender'
                  : 'border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/50 hover:border-white/15'
              }`}
            >
              <input
                type='file'
                multiple
                id='brand-file-uploader'
                className='hidden'
                accept='image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt'
                onChange={e => handleUploadAssets(e.target.files)}
                disabled={uploadingAssets}
              />
              <label
                htmlFor='brand-file-uploader'
                className='cursor-pointer w-full flex flex-col items-center justify-center gap-2 text-text-muted'
              >
                {uploadingAssets ? (
                  <div className='flex flex-col items-center gap-2'>
                    <div className='h-6 w-6 border-2 border-accent-lavender border-t-transparent rounded-full animate-spin'></div>
                    <span className='text-[10px] font-bold text-white'>Subiendo archivos...</span>
                  </div>
                ) : (
                  <>
                    <div className='w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-lg border border-white/5 shadow-inner'>
                      📥
                    </div>
                    <div className='space-y-0.5'>
                      <span className='text-[11px] font-black text-text-primary block'>
                        Arrastra archivos aquí
                      </span>
                      <span className='text-[9px] text-text-muted block'>
                        o haz clic para buscar en el sistema
                      </span>
                    </div>
                    <span className='text-[7.5px] font-bold uppercase tracking-wider text-text-secondary bg-black/40 px-2 py-0.5 rounded border border-white/5 mt-1'>
                      PDF, DOCX, TXT o Imágenes
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Visual File Grid */}
            {brandAssets.length > 0 && (
              <div className='grid grid-cols-2 gap-3 pt-1'>
                {brandAssets.map(asset => {
                  const isImage = asset.file_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                  return (
                    <div
                      key={asset.id}
                      className='group overflow-hidden rounded-xl border border-border-subtle bg-surface-strong p-2 flex flex-col justify-between gap-3 relative shadow-md transition-all hover:border-white/15 hover:shadow-lg'
                    >
                      <div className='flex items-start justify-between gap-1'>
                        <div className='flex items-center gap-2 max-w-[80%]'>
                          <span className='text-sm flex-shrink-0'>{isImage ? '🖼️' : '📄'}</span>
                          <p className='truncate text-[9.5px] text-white/90 font-bold leading-tight'>
                            {asset.file_name || asset.name}
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => handleDeleteAsset(asset)}
                          className='opacity-60 hover:opacity-100 text-red-400 hover:text-red-300 text-[10.5px] p-0.5 font-bold transition-all transition-opacity duration-200'
                        >
                          ✕
                        </button>
                      </div>

                      {/* Display thumbnail preview for images */}
                      {isImage && asset.preview_url && (
                        <div className='h-16 w-full rounded-lg overflow-hidden border border-white/5 relative bg-black/60'>
                          <img
                            src={asset.preview_url}
                            alt={asset.file_name}
                            className='w-full h-full object-cover transition-all group-hover:scale-105 duration-300'
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: LIENZO ESTRATÉGICO Y CO-PILOT (8/12) ================= */}
        <div className='lg:col-span-8 space-y-8'>
          {/* MAGIC PANEL: CENTRO DE COMANDO DE IA */}
          <div className='rounded-3xl border border-border-subtle bg-surface p-6 space-y-6 shadow-xl relative overflow-hidden'>
            {/* Glowing border top */}
            <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-lavender via-accent-sage to-accent-sand' />

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4'>
              <div>
                <h3 className='text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2'>
                  <span>✨</span> Rellenar Ficha con IA
                </h3>
                <p className='text-[10px] text-text-muted mt-1 leading-normal'>
                  Estructura rápidamente el perfil comercial de tu cliente buscando en internet o
                  analizando su brief.
                </p>
              </div>

              {/* Toggle tabs */}
              <div className='flex gap-1 bg-black/40 p-1 rounded-xl border border-border-subtle self-start'>
                <button
                  type='button'
                  onClick={() => setAiInputMode('text')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    aiInputMode === 'text'
                      ? 'bg-surface text-white border border-border-subtle'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  Buscar Empresa
                </button>
                <button
                  type='button'
                  onClick={() => setAiInputMode('doc')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    aiInputMode === 'doc'
                      ? 'bg-surface text-white border border-border-subtle'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  Pegar Brief / Notas
                </button>
              </div>
            </div>

            {/* Input States */}
            {aiInputMode === 'text' ? (
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-3'>
                  <input
                    type='text'
                    value={companySearchQuery}
                    onChange={e => setCompanySearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isSearching && handleCompanySearch()}
                    disabled={isSearching}
                    placeholder='Escribe el nombre de la empresa (ej: Nike, Starbucks, Rambla Studio)...'
                    className='flex-1 rounded-2xl border border-border-subtle bg-surface-strong px-4 py-3 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent-lavender/50 focus:ring-1 focus:ring-accent-lavender/10'
                  />
                  <button
                    type='button'
                    onClick={handleCompanySearch}
                    disabled={isSearching}
                    className='rounded-2xl bg-white hover:bg-gray-100 text-black px-6 py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md whitespace-nowrap disabled:opacity-50 active:scale-[0.98]'
                  >
                    {isSearching ? 'Buscando con Co-Pilot...' : 'Buscar y Rellenar'}
                  </button>
                </div>
                <div className='flex flex-wrap items-center gap-2.5'>
                  <span className='text-[8.5px] font-black text-text-secondary uppercase tracking-widest'>
                    Empresas sugeridas para probar:
                  </span>
                  {['Rambla Studio', 'Nike', 'Starbucks', 'Nespresso'].map(brand => (
                    <button
                      type='button'
                      key={brand}
                      onClick={() => setCompanySearchQuery(brand)}
                      className='text-[9.5px] font-extrabold text-accent-lavender hover:text-accent-sage bg-accent-lavender/5 border border-accent-lavender/10 hover:border-accent-sage/35 px-2.5 py-1 rounded-lg transition-all'
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <textarea
                  rows={4}
                  value={aiTextPrompt}
                  onChange={e => setAiTextPrompt(e.target.value)}
                  className='w-full rounded-2xl border border-border-subtle bg-surface-strong p-4 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent-lavender/50 focus:ring-1 focus:ring-accent-lavender/10 resize-none'
                  placeholder='Pega notas rápidas, apuntes de reuniones, correos comerciales o breves resúmenes del negocio aquí...'
                />
                <div className='flex justify-end'>
                  <button
                    type='button'
                    disabled={isAutoFilling}
                    onClick={handleAiAutoFill}
                    className='rounded-2xl bg-gradient-to-r from-accent-lavender to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 text-xs font-black uppercase tracking-wider shadow-lg transition-all duration-300 disabled:opacity-50 active:scale-[0.98]'
                  >
                    {isAutoFilling ? 'Analizando Brief...' : '✨ Procesar con IA'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EL LIENZO DE ADN DE MARCA (LOS 6 PILARES ESTRATÉGICOS) */}
          <form onSubmit={handleSubmit} className='space-y-8'>
            <div className='space-y-6'>
              {dnaFields.map(field => {
                const value = formData[field.id] || '';

                // Buscar discrepancias contextuales de IA
                const detectedText = consistencyReport?.detected_profile?.[field.id] || '';
                const conflict = consistencyReport?.conflicts?.find(c => c.field === field.id);
                const isResolved = conflict ? resolvedConflicts.has(conflict.id) : true;
                const isHighlight = highlightedField === field.id;

                return (
                  <div
                    key={field.id}
                    className={`rounded-3xl border bg-surface p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                      isHighlight
                        ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-emerald-500/10 scale-[1.005]'
                        : aiHighlightFields
                          ? 'border-accent-lavender/80 scale-[1.005]'
                          : 'border-border-subtle hover:border-white/10'
                    }`}
                  >
                    {/* Glowing vertical line matching section color */}
                    <div
                      className='absolute top-0 bottom-0 left-0 w-[4.5px] rounded-r-md pointer-events-none'
                      style={{ backgroundColor: field.accentColor }}
                    />

                    {/* Card Header */}
                    <div className='flex items-center justify-between border-b border-border-subtle pb-4 mb-4 gap-4'>
                      <div className='flex items-center gap-3.5'>
                        <div className='p-2.5 rounded-xl bg-black/40 shadow-inner flex items-center justify-center flex-shrink-0'>
                          {field.icon}
                        </div>
                        <div className='space-y-0.5'>
                          <h4 className='text-sm font-black text-text-primary'>{field.title}</h4>
                          <p className='text-[10px] text-text-muted'>{field.description}</p>
                        </div>
                      </div>

                      {/* Align Status */}
                      {consistencyReport && (
                        <span
                          className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            conflict && !isResolved
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {conflict && !isResolved ? '⚠️ Discrepancia' : '✓ Alineado'}
                        </span>
                      )}
                    </div>

                    {/* Form Input Textarea */}
                    <textarea
                      rows={5}
                      value={value}
                      onChange={e => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className='w-full rounded-2xl border border-border-subtle bg-surface-strong px-4 py-3 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent-lavender/50 focus:ring-1 focus:ring-accent-lavender/10 min-h-[100px] transition-all duration-300'
                    />

                    {/* CONTEXTUAL AI SUGGESTION DRAWER INLINE */}
                    {detectedText && conflict && !isResolved && (
                      <div className='mt-4 p-4.5 rounded-2xl border border-accent-lavender/25 bg-accent-lavender/5 space-y-3 shadow-inner relative overflow-hidden animate-fadeIn'>
                        {/* Glow ornament */}
                        <div className='absolute top-0 right-0 p-1 bg-accent-lavender/20 rounded-bl-xl text-[9px] font-black text-accent-lavender uppercase tracking-widest'>
                          Sugerencia Co-Pilot
                        </div>

                        <div className='space-y-1 pr-16 text-left'>
                          <span className='text-[9px] font-black text-accent-lavender uppercase tracking-wider block'>
                            📡 Extraído de los canales activos del cliente:
                          </span>
                          <p className='text-[10.5px] text-white/90 italic leading-relaxed whitespace-pre-line border-l-2 border-accent-lavender/35 pl-3.5 mt-2'>
                            "{detectedText}"
                          </p>
                        </div>

                        <div className='flex items-center justify-between pt-3 border-t border-white/5'>
                          <p className='text-[8.5px] text-text-muted leading-tight max-w-[70%]'>
                            La IA sugiere fusionar o sustituir tu descripción interna con esta
                            información real recolectada.
                          </p>
                          <button
                            type='button'
                            onClick={() =>
                              resolveConflict(
                                conflict.id,
                                conflict.field,
                                conflict.suggested_actions.find(a => a.type === 'merge_both')
                                  ?.value || detectedText
                              )
                            }
                            className='inline-flex items-center gap-1.5 bg-accent-lavender hover:bg-accent-lavender/90 text-white rounded-xl px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 whitespace-nowrap'
                          >
                            🧬 Fusionar con ADN
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ================= PIE DE PÁGINA: ACCIONES DE GUARDADO GLOBAL ================= */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl border border-border-subtle bg-surface shadow-xl'>
              <div className='text-left'>
                <span className='text-[10px] font-black text-text-secondary uppercase tracking-widest block'>
                  Cambios Pendientes
                </span>
                <p className='text-[9.5px] text-text-muted leading-normal mt-0.5'>
                  Una vez conforme con la ficha estratégica de ADN de marca, guarda para actualizar
                  la memoria de Gemini.
                </p>
              </div>

              <button
                type='submit'
                disabled={saving}
                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]'
              >
                {saving ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Guardando ADN...</span>
                  </div>
                ) : (
                  <>
                    <span>💾 Guardar Identidad de Marca</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
