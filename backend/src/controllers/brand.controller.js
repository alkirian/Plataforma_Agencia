import { extractBrandProfileFromContext, searchAndExtractCompanyBrand, analyzeBrandConsistency, processBrandDnaChat } from '../services/aiBrand.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import axios from 'axios';
import { getInstagramFeedForBrandAnalysis } from '../services/metaAds.service.js';
import { saveChatMessage } from '../services/chat.service.js';

/**
 * Endpoint para autocompletar la identidad de marca del cliente usando IA
 * POST /api/v1/clients/:clientId/brand-profile/auto-fill
 */
export const handleAutoFillBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { rawText, documentId } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    // 1. Validar cliente y obtener permisos del usuario
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    let textToAnalyze = '';

    // A. Si se proporciona un texto plano directamente
    if (rawText && rawText.trim()) {
      textToAnalyze = rawText.trim();
    } 
    // B. Si se proporciona un documentId de la biblioteca de documentos del cliente
    else if (documentId) {
      console.log(`📂 [Brand Onboarding] Extrayendo texto del documento: ${documentId}`);
      
      const { data: doc, error: docErr } = await supabaseAuth
        .from('documents')
        .select('id, storage_path, file_type')
        .eq('id', documentId)
        .eq('client_id', clientId)
        .single();

      if (docErr || !doc) {
        console.error('❌ Error al cargar documento de referencia:', docErr);
        return res.status(404).json({ success: false, error: 'Documento de referencia no encontrado.' });
      }

      // Descargar archivo del storage bucket 'documents'
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('documents')
        .download(doc.storage_path);

      if (downloadError) {
        console.error('❌ Error al descargar archivo de Supabase Storage:', downloadError);
        return res.status(500).json({ success: false, error: `No se pudo descargar el archivo: ${downloadError.message}` });
      }

      // Decodificar y extraer texto según mime type
      const arrayBuffer = await fileData.arrayBuffer?.();
      const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : fileData;
      const fileType = doc.file_type?.toLowerCase() || '';

      if (fileType.includes('pdf')) {
        const parsedPdf = await pdf(buffer, { max: 150 });
        textToAnalyze = parsedPdf.text || '';
      } else if (fileType.includes('docx') || fileType.includes('officedocument.wordprocessingml')) {
        const { value } = await mammoth.extractRawText({ buffer });
        textToAnalyze = value || '';
      } else {
        textToAnalyze = buffer.toString('utf8') || '';
      }
    } else {
      return res.status(400).json({ success: false, error: 'Debes proporcionar un texto plano (rawText) o un documento (documentId) para analizar.' });
    }

    if (!textToAnalyze.trim()) {
      return res.status(400).json({ success: false, error: 'No se pudo extraer ningún texto de la fuente provista.' });
    }

    // 2. Ejecutar extracción estructurada usando la API de Gemini
    const extractedBrandProfile = await extractBrandProfileFromContext(textToAnalyze);

    return res.status(200).json({
      success: true,
      data: extractedBrandProfile,
      message: 'Propuesta de identidad generada con éxito por la IA.'
    });

  } catch (error) {
    console.error('❌ Error general en handleAutoFillBrandProfile:', error);
    next(error);
  }
};

/**
 * Endpoint para buscar una empresa en internet con Gemini + Google Search Grounding
 * y generar su perfil de identidad de marca automáticamente.
 * POST /api/v1/clients/:clientId/brand-profile/search-company
 */
export const handleSearchCompanyBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { companyName } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre de la empresa es requerido.' });
    }

    // Validar que el usuario tiene acceso al cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, agency_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ [Brand Search] Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    console.log(`🔍 [Brand Search] Cliente validado: ${client.name}. Buscando: "${companyName.trim()}"`);

    const extractedBrandProfile = await searchAndExtractCompanyBrand(companyName.trim());

    return res.status(200).json({
      success: true,
      data: extractedBrandProfile,
      message: `Perfil de marca de "${companyName}" generado con éxito a partir de información web.`
    });

  } catch (error) {
    console.error('❌ Error general en handleSearchCompanyBrandProfile:', error);
    next(error);
  }
};

