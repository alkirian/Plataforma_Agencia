import { 
  getScheduleItemsByClient, 
  createScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem,
  getScheduleItemAssets,
  createScheduleItemAsset,
  clearScheduleItemsByMonth,
  clearAllScheduleItems,
} from '../services/schedule.service.js';
import { validateData, scheduleItemSchema, scheduleItemUpdateSchema, contentAssetSchema } from '../schemas/validation.js';

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

export const handleGetScheduleItemAssets = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;
    const assets = await getScheduleItemAssets(itemId, clientId, token);
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const handleCreateScheduleItemAsset = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;
    const validation = validateData(contentAssetSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const asset = await createScheduleItemAsset(itemId, clientId, validation.data, token, req.user?.id);
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

export const handleClearSchedule = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId } = req.params;
    const { year, month } = req.query;

    // Si NO vienen year/month -> limpiar TODO el cronograma del cliente
    if (year === undefined && month === undefined) {
      const result = await clearAllScheduleItems(clientId, token, req.user?.id);
      return res.status(200).json({
        success: true,
        message: `Se eliminaron ${result.count} tareas del cronograma completo.`,
        data: result
      });
    }

    // Validar que ambos parámetros estén presentes si se pasa alguno
    if (year === undefined || month === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se deben proporcionar ambos parámetros: year y month.'
      });
    }

    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 0 || monthInt > 11) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros year o month inválidos.'
      });
    }

    const result = await clearScheduleItemsByMonth(clientId, yearInt, monthInt, token, req.user?.id);
    res.status(200).json({ 
      success: true, 
      message: `Se eliminaron ${result.count} tareas exitosamente del cronograma.`, 
      data: result 
    });
  } catch (error) {
    next(error);
  }
};
