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
    '🔌 Conectando con canales públicos de la marca...',
    '🌐 Analizando estructura de enlaces y redes sociales...',
    '🔍 Realizando búsquedas profundas sobre el sector e industria...',
    '🕷️ Extrayendo y limpiando contenido del sitio web oficial...',
    '📂 Decodificando documentos de referencia y PDFs...',
    '🖼️ Procesando elementos gráficos e imágenes...',
    '🧠 Evaluando la consistencia y ADN de marca...',
    '⚖️ Co-Pilot cruzando datos y buscando contradicciones...',
    '✨ Consolidando informe estratégico en la Casilla Única...',
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

      if (data.analysis_in_progress) {
        setIsAnalyzingConsistency(true);
      } else {
        setIsAnalyzingConsistency(false);
      }

      if (data.consistency_report) {
        setConsistencyReport(data.consistency_report);
      } else {
        setConsistencyReport(null);
      }
    } catch (error) {
      toast.error('No se pudo cargar la identidad del cliente.');
    } finally {
      setLoading(false);
    }
  };

  // Carga silenciosa periódica mientras se ejecuta el análisis en segundo plano
  const loadProfileSilent = async () => {
    try {
      const response = await getClientBrandProfile(clientId);
      const data = response?.data || {};

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

      setFormData(prev => ({
        ...DEFAULT_PROFILE,
        ...mapped,
        // No pisar la edición del usuario a menos que el análisis haya finalizado con nueva descripción
        business_description: data.analysis_in_progress ? prev.business_description : (data.business_description || prev.business_description)
      }));

      if (data.consistency_report) {
        setConsistencyReport(data.consistency_report);
      }

      if (!data.analysis_in_progress) {
        setIsAnalyzingConsistency(false);
        if (data.analysis_error) {
          toast.error(`❌ El análisis falló: ${data.analysis_error}`, { duration: 6000 });
        } else if (data.consistency_report) {
          toast.success('✨ ¡Análisis de Co-Pilot completado en segundo plano y cargado con éxito!', { id: 'bg-analysis-success', duration: 5000 });
        }
      }
    } catch (error) {
      console.error('Silent profile load failed:', error);
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

  // Polling silencioso de fondo cada 4 segundos mientras se esté analizando
  useEffect(() => {
    let interval;
    if (isAnalyzingConsistency) {
      interval = setInterval(() => {
        loadProfileSilent();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzingConsistency, clientId]);

  // Event listener para recargar el ADN de marca en vivo cuando Nova aplique ajustes (chat)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('⚡ Recargando ADN de identidad (Nova)...');
      loadProfile();
    };
    window.addEventListener('cadence:refresh-brand-identity', handleRefresh);
    return () => {
      window.removeEventListener('cadence:refresh-brand-identity', handleRefresh);
    };
  }, [clientId]);

  // Cálculo del porcentaje de completado de identidad
  const completion = useMemo(() => {
    const text = String(formData.business_description || '').trim();
    if (!text) return 0;
    if (text.length > 500) return 100;
    return Math.min(100, Math.round((text.length / 500) * 100));
  }, [formData.business_description]);

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
        toast.error('Por favor agrega al menos un enlace de canal público antes de analizar.');
        setIsAnalyzingConsistency(false);
        return;
      }

      const response = await analyzeBrandConsistency(clientId, formData, reconstructedSourceLinks);

      if (response?.success) {
        toast.success(
          response.message || '🧠 ¡Análisis de Co-Pilot iniciado de fondo!',
          {
            duration: 8000,
            id: 'brand-analysis-started',
          }
        );
        // NOTA: No desactivamos isAnalyzingConsistency aquí, ya que el análisis corre asíncronamente
        // de fondo y el polling silencioso se encargará de consultar el estado y apagarlo cuando termine.
      } else {
        throw new Error(response?.error || 'No se pudo iniciar el diagnóstico de consistencia.');
      }
    } catch (error) {
      toast.error(error.message || 'Error al realizar el análisis.');
      setIsAnalyzingConsistency(false);
    }
  };

  const handleApplySuggestedFix = (contraId, suggestedFixText) => {
    handleChange('business_description', suggestedFixText);

    setResolvedConflicts(prev => {
      const next = new Set(prev);
      next.add(contraId);
      return next;
    });

    toast.success('✨ ¡Propuesta armonizada aplicada con éxito!');
  };

  const getFieldLabel = field => {
    const labels = {
      business_description: 'Descripción de Identidad Unificada',
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
    <section className='w-full max-w-[1600px] mx-auto px-4 pt-1 pb-2 space-y-2 h-full overflow-hidden flex flex-col justify-start text-left'>
      
      {/* ================= MAIN TWO-COLUMN WORKSPACE GRID ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 items-start flex-1 overflow-hidden h-full'>
        
        {/* ================= COLUMNA IZQUIERDA: DOCK, BIBLIOTECA Y BOTÓN (5/12) ================= */}
        <div className='lg:col-span-5 space-y-2 overflow-y-auto max-h-full pr-1 pb-2 flex flex-col justify-start'>
          
          {/* GUÍA DE ONBOARDING */}
          <div className='rounded-2xl border border-border-subtle bg-gradient-to-br from-[#121228] to-[#1a1a3b] p-2.5 space-y-1 relative overflow-hidden shadow-md border-l-[3.5px] border-l-[#7C5CFC] text-left flex-shrink-0'>
            <div className='absolute top-0 right-0 p-2 text-2xl opacity-10 pointer-events-none'>🧬</div>
            <h3 className='text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5'>
              <span>ℹ️</span> Identidad de Marca
            </h3>
            <p className='text-[10.5px] text-text-muted leading-relaxed'>
              Conecta los canales oficiales y sube manuales o capturas. Al pulsar <strong>Analizar</strong>, Co-Pilot asimilará el material y consolidará el ADN de marca en la Casilla Única.
            </p>
          </div>

          {/* CARD 1: CANALES PÚBLICOS (SOCIAL DOCK) */}
          <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2 shadow-md relative overflow-hidden flex-shrink-0'>
            <div className='text-left'>
              <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
                <span>🔌</span> Canales de Marca
              </h3>
            </div>

            {/* Social Grid Container - 2 columns grid for space saving */}
            <div className='grid grid-cols-2 gap-1.5'>
              {[
                {
                  id: 'instagram_url',
                  label: 'Instagram',
                  placeholder: 'instagram.com/usuario',
                  icon: (
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
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
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
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
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
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
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
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
                {
                  id: 'facebook_url',
                  label: 'Facebook',
                  placeholder: 'facebook.com/pagina',
                  icon: (
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-[#1877F2]/40 bg-[#1877F2]/5 shadow-[0_0_15px_rgba(24,119,242,0.05)]',
                  activeText: 'text-[#1877F2]',
                },
                {
                  id: 'youtube_url',
                  label: 'YouTube',
                  placeholder: 'youtube.com/@canal',
                  icon: (
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9.75 15.02l5.75-3.02-5.75-3.02v6.04z'
                      />
                    </svg>
                  ),
                  activeStyle:
                    'border-[#FF0000]/40 bg-[#FF0000]/5 shadow-[0_0_15px_rgba(255,0,0,0.05)]',
                  activeText: 'text-[#FF0000]',
                },
              ].map(platform => {
                const value = formData[platform.id] || '';
                const isConnected = value.trim().length > 0;
                return (
                  <div
                    key={platform.id}
                    className={`rounded-xl border transition-all duration-200 p-1.5 flex items-center gap-1.5 ${
                      isConnected
                        ? platform.activeStyle
                        : 'border-border-subtle bg-surface-strong/30 hover:border-white/10'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg bg-black/40 ${isConnected ? platform.activeText : 'text-text-muted'}`}
                    >
                      {platform.icon}
                    </div>

                    <div className='flex-1 space-y-0.5 text-left min-w-0'>
                      <div className='flex items-center justify-between gap-1'>
                        <span className='text-[9px] font-bold uppercase tracking-wider text-text-primary truncate'>
                          {platform.label}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-white/10'}`} />
                      </div>
                      <input
                        type='text'
                        value={value}
                        onChange={e => handleChange(platform.id, e.target.value)}
                        placeholder={platform.placeholder}
                        disabled={isAnalyzingConsistency}
                        className='w-full bg-transparent p-0 text-[11px] text-white placeholder-text-secondary border-none focus:ring-0 focus:outline-none truncate disabled:opacity-50 disabled:cursor-not-allowed'
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 2: BIBLIOTECA DE MATERIALES DE REFERENCIA */}
          <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2 shadow-md relative overflow-hidden flex-shrink-0'>
            <div className='text-left'>
              <h3 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
                <span>📎</span> Referencias y Gráficos
              </h3>
            </div>

            {/* Drag & Drop zone */}
            <div
              onDragOver={isAnalyzingConsistency ? undefined : handleDragOver}
              onDragLeave={isAnalyzingConsistency ? undefined : handleDragLeave}
              onDrop={isAnalyzingConsistency ? undefined : handleDrop}
              className={`rounded-xl border border-dashed p-2.5 text-center transition-all duration-300 relative ${
                isAnalyzingConsistency
                  ? 'border-border-subtle bg-surface-strong/10 opacity-50 cursor-not-allowed'
                  : isDragging
                  ? 'cursor-pointer border-accent-lavender bg-accent-lavender/10 text-accent-lavender'
                  : 'cursor-pointer border-border-subtle bg-surface-strong/30 hover:bg-surface-strong/50 hover:border-white/15'
              }`}
            >
              <input
                type='file'
                multiple
                id='brand-file-uploader'
                className='hidden'
                accept='image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt'
                onChange={e => handleUploadAssets(e.target.files)}
                disabled={uploadingAssets || isAnalyzingConsistency}
              />
              <label
                htmlFor={isAnalyzingConsistency ? undefined : 'brand-file-uploader'}
                className={`w-full flex flex-col items-center justify-center gap-1 text-text-muted ${isAnalyzingConsistency ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {uploadingAssets ? (
                  <div className='flex flex-col items-center gap-1.5'>
                    <div className='h-4 w-4 border-2 border-accent-lavender border-t-transparent rounded-full animate-spin'></div>
                    <span className='text-[9.5px] font-bold text-white'>Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <div className='w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-xs border border-white/5 shadow-inner'>
                      📥
                    </div>
                    <div className='space-y-0.5'>
                      <span className='text-[9.5px] font-black text-text-primary block'>
                        Arrastra PDFs o Capturas
                      </span>
                      <span className='text-[8px] text-text-muted block'>
                        o haz clic para explorar
                      </span>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* Visual File Grid */}
            {brandAssets.length > 0 && (
              <div className='grid grid-cols-2 gap-1.5 pt-0.5 max-h-[85px] overflow-y-auto pr-0.5'>
                {brandAssets.map(asset => {
                  const isImage = asset.file_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                  return (
                    <div
                      key={asset.id}
                      className='group overflow-hidden rounded-lg border border-border-subtle bg-surface-strong p-1 flex items-center justify-between gap-1.5 relative shadow-sm transition-all hover:border-white/10'
                    >
                      <div className='flex items-center gap-1 min-w-0 text-left'>
                        <span className='text-[10px] flex-shrink-0'>{isImage ? '🖼️' : '📄'}</span>
                        <p className='truncate text-[8.5px] text-white/90 font-bold leading-tight'>
                          {asset.file_name || asset.name}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleDeleteAsset(asset)}
                        className='opacity-60 hover:opacity-100 text-red-400 hover:text-red-300 text-[9px] p-0.5 font-bold transition-all'
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTÓN "ANALIZAR" */}
          <button
            type='button'
            disabled={isAnalyzingConsistency}
            onClick={handleConsistencyCheck}
            className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#4ECDC4] hover:from-[#6b4dfc] hover:to-[#3ec3ba] text-white py-2.5 text-xs font-black uppercase tracking-widest shadow-md shadow-[#7C5CFC]/10 hover:shadow-[#7C5CFC]/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98] flex-shrink-0'
          >
            {isAnalyzingConsistency ? (
              <div className='flex flex-col items-center gap-1 py-0.5'>
                <div className='flex items-center justify-center gap-1.5'>
                  <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  <span>Procesando referencias...</span>
                </div>
                <span className='text-[8.5px] text-white/70 font-semibold animate-pulse'>
                  {CONSISTENCY_LOADER_MSGS[loadingMessageIndex]}
                </span>
              </div>
            ) : (
              <>
                <span>🧠 Analizar</span>
              </>
            )}
          </button>
        </div>

        {/* ================= COLUMNA DERECHA: LIENZO ESTRATÉGICO Y CONTRADICCIONES (7/12) ================= */}
        <div className='lg:col-span-7 space-y-2 h-full flex flex-col justify-start overflow-hidden'>
          
          {/* LIENZO DE ADN DE MARCA (CASILLA ÚNICA) */}
          <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2 shadow-md relative overflow-hidden flex flex-col flex-1 min-h-0'>
            <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-lavender via-accent-sage to-accent-sand' />
            
            <div className='flex items-center justify-between border-b border-border-subtle pb-1.5 flex-shrink-0'>
              <div className='text-left'>
                <h4 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
                  <span>📝</span> Casilla Única: Identidad Estratégica
                </h4>
              </div>

              <button
                type='button'
                onClick={handleSubmit}
                disabled={saving}
                className='inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-1.5 text-[9.5px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]'
              >
                {saving ? (
                  <div className='flex items-center gap-1'>
                    <div className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  <>
                    <span>💾 Guardar Identidad</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Textarea with dynamic sizing to avoid screen scroll */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <textarea
                value={formData.business_description || ''}
                onChange={e => handleChange('business_description', e.target.value)}
                placeholder='El perfil unificado de marca está vacío. Escribe el ADN de marca o presiona el botón "Analizar" para que la IA realice una extracción profunda de los canales y materiales provistos...'
                disabled={isAnalyzingConsistency}
                className='w-full rounded-xl border border-border-subtle bg-surface-strong p-3 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent-lavender/50 focus:ring-1 focus:ring-accent-lavender/10 leading-relaxed transition-all duration-300 flex-1 resize-none min-h-0 disabled:opacity-30 disabled:cursor-not-allowed'
              />

              {isAnalyzingConsistency && (
                <div className="absolute inset-0 bg-[#0d0d1e]/85 backdrop-blur-[6px] rounded-xl flex flex-col items-center justify-center p-6 text-center z-10 border border-white/5 animate-fade-in overflow-y-auto">
                  <div className="relative mb-4 flex items-center justify-center">
                    {/* Pulsing premium glow effect */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#7C5CFC]/30 to-[#4ECDC4]/30 opacity-75 blur-xl animate-pulse"></div>
                    <div className="relative h-14 w-14 rounded-full border-2 border-t-[#7C5CFC] border-r-[#4ECDC4] border-b-transparent border-l-transparent animate-spin flex items-center justify-center bg-black/60 shadow-inner">
                      <span className="text-xl animate-bounce">🧬</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-w-sm">
                    <h5 className="text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                      <span>⚙️</span> Co-Pilot de Marca Activo
                    </h5>
                    
                    <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                      El estratega senior IA está auditando tus canales públicos, sitio web e industria en internet.
                    </p>
                    
                    <div className="inline-flex items-center gap-1.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-lg px-2.5 py-1 text-[9px] text-[#9b82ff] font-bold">
                      <span>⚡</span> Proceso en segundo plano
                    </div>

                    <div className="bg-surface-strong/60 rounded-xl p-2.5 border border-white/5 space-y-1.5 mt-2">
                      <p className="text-[9px] text-text-secondary uppercase tracking-wider font-bold">
                        Paso actual:
                      </p>
                      <p className="text-[10px] text-white font-bold animate-pulse">
                        {CONSISTENCY_LOADER_MSGS[loadingMessageIndex]}
                      </p>
                    </div>

                    <p className="text-[9px] text-text-muted/80 leading-normal border-t border-white/5 pt-2 mt-2">
                      🔒 <strong className="text-white">Puedes cerrar esta pestaña o el navegador de forma segura.</strong> El análisis se procesa en segundo plano en nuestros servidores y el lienzo se actualizará automáticamente cuando esté listo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PANEL DE CONTRADICCIONES Y CONSULTAS CO-PILOT */}
          {consistencyReport && (
            <div className='rounded-2xl border border-border-subtle bg-surface p-3 space-y-2 shadow-md relative overflow-hidden text-left flex-shrink-0 max-h-[40%] flex flex-col min-h-0'>
              <div className='flex items-center justify-between border-b border-border-subtle pb-1.5 flex-shrink-0'>
                <div>
                  <h4 className='text-[10px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5'>
                    <span>⚖️</span> Coherencia de Marca
                  </h4>
                  <p className='text-[9.5px] text-text-muted mt-0.5 leading-normal'>
                    Coherencia al <strong>{consistencyReport.consistency_score}%</strong>.
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  consistencyReport.consistency_score >= 90
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {consistencyReport.is_consistent ? '✓ Alineado' : '⚠️ Contradicciones'}
                </span>
              </div>

              {/* List of Contradictions */}
              {consistencyReport.contradictions && consistencyReport.contradictions.length > 0 ? (
                <div className='space-y-2 overflow-y-auto pr-0.5 flex-1 min-h-0'>
                  {consistencyReport.contradictions.map(contra => {
                    const isResolved = resolvedConflicts.has(contra.id);
                    return (
                      <div
                        key={contra.id}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                          isResolved
                            ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                            : 'border-amber-500/20 bg-amber-500/5'
                        }`}
                      >
                        <div className='flex items-center justify-between gap-4 mb-1.5'>
                          <span className={`text-[9.5px] font-bold uppercase tracking-wide ${isResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isResolved ? '✓ Resuelto' : `⚠️ ${contra.title}`}
                          </span>
                          {isResolved && (
                            <span className='text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20'>
                              Aplicado
                            </span>
                          )}
                        </div>

                        <p className='text-[10.5px] text-white/90 leading-relaxed mb-2'>{contra.description}</p>
                        
                        {!isResolved && (
                          <div className='mt-2 p-2.5 rounded-lg bg-black/35 border border-white/5 space-y-2 text-left'>
                            <span className='text-[9px] font-black text-[#7C5CFC] uppercase tracking-wider block'>
                              🤔 Consulta:
                            </span>
                            <p className='text-[10.5px] text-text-muted italic leading-relaxed'>
                              "{contra.consultation_question}"
                            </p>
                            
                            {contra.suggested_fix && (
                              <div className='pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                                <span className='text-[8px] text-text-secondary font-bold uppercase text-left'>
                                  ¿Aplicar propuesta de la IA?
                                </span>
                                <button
                                  type='button'
                                  onClick={() => handleApplySuggestedFix(contra.id, contra.suggested_fix)}
                                  className='inline-flex items-center gap-1.5 bg-[#7C5CFC] hover:bg-[#6b4dfc] text-white rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 whitespace-nowrap self-end sm:sm:self-auto'
                                >
                                  🧬 Aplicar Solución
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-3 bg-surface-strong/30 rounded-xl border border-border-subtle flex-1 flex flex-col items-center justify-center min-h-[80px]'>
                  <span className='text-xl block mb-1'>✨</span>
                  <p className='text-[10px] text-text-muted leading-relaxed max-w-[240px] mx-auto'>
                    El Co-Pilot no detecta contradicciones en los canales analizados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};