/**
 * Endpoint para analizar la coherencia e inconsistencias de marca cruzando
 * el formulario manual y las redes sociales de referencia.
 * POST /api/v1/clients/:clientId/brand-profile/analyze-consistency
 */
export const handleAnalyzeBrandConsistency = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { currentProfile, sourceLinks } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    if (!currentProfile) {
      return res.status(400).json({ success: false, error: 'Los datos actuales del perfil (currentProfile) son requeridos.' });
    }

    // Validar acceso al cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, industry, brand_info')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ [Brand Consistency] Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    // A. Marcar de inmediato en la base de datos que el análisis de fondo ha iniciado
    const initialBrandInfo = {
      ...(client.brand_info || {}),
      // Preservar los enlaces de redes cargados en el formulario
      instagram_url: currentProfile.instagram_url || client.brand_info?.instagram_url || '',
      website_url: currentProfile.website_url || client.brand_info?.website_url || '',
      tiktok_url: currentProfile.tiktok_url || client.brand_info?.tiktok_url || '',
      youtube_url: currentProfile.youtube_url || client.brand_info?.youtube_url || '',
      facebook_url: currentProfile.facebook_url || client.brand_info?.facebook_url || '',
      linkedin_url: currentProfile.linkedin_url || client.brand_info?.linkedin_url || '',
      analysis_in_progress: true,
      analysis_error: null
    };

    console.log(`🚀 [Brand Consistency] Marcando inicio de análisis de fondo para: "${client.name}"`);
    await supabaseAdmin
      .from('clients')
      .update({ brand_info: initialBrandInfo })
      .eq('id', clientId);

    // B. Responder de inmediato al cliente (frontend) para liberar la conexión HTTP
    res.status(200).json({
      success: true,
      message: '🧠 ¡Análisis de Co-Pilot iniciado de fondo! Tu estratega senior está auditando los canales, sitio web e industria en la web. Puedes navegar libremente o cerrar tu navegador; el lienzo se actualizará automáticamente cuando esté listo.'
    });

    // C. Ejecutar todo el proceso pesado asíncronamente en segundo plano
    (async () => {
      try {
        console.log(`📡 [Background Brand Analysis] Hilo asíncrono iniciado para: "${client.name}"`);

        // 1. Obtener brand_assets del cliente (excluyendo posts/productos automáticos de otras secciones)
        const { data: assets, error: assetsErr } = await supabaseAdmin
          .from('brand_assets')
          .select('*')
          .eq('client_id', clientId)
          .in('asset_type', ['reference', 'document', 'screenshot', 'logo']);

        let extractedTexts = [];
        let imageAssets = [];

        if (assetsErr) {
          console.error('⚠️ [Brand Consistency] Error al cargar brand_assets:', assetsErr);
        } else if (assets && assets.length > 0) {
          for (const asset of assets) {
            if (!asset.storage_path) continue;

            try {
              console.log(`📥 [Brand Analysis] Descargando asset de marca: ${asset.file_name} (${asset.storage_path})`);
              
              const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('brand-assets')
                .download(asset.storage_path);

              if (downloadError) {
                console.error(`⚠️ Error al descargar asset ${asset.file_name}:`, downloadError);
                continue;
              }

              const mimeType = asset.mime_type?.toLowerCase() || '';
              const arrayBuffer = await fileData.arrayBuffer?.();
              const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : fileData;

              if (mimeType.includes('pdf')) {
                const parsedPdf = await pdf(buffer, { max: 150 });
                if (parsedPdf.text?.trim()) {
                  extractedTexts.push(`[Archivo PDF: ${asset.file_name}]\n${parsedPdf.text.trim()}`);
                }
              } else if (mimeType.includes('docx') || mimeType.includes('officedocument.wordprocessingml')) {
                const { value } = await mammoth.extractRawText({ buffer });
                if (value?.trim()) {
                  extractedTexts.push(`[Archivo Word: ${asset.file_name}]\n${value.trim()}`);
                }
              } else if (mimeType.includes('text/') || mimeType.includes('txt') || asset.file_name?.endsWith('.txt')) {
                const txt = buffer.toString('utf8') || '';
                if (txt.trim()) {
                  extractedTexts.push(`[Archivo de texto: ${asset.file_name}]\n${txt.trim()}`);
                }
              } else if (mimeType.startsWith('image/')) {
                const base64 = buffer.toString('base64');
                imageAssets.push({
                  base64,
                  mimeType,
                  fileName: asset.file_name
                });
                console.log(`🖼️ [Brand Analysis] Imagen base64 extraída de ${asset.file_name}`);
              }
            } catch (assetErr) {
              console.error(`❌ Error al procesar asset ${asset.file_name}:`, assetErr);
            }
          }
        }

        // 1.5. Obtener los últimos 10 posts de Instagram para reforzar la identidad
        let instagramPosts = [];
        try {
          console.log(`📸 [Background Brand Analysis] Recuperando últimos 10 posteos de Instagram para: "${client.name}"`);
          instagramPosts = await getInstagramFeedForBrandAnalysis(clientId);
          
          if (instagramPosts && instagramPosts.length > 0) {
            console.log(`📸 [Background Brand Analysis] Se recuperaron ${instagramPosts.length} posts de Instagram.`);
            
            // Descargar imágenes de posts de Instagram para el análisis visual multimodal (máximo 5 imágenes)
            let downloadedIgImages = 0;
            for (const post of instagramPosts) {
              if (downloadedIgImages >= 5) break;
              if (post.imageUrl && (post.mediaType === 'IMAGE' || post.mediaType === 'CAROUSEL_ALBUM')) {
                try {
                  console.log(`📥 [Background Brand Analysis] Descargando imagen de post de Instagram: ${post.id}`);
                  const imgRes = await axios.get(post.imageUrl, { responseType: 'arraybuffer', timeout: 7000 });
                  const base64 = Buffer.from(imgRes.data, 'binary').toString('base64');
                  
                  imageAssets.push({
                    base64,
                    mimeType: 'image/jpeg', // Formato estándar seguro
                    fileName: `instagram_post_${post.id}.jpg`
                  });
                  downloadedIgImages++;
                } catch (imgDlErr) {
                  console.warn(`⚠️ [Background Brand Analysis] No se pudo descargar la imagen del post de Instagram ${post.id}:`, imgDlErr.message);
                }
              }
            }
            console.log(`📸 [Background Brand Analysis] Se añadieron ${downloadedIgImages} imágenes de Instagram para análisis visual.`);
          }
        } catch (igErr) {
          console.error('❌ [Background Brand Analysis] Error al integrar Instagram feed:', igErr.message);
        }

        console.log(`🔍 [Background Brand Analysis] Realizando diagnóstico multimodal de coherencia para cliente: "${client.name}" con ${extractedTexts.length} textos y ${imageAssets.length} imágenes (incluyendo Instagram).`);
        const consistencyReport = await analyzeBrandConsistency(currentProfile, sourceLinks, extractedTexts, imageAssets, client.name, client.industry, instagramPosts);

        // Volver a obtener el brand_info actual de la DB para no sobreescribir otros cambios del usuario
        const { data: refreshedClient } = await supabaseAdmin
          .from('clients')
          .select('brand_info')
          .eq('id', clientId)
          .single();

        const updatedBrandInfo = {
          ...(refreshedClient?.brand_info || {}),
          // Guardar el informe estratégico generado por la IA en la casilla de descripción comercial
          business_description: consistencyReport.brand_profile_text,
          consistency_report: consistencyReport,
          analysis_in_progress: false,
          analysis_error: null,
          last_analyzed_at: new Date().toISOString()
        };

        await supabaseAdmin
          .from('clients')
          .update({ brand_info: updatedBrandInfo })
          .eq('id', clientId);

        console.log(`✅ [Background Brand Analysis] Completado y guardado exitosamente en DB para: "${client.name}"`);

      } catch (backgroundError) {
        console.error(`❌ [Background Brand Analysis] Error de fondo para ${client.name}:`, backgroundError);
        
        try {
          const { data: refreshedClient } = await supabaseAdmin
            .from('clients')
            .select('brand_info')
            .eq('id', clientId)
            .single();

          const errorBrandInfo = {
            ...(refreshedClient?.brand_info || {}),
            analysis_in_progress: false,
            analysis_error: backgroundError.message
          };

          await supabaseAdmin
            .from('clients')
            .update({ brand_info: errorBrandInfo })
            .eq('id', clientId);
        } catch (innerErr) {
          console.error('❌ Error al actualizar estado de fallo en DB:', innerErr);
        }
      }
    })();

  } catch (error) {
    console.error('❌ Error general en handleAnalyzeBrandConsistency:', error);
    next(error);
  }
};

