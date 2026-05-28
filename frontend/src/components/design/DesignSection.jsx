import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiFetch.js';
import { useQuery } from '@tanstack/react-query';
import { getClientById } from '../../api/clients';
import {
  SparklesIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ViewfinderCircleIcon,
  FolderArrowDownIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton, Card, CardHeader, CardTitle, CardContent } from '../ui';

// Imágenes demo de productos "feas" tomadas con celular para prueba rápida instantánea
const DEMO_PRODUCT_IMAGES = [
  {
    id: 'perfume',
    name: 'Loción / Perfume',
    thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&auto=format&fit=crop',
    prompt: 'En un pedestal de mármol blanco brillante, rodeado de hojas de palma doradas, luz de sol suave de mañana, gotas de rocío, estilo anuncio de revista de lujo, colores crema y oro'
  },
  {
    id: 'soda',
    name: 'Lata de Refresco',
    thumbnail: 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?q=80&w=300&auto=format&fit=crop',
    prompt: 'Flotando en el aire rodeada de cubos de hielo salpicando agua cristalina fresca, fondo de degradado azul eléctrico con luces de neón, altamente refrescante, dinámico, publicitario'
  },
  {
    id: 'mug',
    name: 'Taza de Café',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop',
    prompt: 'Sobre una mesa rústica de madera en una cafetería acogedora con luces bokeh cálidas de fondo, granos de café esparcidos alrededor con vapor caliente saliendo suavemente de la taza, rústico y premium'
  }
];

// Plantillas de estilos creativos predefinidos
const STYLE_TEMPLATES = [
  {
    name: 'Estudio de Lujo',
    prompt: 'sobre un bloque minimalista de travertino, iluminación de estudio suave lateral, fondo abstracto en tonos pastel cálidos, estética editorial de alta gama, sombras suaves y realistas'
  },
  {
    name: 'Naturaleza Tropical',
    prompt: 'en un bosque tropical húmedo, apoyado sobre una roca mojada con musgo, hojas exóticas gigantes desenfocadas de fondo, rayos de luz natural atravesando la selva, fresco y orgánico'
  },
  {
    name: 'Cibernético / Neón',
    prompt: 'sobre un panel de vidrio negro reflectivo, rodeado de líneas de luz de neón cian y magenta, atmósfera cyberpunk futurista y tecnológica, reflejos perfectos en el suelo'
  },
  {
    name: 'Explosión de Ingredientes',
    prompt: 'en una composición dinámica de alta velocidad, rodeado de salpicaduras artísticas de agua y partículas suspendidas flotantes a juego con los colores del producto, fondo de estudio limpio y enérgico'
  }
];

