// src/components/brand/useBrandIdentity.js
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  getClientBrandProfile,
  updateClientBrandProfile,
  analyzeBrandConsistency,
} from '../../api/clients';
import {
  deleteBrandAsset,
  getBrandAssetsWithPreview,
  uploadBrandAsset,
} from '../../api/brandAssets';

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
  color_palette: [], // Array de colores hexadecimales (ej. ['#7C5CFC', '#4ECDC4'])
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

export const useBrandIdentity = (clientId) => {
  const [formData, setFormData] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para el verificador de coherencia
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [isAnalyzingConsistency, setIsAnalyzingConsistency] = useState(false);
  const [resolvedConflicts, setResolvedConflicts] = useState(new Set());
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Estados para material de referencia y archivos
  const [brandAssets, setBrandAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Pestaña activa del espacio de trabajo de la columna derecha ('brief' | 'alerts')
  const [activeTab, setActiveTab] = useState('brief');

  const CONSISTENCY_LOADER_MSGS = [
    '🔌 Conectando con canales públicos de la marca...',
    '🌐 Analizando estructura de enlaces y redes sociales...',
    '🔍 Realizando búsquedas profundas sobre el sector e industria...',
    '🕷️ Extrayendo y limpiando contenido del sitio web oficial...',
    '📂 Decodificando documentos de referencia y PDFs...',
    '🖼️ Procesando elementos gráficos e imágenes...',
    '🧠 Evaluando la consistencia y ADN de marca...',
    '⚖️ Cruzando datos y buscando contradicciones...',
    '✨ Consolidando informe estratégico en la Casilla Única...',
  ];

  // Rotador de mensajes de carga
  useEffect(() => {
    let interval;
    if (isAnalyzingConsistency) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % CONSISTENCY_LOADER_MSGS.length);
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzingConsistency]);

  // Carga inicial de datos
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getClientBrandProfile(clientId);
      const data = response?.data || {};

      // Mapear de source_links si no existen inputs dedicados
      const mapped = { ...data };
      if (Array.isArray(data.source_links) && data.source_links.length > 0) {
        data.source_links.forEach((link) => {
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
        color_palette: data.color_palette || data.brand_info?.color_palette || [],
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
        data.source_links.forEach((link) => {
          if (link.type === 'instagram' && !data.instagram_url) mapped.instagram_url = link.url;
          if (link.type === 'website' && !data.website_url) mapped.website_url = link.url;
          if (link.type === 'tiktok' && !data.tiktok_url) mapped.tiktok_url = link.url;
          if (link.type === 'youtube' && !data.youtube_url) mapped.youtube_url = link.url;
          if (link.type === 'facebook' && !data.facebook_url) mapped.facebook_url = link.url;
          if (link.type === 'linkedin' && !data.linkedin_url) mapped.linkedin_url = link.url;
        });
      }

      setFormData((prev) => ({
        ...DEFAULT_PROFILE,
        ...mapped,
        color_palette: data.color_palette || data.brand_info?.color_palette || prev.color_palette,
        // No pisar la edición del usuario a menos que el análisis haya finalizado con nueva descripción
        business_description: data.analysis_in_progress
          ? prev.business_description
          : data.business_description || prev.business_description,
      }));

      if (data.consistency_report) {
        setConsistencyReport(data.consistency_report);
      }

      if (!data.analysis_in_progress) {
        setIsAnalyzingConsistency(false);
        if (data.analysis_error) {
          toast.error(`❌ El análisis falló: ${data.analysis_error}`, { duration: 6000 });
        } else if (data.consistency_report) {
          toast.success('✨ ¡Análisis completado de fondo y cargado con éxito!', {
            id: 'bg-analysis-success',
            duration: 5000,
          });
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        .filter((l) => l.url && l.url.trim())
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
          response.message || '🧠 ¡Análisis iniciado de fondo de forma segura!',
          {
            duration: 8000,
            id: 'brand-analysis-started',
          }
        );
      } else {
        throw new Error(response?.error || 'No se pudo iniciar el diagnóstico.');
      }
    } catch (error) {
      toast.error(error.message || 'Error al realizar el análisis.');
      setIsAnalyzingConsistency(false);
    }
  };

  const handleApplySuggestedFix = (contraId, suggestedFixText) => {
    handleChange('business_description', suggestedFixText);

    setResolvedConflicts((prev) => {
      const next = new Set(prev);
      next.add(contraId);
      return next;
    });

    toast.success('✨ ¡Propuesta armonizada aplicada con éxito!');
  };

  // Carga de material de referencia
  const handleUploadAssets = async (files) => {
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

  const handleDeleteAsset = async (asset) => {
    try {
      await deleteBrandAsset(clientId, asset.id);
      setBrandAssets((prev) => prev.filter((item) => item.id !== asset.id));
      toast.success('Archivo eliminado de las referencias.');
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el archivo.');
    }
  };

  // Guardar identidad en base de datos
  const handleSubmit = async (e) => {
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
        .filter((l) => l.url && l.url.trim())
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
      toast.success('✨ ¡Identidad de marca guardada con éxito!');
      setFormData((prev) => ({
        ...prev,
        source_links: reconstructedSourceLinks,
      }));
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la identidad.');
    } finally {
      setSaving(false);
    }
  };

  // Manejo de paleta manual de colores
  const handleAddColor = (newHexColor) => {
    if (!newHexColor || !/^#[0-9A-Fa-f]{6}$/.test(newHexColor)) {
      toast.error('Color hexadecimal inválido.');
      return;
    }
    const normalizedColor = newHexColor.toUpperCase();
    if (formData.color_palette.includes(normalizedColor)) {
      toast.error('Este color ya existe en tu paleta.');
      return;
    }
    const updatedPalette = [...formData.color_palette, normalizedColor];
    handleChange('color_palette', updatedPalette);
    toast.success(`Color ${normalizedColor} añadido.`);
  };

  const handleRemoveColor = (hexColorToRemove) => {
    const updatedPalette = formData.color_palette.filter((color) => color !== hexColorToRemove);
    handleChange('color_palette', updatedPalette);
    toast.success('Color eliminado de la paleta.');
  };

  return {
    formData,
    loading,
    saving,
    consistencyReport,
    isAnalyzingConsistency,
    resolvedConflicts,
    loadingMessageIndex,
    brandAssets,
    loadingAssets,
    uploadingAssets,
    isDragging,
    activeTab,
    setActiveTab,
    setIsDragging,
    completion,
    CONSISTENCY_LOADER_MSGS,
    handleChange,
    handleConsistencyCheck,
    handleApplySuggestedFix,
    handleUploadAssets,
    handleDeleteAsset,
    handleSubmit,
    handleAddColor,
    handleRemoveColor,
  };
};
