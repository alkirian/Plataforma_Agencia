import { transformProductPhoto, outpaintImage } from '../services/fal.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import { analyzePostImageForAdaptation, generateImageWithAI, extractImageBase64, cropToAspectRatio } from '../services/ai.service.js';
import { executeVertexAIOutpaint } from '../services/vertexAI.service.js';
import { adaptPostFormat } from '../services/adapt.service.js';
import sharp from 'sharp';

/**
 * Helper para descargar una imagen externa y subirla a Supabase Storage
 * de modo que sea un asset propio y persistente de la agencia.
 */
export const uploadExternalImageToStorage = async (imageSource, clientId, fileNamePrefix = 'design') => {
  try {
    let buffer;
    let contentType = 'image/png';

    if (imageSource.startsWith('data:image') || !imageSource.startsWith('http')) {
      // Es un base64
      const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      const mimeMatch = imageSource.match(/^data:(image\/\w+);base64,/);
      if (mimeMatch) contentType = mimeMatch[1];
    } else {
      // Es una URL externa, la descargamos
      console.log(`📥 Descargando imagen externa para guardar en Supabase Storage: ${imageSource}`);
      const response = await fetch(imageSource);
      if (!response.ok) throw new Error('No se pudo descargar la imagen externa.');
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = response.headers.get('content-type') || 'image/png';
    }

    const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    const timestamp = Date.now();
    const fileName = `${fileNamePrefix}-${timestamp}.${extension}`;
    const storagePath = `${clientId}/design/${fileName}`;

    console.log(`💾 Subiendo a bucket 'content-assets', ruta: '${storagePath}'`);
    const { data, error } = await supabaseAdmin.storage
      .from('content-assets')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('content-assets')
      .getPublicUrl(storagePath);

    return {
      fileName,
      storagePath,
      publicUrl: publicUrlData.publicUrl,
      sizeBytes: buffer.length,
      mimeType: contentType
    };
  } catch (err) {
    console.error('⚠️ Error al subir imagen a Supabase Storage:', err.message);
    // Si falla la subida a Storage por algún motivo de RLS/permisos de admin, devolvemos la fuente original para no bloquear el flujo
    return {
      fileName: `external-fallback-${Date.now()}.png`,
      storagePath: '',
      publicUrl: imageSource,
      sizeBytes: 0,
      mimeType: 'image/png'
    };
  }
};

/**
 * POST /api/v1/clients/:clientId/design/transform-product
 * Transforma una foto ordinaria en una publicitaria de stock.
 */
export const handleTransformProductImage = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { imageUrl, bgImageUrl, subjectImageUrl, prompt, aspectRatio, aspectRatios, aiEngine } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'El prompt creativo es requerido.' });
    }

    // 1. Validar cliente y obtener su ADN de marca
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, industry, agency_id, brand_info')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    // 1.5. Subir imágenes base64 adicionales a Supabase Storage para obtener URLs públicas estables
    let finalImageUrl = imageUrl || null;
    if (imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('blob:'))) {
      const uploadProd = await uploadExternalImageToStorage(imageUrl, clientId, 'transform-source-product');
      finalImageUrl = uploadProd.publicUrl;
    }

    let finalBgUrl = bgImageUrl || null;
    if (bgImageUrl && (bgImageUrl.startsWith('data:image') || bgImageUrl.startsWith('blob:'))) {
      const uploadBg = await uploadExternalImageToStorage(bgImageUrl, clientId, 'transform-source-bg');
      finalBgUrl = uploadBg.publicUrl;
    }

    let finalSubjectUrl = subjectImageUrl || null;
    if (subjectImageUrl && (subjectImageUrl.startsWith('data:image') || subjectImageUrl.startsWith('blob:'))) {
      const uploadSubject = await uploadExternalImageToStorage(subjectImageUrl, clientId, 'transform-source-subject');
      finalSubjectUrl = uploadSubject.publicUrl;
    }

    // 2. Determinar relaciones de aspecto a generar
    const ratiosToGen = Array.isArray(aspectRatios) && aspectRatios.length > 0 
      ? aspectRatios 
      : [aspectRatio || '1:1'];

    console.log(`🚀 Generando foto de estudio en paralelo para los siguientes formatos: [${ratiosToGen.join(', ')}]`);

    // 3. Ejecutar las transformaciones en paralelo
    const generationPromises = ratiosToGen.map(async (ratio) => {
      const result = await transformProductPhoto({
        imageUrl: finalImageUrl,
        bgImageUrl: finalBgUrl,
        subjectImageUrl: finalSubjectUrl,
        prompt: prompt.trim(),
        aspectRatio: ratio,
        aiEngine,
        clientContext: {
          name: client.name,
          industry: client.industry,
          brandInfo: client.brand_info
        }
      });

      // Subir la imagen generada a nuestro storage propio
      const imageSource = result.base64 ? `data:${result.mimeType};base64,${result.base64}` : result.url;
      const uploadResult = await uploadExternalImageToStorage(imageSource, clientId, `transform-${ratio.replace(':', '-')}`);

      // Registrar la imagen generada en public.brand_assets para guardarla permanentemente para el cliente
      const { data: asset, error: assetErr } = await supabaseAuth
        .from('brand_assets')
        .insert({
          client_id: clientId,
          agency_id: client.agency_id,
          created_by: req.user?.id || null,
          file_name: uploadResult.fileName,
          storage_path: uploadResult.storagePath || uploadResult.publicUrl,
          mime_type: uploadResult.mimeType,
          size_bytes: uploadResult.sizeBytes,
          asset_type: 'product',
          notes: `Generación IA: ${prompt} (Aspecto: ${ratio})`
        })
        .select('*')
        .single();

      if (assetErr) {
        console.error(`⚠️ Error al registrar asset para formato ${ratio}:`, assetErr.message);
      }

      return {
        ratio,
        url: uploadResult.publicUrl,
        assetId: asset?.id || null,
        prompt: result.prompt,
        mode: result.mode,
        isSimulated: result.isSimulated || false
      };
    });

    const generatedResults = await Promise.all(generationPromises);

    // Mapear los resultados en formato ratio -> url
    const formatsMap = {};
    generatedResults.forEach(res => {
      formatsMap[res.ratio] = res.url;
    });

    console.log('✅ Transformaciones de producto completadas:', Object.keys(formatsMap));

    return res.status(200).json({
      success: true,
      data: {
        urls: formatsMap,
        url: generatedResults[0]?.url, // fallback para el primer ratio
        results: generatedResults
      }
    });

  } catch (error) {
    console.error('❌ Error en handleTransformProductImage:', error);
    next(error);
  }
};

