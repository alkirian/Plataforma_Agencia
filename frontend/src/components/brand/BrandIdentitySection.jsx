import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getClientBrandProfile, updateClientBrandProfile, autoFillBrandProfile, searchCompanyBrandProfile, analyzeBrandConsistency } from '../../api/clients';
import { deleteBrandAsset, getBrandAssetsWithPreview, uploadBrandAsset } from '../../api/brandAssets';
import { getDocumentsForClient } from '../../api/documents';
import { TagInput } from '../common/TagInput';

const DEFAULT_PROFILE = {
  business_description: '',
  target_audience: '',
  brand_voice: '',
  reference_style: '',
  brand_values: '',
  competitors: '',
  // Enlaces específicos lado a lado
  instagram_url: '',
  website_url: '',
  tiktok_url: '',
  youtube_url: '',
  facebook_url: '',
  linkedin_url: '',
  source_notes: '',
  // Campos antiguos preservados para compatibilidad
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

const SOURCE_TYPES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Sitio web' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'drive', label: 'Google Drive' },
  { value: 'other', label: 'Otro' },
];

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
  content_goals: ['Generar engagement', 'Aumentar ventas', 'Educar audiencia', 'Posicionamiento', 'Tráfico a web', 'Generar leads'],
  preferred_formats: ['Reels', 'Carruseles', 'Historias', 'Post estáticos', 'Videos largos', 'Infografías'],
  avoid_topics: ['Religión', 'Política', 'Competidores directos', 'Controversias', 'Precios explícitos', 'Hype exagerado'],
};

