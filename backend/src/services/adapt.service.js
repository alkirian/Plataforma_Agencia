import { supabaseAdmin } from '../config/supabaseClient.js';
import { generateImageWithAI } from './ai.service.js';
import { uploadExternalImageToStorage } from '../controllers/design.controller.js';
import sharp from 'sharp';

/**
 * Mapea un aspect ratio a uno soportado por la API de Imagen 3 (1:1, 3:4, 4:3, 9:16, 16:9).
 */
const mapToGeminiRatio = (ratio) => {
  const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  if (validRatios.includes(ratio)) return ratio;
  
  // Ratios comunes fallback
  if (ratio === '4:5') return '3:4'; 
  return '1:1';
};

/**
 * Mapea un aspect ratio a las dimensiones correspondientes de DALL-E 3.
 */
const mapToDalleSize = (ratio) => {
  if (ratio === '9:16' || ratio === '4:5') return '1024x1792';
  if (ratio === '16:9' || ratio === '4:3') return '1792x1024';
  return '1024x1024';
};

/**
 * Mapea un aspect ratio a los nombres de parámetro admitidos por Fal.ai Flux.
 */
const mapToFalSize = (ratio) => {
  if (ratio === '9:16') return 'portrait_16_9';
  if (ratio === '16:9') return 'landscape_16_9';
  if (ratio === '4:5') return 'portrait_4_3';
  if (ratio === '4:3') return 'landscape_4_3';
  return 'square';
};

/**
 * Retorna las dimensiones estándar (ancho x alto) para la composición final del post.
 */
const getTargetDimensions = (ratio) => {
  switch (ratio) {
    case '9:16': return { width: 1080, height: 1920 };
    case '16:9': return { width: 1920, height: 1080 };
    case '4:5': return { width: 1080, height: 1350 };
    case '4:3': return { width: 1440, height: 1080 };
    case '1:1':
    default:
      return { width: 1080, height: 1080 };
  }
};

/**
 * Realiza un análisis visual/OCR del layout del post usando GPT-4o-mini de OpenAI.
 * Se pide la descripción y sujeto principal en INGLÉS para optimizar la generación.
 */
export const analyzeLayoutWithGPT4oMini = async (imageBuffer, mimeType) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada.');
  }

  const base64Data = imageBuffer.toString('base64');
  const url = 'https://api.openai.com/v1/chat/completions';

  const systemPrompt = "Actúa como un detector de layouts. Analiza esta imagen de redes sociales y devuelve estrictamente un objeto JSON con: " +
    "1) `detected_text`: Todo el texto legible de la imagen (en su idioma original). " +
    "2) `layout_description`: Detailed description of the background, colors, gradients, art style, and vibe in ENGLISH. " +
    "3) `main_subject`: What main object, product or subject appears in the image, written in ENGLISH.";

  console.log('📡 [GPT-4o-mini] Enviando imagen original para análisis OCR...');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analiza el layout de la siguiente imagen y devuelve estrictamente un JSON conforme a las instrucciones.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el análisis visual de GPT-4o-mini (Status: ${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('GPT-4o-mini no retornó una respuesta de análisis válida.');
  }

  console.log('✅ [GPT-4o-mini] Análisis visual completado exitosamente.');
  return JSON.parse(rawText.trim());
};

/**
 * Realiza la generación de la imagen utilizando la API de Fal.ai Flux Schnell (síncrona).
 */
export const generateImageWithFal = async (prompt, targetRatio) => {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY no está configurada.');
  }

  const falSize = mapToFalSize(targetRatio);
  const url = 'https://fal.run/fal-ai/flux/schnell';
  
  console.log(`📡 [Fal.ai Flux] Generando diseño completo con tamaño: ${falSize}...`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      image_size: falSize
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en Fal.ai API: ${errText}`);
  }

  const result = await response.json();
  const imageUrl = result.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('La API de Fal.ai no devolvió una URL de imagen válida.');
  }

  return imageUrl;
};

/**
 * Realiza la generación de la imagen utilizando la API de DALL-E 3.
 */
export const generateImageWithDalle = async (prompt, targetRatio) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada.');
  }

  const dalleSize = mapToDalleSize(targetRatio);
  const url = 'https://api.openai.com/v1/images/generations';
  
  console.log(`📡 [DALL-E 3] Generando diseño completo con tamaño: ${dalleSize}...`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: dalleSize
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en DALL-E 3 API: ${errText}`);
  }

  const result = await response.json();
  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('La API de DALL-E 3 no devolvió una URL válida.');
  }

  return imageUrl;
};

