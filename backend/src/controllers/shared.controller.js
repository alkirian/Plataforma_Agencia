import { supabaseAdmin } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/v1/shared/approval/:token
 * Obtiene el estado del cronograma de un cliente usando el token público.
 */
export const handleGetSharedApprovalDetails = async (req, res, next) => {
  try {
    const { token } = req.params;

    // 1. Validar el token y ver si está activo
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('client_approval_links')
      .select('*')
      .eq('id', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkErr || !link) {
      return res.status(404).json({
        success: false,
        message: 'Enlace de aprobación vencido, inactivo o inexistente.',
      });
    }

    // 2. Obtener información del cliente
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, name, industry, agency_id')
      .eq('id', link.client_id)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    // 3. Obtener información de la agencia
    const { data: agency, error: agencyErr } = await supabaseAdmin
      .from('agencies')
      .select('name')
      .eq('id', link.agency_id)
      .single();

    if (agencyErr || !agency) {
      return res.status(404).json({ success: false, message: 'Agencia no encontrada.' });
    }

    // 4. Obtener posts programados elegibles para aprobación
    // Mostramos Pendiente, En Diseño, En Progreso, Aprobado
    const { data: posts, error: postsErr } = await supabaseAdmin
      .from('schedule_items')
      .select('*')
      .eq('client_id', link.client_id)
      .in('status', ['Pendiente', 'En Diseño', 'En Progreso', 'Aprobado'])
      .order('scheduled_at', { ascending: true });

    if (postsErr) throw postsErr;

    // 5. Obtener assets de contenido para enriquecer los posts con imágenes/videos firmados
    const { data: assets, error: assetsErr } = await supabaseAdmin
      .from('content_assets')
      .select('*')
      .eq('client_id', link.client_id);

    if (assetsErr) {
      logger.error?.('[shared-approval] Error fetching content assets:', assetsErr.message);
    }

    // 6. Firmar URLs de forma masiva para el cliente externo (firmas válidas por 7 días)
    const enrichedAssets = [];
    if (assets && assets.length > 0) {
      for (const asset of assets) {
        try {
          const { data: signedData, error: signErr } = await supabaseAdmin.storage
            .from('content-assets')
            .createSignedUrl(asset.storage_path, 60 * 60 * 24 * 7); // 7 días

          if (!signErr && signedData?.signedUrl) {
            enrichedAssets.push({
              ...asset,
              preview_url: signedData.signedUrl,
            });
          } else {
            enrichedAssets.push({ ...asset, preview_url: null });
          }
        } catch (err) {
          enrichedAssets.push({ ...asset, preview_url: null });
        }
      }
    }

    // 7. Mapear assets a sus respectivos posts
    const enrichedPosts = (posts || []).map(post => {
      const postAssets = enrichedAssets.filter(a => a.schedule_item_id === post.id);
      return {
        ...post,
        assets: postAssets,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        client,
        agency,
        items: enrichedPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/shared/approval/:token/items/:itemId/approve
 * Aprueba un post específico en el calendario.
 */
export const handleSharedApprovePost = async (req, res, next) => {
  try {
    const { token, itemId } = req.params;

    // 1. Validar enlace
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('client_approval_links')
      .select('*')
      .eq('id', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkErr || !link) {
      return res.status(403).json({ success: false, message: 'Enlace de aprobación inactivo.' });
    }

    // 2. Actualizar estado del post en Supabase
    const { data: post, error: postErr } = await supabaseAdmin
      .from('schedule_items')
      .update({
        status: 'Aprobado',
        client_feedback: '', // limpiar feedback anterior al aprobar
      })
      .eq('id', itemId)
      .eq('client_id', link.client_id)
      .select('*')
      .single();

    if (postErr || !post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado o no pertenece al cliente.' });
    }

    // 3. Registrar log de actividad
    await supabaseAdmin.from('activity_logs').insert({
      agency_id: link.agency_id,
      client_id: link.client_id,
      user_id: link.created_by || '00000000-0000-0000-0000-000000000000', // anónimo o sistema
      action_type: 'post_approved_by_client',
      details: {
        post_id: post.id,
        post_title: post.title,
        approved_via_link: token,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Post aprobado con éxito.',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/shared/approval/:token/items/:itemId/feedback
 * Rechaza o deja feedback en un post para solicitar ajustes.
 */
export const handleSharedFeedbackPost = async (req, res, next) => {
  try {
    const { token, itemId } = req.params;
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, message: 'El feedback de ajuste es requerido.' });
    }

    // 1. Validar enlace
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('client_approval_links')
      .select('*')
      .eq('id', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkErr || !link) {
      return res.status(403).json({ success: false, message: 'Enlace de aprobación inactivo.' });
    }

    // 2. Actualizar estado y feedback del post
    const { data: post, error: postErr } = await supabaseAdmin
      .from('schedule_items')
      .update({
        status: 'En Diseño', // cambiar a En Diseño/Pendiente para ajustes
        client_feedback: feedback.trim(),
      })
      .eq('id', itemId)
      .eq('client_id', link.client_id)
      .select('*')
      .single();

    if (postErr || !post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado.' });
    }

    // 3. Registrar log de actividad
    await supabaseAdmin.from('activity_logs').insert({
      agency_id: link.agency_id,
      client_id: link.client_id,
      user_id: link.created_by || '00000000-0000-0000-0000-000000000000',
      action_type: 'post_rejected_by_client',
      details: {
        post_id: post.id,
        post_title: post.title,
        feedback: feedback.trim(),
        rejected_via_link: token,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Ajuste solicitado con éxito.',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/shared/approval/:token/items/:itemId/revert
 * Revierte la aprobación de un post, volviendo su estado a 'En Diseño' y limpiando el feedback.
 */
export const handleSharedRevertPost = async (req, res, next) => {
  try {
    const { token, itemId } = req.params;

    // 1. Validar enlace
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('client_approval_links')
      .select('*')
      .eq('id', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkErr || !link) {
      return res.status(403).json({ success: false, message: 'Enlace de aprobación inactivo o inexistente.' });
    }

    // 2. Actualizar estado del post en Supabase a 'En Diseño' y limpiar feedback
    const { data: post, error: postErr } = await supabaseAdmin
      .from('schedule_items')
      .update({
        status: 'En Diseño',
        client_feedback: '',
      })
      .eq('id', itemId)
      .eq('client_id', link.client_id)
      .select('*')
      .single();

    if (postErr || !post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado o no pertenece al cliente.' });
    }

    // 3. Registrar log de actividad
    await supabaseAdmin.from('activity_logs').insert({
      agency_id: link.agency_id,
      client_id: link.client_id,
      user_id: link.created_by || '00000000-0000-0000-0000-000000000000',
      action_type: 'post_reverted_by_client',
      details: {
        post_id: post.id,
        post_title: post.title,
        reverted_via_link: token,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Aprobación revertida con éxito.',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

