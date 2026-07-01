// src/services/metaCapi.service.js
import crypto from 'crypto';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Supabase client creation helper using service role/anonymous key from env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Hashea una cadena utilizando SHA-256 (requerido por Meta para datos personales).
 */
const hashValue = (value) => {
  if (!value) return null;
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
};

/**
 * Envía un evento de conversión del lado del servidor a la API de Conversiones de Meta (CAPI).
 * 
 * @param {string} clientId ID del cliente en Cadence.
 * @param {string} eventName Nombre del evento (ej: 'Lead', 'Purchase').
 * @param {Object} userData Datos de coincidencia del usuario (email, phone, ipAddress, userAgent).
 * @param {Object} customData Datos personalizados adicionales (currency, value, eventSourceUrl).
 */
export const sendConversionEvent = async (clientId, eventName, userData = {}, customData = {}) => {
  try {
    // 1. Obtener la integración de Meta del cliente para sacar el Pixel ID y el CAPI Token
    const { data: integration, error } = await supabase
      .from('client_meta_integrations')
      .select('meta_pixel_id, meta_capi_token')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al leer integración de Meta: ${error.message}`);
    }

    if (!integration || !integration.meta_pixel_id || !integration.meta_capi_token) {
      console.log(`⚠️ [CAPI] Cliente ${clientId} no tiene configurado Pixel ID o CAPI Token. Se omite el evento.`);
      return { success: false, reason: 'unconfigured' };
    }

    const { meta_pixel_id: pixelId, meta_capi_token: capiToken } = integration;

    // Simulación en Sandbox / Entorno de desarrollo local
    if (capiToken === 'mock_token' || pixelId === 'mock_pixel') {
      console.log(`📊 [CAPI - SIMULADO] Evento '${eventName}' recibido en Sandbox para el cliente ${clientId}.`);
      return { success: true, isMock: true };
    }

    // 2. Preparar el Payload para Meta CAPI
    const userPayload = {};
    if (userData.email) userPayload.em = [hashValue(userData.email)];
    if (userData.phone) userPayload.ph = [hashValue(userData.phone)];
    if (userData.ipAddress) userPayload.client_ip_address = userData.ipAddress;
    if (userData.userAgent) userPayload.client_user_agent = userData.userAgent;

    const eventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: userPayload
    };

    if (Object.keys(customData).length > 0) {
      eventPayload.custom_data = customData;
    }

    const url = `https://graph.facebook.com/v25.0/${pixelId}/events`;

    console.log(`📤 [CAPI] Enviando evento '${eventName}' a Meta para el cliente ${clientId}...`);
    
    const response = await axios.post(url, {
      data: [eventPayload]
    }, {
      params: { access_token: capiToken }
    });

    console.log(`✅ [CAPI] Evento '${eventName}' enviado con éxito. Meta Response ID:`, response.data.fbtrace_id);
    return { success: true, traceId: response.data.fbtrace_id };

  } catch (err) {
    console.error(`❌ [CAPI] Error al enviar evento de conversión a Meta:`, err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};