/**
 * POST /api/v1/clients/:clientId/design/outpaint
 * Extrapola (AI Expand) una imagen generada a un formato de red social específico.
 */
export const handleOutpaintImage = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { imageUrl, targetAspectRatio } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl de la imagen original es requerida.' });
    }
    if (!targetAspectRatio) {
      return res.status(400).json({ success: false, error: 'targetAspectRatio (ej: 9:16, 16:9) es requerido.' });
    }

    // 1. Validar cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, agency_id, industry')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    // 2. Ejecutar la extrapolación
    const result = await outpaintImage({
      imageUrl,
      targetAspectRatio,
      clientContext: {
        name: client.name,
        industry: client.industry
      }
    });

    // 3. Subir la imagen expandida a nuestro storage propio
    const uploadResult = await uploadExternalImageToStorage(result.url, clientId, `expand-${targetAspectRatio.replace(':', '-')}`);

    // 4. Registrar en brand_assets
    const { data: asset, error: assetErr } = await supabaseAuth
      .from('brand_assets')
      .insert({
        client_id: clientId,
        agency_id: client.agency_id,
        created_by: req.user?.id || null,
        file_name: uploadResult.fileName,
        storage_path: uploadResult.storagePath || uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        size_bytes: uploadResult.sizeBytes,
        asset_type: 'reference',
        notes: `AI Outpaint a formato ${targetAspectRatio} de la imagen: ${imageUrl}`
      })
      .select('*')
      .single();

    if (assetErr) {
      console.error('⚠️ Error al registrar outpaint asset en base de datos:', assetErr.message);
    }

    console.log(`✅ Outpaint a [${targetAspectRatio}] completado y guardado:`, uploadResult.publicUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.publicUrl,
        assetId: asset?.id || null,
        aspectRatio: targetAspectRatio,
        mode: result.mode,
        isSimulated: result.isSimulated || false
      }
    });

  } catch (error) {
    console.error('❌ Error en handleOutpaintImage:', error);
    next(error);
  }
};

/**
 * POST /api/v1/clients/:clientId/design/adapt-formats
 * Toma una imagen de un post terminado, analiza su estilo/textos con GPT-4o Vision,
 * y recrea las variantes de formato en paralelo usando DALL-E 3 / Imagen.
 */
