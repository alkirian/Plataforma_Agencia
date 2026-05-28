import { generateScheduleIdeas, handleChatConversation, generateImageWithAI, generateCopyFromTrend } from '../services/ai.service.js';
import { listChatMessages, saveChatMessage } from '../services/chat.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { userPrompt, monthContext, quantity, targetDate } = req.body;
    if (!clientId || !userPrompt) {
      return res.status(400).json({ success: false, message: 'clientId y userPrompt son requeridos' });
    }
    const ideas = await generateScheduleIdeas({ clientId, userPrompt, monthContext, quantity, targetDate, token });
    res.status(200).json({ success: true, data: ideas });
  } catch (error) {
    next(error);
  }
};

export const handleChat = async (req, res, next) => {
  console.log('🔍 handleChat - Entrada completa:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Bearer ...' : 'NO AUTH',
      contentType: req.headers['content-type']
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : 'NO USER',
    authToken: req.authToken ? 'EXISTS' : 'NO TOKEN'
  });

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { userPrompt, chatHistory, agentId } = req.body;

    if (!clientId) {
      console.error('❌ clientId faltante');
      return res.status(400).json({ success: false, error: 'clientId requerido' });
    }
    if (!userPrompt?.trim()) {
      console.error('❌ userPrompt faltante o vacío:', userPrompt);
      return res.status(400).json({ success: false, error: 'userPrompt requerido' });
    }
    if (!req.user?.id) {
      console.error('❌ userId no detectado. req.user:', req.user);
      return res.status(401).json({ success: false, error: 'userId no detectado' });
    }

    console.log('✅ Validaciones pasadas:', {
      clientId,
      userId: req.user.id,
      userPromptLength: userPrompt.trim().length,
      agentId
    });

    // Guardar mensaje del usuario con metadatos del agente
    let userMessageId = null;
    try {
      console.log('💾 Intentando guardar mensaje de usuario...');
      const userMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: 'user',
        content: userPrompt.trim(),
        metadata: { chatHistory, agentId }
      });
      userMessageId = userMessage.id;
      console.log('✅ Mensaje de usuario guardado:', userMessage);
    } catch (saveError) {
      console.error('❌ Error al guardar mensaje de usuario:', saveError);
    }

    // Generar respuesta con AI inyectando expertise
    console.log('🤖 Generando respuesta AI con agentId:', agentId);
    const response = await handleChatConversation({ clientId, userPrompt, chatHistory, token, agentId });
    console.log('✅ Respuesta AI generada:', {
      hasResponse: !!response?.response,
      responseLength: response?.response?.length,
      hasCommands: !!response?.commands?.length
    });

    const pendingCommands = Array.isArray(response?.commands)
      ? response.commands.map(cmd => ({ ...cmd, status: 'pending' }))
      : [];
    const firstPendingCommand = pendingCommands.length > 0 ? pendingCommands[0] : null;

    // Guardar respuesta del asistente con metadatos del agente y comandos en estado pendiente
    try {
      console.log('💾 Intentando guardar respuesta del asistente...');
      const assistantMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: 'assistant',
        content: response?.response || 'Lo siento, no pude generar una respuesta.',
        metadata: {
          chatHistory,
          relatedToMessageId: userMessageId,
          agentId,
          commands: pendingCommands,
          command: firstPendingCommand // Compatibilidad hacia atrás
        }
      });
      console.log('✅ Respuesta del asistente guardada:', assistantMessage);
    } catch (saveError) {
      console.error('❌ Error al guardar respuesta del asistente:', saveError);
    }

    // Responder al cliente
    const responseData = {
      success: true,
      data: {
        response: response?.response || 'Respuesta generada',
        messageId: userMessageId,
        suggestions: response?.suggestions,
        commands: pendingCommands,
        command: firstPendingCommand // Compatibilidad hacia atrás
      }
    };

    console.log('📤 Enviando respuesta al cliente:', {
      hasResponse: !!responseData.data.response,
      hasMessageId: !!responseData.data.messageId,
      hasCommands: !!responseData.data.commands?.length
    });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error general en handleChat:', error);
    next(error);
  }
};

