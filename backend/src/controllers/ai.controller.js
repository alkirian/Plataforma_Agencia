import { handleChatConversation } from "../services/ai.service.js";
import { generateScheduleIdeas } from "../services/aiIdeas.service.js";
import { listChatMessages, saveChatMessage } from "../services/chat.service.js";
import { logger } from "../utils/logger.js";

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { clientId } = req.params;

    if (!clientId) {
      return res
        .status(400)
        .json({ success: false, message: "clientId es requerido" });
    }

    const {
      userPrompt = "",
      monthContext = [],
      tone = "Profesional",
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
    const token = req.headers.authorization?.split(" ")[1];
    const { clientId, ideaId } = req.params;
    const { value } = req.body || {};

    if (!clientId || !ideaId) {
      return res
        .status(400)
        .json({ success: false, message: "clientId e ideaId son requeridos" });
    }
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "userId requerido" });
    }

    const { upsertIdeaFeedback } = await import(
      "../services/aiIdeas.service.js"
    );
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
    const token = req.headers.authorization?.split(" ")[1];
    const { clientId } = req.params;
    const { month, year, sessionId } = req.query || {};
    const { listIdeas } = await import("../services/aiIdeas.service.js");
    const ideas = await listIdeas({
      clientId,
      month: month ? Number(month) : null,
      year: year ? Number(year) : null,
      sessionId: sessionId || null,
      token,
    });
    res.status(200).json({ success: true, data: ideas });
  } catch (error) {
    next(error);
  }
};

export const handleChat = async (req, res, next) => {
  logger.debug("handleChat - Entrada completa", {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
    hasAuth: !!req.headers.authorization,
    hasUser: !!req.user,
    hasAuthToken: !!req.authToken,
  });

  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { clientId } = req.params;
    const { userPrompt, chatHistory } = req.body;

    if (!clientId) {
      logger.error("clientId faltante");
      return res
        .status(400)
        .json({ success: false, error: "clientId requerido" });
    }
    if (!userPrompt?.trim()) {
      logger.error("userPrompt faltante o vacío", null, { userPrompt });
      return res
        .status(400)
        .json({ success: false, error: "userPrompt requerido" });
    }
    if (!req.user?.id) {
      logger.error("userId no detectado", null, { user: req.user });
      return res
        .status(401)
        .json({ success: false, error: "userId no detectado" });
    }

    logger.info("Validaciones pasadas", {
      clientId,
      userId: req.user.id,
      userPromptLength: userPrompt.trim().length,
    });

    // Guardar mensaje del usuario
    let userMessageId = null;
    try {
      logger.debug("Intentando guardar mensaje de usuario");
      const userMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: "user",
        content: userPrompt.trim(),
        metadata: { chatHistory },
      });
      userMessageId = userMessage.id;
      logger.info("Mensaje de usuario guardado", { messageId: userMessage.id });
    } catch (saveError) {
      logger.error("Error al guardar mensaje de usuario", saveError, {
        clientId,
        userId: req.user.id,
      });
    }

    // Generar respuesta con AI
    logger.debug("Generando respuesta AI");
    const response = await handleChatConversation({
      clientId,
      userPrompt,
      chatHistory,
      token,
    });
    logger.info("Respuesta AI generada", {
      hasResponse: !!response?.response,
      responseLength: response?.response?.length,
    });

    // Guardar respuesta del asistente
    try {
      logger.debug("Intentando guardar respuesta del asistente");
      const assistantMessage = await saveChatMessage({
        token,
        userId: req.user.id,
        clientId,
        role: "assistant",
        content:
          response?.response || "Lo siento, no pude generar una respuesta.",
        metadata: { chatHistory, relatedToMessageId: userMessageId },
      });
      logger.info("Respuesta del asistente guardada", {
        messageId: assistantMessage.id,
      });
    } catch (saveError) {
      logger.error("Error al guardar respuesta del asistente", saveError, {
        clientId,
        userId: req.user.id,
      });
    }

    // Responder al cliente
    const responseData = {
      success: true,
      data: {
        response: response?.response || "Respuesta generada",
        messageId: userMessageId,
        suggestions: response?.suggestions,
      },
    };

    logger.info("Enviando respuesta al cliente", {
      hasResponse: !!responseData.data.response,
      hasMessageId: !!responseData.data.messageId,
    });

    res.json(responseData);
  } catch (error) {
    logger.error("Error general en handleChat", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

// GET /clients/:clientId/chat/history?limit=20&before=2025-01-01T00:00:00Z
export const handleGetChatHistory = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { clientId } = req.params;
    const { limit, before } = req.query;
    const lim = Math.max(1, Math.min(100, Number(limit) || 20));
    const result = await listChatMessages({
      token,
      clientId,
      limit: lim,
      before,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