/**
 * Realiza un análisis visual/OCR del layout del post usando Gemini Flash.
 */
export const analyzeLayoutWithGemini = async (imageBuffer, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  const base64Data = imageBuffer.toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = "Actúa como un detector de layouts. Analiza esta imagen de redes sociales y devuelve estrictamente un objeto JSON con: " +
    "1) `detected_text`: Todo el texto legible de la imagen (en su idioma original). " +
    "2) `layout_description`: Detailed description of the background, colors, gradients, art style, and vibe in ENGLISH. " +
    "3) `main_subject`: What main object, product or subject appears in the image, written in ENGLISH.";

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Analiza la imagen adjunta y devuelve la estructura de layout descrita en las instrucciones del sistema en formato JSON."
          },
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: base64Data
            }
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
  };

  console.log('📡 [Gemini Flash] Enviando imagen original para análisis OCR...');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Gemini Flash] Error de API:', errorText);
    throw new Error(`Error en el análisis visual de Gemini (Status: ${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini no retornó una respuesta de análisis válida.');
  }

  console.log('✅ [Gemini Flash] Análisis visual completado exitosamente.');
  return JSON.parse(rawText.trim());
};

/**
 * Adapta el formato de un post de redes sociales de forma inteligente rediseñándolo al 100% con IA.
 * Usa un pipeline híbrido robusto con Imagen 3, Fal.ai Flux (Schnell) y OpenAI DALL-E 3.
 */
export const adaptPostFormat = async (storagePath, targetRatio, brandContext = {}) => {
  const clientId = brandContext.clientId;
  if (!clientId) {
    throw new Error('clientId es requerido en el contexto de la marca para subir la imagen.');
  }

  console.log(`🚀 Iniciando adaptación de formato a [${targetRatio}] para el cliente ${brandContext.name || clientId}`);
  
  // 1. Descargar la imagen original
  let originalBuffer;
  let mimeType = 'image/png';

  try {
    if (storagePath.startsWith('data:image')) {
      const base64Data = storagePath.replace(/^data:image\/\w+;base64,/, '');
      originalBuffer = Buffer.from(base64Data, 'base64');
      const mimeMatch = storagePath.match(/^data:(image\/\w+);base64,/);
      mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      console.log(`📥 Imagen original cargada directamente desde Base64 (Mime: ${mimeType})`);
    } else if (!storagePath.startsWith('http') && !storagePath.includes('/') && storagePath.length > 100) {
      originalBuffer = Buffer.from(storagePath, 'base64');
      mimeType = 'image/png';
      console.log(`📥 Imagen original cargada directamente desde Base64 crudo`);
    } else if (storagePath.startsWith('http')) {
      console.log(`📥 Descargando imagen original desde URL externa: ${storagePath}`);
      const res = await fetch(storagePath);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      originalBuffer = Buffer.from(arrayBuffer);
      mimeType = res.headers.get('content-type') || 'image/png';
    } else {
      console.log(`📥 Descargando imagen original desde Supabase Storage: ${storagePath}`);
      const { data, error } = await supabaseAdmin.storage
        .from('content-assets')
        .download(storagePath);
      if (error) throw error;
      const arrayBuffer = await data.arrayBuffer();
      originalBuffer = Buffer.from(arrayBuffer);
      mimeType = data.type || 'image/png';
    }
  } catch (err) {
    console.error('❌ Error al obtener la imagen original:', err.message);
    throw new Error(`No se pudo obtener la imagen original: ${err.message}`);
  }

  // 2. Fase de Análisis Visual (OCR) - Primario GPT-4o-mini, Fallback Gemini Flash
  let analysis;
  try {
    analysis = await analyzeLayoutWithGPT4oMini(originalBuffer, mimeType);
    console.log('📊 Layout analizado con GPT-4o-mini:', analysis);
  } catch (err) {
    console.warn('⚠️ Falló el análisis de layout con GPT-4o-mini. Intentando Gemini de respaldo...', err.message);
    try {
      analysis = await analyzeLayoutWithGemini(originalBuffer, mimeType);
      console.log('📊 Layout analizado con Gemini:', analysis);
    } catch (geminiErr) {
      console.warn('⚠️ Falló también el análisis con Gemini. Usando valores por defecto:', geminiErr.message);
      analysis = {
        detected_text: '',
        layout_description: 'Modern clean graphic background with soft gradients',
        main_subject: 'General product composition'
      };
    }
  }

  // 3. Fase de Generación de Post Completo Rediseñado por IA
  const { width: T_W, height: T_H } = getTargetDimensions(targetRatio);
  let finalBuffer;
  let backgroundMode = 'gemini-imagen';

  // Construir el prompt para que la IA genere el post entero con textos y logos incluidos
  const textPromptPart = (analysis.detected_text && analysis.detected_text.trim() !== '')
    ? `You MUST clearly and legibly write this exact text directly within the design: "${analysis.detected_text}".`
    : `Include a relevant graphic design headline related to: "${analysis.main_subject}".`;

  const backgroundPrompt = `A professional advertising social media graphic banner for the brand "${brandContext.name}" in the "${brandContext.industry || 'general'}" industry.
The banner must display the main product or subject: "${analysis.main_subject}".
The visual layout, colors, and gradients of the post must match exactly this style: "${analysis.layout_description}".
${textPromptPart}
Include a clean corporate logo mockup for "${brandContext.name}" integrated in the composition. High quality, premium typography, modern composition.`;
  
  try {
    // 3.1 Intento Primario con Gemini Imagen 3
    console.log(`🤖 Generando diseño completo adaptado para [${targetRatio}] usando Imagen 3...`);
    const mappedRatio = mapToGeminiRatio(targetRatio);
    const imagenResult = await generateImageWithAI({
      prompt: backgroundPrompt,
      aspectRatio: mappedRatio
    });
    const bgBuffer = Buffer.from(imagenResult.base64, 'base64');
    
    console.log(`🎨 Redimensionando diseño completo generado por IA al tamaño final [${T_W}x${T_H}]...`);
    finalBuffer = await sharp(bgBuffer)
      .resize(T_W, T_H, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    console.log('✅ Post completo generado y adaptado exitosamente con Imagen 3.');
  } catch (err) {
    console.warn(`⚠️ [Gemini Imagen] No se pudo generar con Imagen 3 (cuenta free o límite de cuota): "${err.message}".`);
    
    // 3.2 Intento Secundario con Fal.ai Flux Schnell (Active Fallback)
    if (process.env.FAL_KEY) {
      try {
        console.log(`🤖 [Fal.ai Flux] Intentando generar post completo usando Flux Schnell como fallback...`);
        const falUrl = await generateImageWithFal(backgroundPrompt, targetRatio);
        console.log(`📥 [Fal.ai Flux] Descargando imagen generada desde URL: ${falUrl}`);
        
        const falRes = await fetch(falUrl);
        if (!falRes.ok) throw new Error(`Status ${falRes.status}`);
        const arrayBuffer = await falRes.arrayBuffer();
        const falImageBuffer = Buffer.from(arrayBuffer);
        
        console.log(`🎨 Redimensionando diseño completo de Fal.ai al tamaño final [${T_W}x${T_H}]...`);
        finalBuffer = await sharp(falImageBuffer)
          .resize(T_W, T_H, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();
          
        backgroundMode = 'fal-ai-flux';
        console.log('✅ Post completo generado y adaptado exitosamente con Fal.ai Flux Schnell.');
      } catch (falErr) {
        console.warn(`⚠️ [Fal.ai Flux] Falló la generación con Fal.ai: "${falErr.message}".`);
      }
    }

    // 3.3 Intento Terciario con DALL-E 3 de OpenAI
    if (!finalBuffer && process.env.OPENAI_API_KEY) {
      try {
        console.log(`🤖 [DALL-E 3] Intentando generar post completo usando DALL-E 3 como fallback...`);
        const dalleUrl = await generateImageWithDalle(backgroundPrompt, targetRatio);
        console.log(`📥 [DALL-E 3] Descargando imagen generada desde URL: ${dalleUrl}`);
        
        const dalleRes = await fetch(dalleUrl);
        if (!dalleRes.ok) throw new Error(`Status ${dalleRes.status}`);
        const arrayBuffer = await dalleRes.arrayBuffer();
        const dalleImageBuffer = Buffer.from(arrayBuffer);
        
        console.log(`🎨 Redimensionando diseño completo de DALL-E 3 al tamaño final [${T_W}x${T_H}]...`);
        finalBuffer = await sharp(dalleImageBuffer)
          .resize(T_W, T_H, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();
          
        backgroundMode = 'openai-dalle';
        console.log('✅ Post completo generado y adaptado exitosamente con DALL-E 3.');
      } catch (dalleErr) {
        console.warn(`⚠️ [DALL-E 3] Falló la generación de fondo con DALL-E 3: "${dalleErr.message}".`);
      }
    }
    
    // 3.4 Intento Cuaternario (Fallback de fondo difuminado en Sharp)
    if (!finalBuffer) {
      console.log('🎨 Creando fallback local de fondo difuminado inteligente con Sharp...');
      backgroundMode = 'local-blurred-fallback';
      
      const bgFallbackBuffer = await sharp(originalBuffer)
        .resize(T_W, T_H, {
          fit: 'cover',
          position: 'center'
        })
        .blur(40)
        .composite([{
          input: Buffer.from(`<svg width="${T_W}" height="${T_H}"><rect width="100%" height="100%" fill="black" opacity="0.3"/></svg>`),
          left: 0,
          top: 0
        }])
        .toBuffer();
        
      const origMeta = await sharp(originalBuffer).metadata();
      const origW = origMeta.width || 1024;
      const origH = origMeta.height || 1024;

      const scale = Math.min((T_W * 0.96) / origW, (T_H * 0.96) / origH);
      const overlayW = Math.round(origW * scale);
      const overlayH = Math.round(origH * scale);

      const featherSize = Math.max(8, Math.round(Math.min(overlayW, overlayH) * 0.05));
      const svgMask = `
        <svg width="${overlayW}" height="${overlayH}">
          <rect x="${featherSize}" y="${featherSize}" width="${overlayW - 2 * featherSize}" height="${overlayH - 2 * featherSize}" rx="8" fill="white" filter="blur(${Math.round(featherSize / 2)}px)" />
        </svg>
      `;

      const resizedOriginal = await sharp(originalBuffer)
        .resize(overlayW, overlayH)
        .png()
        .toBuffer();

      const maskedOriginal = await sharp(resizedOriginal)
        .composite([{
          input: Buffer.from(svgMask),
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();

      const left = Math.round((T_W - overlayW) / 2);
      const top = Math.round((T_H - overlayH) / 2);

      finalBuffer = await sharp(bgFallbackBuffer)
        .composite([{
          input: maskedOriginal,
          left,
          top
        }])
        .png()
        .toBuffer();
        
      console.log('✅ Fallback híbrido de fondo difuminado completado.');
    }
  }

  // 5. Fase de Guardado en Supabase Storage
  const fileName = `adapt-${targetRatio.replace(':', '-')}-${Date.now()}.png`;
  const imageSource = `data:image/png;base64,${finalBuffer.toString('base64')}`;

  console.log(`💾 Subiendo resultado de adaptación a Supabase Storage: 'content-assets'`);
  const uploadResult = await uploadExternalImageToStorage(imageSource, clientId, `adapt-${targetRatio.replace(':', '-')}`);

  if (!uploadResult.publicUrl) {
    throw new Error('No se pudo subir la imagen adaptada o no se obtuvo una URL pública.');
  }

  console.log(`🎉 Proceso completado. URL pública: ${uploadResult.publicUrl}`);
  return {
    success: true,
    fileName: uploadResult.fileName,
    storagePath: uploadResult.storagePath || uploadResult.publicUrl,
    publicUrl: uploadResult.publicUrl,
    mimeType: uploadResult.mimeType,
    sizeBytes: uploadResult.sizeBytes,
    backgroundMode,
    analysis
  };
};
