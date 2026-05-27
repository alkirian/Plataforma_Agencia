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
  getScheduleAssetsByClient,
  deleteScheduleItemAsset,
} from '../services/schedule.service.js';
import { validateData, contentAssetSchema } from '../schemas/validation.js';
import { publishPostToMeta } from '../services/metaAds.service.js';
import { publishToLinkedIn } from '../services/linkedin.service.js';
import { publishToTikTok } from '../services/tiktok.service.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

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

    // Inject client_id into req.validatedBody
    const validatedData = {
      ...req.validatedBody,
      client_id: clientId
    };

    const newItem = await createScheduleItem(validatedData, token, req.user?.id);
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

    const updatedItem = await updateScheduleItem(itemId, clientId, req.validatedBody, token, req.user?.id);
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

export const handleGetClientScheduleAssets = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId } = req.params;
    const assets = await getScheduleAssetsByClient(clientId, token);
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteScheduleItemAsset = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, assetId } = req.params;
    await deleteScheduleItemAsset(assetId, clientId, token, req.user?.id);
    res.status(200).json({ success: true, message: 'Asset del cronograma eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const handlePublishScheduleItem = async (req, res, next) => {
  try {
    const token = req.token || (req.headers.authorization?.split(' ')[1]);
    const { clientId, itemId } = req.params;

    // 1. Obtener la publicación del cronograma por ID
    const item = await getScheduleItemById(itemId, clientId, token);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada.' });
    }

    // 2. Consultar sus archivos adjuntos en content_assets
    const assets = await getScheduleItemAssets(itemId, clientId, token);

    // Obtener la imagen principal (el primer asset visual que sea final o de rol válido)
    let mediaUrl = null;
    const visualAsset = assets.find(a => a.mime_type?.startsWith('image/') || a.mime_type?.startsWith('video/'));

    if (visualAsset?.storage_path) {
      // Generar URL firmada temporal de Supabase (duración 1 hora) para que Meta pueda descargar el archivo
      const { data, error } = await supabaseAdmin.storage
        .from('content-assets')
        .createSignedUrl(visualAsset.storage_path, 3600);

      if (!error && data?.signedUrl) {
        mediaUrl = data.signedUrl;
      } else {
        console.warn('⚠️ No se pudo generar la URL firmada de Supabase:', error?.message);
      }
    }

    // 3. Determinar las plataformas destino a publicar
    const targetPlats = [];
    const platsStr = (item.platforms || '').toLowerCase();
    if (platsStr.includes('facebook')) targetPlats.push('facebook');
    if (platsStr.includes('instagram')) targetPlats.push('instagram');
    if (platsStr.includes('linkedin')) targetPlats.push('linkedin');
    if (platsStr.includes('tiktok')) targetPlats.push('tiktok');

    // Fallback por defecto si no especifica ninguna pero tiene canal
    if (targetPlats.length === 0) {
      const channel = (item.channel || '').toLowerCase();
      if (channel.includes('fb') || channel.includes('facebook')) targetPlats.push('facebook');
      if (channel.includes('ig') || channel.includes('instagram')) targetPlats.push('instagram');
      if (channel.includes('li') || channel.includes('linkedin')) targetPlats.push('linkedin');
      if (channel.includes('tk') || channel.includes('tiktok')) targetPlats.push('tiktok');
    }

    if (targetPlats.length === 0) {
      targetPlats.push('instagram'); // Default
    }

    // Ejecutar publicaciones
    const results = {};
    for (const plat of targetPlats) {
      if (plat === 'facebook' || plat === 'instagram') {
        const res = await publishPostToMeta(clientId, item.copy, mediaUrl, plat, token);
        Object.assign(results, res);
      } else if (plat === 'linkedin') {
        const res = await publishToLinkedIn(clientId, item.copy, mediaUrl, token);
        results.linkedin = res;
      } else if (plat === 'tiktok') {
        const res = await publishToTikTok(clientId, item.copy, mediaUrl, token);
        results.tiktok = res;
      }
    }

    // Verificar si al menos una publicación fue exitosa
    const hasSuccess = Object.values(results).some(r => r.success);
    const errorsList = Object.entries(results)
      .filter(([_, r]) => !r.success)
      .map(([p, r]) => `${p}: ${r.error}`);

    if (!hasSuccess) {
      return res.status(500).json({
        success: false,
        message: `No se pudo publicar: ${errorsList.join('; ')}`,
        details: results
      });
    }

    // 4. Si fue exitoso, actualizar el estado de la publicación a "Publicado"
    await updateScheduleItem(itemId, clientId, { status: 'Publicado' }, token, req.user?.id);

    res.status(200).json({
      success: true,
      message: errorsList.length > 0
        ? `Publicado parcialmente. Errores: ${errorsList.join(', ')}`
        : '¡Publicación realizada con éxito en redes sociales!',
      data: results
    });
  } catch (error) {
    next(error);
  }
};
