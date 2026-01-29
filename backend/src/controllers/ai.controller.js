import { handleChatConversation } from '../services/ai.service.js';
import { generateScheduleIdeas } from '../services/aiIdeas.service.js';
// import { listChatMessages, saveChatMessage } from '../services/chat.service.js';
import { logger } from '../utils/logger.js';

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;

    if (!clientId) {
      return res
        .status(400)
        .json({ success: false, message: 'clientId es requerido' });
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
      return res
        .status(400)
        .json({ success: false, message: 'clientId e ideaId son requeridos' });
    }
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: 'userId requerido' });
    }

    const { upsertIdeaFeedback } = await import(
      '../services/aiIdeas.service.js'
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
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { month, year, sessionId } = req.query || {};
    const { listIdeas } = await import('../services/aiIdeas.service.js');
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

// Chat handlers disabled - chat.service was removed
/*
export const handleChat = async (req, res, next) => {
  // Disabled - depends on deleted chat.service
  res.status(501).json({ success: false, error: 'Chat feature disabled' });
};

export const handleGetChatHistory = async (req, res, next) => {
  // Disabled - depends on deleted chat.service
  res.status(501).json({ success: false, error: 'Chat feature disabled' });
};
*/
