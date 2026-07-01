import { generateImageWithAI } from './ai.service.js';

/**
 * Transforma una foto de producto o genera una variante de diseño utilizando exclusivamente Google Gemini Imagen.
 * Se eliminaron todas las dependencias de Fal.ai / Flux.
 * 
 * @param {Object} params 
 * @param {string} params.imageUrl URL o base64 de la imagen original (se ignora para la generación directa en Gemini)
 * @param {string} params.bgImageUrl URL de la imagen de fondo de referencia (se ignora)
 * @param {string} params.subjectImageUrl URL de la imagen del modelo de referencia (se ignora)
 * @param {string} params.prompt Descripción creativa de la escena/fondo
 * @param {string} params.aspectRatio Relación de aspecto deseada ('1:1', '9:16', '16:9', etc.)
 * @param {Object} params.clientContext Objeto del cliente (nombre, industria, brandInfo)
 * @returns {Promise<Object>} Datos de la imagen generada
 */
export const transformProductPhoto = async ({ imageUrl, bgImageUrl, subjectImageUrl, prompt, aspectRatio = '1:1', clientContext = {} }) => {
  console.log(`🤖 [Gemini Imagen] Ejecutando transformProductPhoto para cliente ${clientContext.name || 'Desconocido'}`);

  // Construir prompt enriquecido con la información de marca e industria del cliente para mejor alineación
  const industryText = clientContext.industry ? `for the ${clientContext.industry} industry` : '';
  const brandDetails = clientContext.brandInfo ? `, matching brand details: ${clientContext.brandInfo}` : '';
  
  const finalPrompt = `Professional commercial advertising studio photography for "${clientContext.name}" ${industryText}${brandDetails}. ${prompt}. High quality, studio lighting, modern composition, clean aesthetic.`;

  console.log(`📡 Enviando prompt enriquecido a Gemini Imagen: "${finalPrompt}"`);

  // Llamar directamente a la función de generación con Gemini
  const geminiResult = await generateImageWithAI({
    prompt: finalPrompt,
    aspectRatio
  });

  if (geminiResult && geminiResult.base64) {
    console.log('✅ Imagen generada exitosamente con Gemini Imagen.');
    return {
      base64: geminiResult.base64,
      mimeType: geminiResult.mimeType || 'image/png',
      mode: 'gemini-imagen',
      prompt: finalPrompt,
      aspectRatio
    };
  }

  throw new Error('Google Gemini Imagen no pudo generar la imagen.');
};

/**
 * Servicio de extrapolación (Outpainting).
 * Dado que Fal.ai ha sido desactivado, esta función ahora arroja un error controlado
 * para que el controlador aplique Smart Padding (Relleno Inteligente) local de manera gratuita.
 */
export const outpaintImage = async ({ imageUrl, targetAspectRatio, clientContext = {} }) => {
  console.log(`🤖 outpaintImage - Intento de extrapolar imagen a formato [${targetAspectRatio}]`);
  throw new Error('El servicio de extrapolación por IA (Outpaint) requiere las APIs de Fal.ai/Flux, las cuales han sido desactivadas en la plataforma.');
};
