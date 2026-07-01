// src/components/brand/useBrandIdentity.js
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useLanguage } from '../../hooks';
import { useDocuments } from '../../hooks/useDocuments';
import { playSuccessSound } from '../../utils/soundEffects';


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
  const { t, lang } = useLanguage();
  const { documents, upload: uploadDoc, remove: removeDoc, isLoading: loadingDocs } = useDocuments(clientId);
  const [formData, setFormData] = useState(DEFAULT_PROFILE);
  const isDirtyRef = useRef(false);
  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  const handleAutosave = useCallback(async () => {
    if (!clientId) return;
    setAutosaveStatus('saving');
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
      setAutosaveStatus('saved');
      playSuccessSound();
      isDirtyRef.current = false;

      // Verificar si la marca está 100% completa y disparar evento de celebración
      const isProfileComplete =
        formData.business_description?.trim() &&
        formData.ai_insights?.tone_detected?.trim() &&
        formData.target_audience?.trim() &&
        (formData.color_palette?.length > 0) &&
        (formData.instagram_url || formData.website_url || formData.facebook_url);

      if (isProfileComplete) {
        window.dispatchEvent(new CustomEvent('cadence:brand-complete', { detail: { clientId } }));
      }

      // Reset autosaveStatus to 'idle' after 3s
      setTimeout(() => {
        setAutosaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Autosave error:', error);
      setAutosaveStatus('error');
    }
  }, [clientId, formData]);

  useEffect(() => {
    if (!isDirtyRef.current) return;

    const timer = setTimeout(() => {
      handleAutosave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, handleAutosave]);
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

  const CONSISTENCY_LOADER_MSGS = t.brand.consistencyLoaderMsgs;

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
  }, [isAnalyzingConsistency, CONSISTENCY_LOADER_MSGS]);

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
      toast.error(t.brand.errorLoadProfile);
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
          toast.error(`${t.brand.analysisFailed}${data.analysis_error}`, { duration: 6000 });
        } else if (data.consistency_report) {
          toast.success(t.brand.analysisCompleted, {
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
      // Solo mostrar recursos cargados por el usuario para identidad de marca
      const filtered = assets.filter((asset) =>
        ['reference', 'document', 'screenshot', 'logo'].includes(asset.asset_type)
      );
      setBrandAssets(filtered);
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

  // Auto-guardado automático de canales y paleta de colores
  useEffect(() => {
    if (loading) return;

    const delayDebounceFn = setTimeout(() => {
      if (!isAnalyzingConsistency) {
        handleSubmit();
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [
    formData.color_palette,
    formData.instagram_url,
    formData.website_url,
    formData.tiktok_url,
    formData.facebook_url,
    formData.linkedin_url,
    formData.youtube_url,
  ]);

  // Cálculo del porcentaje de completado de identidad
  const completion = useMemo(() => {
    const text = String(formData.business_description || '').trim();
    if (!text) return 0;
    if (text.length > 500) return 100;
    return Math.min(100, Math.round((text.length / 500) * 100));
  }, [formData.business_description]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    isDirtyRef.current = true;
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
        toast.error(t.brand.errorAddChannel);
        setIsAnalyzingConsistency(false);
        return;
      }

      const response = await analyzeBrandConsistency(clientId, formData, reconstructedSourceLinks);

      if (response?.success) {
        toast.success(
          response.message || t.brand.analysisStarted,
          {
            duration: 8000,
            id: 'brand-analysis-started',
          }
        );
      } else {
        throw new Error(response?.error || t.brand.errorStartDiagnosis);
      }
    } catch (error) {
      toast.error(error.message || t.brand.errorPerformAnalysis);
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

    toast.success(t.brand.harmonizedApplied);
  };

  // Carga de material de referencia y soporte
  const handleUploadAssets = async (files) => {
    const validFiles = Array.from(files || []);
    if (!validFiles.length) return;
    setUploadingAssets(true);
    try {
      for (const file of validFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);

        if (isImage) {
          await uploadBrandAsset(clientId, file, { asset_type: 'reference' });
        } else {
          await uploadDoc({ file });
        }
      }
      await loadAssets();
      const successMsg = lang === 'es'
        ? `¡${validFiles.length} archivo${validFiles.length > 1 ? 's' : ''} procesado${validFiles.length > 1 ? 's' : ''} con éxito!`
        : `${validFiles.length} file${validFiles.length > 1 ? 's' : ''} processed successfully!`;
      toast.success(successMsg);
    } catch (error) {
      toast.error(error.message || t.brand.errorUploadFiles);
    } finally {
      setUploadingAssets(false);
    }
  };

  const handleDeleteAsset = async (asset) => {
    try {
      await deleteBrandAsset(clientId, asset.id);
      setBrandAssets((prev) => prev.filter((item) => item.id !== asset.id));
      toast.success(t.brand.assetDeleted);
    } catch (error) {
      toast.error(error.message || t.brand.errorDeleteAsset);
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
      toast.success(t.brand.identitySaved);
      isDirtyRef.current = false;
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 3000);
      setFormData((prev) => ({
        ...prev,
        source_links: reconstructedSourceLinks,
      }));
    } catch (error) {
      toast.error(error.message || t.brand.errorSaveIdentity);
      setAutosaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Manejo de paleta manual de colores
  const handleAddColor = (newHexColor) => {
    if (!newHexColor || !/^#[0-9A-Fa-f]{6}$/.test(newHexColor)) {
      toast.error(t.brand.errorInvalidHex);
      return;
    }
    const normalizedColor = newHexColor.toUpperCase();
    if (formData.color_palette.includes(normalizedColor)) {
      toast.error(t.brand.errorColorExists);
      return;
    }
    const updatedPalette = [...formData.color_palette, normalizedColor];
    handleChange('color_palette', updatedPalette);
    const addedMsg = lang === 'es' ? `Color ${normalizedColor} añadido.` : `Color ${normalizedColor} added.`;
    toast.success(addedMsg);
  };

  const handleRemoveColor = (hexColorToRemove) => {
    const updatedPalette = formData.color_palette.filter((color) => color !== hexColorToRemove);
    handleChange('color_palette', updatedPalette);
    toast.success(t.brand.colorRemoved);
  };

  const handleUpdateColor = (index, newHexColor) => {
    if (!newHexColor || !/^#[0-9A-Fa-f]{6}$/.test(newHexColor)) {
      toast.error(t.brand.errorInvalidHex);
      return;
    }
    const normalizedColor = newHexColor.toUpperCase();
    
    // Check if the color already exists at another index
    const exists = formData.color_palette.some((color, idx) => color === normalizedColor && idx !== index);
    if (exists) {
      toast.error(t.brand.errorColorExists);
      return;
    }

    const updatedPalette = [...formData.color_palette];
    updatedPalette[index] = normalizedColor;
    handleChange('color_palette', updatedPalette);
    const updatedMsg = lang === 'es' ? `Color actualizado a ${normalizedColor}.` : `Color updated to ${normalizedColor}.`;
    toast.success(updatedMsg);
  };

  return {
    formData,
    loading: loading || loadingDocs,
    saving,
    consistencyReport,
    isAnalyzingConsistency,
    resolvedConflicts,
    loadingMessageIndex,
    brandAssets,
    loadingAssets,
    uploadingAssets,
    isDragging,
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
    handleUpdateColor,
    documents,
    loadingDocs,
    handleDeleteDoc: removeDoc,
    autosaveStatus,
  };
};
