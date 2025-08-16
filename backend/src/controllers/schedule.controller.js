import { 
  getScheduleItemsByClient, 
  createScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem
} from '../services/schedule.service.js';

export const handleGetSchedule = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId } = req.params;
    const items = await getScheduleItemsByClient(clientId, token);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const handleCreateScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId } = req.params;
    const { title, scheduled_at } = req.body;

    if (!title || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'El título y la fecha programada son requeridos.' });
    }

    const newItemData = {
      ...req.body,
      client_id: clientId,
    };

    const newItem = await createScheduleItem(newItemData, token, req.user?.id);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

export const handleGetScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;
    
    const item = await getScheduleItemById(itemId, clientId, token);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;
    const updateData = req.body;

    const updatedItem = await updateScheduleItem(itemId, clientId, updateData, token);
    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;

    await deleteScheduleItem(itemId, clientId, token);
    res.status(200).json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
