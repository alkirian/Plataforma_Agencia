import { 
  getScheduleItemsByClient, 
  createScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem
} from '../services/schedule.service.js';
import { validateData, scheduleItemSchema, scheduleItemUpdateSchema } from '../schemas/validation.js';

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

    // Validar datos de entrada
    const validation = validateData(scheduleItemSchema, {
      ...req.body,
      client_id: clientId
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors
      });
    }

    const newItem = await createScheduleItem(validation.data, token, req.user?.id);
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

    // Validar datos de actualización
    const validation = validateData(scheduleItemUpdateSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors
      });
    }

    const updatedItem = await updateScheduleItem(itemId, clientId, validation.data, token, req.user?.id);
    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;

    await deleteScheduleItem(itemId, clientId, token, req.user?.id);
    res.status(200).json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
