import os from 'os';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { sendConversionEvent } from '../services/metaCapi.service.js';
import * as metaAdsService from '../services/metaAds.service.js';

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

    // 4. Enviar evento de conversión a Meta CAPI (Server-Side) de forma asíncrona
    sendConversionEvent(link.client_id, 'Lead', {
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Cadence-Approval-Portal'
    }, {
      eventSourceUrl: `${req.protocol}://${req.get('host')}/shared/approval/${token}`,
      postId: post.id,
      postTitle: post.title
    }).catch(err => {
      logger.error?.('[CAPI-Approval] Error sending CAPI event:', err.message);
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

/**
 * GET /api/v1/shared/meta-mobile/login
 * Sirve la página HTML del login móvil de Facebook directamente desde el backend.
 * Esto evita el problema de que el SDK de Facebook no permite IPs locales como dominio
 * a menos que estén registradas en la app de Meta. Al servirse desde el backend que
 * sí tiene el dominio registrado (o en desarrollo desde el host configurado), el flujo funciona.
 */
export const handleMobileLoginPage = async (req, res, next) => {
  try {
    const { clientId, state, appId } = req.query;

    // La URL base de la API es la misma del backend que está respondiendo
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiBaseUrl = `${protocol}://${host}/api/v1`;

    // Validación básica
    if (!clientId || !state || !appId) {
      return res.status(400).send('<html><body style="background:#0b0b14;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p>Parámetros incompletos. Genera un nuevo código QR.</p></body></html>');
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadence - Conectar Meta Ads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0b14;
      color: #f3f4f6;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: linear-gradient(135deg, #16162a 0%, #0f0f1e 100%);
      border: 1px solid rgba(168, 85, 247, 0.25);
      border-radius: 24px;
      padding: 32px 24px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 50px rgba(168,85,247,0.1);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 60%);
      pointer-events: none;
    }
    .logo {
      width: 64px; height: 64px;
      background: rgba(168,85,247,0.1);
      border: 1.5px solid #a855f7;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px auto;
      box-shadow: 0 0 20px rgba(168,85,247,0.3);
    }
    .logo svg { width: 32px; height: 32px; fill: #a855f7; }
    h1 {
      font-size: 20px; font-weight: 800; margin-bottom: 10px;
      background: linear-gradient(to right, #ffffff, #c084fc);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      letter-spacing: -0.02em;
    }
    p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-bottom: 28px; }
    .fb-btn {
      background-color: #1877f2; color: white;
      border: none; border-radius: 12px;
      padding: 14px 20px; font-size: 15px; font-weight: bold;
      width: 100%; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(24,119,242,0.4);
    }
    .fb-btn:active { transform: scale(0.97); background-color: #166fe5; }
    .fb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner {
      width: 22px; height: 22px;
      border: 3px solid rgba(255,255,255,0.3);
      border-left-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status-msg {
      margin-top: 20px; padding: 12px 16px;
      border-radius: 12px; font-size: 12px; line-height: 1.5;
      display: none;
    }
    .status-msg.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }
    .status-msg.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
    .info-box {
      margin-top: 20px; padding: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      font-size: 11px; color: #6b7280; text-align: left; line-height: 1.4;
    }
    #fb-root { display: none; }
  </style>
</head>
<body>
  <div id="fb-root"></div>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    </div>
    <h1>Conectar Meta Ads</h1>
    <p>Iniciá sesión en Facebook desde este dispositivo para vincular tu cuenta publicitaria con Cadence.</p>

    <button id="connectBtn" class="fb-btn">
      <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      <span id="btnText">Conectar con Facebook</span>
      <div id="btnSpinner" class="spinner" style="display:none;"></div>
    </button>

    <div id="statusMsg" class="status-msg"></div>

    <div class="info-box">
      🔒 <strong>Seguridad Garantizada:</strong> Cadence nunca accede a tus credenciales. La conexión se realiza directamente con los servidores de Facebook mediante su SDK oficial.
    </div>
  </div>

  <script>
    const clientId  = ${JSON.stringify(clientId)};
    const state     = ${JSON.stringify(state)};
    const appId     = ${JSON.stringify(appId)};
    const apiBaseUrl = ${JSON.stringify(apiBaseUrl)};

    const connectBtn = document.getElementById('connectBtn');
    const btnText    = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const statusMsg  = document.getElementById('statusMsg');

    function showStatus(msg, type) {
      statusMsg.textContent = msg;
      statusMsg.className = 'status-msg ' + (type || 'error');
      statusMsg.style.display = 'block';
    }
    function setLoading(loading) {
      connectBtn.disabled = loading;
      btnText.style.display = loading ? 'none' : 'inline';
      btnSpinner.style.display = loading ? 'block' : 'none';
    }

    window.fbAsyncInit = function() {
      FB.init({ appId: appId, cookie: true, xfbml: false, version: 'v21.0' });
    };
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/es_LA/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    connectBtn.addEventListener('click', function() {
      if (!window.FB) {
        showStatus('El SDK de Facebook aún no cargó. Espera unos segundos y vuelve a intentarlo.');
        return;
      }
      const scope = 'ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_comments,pages_manage_posts,instagram_content_publish,pages_manage_engagement';

      FB.login(function(response) {
        if (response.authResponse && response.authResponse.accessToken) {
          setLoading(true);
          fetch(apiBaseUrl + '/shared/meta-mobile/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: clientId, state: state, shortLivedToken: response.authResponse.accessToken })
          })
          .then(function(r) { return r.json(); })
          .then(function(result) {
            setLoading(false);
            if (result.success) {
              showStatus('✓ ¡Vinculación exitosa! Vuelve a tu computadora para seleccionar la cuenta publicitaria. Esta pantalla se cerrará en 5 segundos.', 'success');
              connectBtn.style.display = 'none';
              setTimeout(function() { window.close(); }, 5000);
            } else {
              showStatus(result.message || 'Error al registrar la vinculación. Intenta de nuevo.');
            }
          })
          .catch(function() {
            setLoading(false);
            showStatus('Error de red. Asegúrate de estar en la misma red WiFi que tu computadora.');
          });
        } else if (response.status === 'not_authorized') {
          showStatus('No autorizaste el acceso. Intenta de nuevo.');
        } else {
          showStatus('No se completó el inicio de sesión en Facebook. Intenta de nuevo.');
        }
      }, { scope: scope, return_scopes: true });
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

// Almacenamiento temporal para sesiones de login QR
const mobileMetaSessions = new Map();

/**
 * GET /api/v1/shared/meta-mobile/ip
 * Devuelve la IP local del servidor de desarrollo para generar el QR.
 */
export const handleGetLocalIp = async (req, res, next) => {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && !alias.internal) {
          localIp = alias.address;
          break;
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        localIp
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/shared/meta-mobile/callback
 * Recibe las credenciales desde el dispositivo móvil y las asocia con el state (nonce).
 */
export const handleMobileCallback = async (req, res, next) => {
  try {
    const { clientId, state, shortLivedToken } = req.body;

    if (!clientId || !state || !shortLivedToken) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos (clientId, state, shortLivedToken).'
      });
    }

    logger.info?.(`📲 Recibido token móvil de Meta para cliente ${clientId} con state ${state}`);

    // Intercambiar shortLivedToken por longLivedToken usando metaAdsService
    const longLivedToken = await metaAdsService.exchangeShortLivedToken(shortLivedToken);
    
    // Obtener las cuentas publicitarias y páginas asociadas
    const accounts = await metaAdsService.getUserAdAccounts(longLivedToken);
    const pages = await metaAdsService.getUserPagesAndInstagramAccounts(longLivedToken);

    // Guardar en el Map de sesiones
    mobileMetaSessions.set(state, {
      accessToken: longLivedToken,
      accounts,
      pages,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      message: 'Autorización procesada correctamente en el backend. Ya puedes regresar a tu pantalla principal.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/shared/meta-mobile/status
 * Consulta si el dispositivo móvil ya completó la autorización para un state (nonce) dado.
 */
export const handleGetMobileStatus = async (req, res, next) => {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro state (nonce) es requerido.'
      });
    }

    const sessionData = mobileMetaSessions.get(state);

    if (!sessionData) {
      return res.status(200).json({
        success: true,
        connected: false,
        message: 'Esperando autorización del celular...'
      });
    }

    // Si pasaron más de 10 minutos, expirar la sesión por seguridad
    if (Date.now() - sessionData.timestamp > 10 * 60 * 1000) {
      mobileMetaSessions.delete(state);
      return res.status(400).json({
        success: false,
        message: 'La sesión QR ha expirado. Por favor, genera un nuevo código QR.'
      });
    }

    // Devolver las credenciales y remover la sesión para que no se pueda volver a leer
    mobileMetaSessions.delete(state);

    return res.status(200).json({
      success: true,
      connected: true,
      data: {
        accessToken: sessionData.accessToken,
        accounts: sessionData.accounts,
        pages: sessionData.pages
      }
    });
  } catch (error) {
    next(error);
  }
};

