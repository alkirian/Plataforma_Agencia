import { generateScheduleIdeas, handleChatConversation } from '../services/ai.service.js';

export const handleGenerateIdeas = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { userPrompt, monthContext } = req.body;
    if (!clientId || !userPrompt) {
      return res.status(400).json({ success: false, message: 'clientId y userPrompt son requeridos' });
    }
    const ideas = await generateScheduleIdeas({ clientId, userPrompt, monthContext, token });
    res.status(200).json({ success: true, data: ideas });
  } catch (error) {
    next(error);
  }
};

export const handleChat = async (req, res, next) => {
  console.log('🔍 handleChat llamado con:', {
    clientId: req.params.clientId,
    body: req.body,
    hasToken: !!req.headers.authorization
  });
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const { userPrompt, chatHistory } = req.body;
    if (!clientId || !userPrompt) {
      return res.status(400).json({ success: false, message: 'clientId y userPrompt son requeridos' });
    }
    const response = await handleChatConversation({ clientId, userPrompt, chatHistory, token });
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};
