import { handleChatConversation } from '../services/ai.service.js';
import { generateScheduleIdeas } from '../services/aiIdeas.service.js';
import { listChatMessages, saveChatMessage } from '../services/chat.service.js';

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId es requerido' });
    }

    const {
      userPrompt = '',
      monthContext = [],
      tone = 'Profesional',
      count = 10,
      preferWeekdays = true,
      allowedWeekdays = null, // e.g., [1,2,3,4,5] (1=Lunes..7=Domingo)
      month = null, // 1-12 opcional
      year = null, // YYYY opcional
      platforms = [],
    } = req.body || {};

    const ideas = await generateScheduleIdeas({
      clientId,
      userPrompt,
      monthContext,
      tone,
      count,
      preferWeekdays,
      allowedWeekdays,
      month,
      year,
      platforms,
      token,
      userId: req.user?.id || null,
    });

    res.status(200).json({ success: true, data: ideas });
  } catch (error) {
    next(error);
  }
};

export const handleIdeaFeedback = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId, ideaId } = req.params;
    const { value } = req.body || {};

    if (!clientId || !ideaId) {
      return res.status(400).json({ success: false, message: 'clientId e ideaId son requeridos' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'userId requerido' });
    }

    const { upsertIdeaFeedback } = await import('../services/aiIdeas.service.js');
    const result = await upsertIdeaFeedback({
      clientId,
      ideaId,
      userId: req.user.id,
      token,
      value, // 'like' | 'dislike' | 'clear'
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleListIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { month, year, sessionId } = req.query || {};
    const { listIdeas } = await import('../services/aiIdeas.service.js');
    const ideas = await listIdeas({ clientId, month: month ? Number(month) : null, year: year ? Number(year) : null, sessionId: sessionId || null, token });
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
    const { userPrompt, chatHistory } = req.body;

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
      userPromptLength: userPrompt.trim().length
    });

    // Guardar mensaje del usuario
    let userMessageId = null;
    try {
      console.log('💾 Intentando guardar mensaje de usuario...');
      const userMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: 'user',
        content: userPrompt.trim(),
        metadata: { chatHistory }
      });
      userMessageId = userMessage.id;
      console.log('✅ Mensaje de usuario guardado:', userMessage);
    } catch (saveError) {
      console.error('❌ Error al guardar mensaje de usuario:', {
        error: saveError.message,
        stack: saveError.stack,
        details: saveError
      });
    }

    // Generar respuesta con AI
    console.log('🤖 Generando respuesta AI...');
    const response = await handleChatConversation({ clientId, userPrompt, chatHistory, token });
    console.log('✅ Respuesta AI generada:', {
      hasResponse: !!response?.response,
      responseLength: response?.response?.length
    });

    // Guardar respuesta del asistente
    try {
      console.log('💾 Intentando guardar respuesta del asistente...');
      const assistantMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: 'assistant',
        content: response?.response || 'Lo siento, no pude generar una respuesta.',
        metadata: { chatHistory, relatedToMessageId: userMessageId }
      });
      console.log('✅ Respuesta del asistente guardada:', assistantMessage);
    } catch (saveError) {
      console.error('❌ Error al guardar respuesta del asistente:', {
        error: saveError.message,
        stack: saveError.stack,
        details: saveError
      });
    }

    // Responder al cliente
    const responseData = {
      success: true,
      data: {
        response: response?.response || 'Respuesta generada',
        messageId: userMessageId,
        suggestions: response?.suggestions
      }
    };

    console.log('📤 Enviando respuesta al cliente:', {
      hasResponse: !!responseData.data.response,
      hasMessageId: !!responseData.data.messageId
    });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error general en handleChat:', {
      error: error.message,
      stack: error.stack,
      details: error
    });
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