// GET /clients/:clientId/chat/history?limit=20&before=2025-01-01T00:00:00Z
export const handleGetChatHistory = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { limit, before } = req.query;
    const lim = Math.max(1, Math.min(100, Number(limit) || 20));
    const result = await listChatMessages({ token, clientId, limit: lim, before });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleGenerateImage = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId, itemId } = req.params;
    const { prompt, aspectRatio } = req.body;

    if (!clientId || !itemId) {
      return res.status(400).json({ success: false, error: 'clientId y itemId son requeridos.' });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'El prompt es requerido para generar la imagen.' });
    }

    // 1. Validar cliente y obtener su agency_id usando el token del usuario
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

    // 2. Validar que la publicación (schedule_item) existe y pertenece al cliente
    const { data: item, error: itemErr } = await supabaseAuth
      .from('schedule_items')
      .select('id')
      .eq('id', itemId)
      .eq('client_id', clientId)
      .single();

    if (itemErr || !item) {
      console.error('❌ Error al validar schedule_item:', itemErr);
      return res.status(404).json({ success: false, error: 'Publicación no encontrada o sin permisos.' });
    }

    // 3. Generar la imagen con IA (Nano Banana / Gemini API)
    let generatedImage;
    try {
      generatedImage = await generateImageWithAI({ prompt, aspectRatio });
    } catch (aiError) {
      console.error('❌ Error al generar imagen con IA:', aiError);
      return res.status(aiError.statusCode || 400).json({ success: false, error: aiError.message });
    }

    // 4. Decodificar la imagen a un Buffer
    const base64Image = typeof generatedImage === 'string' ? generatedImage : generatedImage.base64;
    const mimeType = typeof generatedImage === 'string' ? 'image/jpeg' : (generatedImage.mimeType || 'image/png');
    const extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const timestamp = Date.now();
    const fileName = `ai-generated-${timestamp}.${extension}`;
    const storagePath = `${clientId}/${itemId}/${fileName}`;

    console.log(`💾 Subiendo imagen generada a Supabase Storage: bucket 'content-assets', path: '${storagePath}'`);

    // 5. Subir imagen a Supabase Storage usando supabaseAdmin
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('content-assets')
      .upload(storagePath, imageBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadErr) {
      console.error('❌ Error al subir imagen a Supabase Storage:', uploadErr);
      return res.status(500).json({ success: false, error: `Error al almacenar la imagen: ${uploadErr.message}` });
    }

    // 6. Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('content-assets')
      .getPublicUrl(storagePath);
    
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      console.error('❌ No se pudo obtener la URL pública de la imagen.');
      return res.status(500).json({ success: false, error: 'No se pudo obtener la URL pública del asset.' });
    }

    // 7. Insertar el registro del asset en public.content_assets
    const { data: asset, error: assetErr } = await supabaseAuth
      .from('content_assets')
      .insert({
        schedule_item_id: itemId,
        client_id: clientId,
        agency_id: client.agency_id,
        created_by: req.user?.id || null,
        file_name: fileName,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: imageBuffer.length,
        asset_role: 'final'
      })
      .select('*')
      .single();

    if (assetErr) {
      console.error('❌ Error al registrar el asset en la base de datos:', assetErr);
      // Intentar limpiar el archivo subido en storage
      await supabaseAdmin.storage.from('content-assets').remove([storagePath]).catch(e => {
        console.error('⚠️ No se pudo eliminar el archivo huérfano del storage:', e.message);
      });
      return res.status(500).json({ success: false, error: `Error al registrar el asset: ${assetErr.message}` });
    }

    console.log('✅ Asset generado e insertado correctamente:', asset);
    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error('❌ Error general en handleGenerateImage:', error);
    next(error);
  }
};

export const handleGenerateCopyFromTrend = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { trendTitle, trendDescription, suggestedAction, channel } = req.body;

    if (!clientId || !trendTitle) {
      return res.status(400).json({ success: false, message: 'clientId y trendTitle son requeridos' });
    }

    const copyData = await generateCopyFromTrend({
      clientId,
      trendTitle,
      trendDescription,
      suggestedAction,
      channel,
      token
    });

    res.status(200).json({ success: true, data: copyData });
  } catch (error) {
    next(error);
  }
};
