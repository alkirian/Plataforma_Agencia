import { generateScheduleIdeas, handleChatConversation, generateImageWithAI, generateCopyFromTrend, callLLM } from '../services/ai.service.js';
import { listChatMessages, saveChatMessage } from '../services/chat.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import { uploadExternalImageToStorage } from './design.controller.js';
import { getClientComments } from '../services/metaAds.service.js';

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { userPrompt, monthContext, quantity, targetDate, concepts, currentIdeas, refinementPrompt } = req.body;
    if (!clientId || !userPrompt) {
      return res.status(400).json({ success: false, message: 'clientId y userPrompt son requeridos' });
    }
    const ideas = await generateScheduleIdeas({ clientId, userPrompt, monthContext, quantity, targetDate, token, concepts, currentIdeas, refinementPrompt });
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
    const { userPrompt, chatHistory, agentId, model, imageUrl, localTime, timezone, threadId, threadTitle } = req.body;

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
      agentId,
      model,
      hasImage: !!imageUrl
    });

    // 1. Si hay una imagen adjunta, subirla a Supabase Storage
    let uploadedImageUrl = null;
    if (imageUrl) {
      try {
        console.log('🖼️ Subiendo imagen de chat adjunta...');
        const uploadResult = await uploadExternalImageToStorage(imageUrl, clientId, 'chat-upload');
        uploadedImageUrl = uploadResult.publicUrl;
        console.log('✅ Imagen de chat subida con éxito:', uploadedImageUrl);
      } catch (uploadError) {
        console.error('❌ Error al subir imagen adjunta en chat:', uploadError);
      }
    }

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
        metadata: { chatHistory, agentId, model, imageUrl: uploadedImageUrl, threadId, threadTitle }
      });
      userMessageId = userMessage.id;
      console.log('✅ Mensaje de usuario guardado:', userMessage);
    } catch (saveError) {
      console.error('❌ Error al guardar mensaje de usuario:', saveError);
    }

    // Generar respuesta con AI inyectando expertise e imagen si la hay
    console.log('🤖 Generando respuesta AI con agentId:', agentId, 'y modelo:', model);
    const response = await handleChatConversation({
      clientId,
      userPrompt,
      chatHistory,
      token,
      agentId,
      model,
      uploadedImageUrl,
      localTime,
      timezone
    });
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
          model,
          commands: pendingCommands,
          command: firstPendingCommand, // Compatibilidad hacia atrás
          threadId,
          threadTitle
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
        command: firstPendingCommand, // Compatibilidad hacia atrás
        model: response?.modelUsed || model,
        isFallback: response?.isFallback || false
      }
    };

    console.log('📤 Enviando respuesta al cliente:', {
      hasResponse: !!responseData.data.response,
      hasMessageId: !!responseData.data.messageId,
      hasCommands: !!responseData.data.commands?.length,
      modelUsed: responseData.data.model,
      isFallback: responseData.data.isFallback
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
      .select('id, name, industry, brand_info, agency_id')
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
      generatedImage = await generateImageWithAI({
        prompt,
        aspectRatio,
        clientContext: {
          name: client?.name,
          industry: client?.industry,
          brandInfo: client?.brand_info?.business_description || client?.brand_info?.brand_voice
        }
      });
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

export const handleGetDashboardBriefing = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido' });
    }

    const supabaseAuth = createAuthenticatedClient(token);

    // 1. Obtener datos del cliente
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos' });
    }

    // 2. Obtener cronograma reciente
    const { data: scheduleItems } = await supabaseAuth
      .from('schedule_items')
      .select('id, title, channel, scheduled_at, status')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: true });

    // 3. Obtener comentarios recientes
    let comments = [];
    try {
      comments = await getClientComments(clientId, token);
    } catch (e) {
      console.warn('⚠️ Error al cargar comentarios en briefing:', e.message);
    }

    // 4. Calcular completitud
    const brandInfo = client.brand_info || {};
    const checks = [
      { label: 'Descripción del negocio', ok: !!brandInfo.business_description?.trim() || !!client.business_description?.trim() },
      { label: 'Tono de comunicación', ok: !!brandInfo.brand_voice?.trim() },
      { label: 'Público objetivo', ok: !!brandInfo.target_audience?.trim() },
      { label: 'Colores de marca', ok: (brandInfo.color_palette?.length || 0) > 0 }
    ];
    const completedPct = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);

    const upcomingPost = (scheduleItems || []).find(item => new Date(item.scheduled_at) > new Date());
    const pendingCommentsCount = (comments || []).filter(c => c.status === 'pending' || !c.status).length;

    // 5. Construir contexto para la IA
    const systemPrompt = `Eres Aura, una colega y asesora de marketing y publicidad experta, empática y cercana. Tu tarea es redactar un saludo inicial y resumen estratégico diario ("El Briefing de la Agencia") para el usuario en base al estado de su negocio.
REGLAS OBLIGATORIAS:
- Escribe UN ÚNICO párrafo de máximo 3 líneas de texto (muy conciso, directo y humano).
- PROHIBIDO usar viñetas, listas o negritas markdown (por ejemplo, **post**, **hoy**).
- No uses lenguaje técnico abrumador, sé muy amigable, motivadora y clara.
- Redacta en español de forma súper fluida, como un colega que le da un buen consejo diario.`;

    const userPrompt = `Datos del negocio:
- Nombre: "${client.name}"
- Industria: "${client.industry || 'No especificada'}"
- Completitud del ADN de Marca: ${completedPct}%
- Posts en Cronograma: ${scheduleItems?.length || 0} en total.
- Próxima publicación programada: ${upcomingPost ? `"${upcomingPost.title}" para el día ${upcomingPost.scheduled_at.slice(0,10)} en ${upcomingPost.channel}` : 'Ninguna programada'}
- Comentarios pendientes de responder en redes sociales: ${pendingCommentsCount} comentario(s) pendiente(s).

Por favor, escribe el Briefing Diario de la Agencia.`;

    let briefingText = '';
    try {
      briefingText = await callLLM({
        systemPrompt,
        userPrompt,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 300
      });
      briefingText = briefingText.replace(/\*\*?/g, '').trim(); // Quitar negritas si las coló
    } catch (llmErr) {
      console.error('❌ Error al llamar al LLM para briefing:', llmErr);
      // Fallback estático de Aura si falla el LLM
      briefingText = `¡Hola! Aquí Aura de tu agencia. Hoy tu marca está al ${completedPct}%. Tenemos ${scheduleItems?.length || 0} publicaciones planificadas en el cronograma. Recuerda revisar el Buzón Creativo si tienes ideas o fotos nuevas para que creemos más contenido de valor hoy.`;
    }

    res.status(200).json({ success: true, data: { briefing: briefingText } });
  } catch (error) {
    next(error);
  }
};