export const DesignSection = ({ clientId }) => {
  const [uploadedImage, setUploadedImage] = useState(null); // base64 o URL
  const [uploadedFile, setUploadedFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Estados de carga y resultados
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatingMode, setGeneratingMode] = useState(''); // 'fal-ai', 'simulation', etc.
  const [isSimulated, setIsSimulated] = useState(false);

  // Mapeo de formatos generados y su estado de Outpainting individual
  const [formats, setFormats] = useState({
    '1:1': null,
    '9:16': null,
    '16:9': null
  });
  const [outpaintLoading, setOutpaintLoading] = useState({
    '9:16': false,
    '16:9': false
  });

  // Slider de comparación Antes/Después
  const [sliderPosition, setSliderPosition] = useState(50);

  // Obtener datos del cliente actual (para el ADN e industria en la simulación)
  const { data: response } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId).then(res => res.data),
    enabled: !!clientId
  });

  const client = response || {};

  // Rellenar prompt con plantilla
  const handleApplyTemplate = (template) => {
    const brandName = client.name || 'el producto';
    setPrompt(`Foto publicitaria para ${brandName}, ${template.prompt}`);
  };

  // Usar imagen de prueba
  const handleUseDemo = (demo) => {
    setUploadedImage(demo.thumbnail);
    setUploadedFile(null);
    setPrompt(demo.prompt);
    // Limpiar resultados anteriores
    setGeneratedImage(null);
    setFormats({ '1:1': null, '9:16': null, '16:9': null });
  };

  // Manejar subida de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      // Limpiar resultados anteriores
      setGeneratedImage(null);
      setFormats({ '1:1': null, '9:16': null, '16:9': null });
    };
    reader.readAsDataURL(file);
  };

  // Disparar la generación principal (Celular a Stock)
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Por favor, sube una foto o selecciona una imagen de prueba primero.');
      return;
    }
    if (!prompt.trim()) {
      setError('Por favor, escribe una descripción o selecciona una plantilla de estilo.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setFormats({ '1:1': null, '9:16': null, '16:9': null });

    try {
      const res = await apiFetch(`/clients/${clientId}/design/transform-product`, {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: uploadedImage,
          prompt: prompt.trim(),
          aspectRatio: aspectRatio
        })
      });

      if (res.success && res.data) {
        setGeneratedImage(res.data.url);
        setGeneratingMode(res.data.mode);
        setIsSimulated(res.data.isSimulated || false);
        
        // El formato principal generado se mapea directamente
        setFormats(prev => ({
          ...prev,
          [aspectRatio]: res.data.url
        }));
      } else {
        throw new Error('No se recibió la imagen transformada.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al transformar la imagen. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  // Disparar Outpainting/AI Expand para una relación de aspecto específica
  const handleOutpaint = async (targetRatio) => {
    if (!generatedImage) return;

    setOutpaintLoading(prev => ({ ...prev, [targetRatio]: true }));
    setError(null);

    try {
      const res = await apiFetch(`/clients/${clientId}/design/outpaint`, {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: generatedImage,
          targetAspectRatio: targetRatio
        })
      });

      if (res.success && res.data) {
        setFormats(prev => ({
          ...prev,
          [targetRatio]: res.data.url
        }));
      } else {
        throw new Error('No se pudo expandir el formato.');
      }
    } catch (err) {
      console.error(err);
      setError(`Error al extrapolar a ${targetRatio}: ${err.message}`);
    } finally {
      setOutpaintLoading(prev => ({ ...prev, [targetRatio]: false }));
    }
  };

  // Descargar imagen
  const handleDownload = async (url, ratioName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${client.name || 'client'}-design-${ratioName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback si falla el CORS al descargar directo
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto h-full overflow-y-auto select-none font-sans text-text-primary">
      {/* 1. PANEL LATERAL DE HERRAMIENTAS */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-5"
      >
        <Card className="border border-border-subtle bg-surface-strong/50 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-accent-violet/10 to-accent-rose/5 border-b border-border-subtle flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-violet/20 text-accent-violet flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide uppercase leading-none">Estudio Creativo</h2>
              <span className="text-[9.5px] text-text-muted font-bold tracking-wider uppercase mt-1 block">Fotos Premium con IA</span>
            </div>
          </div>

          <CardContent className="p-5 flex flex-col gap-4.5">
            {/* Sección Subir / Cargar */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                1. Foto de Celular (Producto)
              </label>

              {uploadedImage ? (
                <div className="relative rounded-xl border border-border-strong overflow-hidden aspect-video bg-black/40 group flex items-center justify-center">
                  <img
                    src={uploadedImage}
                    alt="Upload preview"
                    className="w-full h-full object-contain max-h-[140px]"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10.5px] font-bold text-white cursor-pointer transition-colors">
                      Cambiar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-[10.5px] font-bold text-red-300 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-accent-violet/40 rounded-xl p-5 cursor-pointer bg-surface/30 hover:bg-surface-soft/10 transition-all group aspect-video">
                  <ArrowUpTrayIcon className="w-6 h-6 text-text-muted group-hover:text-accent-violet transition-colors mb-2.5" />
                  <span className="text-xs font-bold text-text-primary">Arrastra o sube una imagen</span>
                  <span className="text-[9.5px] text-text-muted font-medium mt-1">Formatos JPG, PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Demos rápidas */}
              {!uploadedImage && (
                <div className="mt-1">
                  <span className="text-[9px] font-bold tracking-wider text-text-muted uppercase">¿No tienes fotos? Prueba con éstas:</span>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {DEMO_PRODUCT_IMAGES.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleUseDemo(demo)}
                        className="group flex flex-col items-center gap-1 p-1 rounded-lg border border-border-subtle hover:border-accent-violet/30 bg-surface-soft/40 hover:bg-surface transition-all text-left"
                      >
                        <img
                          src={demo.thumbnail}
                          alt={demo.name}
                          className="w-full aspect-square object-cover rounded-md group-hover:scale-[1.03] transition-transform"
                        />
                        <span className="text-[8px] font-bold text-text-secondary group-hover:text-white truncate w-full text-center mt-0.5">{demo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt creativo */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                  2. Entorno y Escena IA
                </label>
                <span className="text-[8.5px] text-text-muted font-semibold uppercase">Recomendado en español</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe el fondo publicitario ideal... (ej: sobre una repisa de vidrio con plantas tropicales difuminadas al fondo, luz de atardecer dorada)"
                className="w-full min-h-[90px] text-xs p-3 rounded-xl bg-surface-soft border border-border-subtle focus:border-accent-violet focus:ring-1 focus:ring-accent-violet text-white outline-none resize-none placeholder:text-text-muted/65 leading-relaxed"
              />

              {/* Plantillas de estilo */}
              <div>
                <span className="text-[9px] font-bold tracking-wider text-text-muted uppercase">Sugerencias de Estilo:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {STYLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2 py-1 rounded-lg bg-surface border border-border-subtle hover:border-accent-violet/30 text-[9px] font-bold text-text-secondary hover:text-white transition-colors"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ajuste de Formato Principal */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold tracking-widest text-text-secondary uppercase">
                3. Formato Inicial
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1:1', label: 'Cuadrado', desc: '1:1 Post' },
                  { id: '9:16', label: 'Vertical', desc: '9:16 Story' },
                  { id: '16:9', label: 'Horizontal', desc: '16:9 Banner' }
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      aspectRatio === ratio.id
                        ? 'border-accent-violet bg-accent-violet/10 text-white shadow-[0_0_12px_-3px_rgba(124,92,252,0.3)]'
                        : 'border-border-subtle bg-surface hover:border-border-strong text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-black">{ratio.id}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Generar */}
            <CyberButton
              variant="glow"
              size="lg"
              onClick={handleGenerate}
              disabled={generating || !uploadedImage}
              className="w-full mt-2 font-title font-black uppercase text-xs tracking-wider"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                  Diseñando con IA...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <SparklesIcon className="w-4.5 h-4.5 text-yellow-300" />
                  Mejorar Foto a Stock
                </span>
              )}
            </CyberButton>

            {error && (
              <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg p-2.5 text-center mt-1">
                {error}
              </span>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. LIENZO CENTRAL E INTERACTIVO */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col gap-6 min-w-0"
      >
        {/* VISTA COMPARATIVA (ANTES / DESPUÉS) */}
        <Card className="border border-border-subtle bg-surface-strong/30 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[380px]">
          <div className="px-5 py-3.5 border-b border-border-subtle flex justify-between items-center bg-black/[0.15]">
            <div className="flex items-center gap-2">
              <ViewfinderCircleIcon className="w-5 h-5 text-accent-rose" />
              <h3 className="text-xs font-black tracking-widest text-text-secondary uppercase">Lienzo del Estudio</h3>
            </div>
            {generatedImage && (
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] font-black uppercase font-mono tracking-widest bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                  {generatingMode === 'simulation' ? 'Simulación Premium 2K' : 'IA Flux.1 4K'}
                </span>
                {isSimulated && (
                  <span className="text-[8.5px] font-semibold font-sans text-text-muted hover:text-text-primary" title="Modo demostración optimizado con imágenes de stock de alta calidad.">
                    ⓘ Demo
                  </span>
                )}
              </div>
            )}
          </div>

          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden bg-black/20">
            {generating ? (
              // Shimmer loader de lujo mientras genera
              <div className="w-full max-w-[480px] aspect-square rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center p-6 gap-4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-accent-violet/10 to-transparent" style={{ animationDuration: '2s' }} />
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-violet/20 to-accent-rose/10 blur-lg animate-pulse" />
                  <div className="w-full h-full rounded-full border-2 border-white/5 border-t-accent-violet animate-spin" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-black uppercase text-white tracking-widest animate-pulse">Mejorando imagen</span>
                  <span className="text-[9.5px] text-text-muted font-bold tracking-wide text-center uppercase animate-pulse">Eliminando imperfecciones y fusionando con fondo publicitario...</span>
                </div>
              </div>
            ) : generatedImage ? (
              // Slider interactivo Antes/Después
              <div className="w-full max-w-[480px] aspect-square rounded-2xl border border-border-strong overflow-hidden relative shadow-2xl bg-black/40">
                {/* Imagen del ANTES (Fondo) */}
                <img
                  src={uploadedImage}
                  alt="Antes"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Imagen del DESPUÉS (Frente, recortada por slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                >
                  <img
                    src={generatedImage}
                    alt="Después"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                {/* Slider bar y controlador */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
                
                {/* Línea divisoria visible del slider */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_1px_rgba(255,255,255,0.7)] pointer-events-none z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  {/* Manilla central con flechas */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-[#07070E] flex items-center justify-center shadow-2xl font-mono text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Etiquetas */}
                <span className="absolute bottom-4 left-4 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white select-none">
                  Antes (Móvil)
                </span>
                <span className="absolute bottom-4 right-4 px-2 py-1 rounded bg-accent-violet/85 border border-accent-violet/30 text-[9px] font-bold uppercase tracking-wider text-white select-none">
                  Stock Publicitario
                </span>
              </div>
            ) : uploadedImage ? (
              // Imagen cargada lista para procesar
              <div className="w-full max-w-[400px] aspect-square rounded-2xl border border-border-subtle bg-surface overflow-hidden relative p-4 flex items-center justify-center">
                <img
                  src={uploadedImage}
                  alt="Original preview"
                  className="max-h-[300px] object-contain rounded-xl shadow-md"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-violet animate-pulse">Listo para procesar</span>
                  <p className="text-[9.5px] text-text-muted mt-1 font-bold uppercase tracking-wide">Escribe tu descripción y pulsa "Mejorar Foto a Stock"</p>
                </div>
              </div>
            ) : (
              // Estado vacío sin ninguna imagen cargada
              <div className="flex flex-col items-center justify-center gap-3.5 p-8 max-w-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-text-muted">
                  <PhotoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest text-text-secondary uppercase">Sin imagen activa</h4>
                  <p className="text-[10.5px] text-text-muted mt-1 leading-normal font-bold uppercase tracking-wide">
                    Sube una foto de producto tomada con tu móvil o selecciona una de nuestras muestras para comenzar la magia del estudio.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FORMAT ADAPTATION STUDIO (ADAPTACIONES DE FORMATOS EN 1 CLICK) */}
        {generatedImage && (
          <Card className="border border-border-subtle bg-surface-strong/30 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-subtle bg-black/[0.15] flex items-center gap-2">
              <FolderArrowDownIcon className="w-5 h-5 text-accent-violet" />
              <h3 className="text-xs font-black tracking-widest text-text-secondary uppercase">Formatos y Canales Adaptados</h3>
            </div>

            <CardContent className="p-6">
              <p className="text-[10px] text-text-muted font-bold tracking-wide uppercase mb-4">
                Expande la imagen y adáptala a diferentes proporciones de redes sociales usando Inteligencia Artificial Outpainting:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. FORMATO CUADRADO 1:1 */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline px-1">
                    <span className="text-[10px] font-black uppercase text-white">Instagram Post (1:1)</span>
                    <span className="text-[9px] font-bold text-text-muted">Cuadrado</span>
                  </div>
                  <div className="aspect-square rounded-xl border border-border-strong bg-black/40 overflow-hidden relative group">
                    <img
                      src={formats['1:1'] || generatedImage}
                      alt="Ratio 1:1"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(formats['1:1'] || generatedImage, '1-1')}
                        className="p-2 rounded-lg bg-accent-violet hover:bg-accent-violet/85 text-white flex items-center gap-1.5 text-[9.5px] font-bold shadow-md cursor-pointer transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. FORMATO VERTICAL 9:16 (STORY / REEL) */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline px-1">
                    <span className="text-[10px] font-black uppercase text-white">Story / Reel (9:16)</span>
                    <span className="text-[9px] font-bold text-text-muted">Vertical</span>
                  </div>
                  <div className="aspect-square rounded-xl border border-border-strong bg-black/40 overflow-hidden relative group flex items-center justify-center">
                    {outpaintLoading['9:16'] ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-3 bg-black/75">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <ArrowPathIcon className="w-6 h-6 animate-spin text-accent-violet" />
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-white animate-pulse">Expandiendo bordes...</span>
                      </div>
                    ) : formats['9:16'] ? (
                      <>
                        <img
                          src={formats['9:16']}
                          alt="Ratio 9:16"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownload(formats['9:16'], '9-16')}
                            className="p-2 rounded-lg bg-accent-violet hover:bg-accent-violet/85 text-white flex items-center gap-1.5 text-[9.5px] font-bold shadow-md cursor-pointer transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center flex flex-col items-center gap-2.5">
                        <span className="text-[8.5px] font-bold tracking-normal uppercase text-text-muted leading-relaxed">
                          Expande los bordes arriba y abajo manteniendo el Key Visual
                        </span>
                        <button
                          onClick={() => handleOutpaint('9:16')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-accent-violet/30 hover:border-accent-violet bg-accent-violet/10 text-accent-violet hover:text-white transition-all text-[9.5px] font-black uppercase tracking-wide cursor-pointer"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Outpaint 9:16</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. FORMATO HORIZONTAL 16:9 (BANNER / AD) */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline px-1">
                    <span className="text-[10px] font-black uppercase text-white">Banner Web / Ad (16:9)</span>
                    <span className="text-[9px] font-bold text-text-muted">Horizontal</span>
                  </div>
                  <div className="aspect-square rounded-xl border border-border-strong bg-black/40 overflow-hidden relative group flex items-center justify-center">
                    {outpaintLoading['16:9'] ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-3 bg-black/75">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <ArrowPathIcon className="w-6 h-6 animate-spin text-accent-violet" />
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-white animate-pulse">Expandiendo bordes...</span>
                      </div>
                    ) : formats['16:9'] ? (
                      <>
                        <img
                          src={formats['16:9']}
                          alt="Ratio 16:9"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownload(formats['16:9'], '16-9')}
                            className="p-2 rounded-lg bg-accent-violet hover:bg-accent-violet/85 text-white flex items-center gap-1.5 text-[9.5px] font-bold shadow-md cursor-pointer transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center flex flex-col items-center gap-2.5">
                        <span className="text-[8.5px] font-bold tracking-normal uppercase text-text-muted leading-relaxed">
                          Expande los bordes laterales manteniendo el Key Visual
                        </span>
                        <button
                          onClick={() => handleOutpaint('16:9')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-accent-violet/30 hover:border-accent-violet bg-accent-violet/10 text-accent-violet hover:text-white transition-all text-[9.5px] font-black uppercase tracking-wide cursor-pointer"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Outpaint 16:9</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};
export default DesignSection;
