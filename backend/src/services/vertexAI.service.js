import axios from 'axios';
import sharp from 'sharp';

/**
 * Realiza la extrapolación generativa (Outpainting) de una imagen usando Google Vertex AI Imagen 3.
 * Si las credenciales de GCP no están configuradas en .env, aplica un fallback local (Relleno Inteligente)
 * para que el flujo de diseño en el frontend pueda probarse localmente sin interrupciones.
 * 
 * @param {Object} params
 * @param {string} params.baseImageBase64 Imagen original en base64
 * @param {string} params.targetAspectRatio Relación de aspecto destino ('9:16', '16:9', etc.)
 * @param {string} params.prompt Prompt de outpainting
 * @returns {Promise<Object>} Datos de la imagen generada ({ base64, mimeType, mode })
 */
export const executeVertexAIOutpaint = async ({ baseImageBase64, targetAspectRatio, prompt }) => {
  const projectId = process.env.GCP_PROJECT_ID;
  const region = process.env.GCP_REGION || 'us-central1';
  const accessToken = process.env.GCP_ACCESS_TOKEN;

  if (!projectId || !accessToken) {
    console.warn('⚠️ Credenciales de Vertex AI no configuradas (GCP_PROJECT_ID / GCP_ACCESS_TOKEN). Usando fallback local de Relleno Inteligente.');
    
    // Fallback: Redimensionar/rellenar la imagen original usando Sharp
    const cleanBase64 = baseImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const metadata = await sharp(buffer).metadata();
    
    const parts = targetAspectRatio.split(':');
    const targetW = parseFloat(parts[0]);
    const targetH = parseFloat(parts[1]);
    const targetRatio = targetW / targetH;
    
    let finalW = metadata.width || 1024;
    let finalH = Math.round(finalW / targetRatio);
    
    // Padded buffer local
    const paddedBuffer = await sharp(buffer)
      .resize(finalW, finalH, {
        fit: 'contain',
        background: { r: 24, g: 24, b: 27, alpha: 1 } // Fondo sólido oscuro por defecto para re-maquetación
      })
      .toFormat('png')
      .toBuffer();
      
    return {
      base64: paddedBuffer.toString('base64'),
      mimeType: 'image/png',
      mode: 'local-smart-padding'
    };
  }

  try {
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/imagen-3.0-capability-001:predict`;
    
    // 1. Preparar lienzo original en base64
    const cleanBase64 = baseImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(cleanBase64, 'base64');
    
    const parts = targetAspectRatio.split(':');
    const targetW = parseFloat(parts[0]);
    const targetH = parseFloat(parts[1]);
    const targetRatio = targetW / targetH;
    
    // Dimensiones estandarizadas para Imagen 3 (máximo 1024 en el lado mayor)
    let canvasW = 1024;
    let canvasH = Math.round(1024 / targetRatio);
    if (targetRatio < 1) { // Retrato (ej: 9:16)
      canvasH = 1024;
      canvasW = Math.round(1024 * targetRatio);
    }
    
    // Redimensionar y centrar imagen original sobre fondo transparente
    const resizedBase = await sharp(imgBuffer)
      .resize(canvasW, canvasH, { 
        fit: 'contain', 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .toFormat('png')
      .toBuffer();
      
    // 2. Generar máscara binaria para Outpainting (Blanco = Generar, Negro = Preservar)
    // Extraemos el canal alpha y lo invertimos: pixeles vacíos (alpha 0) se vuelven blancos (255)
    const maskBuffer = await sharp(resizedBase)
      .ensureAlpha()
      .extractChannel('alpha')
      .negate()
      .toFormat('png')
      .toBuffer();
      
    const payload = {
      instances: [
        {
          image: {
            bytesBase64Encoded: resizedBase.toString('base64')
          },
          mask: {
            bytesBase64Encoded: maskBuffer.toString('base64')
          }
        }
      ],
      parameters: {
        sampleCount: 1,
        mode: 'outpainting',
        prompt: prompt || 'Extend the background scene, seamless texture, high-fidelity details, sharp focus, matching colors, no blur'
      }
    };
    
    console.log(`📡 [Vertex AI] Invocando Imagen 3 para outpaint en ratio ${targetAspectRatio}...`);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 50000
    });
    
    const base64Output = response.data?.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Output) {
      throw new Error('La API de Vertex AI Imagen 3 no retornó la imagen generada.');
    }
    
    return {
      base64: base64Output,
      mimeType: 'image/png',
      mode: 'vertex-ai-outpaint'
    };
  } catch (error) {
    console.error('❌ Error en executeVertexAIOutpaint:', error.response?.data || error.message);
    throw error;
  }
};
