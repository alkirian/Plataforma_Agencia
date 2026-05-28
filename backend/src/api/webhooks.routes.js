// src/api/webhooks.routes.js
import { Router } from 'express';
import { verifyMetaSignature } from '../middleware/webhookAuth.js';
import { handleMetaWebhookEvent } from '../services/metaAds.service.js';

const router = Router();

/**
 * Endpoint de verificación de Meta (Handshake GET).
 * Requerido por Meta Developers para activar el Webhook.
 */
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Token secreto de verificación configurado en el servidor
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'cadence_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ [Meta Webhooks] Handshake verificado con éxito.');
    return res.status(200).send(challenge);
  } else {
    console.warn('⚠️ [Meta Webhooks] Intento de verificación fallido o token incorrecto.');
    return res.sendStatus(403);
  }
});

/**
 * Endpoint de recepción de eventos de Meta (POST).
 * Recibe eventos de comentarios, menciones y mensajes en tiempo real.
 * Protegido criptográficamente mediante verifyMetaSignature.
 */
router.post('/meta', verifyMetaSignature, (req, res) => {
  const body = req.body;

  // Verificar que el objeto sea una página (Facebook/Instagram comments)
  if (body.object === 'page') {
    console.log('📡 [Meta Webhooks] Evento recibido en vivo:', JSON.stringify(body, null, 2));
    
    // Procesar asíncronamente la pre-generación de respuestas
    handleMetaWebhookEvent(body).catch(err => {
      console.error('❌ Error al manejar evento de webhook:', err.message);
    });
    
    return res.status(200).send('EVENT_RECEIVED');
  } else {
    return res.sendStatus(404);
  }
});

export default router;
