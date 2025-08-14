import { generateScheduleIdeas } from '../services/ai.service.js';

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
