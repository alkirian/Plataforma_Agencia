import { transformProductPhoto, outpaintImage } from '../services/fal.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';

/**
 * Helper para descargar una imagen externa y subirla a Supabase Storage
 * de modo que sea un asset propio y persistente de la agencia.
 */
const uploadExternalImageToStorage = async (imageSource, clientId, fileNamePrefix = 'design') => {
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
    const { imageUrl, prompt, aspectRatio } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl (o base64) de la foto original es requerida.' });
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

    // 2. Ejecutar la transformación usando nuestro fal.service
    const result = await transformProductPhoto({
      imageUrl,
      prompt,
      aspectRatio,
      clientContext: {
        name: client.name,
        industry: client.industry,
        brandInfo: client.brand_info
      }
    });

    // 3. Subir la imagen generada a nuestro storage propio
    const imageSource = result.base64 ? `data:${result.mimeType};base64,${result.base64}` : result.url;
    const uploadResult = await uploadExternalImageToStorage(imageSource, clientId, 'transform');

    // 4. Registrar la imagen generada en public.brand_assets para guardarla permanentemente para el cliente
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
        notes: `Generación IA: ${prompt} (Aspecto: ${aspectRatio})`
      })
      .select('*')
      .single();

    if (assetErr) {
      console.error('⚠️ Error al registrar asset en base de datos:', assetErr.message);
    }

    console.log('✅ Transformación de producto completada y guardada:', uploadResult.publicUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.publicUrl,
        assetId: asset?.id || null,
        prompt: result.prompt,
        mode: result.mode,
        isSimulated: result.isSimulated || false
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