/**
 * Endpoint para chatear con el estratega AI y actualizar quirúrgicamente el ADN de marca.
 * POST /api/v1/clients/:clientId/brand-profile/chat-update
 */
export const handleChatUpdateBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { userPrompt, chatHistory } = req.body;

    if (!clientId || !userPrompt?.trim()) {
      return res.status(400).json({ success: false, error: 'clientId y userPrompt son requeridos.' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'userId no detectado' });
    }

    // 1. Obtener brand_info actual de la DB
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, brand_info')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ Error al validar cliente para chat ADN:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const currentBusinessDescription = client.brand_info?.business_description || '';

    // 2. Procesar con IA
    const chatResult = await processBrandDnaChat(currentBusinessDescription, userPrompt.trim(), chatHistory);

    // 3. Actualizar brand_info en Supabase
    const nextBrandInfo = {
      ...(client.brand_info || {}),
      business_description: chatResult.updated_business_description,
      last_analyzed_at: new Date().toISOString()
    };

    const { error: updateErr } = await supabaseAdmin
      .from('clients')
      .update({ brand_info: nextBrandInfo })
      .eq('id', clientId);

    if (updateErr) {
      console.error('❌ Error al guardar perfil de marca actualizado vía chat:', updateErr);
      return res.status(500).json({ success: false, error: 'No se pudo guardar la actualización de marca.' });
    }

    // 4. Guardar mensajes de chat en chat_messages con metadata: { isBrandDnaChat: true }
    // Mensaje del usuario
    await saveChatMessage({
      token,
      userId: req.user.id,
      clientId,
      role: 'user',
      content: userPrompt.trim(),
      metadata: { isBrandDnaChat: true }
    });

    // Respuesta del asistente
    await saveChatMessage({
      token,
      userId: req.user.id,
      clientId,
      role: 'assistant',
      content: chatResult.reply,
      metadata: { isBrandDnaChat: true }
    });

    return res.status(200).json({
      success: true,
      reply: chatResult.reply,
      updated_business_description: chatResult.updated_business_description
    });

  } catch (error) {
    console.error('❌ Error en handleChatUpdateBrandProfile:', error);
    next(error);
  }
};

/**
 * Endpoint para obtener el historial de chat de ADN de marca.
 * GET /api/v1/clients/:clientId/brand-profile/chat-history
 */
export const handleGetBrandDnaChatHistory = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId requerido' });
    }

    const supabaseAuth = createAuthenticatedClient(token);

    // Consultar chat_messages de este cliente con metadato isBrandDnaChat: true
    const { data: messages, error: fetchErr } = await supabaseAuth
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('client_id', clientId)
      .eq('metadata->isBrandDnaChat', true)
      .order('created_at', { ascending: true });

    if (fetchErr) {
      console.error('❌ Error al obtener historial de chat ADN:', fetchErr);
      return res.status(500).json({ success: false, error: 'Error al recuperar el historial.' });
    }

    return res.status(200).json({
      success: true,
      data: messages || []
    });

  } catch (error) {
    console.error('❌ Error en handleGetBrandDnaChatHistory:', error);
    next(error);
  }
};