export const handleGetProactiveProposals = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido' });
    }

    const supabaseAuth = createAuthenticatedClient(token);

    // 1. Obtener datos del cliente
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos' });
    }

    // 2. Obtener tendencias recientes
    const { data: latestTrend } = await supabaseAuth
      .from('trend_reports')
      .select('title, summary, insights')
      .eq('client_id', clientId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Obtener publicaciones futuras para calcular fechas vacías
    const { data: scheduleItems } = await supabaseAuth
      .from('schedule_items')
      .select('scheduled_at')
      .eq('client_id', clientId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    // Helper para buscar días sin post
    const getNextEmptyDates = (items, count = 2) => {
      const dates = [];
      let current = new Date();
      current.setDate(current.getDate() + 1); // Empezar mañana
      current.setHours(12, 0, 0, 0); // A las 12:00 pm
      
      const scheduledDatesOnly = (items || []).map(item => {
        try {
          return new Date(item.scheduled_at).toDateString();
        } catch (e) {
          return '';
        }
      });

      let safeguard = 0;
      while (dates.length < count && safeguard < 30) {
        safeguard++;
        if (!scheduledDatesOnly.includes(current.toDateString())) {
          dates.push(new Date(current).toISOString());
        }
        current.setDate(current.getDate() + 1);
      }
      // Fallback si por alguna razón no encuentra fechas
      if (dates.length < count) {
        dates.push(new Date(Date.now() + 86400000).toISOString());
        dates.push(new Date(Date.now() + 172800000).toISOString());
      }
      return dates;
    };

    const emptyDates = getNextEmptyDates(scheduleItems, 2);

    // 4. Generar sugerencias con IA
    const systemPrompt = `Eres Aura, la estratega creativa de tu agencia de publicidad digital. Tu objetivo es generar exactamente 2 propuestas de publicaciones proactivas, llamativas y minimalistas para el cliente.
Usa su descripción del negocio, tono de voz y público objetivo. Si hay un reporte de tendencias reciente, intenta que al menos una propuesta se alinee con alguna tendencia de forma orgánica.

Responde estrictamente un JSON que siga el siguiente esquema, sin bloques markdown de código (no uses \`\`\`json) y sin explicaciones externas:
{
  "proposals": [
    {
      "title": "Título corto y llamativo para identificar la publicación",
      "channel": "Instagram | TikTok | LinkedIn | Facebook",
      "copy": "El copy redactado del post, amigable y directo, alineado al tono de la marca",
      "creative_idea": "Descripción breve del diseño visual sugerido",
      "goal": "Ej: Generar comunidad | Educar | Vender"
    }
  ]
}`;

    const trendContextText = latestTrend 
      ? `Tendencia de Mercado Reciente:\n- Reporte: "${latestTrend.title}"\n- Insights: ${JSON.stringify(latestTrend.insights)}` 
      : 'No hay tendencias recientes del mercado.';

    const brandInfo = client.brand_info || {};
    const userPrompt = `Información de Marca del negocio:
- Nombre: "${client.name}"
- Industria: "${client.industry || 'No especificada'}"
- Descripción: "${brandInfo.business_description || client.business_description || 'No especificada'}"
- Público objetivo: "${brandInfo.target_audience || 'General'}"
- Tono de voz: "${brandInfo.brand_voice || 'Conversacional'}"

${trendContextText}

Por favor, genera las 2 propuestas.`;

    const proposalsSchema = {
      type: "object",
      properties: {
        proposals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              channel: { type: "string" },
              copy: { type: "string" },
              creative_idea: { type: "string" },
              goal: { type: "string" }
            },
            required: ["title", "channel", "copy", "creative_idea", "goal"],
            additionalProperties: false
          }
        }
      },
      required: ["proposals"],
      additionalProperties: false
    };

    let generatedJSON = '';
    let proposalsList = [];

    try {
      generatedJSON = await callLLM({
        systemPrompt,
        userPrompt,
        responseSchema: proposalsSchema,
        model: 'gpt-4o-mini',
        temperature: 0.8,
        maxTokens: 800
      });
      const parsed = robustJSONParse(generatedJSON);
      if (parsed && Array.isArray(parsed.proposals)) {
        proposalsList = parsed.proposals.map((prop, idx) => ({
          ...prop,
          scheduled_at: emptyDates[idx] || new Date().toISOString()
        }));
      }
    } catch (llmErr) {
      console.error('❌ Error al generar propuestas proactivas con LLM:', llmErr);
    }

    // Fallback si falla la generación con LLM
    if (proposalsList.length === 0) {
      proposalsList = [
        {
          title: 'Consejo Práctico de tu Especialidad',
          channel: 'Instagram',
          copy: `¿Sabías que un pequeño detalle puede marcar la diferencia en tu día? En ${client.name} nos apasiona ayudarte a descubrirlo. Cuéntanos, ¿cuál es tu mayor desafío al respecto hoy? Te leemos en comentarios. 👇`,
          creative_idea: 'Imagen limpia del producto principal con una tipografía minimalista que destaca la pregunta del post.',
          goal: 'Generar comunidad',
          scheduled_at: emptyDates[0]
        },
        {
          title: 'Conoce nuestro Propósito',
          channel: 'Instagram',
          copy: `En ${client.name} no solo ofrecemos un servicio, creamos soluciones pensadas especialmente para ti. Nuestra misión es facilitarte el día a día con la mejor calidad del mercado. Escríbenos al privado para asesorarte sin compromiso. 📩`,
          creative_idea: 'Un carrusel de fotos estéticas detallando la dedicación y el valor de nuestra propuesta comercial.',
          goal: 'Vender',
          scheduled_at: emptyDates[1]
        }
      ];
    }

    res.status(200).json({ success: true, data: proposalsList });
  } catch (error) {
    next(error);
  }
};

