import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getClientBrandProfile, updateClientBrandProfile, autoFillBrandProfile, searchCompanyBrandProfile } from '../../api/clients';
import { deleteBrandAsset, getBrandAssetsWithPreview, uploadBrandAsset } from '../../api/brandAssets';
import { getDocumentsForClient } from '../../api/documents';
import { TagInput } from '../common/TagInput';

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
  
  // Pestañas / Pasos del Wizard: 'adn' | 'canales' | 'pilares'
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

  // Carga inicial de datos
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getClientBrandProfile(clientId);
      setFormData({
        ...DEFAULT_PROFILE,
        ...(response?.data || {}),
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
      ...(formData.content_pillars || []),
      ...(formData.content_goals || []),
      ...(formData.products_services || []),
      ...(formData.preferred_platforms || []),
      ...(formData.preferred_formats || []),
      ...(formData.avoid_topics || []),
    ];
    const filled = fields.filter(value => String(value || '').trim().length > 0).length;
    // Total de campos a evaluar = 10
    const totalFields = 10;
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
      source_links: (prev.source_links || []).map(link =>
        link.id === linkId ? { ...link, [field]: value } : link
      ),
    }));
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
      const normalizedSourceLinks = (formData.source_links || [])
        .map(link => ({
          id: link.id,
          type: link.type || 'other',
          url: ensureHttpProtocol(link.url),
          notes: String(link.notes || '').trim(),
        }))
        .filter(link => link.url);

      const payload = {
        ...formData,
        source_links: normalizedSourceLinks,
        source_notes: String(formData.source_notes || '').trim(),
      };

      await updateClientBrandProfile(clientId, payload);
      toast.success('Identidad guardada con éxito.');
      setFormData(prev => ({
        ...prev,
        source_links: normalizedSourceLinks,
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
          content_pillars: Array.isArray(generated.content_pillars) && generated.content_pillars.length > 0 ? generated.content_pillars : prev.content_pillars,
          content_goals: Array.isArray(generated.content_goals) && generated.content_goals.length > 0 ? generated.content_goals : prev.content_goals,
          products_services: Array.isArray(generated.products_services) && generated.products_services.length > 0 ? generated.products_services : prev.products_services,
          preferred_platforms: Array.isArray(generated.preferred_platforms) && generated.preferred_platforms.length > 0 ? generated.preferred_platforms : prev.preferred_platforms,
          preferred_formats: Array.isArray(generated.preferred_formats) && generated.preferred_formats.length > 0 ? generated.preferred_formats : prev.preferred_formats,
          avoid_topics: Array.isArray(generated.avoid_topics) && generated.avoid_topics.length > 0 ? generated.avoid_topics : prev.avoid_topics,
          reference_style: generated.reference_style || prev.reference_style,
        }));
        toast.success(`✅ Identidad de "${companySearchQuery}" cargada. Revisá y ajustá los campos.`);
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
        // Combinar datos generados con el formData actual
        const generated = response.data;
        setFormData(prev => ({
          ...prev,
          business_description: generated.business_description || prev.business_description,
          target_audience: generated.target_audience || prev.target_audience,
          brand_voice: generated.brand_voice || prev.brand_voice,
          content_pillars: Array.isArray(generated.content_pillars) ? generated.content_pillars : prev.content_pillars,
          content_goals: Array.isArray(generated.content_goals) ? generated.content_goals : prev.content_goals,
          products_services: Array.isArray(generated.products_services) ? generated.products_services : prev.products_services,
          preferred_platforms: Array.isArray(generated.preferred_platforms) ? generated.preferred_platforms : prev.preferred_platforms,
          preferred_formats: Array.isArray(generated.preferred_formats) ? generated.preferred_formats : prev.preferred_formats,
          avoid_topics: Array.isArray(generated.avoid_topics) ? generated.avoid_topics : prev.avoid_topics,
          reference_style: generated.reference_style || prev.reference_style,
        }));

        toast.success('✨ ¡Identidad estructurada con éxito!');
        setShowAiPanel(false);
        setAiTextPrompt('');
        
        // Destacar visualmente los campos modificados
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

  // Renderizar chips de sugerencias rápidas debajo de TagInput
  const renderSuggestions = (suggestions, field) => {
    const currentList = formData[field] || [];
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
              handleChange(field, [...currentList, item]);
            }}
            className="rounded bg-[#222024] hover:bg-white hover:text-black border border-[#2B282F] px-1.5 py-0.5 text-[10px] text-gray-400 transition-all"
          >
            + {item}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="rounded-lg border border-[#2B282F] bg-[#161517] p-6 text-center text-gray-400">Cargando identidad de marca...</div>;
  }

  return (
    <section className="space-y-6">
      {/* Encabezado e indicador visual de completado */}
      <div className="rounded-xl border border-[#2B282F] bg-[#222024] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Identidad de Contenido</h2>
            <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-gray-300">
              Onboarding
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Define la voz, pilares y catálogo para que la IA genere ideas completamente personalizadas.
          </p>
        </div>
        
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-400">Completado del Perfil</span>
            <span className="text-white">{completion}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#161517] border border-[#2B282F]">
            <div 
              className="h-full rounded-full bg-white transition-all duration-500 ease-out" 
              style={{ width: `${completion}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Bloque Búsqueda de empresa en internet */}
      <div className="rounded-xl border border-[#2B282F] bg-[#161517] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🔍</span>
              <h3 className="text-sm font-bold text-white">Buscar empresa en internet</h3>
            </div>
            <p className="text-[11px] text-gray-400">
              Escribí el nombre de la empresa y Gemini busca información pública para pre-rellenar la identidad automáticamente.
            </p>
          </div>
          <div className="flex gap-2 sm:w-auto w-full">
            <input
              type="text"
              value={companySearchQuery}
              onChange={e => setCompanySearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isSearching && handleCompanySearch()}
              disabled={isSearching}
              placeholder="Ej: Apple, Nike Argentina, Starbucks..."
              className="flex-1 sm:w-56 rounded-lg border border-[#2B282F] bg-[#222024] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleCompanySearch}
              disabled={isSearching}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bloque AI Autocomplete / Asistente Inteligente */}
      <div className="rounded-xl border border-[#2B282F] bg-[#161517] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between bg-[#222024]/40 border-b border-[#2B282F]">
          <div className="flex items-center gap-2">
            <span className="text-base">🪄</span>
            <div>
              <h3 className="text-sm font-bold text-white">¿Quieres ahorrar tiempo? Autocompletar con IA</h3>
              <p className="text-[11px] text-gray-400">Extrae toda la identidad del cliente a partir de su brief o notas con un solo clic.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-600 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showAiPanel ? 'Cerrar Asistente' : 'Iniciar Asistente IA'}
          </button>
        </div>

        {showAiPanel && (
          <div className="p-5 border-t border-[#2B282F] bg-[#222024]/10 space-y-5">
            <div className="flex border-b border-[#2B282F] pb-3 gap-6 text-sm">
              <button
                type="button"
                onClick={() => setAiInputMode('text')}
                className={`font-semibold pb-1 border-b-2 transition-all ${
                  aiInputMode === 'text' ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Escribir / Pegar Resumen informal
              </button>
              <button
                type="button"
                onClick={() => setAiInputMode('doc')}
                className={`font-semibold pb-1 border-b-2 transition-all ${
                  aiInputMode === 'doc' ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Extraer desde Brief o Documento Cargado
              </button>
            </div>

            {aiInputMode === 'text' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400">Escribe o pega información del cliente</label>
                <textarea
                  rows={4}
                  value={aiTextPrompt}
                  onChange={(e) => setAiTextPrompt(e.target.value)}
                  className="w-full rounded-lg border border-[#2B282F] bg-[#161517] p-3 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none transition-all resize-none"
                  placeholder="Ej: 'Es una cafetería de especialidad llamada Cafe Store. Venden café tostado en origen, pastelería artesanal y cursos de barismo. Su público ideal son amantes del café premium, baristas novatos de 20 a 45 años. Su tono es cálido, moderno y educativo. Queremos publicar en Instagram y TikTok usando Reels e infografías...'"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400">Selecciona el documento de brief</label>
                {loadingDocs ? (
                  <div className="text-xs text-gray-400">Cargando biblioteca de documentos del cliente...</div>
                ) : documents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#2B282F] p-4 text-center text-xs text-gray-400 space-y-2">
                    <p>No hay documentos cargados en la biblioteca de este cliente.</p>
                    <p className="text-[10px] text-gray-500">Puedes cargar PDFs o Word en la pestaña de documentos del cliente antes de usar este asistente.</p>
                  </div>
                ) : (
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full rounded-lg border border-[#2B282F] bg-[#161517] px-3 py-2.5 text-sm text-white focus:border-gray-500 focus:outline-none transition-all"
                  >
                    <option value="">-- Seleccionar un archivo de brief --</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.file_name} ({doc.file_type?.split('/').pop()?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#2B282F]/50">
              <button
                type="button"
                disabled={isAutoFilling}
                onClick={handleAiAutoFill}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-100 text-black px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAutoFilling ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Gemini analizando brief...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Iniciar Extracción Inteligente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard / Pestañas de Navegación del Formulario */}
      <div className="flex border-b border-[#2B282F] gap-2 md:gap-4 overflow-x-auto pb-px">
        {[
          { id: 'adn', label: '1. ADN y Tono 🧬' },
          { id: 'canales', label: '2. Canales y Formato 📱' },
          { id: 'pilares', label: '3. Pilares y Catálogo 📦' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del Formulario por Pasos */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* PASO 1: ADN y TONO */}
        {activeTab === 'adn' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase">Negocio y propuesta de valor</label>
                <textarea
                  value={formData.business_description}
                  onChange={e => handleChange('business_description', e.target.value)}
                  rows={4}
                  className={`w-full rounded-lg border bg-[#222024] p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/5 transition-all ${
                    aiHighlightFields && formData.business_description ? 'border-emerald-500 animate-pulse' : 'border-[#2B282F]'
                  }`}
                  placeholder="Describe a qué se dedica el negocio, qué vende y cuál es su propuesta única..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 tracking-wider uppercase">Audiencia objetivo</label>
                  <textarea
                    value={formData.target_audience}
                    onChange={e => handleChange('target_audience', e.target.value)}
                    rows={4}
                    className={`w-full rounded-lg border bg-[#222024] p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/5 transition-all ${
                      aiHighlightFields && formData.target_audience ? 'border-emerald-500 animate-pulse' : 'border-[#2B282F]'
                    }`}
                    placeholder="¿A quién le habla la marca? Rango de edad, intereses, motivaciones..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 tracking-wider uppercase">Tono de voz</label>
                  <textarea
                    value={formData.brand_voice}
                    onChange={e => handleChange('brand_voice', e.target.value)}
                    rows={4}
                    className={`w-full rounded-lg border bg-[#222024] p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/5 transition-all ${
                      aiHighlightFields && formData.brand_voice ? 'border-emerald-500 animate-pulse' : 'border-[#2B282F]'
                    }`}
                    placeholder="Ej: Cercano, educativo, experto, divertido, formal, etc..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase">Referencias de estilo estético/visual</label>
                <textarea
                  value={formData.reference_style}
                  onChange={e => handleChange('reference_style', e.target.value)}
                  rows={3}
                  className={`w-full rounded-lg border bg-[#222024] p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/5 transition-all ${
                    aiHighlightFields && formData.reference_style ? 'border-emerald-500 animate-pulse' : 'border-[#2B282F]'
                  }`}
                  placeholder="Detalles sobre colores, estilo minimalista, tipografías o vibras estéticas deseadas..."
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: CANALES Y FORMATO */}
        {activeTab === 'canales' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Redes Sociales Prioritarias</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const isSelected = (formData.preferred_platforms || []).includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`rounded-xl border p-4 text-center transition-all ${
                        isSelected
                          ? 'border-white bg-white text-black font-bold shadow-md'
                          : 'border-[#2B282F] bg-[#222024] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{platform.icon}</div>
                      <div className="text-xs">{platform.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Formatos preferidos</label>
                <TagInput
                  tags={formData.preferred_formats}
                  onChange={(tags) => handleChange('preferred_formats', tags)}
                  placeholder="Escribe un formato y presiona Enter..."
                />
                {renderSuggestions(SUGGESTIONS.preferred_formats, 'preferred_formats')}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Temas a evitar</label>
                <TagInput
                  tags={formData.avoid_topics}
                  onChange={(tags) => handleChange('avoid_topics', tags)}
                  placeholder="Escribe un tema y presiona Enter..."
                />
                {renderSuggestions(SUGGESTIONS.avoid_topics, 'avoid_topics')}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: PILARES Y CATÁLOGO */}
        {activeTab === 'pilares' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Pilares de Contenido</label>
                <TagInput
                  tags={formData.content_pillars}
                  onChange={(tags) => handleChange('content_pillars', tags)}
                  placeholder="Escribe un pilar de contenido..."
                />
                {renderSuggestions(SUGGESTIONS.content_pillars, 'content_pillars')}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Objetivos Editoriales</label>
                <TagInput
                  tags={formData.content_goals}
                  onChange={(tags) => handleChange('content_goals', tags)}
                  placeholder="Escribe un objetivo de contenido..."
                />
                {renderSuggestions(SUGGESTIONS.content_goals, 'content_goals')}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 tracking-wider uppercase block">Servicios y Productos clave</label>
              <TagInput
                tags={formData.products_services}
                onChange={(tags) => handleChange('products_services', tags)}
                placeholder="Escribe un producto o servicio de tu catálogo y presiona Enter..."
              />
            </div>

            {/* Fuentes / Links de referencia */}
            <div className="space-y-4 rounded-xl border border-[#2B282F] bg-[#161517] p-5">
              <div className="flex items-center justify-between border-b border-[#2B282F] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Enlaces de Identidad de Marca</h3>
                  <p className="text-[11px] text-gray-400">Configura links a perfiles activos para nutrir al modelo.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSourceLink}
                  className="rounded-lg border border-[#2B282F] bg-[#222024] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2B282F] transition-all"
                >
                  Agregar enlace
                </button>
              </div>

              {(formData.source_links || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#2B282F] p-4 text-center text-xs text-gray-400">
                  Aún no has agregado enlaces. Puedes añadir webs de referencia o perfiles sociales de la marca.
                </div>
              ) : (
                <div className="space-y-3">
                  {(formData.source_links || []).map(link => (
                    <div key={link.id} className="grid grid-cols-1 gap-2.5 rounded-lg border border-[#2B282F] bg-[#222024]/40 p-4 md:grid-cols-[160px_1fr_auto]">
                      <select
                        value={link.type || 'other'}
                        onChange={e => handleUpdateSourceLink(link.id, 'type', e.target.value)}
                        className="rounded-lg border border-[#2B282F] bg-[#161517] px-3 py-2 text-xs text-white focus:outline-none focus:border-gray-500"
                      >
                        {SOURCE_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      
                      <input
                        value={link.url || ''}
                        onChange={e => handleUpdateSourceLink(link.id, 'url', e.target.value)}
                        placeholder="https://instagram.com/nombreclient"
                        className="rounded-lg border border-[#2B282F] bg-[#161517] px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-gray-500"
                      />
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveSourceLink(link.id)}
                        className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Eliminar
                      </button>
                      
                      <textarea
                        value={link.notes || ''}
                        onChange={e => handleUpdateSourceLink(link.id, 'notes', e.target.value)}
                        rows={2}
                        placeholder="Nota opcional para la IA: observar tono, productos, estilo visual..."
                        className="rounded-lg border border-[#2B282F] bg-[#161517] px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-gray-500 md:col-span-3 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-[#2B282F]/50">
                <label className="text-[11px] font-semibold text-gray-400">Instrucciones de enlaces generales</label>
                <textarea
                  value={formData.source_notes || ''}
                  onChange={e => handleChange('source_notes', e.target.value)}
                  rows={2}
                  placeholder="Instrucciones sobre cómo debe la IA procesar u observar estos enlaces..."
                  className="w-full rounded-lg border border-[#2B282F] bg-[#222024] p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Material de referencia / Archivos cargados */}
            <div className="space-y-4 rounded-xl border border-[#2B282F] bg-[#161517] p-5">
              <div>
                <h3 className="text-sm font-bold text-white">Archivos y Capturas de Referencia</h3>
                <p className="text-[11px] text-gray-400">
                  Sube capturas de pantalla, manuales de marca o paletas para enriquecer el contexto.
                </p>
              </div>

              <label className="block cursor-pointer rounded-lg border border-dashed border-[#2B282F] bg-[#222024]/40 hover:bg-[#222024] p-4 text-center text-xs text-gray-400 transition-all">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={e => handleUploadAssets(e.target.files)}
                  disabled={uploadingAssets}
                />
                {uploadingAssets ? 'Subiendo material...' : '📎 Arrastra o selecciona archivos para subir'}
              </label>

              {loadingAssets ? (
                <div className="text-xs text-gray-400">Cargando material...</div>
              ) : brandAssets.length === 0 ? (
                <div className="text-xs text-gray-400">No hay material cargado.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {brandAssets.map(asset => {
                    const mime = asset.mime_type || '';
                    const isImage = mime.startsWith('image/');
                    return (
                      <div key={asset.id} className="overflow-hidden rounded-lg border border-[#2B282F] bg-[#222024]">
                        <div className="aspect-square w-full bg-black/20">
                          {isImage && asset.preview_url ? (
                            <img src={asset.preview_url} alt={asset.file_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-gray-400">
                              Archivo
                            </div>
                          )}
                        </div>
                        <div className="p-2 space-y-1.5">
                          <p className="truncate text-[10px] text-white" title={asset.file_name}>{asset.file_name}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset)}
                            className="w-full rounded border border-red-500/20 bg-red-500/5 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de navegación del Wizard / Guardar */}
        <div className="flex items-center justify-between border-t border-[#2B282F] pt-5">
          <div>
            {activeTab === 'canales' && (
              <button
                type="button"
                onClick={() => setActiveTab('adn')}
                className="px-4 py-2 border border-[#2B282F] hover:bg-[#222024] text-xs font-bold text-white rounded-lg transition-colors"
              >
                Volver
              </button>
            )}
            {activeTab === 'pilares' && (
              <button
                type="button"
                onClick={() => setActiveTab('canales')}
                className="px-4 py-2 border border-[#2B282F] hover:bg-[#222024] text-xs font-bold text-white rounded-lg transition-colors"
              >
                Volver
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'adn' && (
              <button
                type="button"
                onClick={() => setActiveTab('canales')}
                className="px-5 py-2.5 bg-white text-black hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors"
              >
                Siguiente Paso
              </button>
            )}
            {activeTab === 'canales' && (
              <button
                type="button"
                onClick={() => setActiveTab('pilares')}
                className="px-5 py-2.5 bg-white text-black hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors"
              >
                Siguiente Paso
              </button>
            )}
            
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-5 py-2.5 border border-[#2B282F] bg-[#222024] hover:bg-[#2B282F] text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Identidad'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