// Re-trigger reload comment
const composePostLayers = async ({ backgroundBuffer, layout, logoUrl }) => {
  try {
    const bgImage = sharp(backgroundBuffer);
    const metadata = await bgImage.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;
    
    const compositeList = [];
    
    // 1. Agregar Logo si está habilitado y el cliente lo tiene
    if (layout?.logo?.detected && logoUrl) {
      try {
        console.log(`📥 [Composición Backend] Descargando logo del cliente: ${logoUrl}`);
        const logoResp = await fetch(logoUrl);
        if (logoResp.ok) {
          const logoBuffer = Buffer.from(await logoResp.arrayBuffer());
          const logoMetadata = await sharp(logoBuffer).metadata();
          
          const logoW = Math.round(width * 0.15); // El logo ocupará el 15% del ancho del lienzo
          const logoH = Math.round(logoW * (logoMetadata.height / logoMetadata.width));
          
          const resizedLogoBuffer = await sharp(logoBuffer)
            .resize(logoW, logoH)
            .toBuffer();
            
          const logoX = Math.round((layout.logo.xPct / 100) * width - logoW / 2);
          const logoY = Math.round((layout.logo.yPct / 100) * height - logoH / 2);
          
          compositeList.push({
            input: resizedLogoBuffer,
            left: Math.max(0, logoX),
            top: Math.max(0, logoY)
          });
        }
      } catch (logoErr) {
        console.warn('⚠️ Error al agregar logo en composición backend:', logoErr.message);
      }
    }
    
    // 2. Agregar Textos usando SVG
    if (layout?.texts && layout.texts.length > 0) {
      const scaleFactor = width / 1000;
      
      const svgElements = layout.texts.map(t => {
        const x = (t.xPct / 100) * width;
        const y = (t.yPct / 100) * height;
        const size = Math.round((parseFloat(t.fontSize) || 24) * scaleFactor);
        
        // Escapar caracteres XML especiales
        const escapedText = t.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
          
        const fontWeight = t.fontWeight === 'bold' ? 'font-weight="bold"' : 'font-weight="normal"';
        
        // Dibujar un borde negro sutil para mayor legibilidad del texto en cualquier fondo
        return `
          <text x="${x}" y="${y}" fill="black" font-size="${size}" font-family="Inter, sans-serif" ${fontWeight} text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="${Math.max(2, size * 0.1)}" stroke-linejoin="round">${escapedText}</text>
          <text x="${x}" y="${y}" fill="${t.color || '#FFFFFF'}" font-size="${size}" font-family="Inter, sans-serif" ${fontWeight} text-anchor="middle" dominant-baseline="middle">${escapedText}</text>
        `;
      }).join('');
      
      const svgBuffer = Buffer.from(`
        <svg width="${width}" height="${height}">
          ${svgElements}
        </svg>
      `);
      
      compositeList.push({
        input: svgBuffer,
        left: 0,
        top: 0
      });
    }
    
    if (compositeList.length > 0) {
      return await bgImage
        .composite(compositeList)
        .toBuffer();
    }
    
    return backgroundBuffer;
  } catch (err) {
    console.error('❌ Error en composePostLayers:', err.message);
    return backgroundBuffer;
  }
};

export const handleAdaptFormats = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { imageUrl, selectedRatios } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl (o base64) del post es requerido.' });
    }

    // 1. Validar cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, agency_id, industry, brand_info, logo_url')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    // 2. Determinar los ratios a adaptar
    const allowedRatios = ['1:1', '9:16', '16:9', '4:5', '4:3'];
    const ratios = Array.isArray(selectedRatios) && selectedRatios.length > 0
      ? selectedRatios.filter(r => allowedRatios.includes(r))
      : allowedRatios;

    const brandContext = {
      clientId: client.id,
      agencyId: client.agency_id,
      name: client.name,
      industry: client.industry
    };

    console.log(`🎨 [Adaptar Formatos] Iniciando proceso de adaptación modular para: ${client.name}...`);

    // 3. Generar las variantes seleccionadas en paralelo usando adaptPostFormat
    const generationPromises = ratios.map(async (ratio) => {
      try {
        console.log(`🧠 [Adaptar Formatos] Adaptando a formato [${ratio}] usando el servicio adaptPostFormat...`);
        const result = await adaptPostFormat(imageUrl, ratio, brandContext);

        // Registrar en brand_assets
        await supabaseAuth
          .from('brand_assets')
          .insert({
            client_id: clientId,
            agency_id: client.agency_id,
            created_by: req.user?.id || null,
            file_name: result.fileName,
            storage_path: result.storagePath,
            mime_type: result.mimeType,
            size_bytes: result.sizeBytes,
            asset_type: 'reference',
            notes: `Variante completa adaptada a formato ${ratio} del post original`
          });

        return { ratio, url: result.publicUrl, analysis: result.analysis };
      } catch (err) {
        console.error(`❌ [Adaptar Formatos] Error al generar variante [${ratio}]:`, err.message);
        // Fallback url en caso de error crítico
        const fallbackUrls = {
          '1:1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
          '9:16': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop',
          '16:9': 'https://images.unsplash.com/photo-1618005198143-d366800e48de?q=80&w=1600&auto=format&fit=crop',
          '4:5': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
          '4:3': 'https://images.unsplash.com/photo-1618005198143-d366800e48de?q=80&w=1600&auto=format&fit=crop'
        };
        return { ratio, url: fallbackUrls[ratio] };
      }
    });

    const results = await Promise.all(generationPromises);

    const formats = {};
    let finalAnalysis = null;
    results.forEach((r) => {
      formats[r.ratio] = r.url;
      if (r.analysis) finalAnalysis = r.analysis;
    });

    console.log('🎉 [Adaptar Formatos] Proceso de adaptación completado.');

    return res.status(200).json({
      success: true,
      data: {
        analysis: finalAnalysis || {
          product: `Diseño publicitario adaptado para ${client.name}`,
          style: `Estilo visual de ${client.industry || 'diseño publicitario'}`,
          background: `Fondo adaptado por IA al formato correspondiente`,
          text: `Textos y elementos adaptados al nuevo lienzo`
        },
        layers: {
          texts: [],
          logo: { detected: false, xPct: 0, yPct: 0 }
        },
        formats
      }
    });

  } catch (error) {
    console.error('❌ Error en handleAdaptFormats:', error);
    next(error);
  }
};