const createSourceLink = () => ({
  id: crypto?.randomUUID?.() || `source-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: 'instagram',
  url: '',
  notes: '',
});

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
    "🔌 Conectando perfiles...",
    "🧠 Analizando contenido real...",
    "📡 Evaluando coherencia...",
    "✨ Generando informe..."
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

  const detectLinkType = (url = '') => {
    const lower = url.toLowerCase().trim();
    if (!lower) return 'other';
    if (lower.includes('instagram.com') || lower.startsWith('@') || (/^[a-z0-9_.]+$/i.test(lower) && !lower.includes('.'))) {
      return 'instagram';
    }
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
    if (lower.includes('drive.google.com')) return 'drive';
    return 'website';
  };
  
  const [activeTab, setActiveTab] = useState('adn');

  // Estados para el panel de autocompletado con IA
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiInputMode, setAiInputMode] = useState('text'); // 'text' | 'doc'
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
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

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const resp = await getDocumentsForClient(clientId);
      setDocuments(resp?.data || resp || []);
    } catch (_e) {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
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
    loadDocuments();
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
      formData.instagram_url,
      formData.website_url,
      formData.tiktok_url,
      formData.youtube_url,
      formData.facebook_url,
      formData.linkedin_url,
    ];
    const filled = fields.filter(value => String(value || '').trim().length > 0).length;
    const totalFields = fields.length;
    return Math.min(100, Math.round((filled / totalFields) * 100));
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toggles de selección visual de redes sociales
  const togglePlatform = (platformId) => {
    const active = formData.preferred_platforms || [];
    const next = active.includes(platformId)
      ? active.filter(p => p !== platformId)
      : [...active, platformId];
    handleChange('preferred_platforms', next);
  };

  // Manejo de fuentes de links de referencia
  const handleAddSourceLink = () => {
    setFormData(prev => ({
      ...prev,
      source_links: [...(prev.source_links || []), createSourceLink()],
    }));
  };

  const handleUpdateSourceLink = (linkId, field, value) => {
    setFormData(prev => ({
      ...prev,
      source_links: (prev.source_links || []).map(link => {
        if (link.id === linkId) {
          const updated = { ...link, [field]: value };
          if (field === 'url') {
            updated.type = detectLinkType(value);
          }
          return updated;
        }
        return link;
      }),
    }));
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
        notes: ''
      }));

      if (reconstructedSourceLinks.length === 0) {
        toast.error("Por favor agrega al menos un enlace de referencia antes de auditar.");
        setIsAnalyzingConsistency(false);
        return;
      }

      const response = await analyzeBrandConsistency(clientId, formData, reconstructedSourceLinks);
      
      if (response?.success && response?.data) {
        setConsistencyReport(response.data);
        if (response.data.is_consistent) {
          toast.success("✨ ¡Análisis completado! Tu identidad de marca está alineada.");
        } else {
          toast.success(`⚠️ Auditoría completa: ${response.data.consistency_score}% de alineación.`);
        }
      } else {
        throw new Error("No se pudo procesar el diagnóstico de consistencia.");
      }
    } catch (error) {
      toast.error(error.message || "Error al realizar la auditoría.");
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

    toast.success(`✨ ¡Campo [${getFieldLabel(field)}] inyectado e integrado con éxito!`);
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
    toast.success("🧬 ¡Perfil de marca completo inyectado en el formulario con éxito!");
    
    setAiHighlightFields(true);
    setTimeout(() => setAiHighlightFields(false), 3500);
  };

  const getFieldLabel = (field) => {
    const labels = {
      business_description: 'Negocio y Propuesta',
      target_audience: 'Audiencia Objetivo',
      brand_voice: 'Tono de Voz',
      reference_style: 'Estilo Visual',
      brand_values: 'Valores y Filosofía',
      competitors: 'Competidores'
    };
    return labels[field] || field;
  };

  const handleRemoveSourceLink = linkId => {
    setFormData(prev => ({
      ...prev,
      source_links: (prev.source_links || []).filter(link => link.id !== linkId),
    }));
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
      toast.success(`${validFiles.length} archivo${validFiles.length > 1 ? 's' : ''} subido${validFiles.length > 1 ? 's' : ''}.`);
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
      toast.success('Archivo eliminado.');
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el archivo.');
    }
  };

  // Guardar identidad en base de datos
  const handleSubmit = async e => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Reconstruir source_links para retrocompatibilidad con el motor de IA
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
        notes: ''
      }));

      const payload = {
        ...formData,
        source_links: reconstructedSourceLinks,
        source_notes: String(formData.source_notes || '').trim(),
      };

      await updateClientBrandProfile(clientId, payload);
      toast.success('Identidad guardada con éxito.');
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
      toast.error('Por favor ingresá el nombre de la empresa.');
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
        toast.success(`✅ Identidad cargada exitosamente.`);
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
    if (aiInputMode === 'text' && !aiTextPrompt.trim()) {
      toast.error('Por favor escribe un breve resumen o copia tu brief.');
      return;
    }
    if (aiInputMode === 'doc' && !selectedDocId) {
      toast.error('Por favor selecciona un documento de la biblioteca.');
      return;
    }

    setIsAutoFilling(true);
    try {
      const payload = {
        rawText: aiInputMode === 'text' ? aiTextPrompt : '',
        documentId: aiInputMode === 'doc' ? selectedDocId : '',
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

        toast.success('✨ ¡Identidad estructurada con éxito!');
        setShowAiPanel(false);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-white/5 bg-surface-strong/30 p-12 text-center text-text-muted flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold animate-pulse">Cargando identidad del cliente...</p>
      </div>
    );
  }

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

  return (
    <section className="max-w-6xl mx-auto space-y-6 px-4 pt-2 pb-32">
      
      {/* Encabezado Principal Minimalista (Zen) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Identidad de Contenido: ADN y Tono
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Estructura el ADN y tono del cliente para alimentar la IA de forma práctica y limpia.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] text-text-muted font-medium">Completado:</span>
          <span className="text-xs font-bold text-white">{completion}%</span>
          <div className="h-1.5 w-20 rounded-full bg-[#0e0d0f] border border-white/5 overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500" 
              style={{ width: `${completion}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 🪄 Asistente Inteligente Unificado y Sleek */}
      <div className="rounded-2xl border border-white/5 bg-[#121113]/40 p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>✨</span> Rellenar Ficha con IA
          </h3>
          <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setAiInputMode('text')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                aiInputMode === 'text' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Buscar Empresa
            </button>
            <button
              type="button"
              onClick={() => setAiInputMode('doc')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                aiInputMode === 'doc' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Pegar Brief / Notas
            </button>
          </div>
        </div>

        {aiInputMode === 'text' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={companySearchQuery}
              onChange={e => setCompanySearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isSearching && handleCompanySearch()}
              disabled={isSearching}
              placeholder="Escribe el nombre de la empresa (ej: Nike, Starbucks)..."
              className="flex-1 rounded-xl border border-white/5 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-text-muted/40 focus:outline-none focus:border-primary-500/40"
            />
            <button
              type="button"
              onClick={handleCompanySearch}
              disabled={isSearching}
              className="rounded-xl bg-white hover:bg-gray-100 px-4 py-2.5 text-xs font-bold text-black transition-all whitespace-nowrap disabled:opacity-50 shadow-md"
            >
              {isSearching ? 'Buscando...' : 'Buscar y Rellenar'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={2}
              value={aiTextPrompt}
              onChange={(e) => setAiTextPrompt(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-black/40 p-3.5 text-xs text-white placeholder-text-muted/40 focus:outline-none focus:border-purple-500/40 resize-none"
              placeholder="Pega notas rápidas, apuntes de reuniones o breves resúmenes de la marca aquí..."
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isAutoFilling}
                onClick={handleAiAutoFill}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-md transition-all duration-300"
              >
                {isAutoFilling ? 'Analizando...' : '✨ Estructurar con IA'}
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================== COLUMNA IZQUIERDA: INPUTS DEL USUARIO (7/12) ==================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 🔌 Conectar Canales y Fuentes */}
          <div className="rounded-2xl border border-white/5 bg-surface-strong/20 p-5 space-y-5 shadow-md relative overflow-hidden">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                🔌 Canales del Cliente
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Ingresa los enlaces principales de tu cliente.</p>
            </div>

            {/* Cuadrícula compacta de Redes Sociales y Web */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Instagram</label>
                <input
                  type="text"
                  value={formData.instagram_url || ''}
                  onChange={e => handleChange('instagram_url', e.target.value)}
                  placeholder="instagram.com/usuario"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Sitio Web</label>
                <input
                  type="text"
                  value={formData.website_url || ''}
                  onChange={e => handleChange('website_url', e.target.value)}
                  placeholder="https://ejemplo.com"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">TikTok</label>
                <input
                  type="text"
                  value={formData.tiktok_url || ''}
                  onChange={e => handleChange('tiktok_url', e.target.value)}
                  placeholder="tiktok.com/@usuario"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">YouTube</label>
                <input
                  type="text"
                  value={formData.youtube_url || ''}
                  onChange={e => handleChange('youtube_url', e.target.value)}
                  placeholder="youtube.com/@canal"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Facebook</label>
                <input
                  type="text"
                  value={formData.facebook_url || ''}
                  onChange={e => handleChange('facebook_url', e.target.value)}
                  placeholder="facebook.com/pagina"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">LinkedIn</label>
                <input
                  type="text"
                  value={formData.linkedin_url || ''}
                  onChange={e => handleChange('linkedin_url', e.target.value)}
                  placeholder="linkedin.com/company/nombre"
                  className="w-full rounded-xl border border-white/5 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-primary-500/40"
                />
              </div>

            </div>

            {/* Zona Drag & Drop de Documentos (Compacta) */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Subir Manual o Brief</h4>
                <p className="text-[9px] text-text-muted">Arrastra cualquier documento o imagen para alimentar la IA.</p>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border border-dashed p-4 text-center text-xs transition-all duration-200 ${
                  isDragging 
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400' 
                    : 'border-white/10 bg-black/20 hover:bg-black/40 hover:border-white/20'
                }`}
              >
                <input
                  type="file"
                  multiple
                  id="brand-file-uploader"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={e => handleUploadAssets(e.target.files)}
                  disabled={uploadingAssets}
                />
                <label htmlFor="brand-file-uploader" className="cursor-pointer w-full flex flex-col items-center justify-center gap-1 text-text-muted">
                  {uploadingAssets ? (
                    <span className="flex items-center justify-center gap-2 text-[10px]">
                      <span className="h-3 w-3 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></span>
                      Subiendo archivos...
                    </span>
                  ) : (
                    <>
                      <span className="text-lg">📎</span>
                      <span className="text-[10px] font-semibold text-white/80">Arrastra archivos aquí o haz clic para subir</span>
                      <span className="text-[8px] text-text-muted/60">PDF, DOCX, TXT o Imágenes</span>
                    </>
                  )}
                </label>
              </div>

              {/* Lista compacta de archivos cargados */}
              {brandAssets.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                  {brandAssets.map(asset => (
                    <div key={asset.id} className="overflow-hidden rounded-lg border border-white/5 bg-[#121113] p-1.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[9px] text-white/80 font-medium flex-1">
                        {asset.file_name || asset.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset)}
                        className="text-red-400 hover:text-red-300 text-[10px] px-1 font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acción de Refuerzo */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/5 gap-3">
              <p className="text-[9px] text-text-muted max-w-sm leading-normal">
                Compara y audita la coherencia entre lo escrito y la información real del cliente.
              </p>
              <button
                type="button"
                disabled={isAnalyzingConsistency}
                onClick={handleConsistencyCheck}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-400 hover:to-indigo-500 text-white px-5 py-2 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isAnalyzingConsistency ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Analizando...</span>
                  </span>
                ) : (
                  <span>🧠 Reforzar con IA</span>
                )}
              </button>
            </div>
          </div>

          {/* 🧬 ADN, Tono y Filosofía (Formulario de Precisión) */}
          <div className="rounded-2xl border border-white/5 bg-surface-strong/20 p-5 space-y-5 shadow-md relative overflow-hidden">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                🧬 ADN, Tono y Filosofía de Marca
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Describe la propuesta estratégica de la marca.</p>
            </div>

            <div className="space-y-4">
              {/* Descripción del Negocio */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">🏢 Descripción del Negocio</label>
                <textarea
                  rows={3}
                  value={formData.business_description || ''}
                  onChange={e => handleChange('business_description', e.target.value)}
                  placeholder="A qué se dedica, propuesta de valor, productos principales..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'business_description'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>

              {/* Público Objetivo */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">👥 Público Objetivo</label>
                <textarea
                  rows={3}
                  value={formData.target_audience || ''}
                  onChange={e => handleChange('target_audience', e.target.value)}
                  placeholder="Cliente ideal, demografía, intereses, dolores..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'target_audience'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>

              {/* Tono de Voz y Personalidad */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">📢 Tono de Voz y Personalidad</label>
                <textarea
                  rows={3}
                  value={formData.brand_voice || ''}
                  onChange={e => handleChange('brand_voice', e.target.value)}
                  placeholder="Estilo de redacción, personalidad, adjetivos..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'brand_voice'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>

              {/* Estilo Visual y Estética */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">🎨 Estilo Visual y Estética</label>
                <textarea
                  rows={3}
                  value={formData.reference_style || ''}
                  onChange={e => handleChange('reference_style', e.target.value)}
                  placeholder="Dirección visual, paleta sugerida, vibra general..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'reference_style'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>

              {/* Valores y Filosofía de Marca */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">🧬 Valores y Filosofía de Marca</label>
                <textarea
                  rows={3}
                  value={formData.brand_values || ''}
                  onChange={e => handleChange('brand_values', e.target.value)}
                  placeholder="Principios centrales, cultura, misión de la marca..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'brand_values'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>

              {/* Competidores de Referencia */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">🔍 Competidores de Referencia</label>
                <textarea
                  rows={3}
                  value={formData.competitors || ''}
                  onChange={e => handleChange('competitors', e.target.value)}
                  placeholder="Marcas de referencia, cuentas de inspiración, benchmarks..."
                  className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-xs text-white placeholder-text-muted/40 focus:outline-none min-h-[80px] transition-all duration-300 ${
                    highlightedField === 'competitors'
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-md'
                      : aiHighlightFields
                      ? 'border-purple-500/80'
                      : 'border-white/5 focus:border-primary-500/40'
                  }`}
                />
              </div>
            </div>
          </div>
          
        </div>

        {/* ==================== COLUMNA DERECHA: CAPTADO POR IA Y DIAGNÓSTICO (5/12) ==================== */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          
          {/* Card: Conocimiento captado y Resoluciones de forma limpia */}
          <div className="rounded-2xl border border-white/5 bg-surface-strong/20 p-5 space-y-5 shadow-xl relative overflow-hidden">
            
            {/* Banner de Notificación de Análisis Completo y Notorio */}
            {consistencyReport && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center gap-2.5 shadow-md animate-fadeIn border-l-4 border-l-emerald-500">
                <span className="text-base animate-pulse">✨</span>
                <div className="text-left space-y-0.5">
                  <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">¡Análisis Completado!</h4>
                  <p className="text-[9.5px] text-text-muted">Gemini analizó con éxito tus fuentes y extrajo el perfil detallado abajo.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  📡 Análisis de Canales
                </h3>
                <p className="text-[10px] text-text-muted">Lo que la IA captó y sugiere del cliente en la web.</p>
              </div>
              
              {consistencyReport && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  consistencyReport.consistency_score >= 90
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                  {consistencyReport.consistency_score}% Alineado
                </span>
              )}
            </div>

            {/* Listado de lo que la IA detectó de forma zen */}
            <div className="space-y-4">
              
              {!consistencyReport ? (
                <div className="text-center py-8 space-y-2">
                  <span className="text-xl block">🛰️</span>
                  <p className="text-[11px] text-text-muted leading-relaxed max-w-[220px] mx-auto">
                    Introduce los enlaces a la izquierda y haz clic en <strong>"Reforzar con IA"</strong> para auditar tu ADN en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Botón de Adoptar Perfil Completo en 1-Clic */}
                  {consistencyReport.detected_profile && (
                    <button
                      type="button"
                      onClick={handleAdoptEntireProfile}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border border-emerald-500/30 text-emerald-400 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      🧬 Adoptar Perfil Completo IA (1-Clic)
                    </button>
                  )}

                  <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
                    {/* Renderizamos las 6 áreas estratégicas detalladas captadas por la IA */}
                    {['business_description', 'target_audience', 'brand_voice', 'reference_style', 'brand_values', 'competitors'].map(field => {
                      const detectedText = consistencyReport.detected_profile?.[field] || '';
                      if (!detectedText) return null;

                      // Buscar si este campo tiene un conflicto activo
                      const conflict = consistencyReport.conflicts?.find(c => c.field === field);
                      const isResolved = conflict ? resolvedConflicts.has(conflict.id) : true;

                      return (
                        <div key={field} className="bg-black/30 rounded-xl p-3.5 border border-white/5 space-y-2 transition-all hover:border-white/10">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                            <span className="text-[9px] text-primary-400 font-bold uppercase tracking-wider block">
                              {field === 'business_description' ? '🏢 Negocio y Propuesta' : 
                               field === 'target_audience' ? '👥 Público Objetivo' : 
                               field === 'brand_voice' ? '📢 Tono de Voz' : 
                               field === 'reference_style' ? '🎨 Estilo Visual' : 
                               field === 'brand_values' ? '🧬 Valores y Filosofía' : '🔍 Competidores'}
                            </span>
                            
                            {conflict && !isResolved ? (
                              <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.2 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400">
                                Discrepancia
                              </span>
                            ) : (
                              <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.2 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                ✓ Alineado
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10.5px] text-white/90 italic leading-relaxed text-left whitespace-pre-line">
                            "{detectedText}"
                          </p>
                          
                          {conflict && !isResolved && (
                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                              <span className="text-[9px] text-text-muted block">La IA sugiere actualizar este campo en tu ADN:</span>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => resolveConflict(conflict.id, conflict.field, conflict.suggested_actions.find(a => a.type === 'merge_both')?.value || detectedText)}
                                  className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all shadow-sm"
                                >
                                  🧬 Adoptar / Fusionar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

        {/* ==================== PIE DE PÁGINA: BOTÓN DE GUARDAR GLOBAL ==================== */}
        <div className="col-span-1 lg:col-span-12 flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-7 py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Guardando...</span>
              </span>
            ) : (
              <span>💾 Guardar Identidad de Marca</span>
            )}
          </button>
        </div>

      </form>
    </section>
  );
};
