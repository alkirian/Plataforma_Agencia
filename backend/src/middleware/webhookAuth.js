import crypto from 'crypto';

/**
 * Middleware para validar que las peticiones POST a los webhooks de Meta
 * provengan legítimamente de los servidores de Facebook/Instagram.
 * Utiliza firma HMAC con algoritmo SHA256 y la clave de la aplicación (App Secret).
 */
export const verifyMetaSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.META_APP_SECRET;

  // En desarrollo local, si no se ha configurado la clave de la app, permitimos bypass con advertencia
  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ERROR CRÍTICO: META_APP_SECRET no está configurada en producción.');
      return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
    console.warn('⚠️ [Meta Webhooks] Advertencia: META_APP_SECRET no configurada en desarrollo. Omitiendo validación de firma.');
    return next();
  }

  if (!signature) {
    console.warn('⚠️ [Meta Webhooks] Intento de acceso sin firma x-hub-signature-256.');
    return res.status(401).json({ success: false, message: 'Firma de webhook requerida.' });
  }

  const parts = signature.split('=');
  const algorithm = parts[0];
  const signatureHash = parts[1];

  if (algorithm !== 'sha256' || !signatureHash) {
    console.warn('⚠️ [Meta Webhooks] Algoritmo de firma no soportado o malformado.');
    return res.status(400).json({ success: false, message: 'Firma de webhook inválida.' });
  }

  // Calcular HMAC-SHA256 del cuerpo crudo
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody || '')
    .digest('hex');

  // Comparación en tiempo constante para evitar ataques de temporización (timing attacks)
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(signatureHash, 'utf8'),
    Buffer.from(expectedHash, 'utf8')
  );

  if (isMatch) {
    return next();
  } else {
    console.warn('⚠️ [Meta Webhooks] Firma de webhook de Meta inválida o incorrecta.');
    return res.status(403).json({ success: false, message: 'Firma de webhook inválida.' });
  }
};
