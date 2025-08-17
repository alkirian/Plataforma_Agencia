import { 
  getScheduleItemsByClient, 
  createScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem
} from '../services/schedule.service.js';
import { generateScheduleIdeas } from '../services/ai.service.js';
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

    // Ruta extendida: si llega userPrompt o ideas[], generamos/bulk-creamos desde el backend
    const { userPrompt, monthContext, ideas } = req.body || {};

    // Helper: normalizar fecha 'YYYY-MM-DD' -> ISO con hora 09:00Z
    const toIsoDateTime = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      // Si ya parece ISO datetime, devolver tal cual
      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) return dateStr;
      // Si es solo fecha YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return `${dateStr}T09:00:00.000Z`;
      // Intentar parsear y re-serializar
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    if (typeof userPrompt === 'string' && userPrompt.trim()) {
      // 1) Generar ideas con IA
      const generated = await generateScheduleIdeas({
        clientId,
        userPrompt: userPrompt.trim(),
        monthContext: monthContext || null,
        token
      });

      if (!Array.isArray(generated) || generated.length === 0) {
        return res.status(400).json({ success: false, message: 'No se pudieron generar ideas' });
      }

      // 2) Crear ítems a partir de las ideas
      const created = [];
      for (const idea of generated) {
        const payload = {
          title: idea.title || 'Idea sin título',
          scheduled_at: toIsoDateTime(idea.scheduled_at) || new Date().toISOString(),
          status: idea.status || 'pendiente',
          client_id: clientId
        };

        // Validar y crear cada item
        const validation = validateData(scheduleItemSchema, payload);
        if (!validation.success) {
          // Saltar inválidos pero continuar con el resto
          continue;
        }
        const item = await createScheduleItem(validation.data, token, req.user?.id);
        created.push(item);
      }

      return res.status(201).json({ success: true, data: created });
    }

    if (Array.isArray(ideas) && ideas.length) {
      // Bulk create directo desde ideas[] recibidas
      const created = [];
      for (const idea of ideas) {
        const payload = {
          title: idea.title || 'Idea sin título',
          scheduled_at: toIsoDateTime(idea.scheduled_at) || new Date().toISOString(),
          status: idea.status || 'pendiente',
          client_id: clientId
        };
        const validation = validateData(scheduleItemSchema, payload);
        if (!validation.success) continue;
        const item = await createScheduleItem(validation.data, token, req.user?.id);
        created.push(item);
      }
      return res.status(201).json({ success: true, data: created });
    }

    // Flujo normal: crear un único item
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
