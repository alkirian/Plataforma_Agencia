import axios from 'axios';
import { generateImageWithAI } from './ai.service.js';

const FAL_KEY = process.env.FAL_KEY || '';

/**
 * Servicio de diseño para comunicarse con APIs de generación de imágenes (fal.ai / Replicate)
 * y manejar fallbacks inteligentes (Gemini Imagen 3 o simulación premium según el ADN del cliente).
 */

// Banco de imágenes premium de stock simuladas según industria del cliente para demostración ultra-realista
const SIMULATED_STOCK_IMAGES = {
  cosmetics: [
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop'
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop'
  ],
  tech: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
  ],
  coffee: [
    'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=1200&auto=format&fit=crop'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop', // Abstract premium 3D
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop', // Luxury interior
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1200&auto=format&fit=crop'  // Studio lighting concept
  ]
};

// Banco de extrapolaciones de formato simuladas (expandidas) correspondientes a las imágenes anteriores
const SIMULATED_OUTPAINT_MAP = {
  // Cosmetics
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=1600&auto=format&fit=crop'
  },
  'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop'
  },
  // Default/Abstract premium matching styles
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1618005198143-d366800e48de?q=80&w=1600&auto=format&fit=crop'
  }
};

/**
 * Transforma una foto de celular ordinaria a una de stock publicitario premium
 * @param {Object} params 
 * @param {string} params.imageUrl URL o base64 de la imagen original
 * @param {string} params.prompt Descripción creativa de la escena/fondo
 * @param {string} params.aspectRatio Relación de aspecto deseada ('1:1', '9:16', '16:9')
 * @param {Object} params.clientContext Objeto del cliente (nombre, industria, colores)
 * @returns {Promise<Object>} Datos de la imagen generada
 */
export const transformProductPhoto = async ({ imageUrl, prompt, aspectRatio = '1:1', clientContext = {} }) => {
  console.log(`🤖 transformProductPhoto - Ejecutando para cliente ${clientContext.name || 'Desconocido'}`);

  // 1. SI FAL_KEY ESTÁ DISPONIBLE, USAR LA API DE FAL.AI
  if (FAL_KEY) {
    try {
      console.log('📡 Conectando a la API de Fal.ai (Flux Dev Image-to-Image)...');
      
      // Estructuramos el prompt agregando coherencia de producto y calidad premium
      const enhancedPrompt = `Commercial product photography of ${clientContext.name || 'the product'} in a stunning stock-photo setting. ${prompt}. 2k 4k resolution, hyper-detailed, studio lighting, highly creative, sharp focus, professional branding.`;
      
      // Llamada a fal.ai usando Flux Dev Image-to-Image o similar
      const response = await axios.post(
        'https://queue.fal.run/fal-ai/flux/dev/image-to-image',
        {
          image_url: imageUrl,
          prompt: enhancedPrompt,
          strength: 0.65, // Fuerza balanceada para preservar el producto pero cambiar/mejorar el entorno
          num_inference_steps: 30,
          guidance_scale: 7.5,
          sync_mode: true
        },
        {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const generatedImageUrl = response.data?.images?.[0]?.url;
      if (generatedImageUrl) {
        console.log('✅ Imagen generada exitosamente con Fal.ai:', generatedImageUrl);
        return {
          url: generatedImageUrl,
          mode: 'fal-ai',
          prompt: enhancedPrompt,
          aspectRatio
        };
      }
    } catch (apiError) {
      console.error('⚠️ Error en API de Fal.ai. Intentando fallback...', apiError.message);
    }
  }

  // 2. FALLBACK 1: INTENTAR CON GEMINI IMAGEN 3 SI ESTÁ LA KEY CONFIGURADA
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('📡 Fal.ai no disponible. Ejecutando fallback con Gemini Imagen 3...');
      const fallbackPrompt = `Advertising stock photo for ${clientContext.name || 'product'}. ${prompt}. High quality, studio lighting, ultra-realistic 4k.`;
      
      // Llamamos a la función existente que maneja la API de Imagen 3
      const geminiResult = await generateImageWithAI({
        prompt: fallbackPrompt,
        aspectRatio
      });

      if (geminiResult && geminiResult.base64) {
        console.log('✅ Imagen generada exitosamente con Gemini Imagen 3 Fallback.');
        return {
          base64: geminiResult.base64,
          mimeType: geminiResult.mimeType || 'image/png',
          mode: 'gemini-imagen',
          prompt: fallbackPrompt,
          aspectRatio
        };
      }
    } catch (geminiError) {
      console.error('⚠️ Error en Gemini Imagen Fallback. Procediendo a simulación premium...', geminiError.message);
    }
  }

  // 3. FALLBACK 2: SIMULACIÓN PREMIUM SEGÚN EL ADN Y LA INDUSTRIA DEL CLIENTE
  console.log('🎨 Ejecutando simulación de diseño premium contextual...');
  
  // Normalizar industria
  const ind = (clientContext.industry || '').toLowerCase();
  let industryKey = 'default';
  
  if (ind.includes('cosmet') || ind.includes('belleza') || ind.includes('esteti') || ind.includes('beauty')) {
    industryKey = 'cosmetics';
  } else if (ind.includes('comida') || ind.includes('restauran') || ind.includes('gastrono') || ind.includes('food') || ind.includes('cater')) {
    industryKey = 'food';
  } else if (ind.includes('tec') || ind.includes('software') || ind.includes('celular') || ind.includes('computa') || ind.includes('tech')) {
    industryKey = 'tech';
  } else if (ind.includes('cafe') || ind.includes('coffe') || ind.includes('barista') || ind.includes('desayun')) {
    industryKey = 'coffee';
  } else if (ind.includes('moda') || ind.includes('ropa') || ind.includes('vestir') || ind.includes('fashion') || ind.includes('textil')) {
    industryKey = 'fashion';
  }

  const imagesList = SIMULATED_STOCK_IMAGES[industryKey];
  // Seleccionar una imagen de forma pseudo-aleatoria pero consistente basada en el prompt
  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedIndex = hash % imagesList.length;
  const simulatedUrl = imagesList[selectedIndex];

  console.log(`✅ Simulación completada para industria [${industryKey}]. Imagen seleccionada:`, simulatedUrl);
  
  return {
    url: simulatedUrl,
    mode: 'simulation',
    prompt: prompt,
    aspectRatio,
    isSimulated: true
  };
};

/**
 * Realiza la extrapolación (Outpainting / AI Expand) de una imagen a un nuevo formato
 * @param {Object} params 
 * @param {string} params.imageUrl URL de la imagen a expandir
 * @param {string} params.targetAspectRatio Relación de aspecto objetivo ('1:1', '9:16', '16:9')
 * @param {Object} params.clientContext Contexto de cliente
 * @returns {Promise<Object>} Datos de la imagen expandida
 */
export const outpaintImage = async ({ imageUrl, targetAspectRatio, clientContext = {} }) => {
  console.log(`🤖 outpaintImage - Redimensionando imagen a formato [${targetAspectRatio}]`);

  // 1. SI FAL_KEY ESTÁ DISPONIBLE, USAR LA API DE OUTPAINTING DE FAL.AI o SDXL
  if (FAL_KEY) {
    try {
      console.log(`📡 Conectando a Fal.ai Outpaint para expandir a [${targetAspectRatio}]...`);
      
      // Usar el modelo sdxl outpainting de Fal.ai
      const response = await axios.post(
        'https://queue.fal.run/fal-ai/creative-upscaler', // o el endpoint específico de outpainting sdxl
        {
          image_url: imageUrl,
          prompt: `Expand background seamlessly to ${targetAspectRatio} ratio. Commercial stock advertising design for ${clientContext.name || 'product'}. High resolution 4k.`,
          aspect_ratio: targetAspectRatio,
          sync_mode: true
        },
        {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const expandedImageUrl = response.data?.image?.url || response.data?.images?.[0]?.url;
      if (expandedImageUrl) {
        console.log('✅ Outpaint de Fal.ai completado:', expandedImageUrl);
        return {
          url: expandedImageUrl,
          mode: 'fal-ai-outpaint',
          aspectRatio: targetAspectRatio
        };
      }
    } catch (apiError) {
      console.error('⚠️ Error en API de Outpaint de Fal.ai. Intentando fallback...', apiError.message);
    }
  }

  // 2. FALLBACK: SI LA IMAGEN DE ENTRADA ES PARTE DE NUESTRO BANCO SIMULADO, TENEMOS EL OUTPAINT CORRESPONDIENTE EXACTO
  if (SIMULATED_OUTPAINT_MAP[imageUrl] && SIMULATED_OUTPAINT_MAP[imageUrl][targetAspectRatio]) {
    const simulatedOutpaintUrl = SIMULATED_OUTPAINT_MAP[imageUrl][targetAspectRatio];
    console.log(`🎨 Simulación de outpaint coincidente para formato [${targetAspectRatio}]:`, simulatedOutpaintUrl);
    return {
      url: simulatedOutpaintUrl,
      mode: 'simulation-outpaint',
      aspectRatio: targetAspectRatio,
      isSimulated: true
    };
  }

  // Si no coincide exactamente, usar una imagen de stock con la proporción correcta
  const ind = (clientContext.industry || '').toLowerCase();
  let industryKey = 'default';
  if (ind.includes('cosmet') || ind.includes('belleza') || ind.includes('beauty')) {
    industryKey = 'cosmetics';
  } else if (ind.includes('comida') || ind.includes('gastrono') || ind.includes('food')) {
    industryKey = 'food';
  } else if (ind.includes('tec') || ind.includes('software') || ind.includes('tech')) {
    industryKey = 'tech';
  }

  // Mapear URLs estáticas por formato
  const formatFallbackUrls = {
    '1:1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1618005198143-d366800e48de?q=80&w=1600&auto=format&fit=crop'
  };

  const selectedUrl = formatFallbackUrls[targetAspectRatio] || formatFallbackUrls['1:1'];
  console.log(`🎨 Simulación de outpaint genérica para formato [${targetAspectRatio}]:`, selectedUrl);

  return {
    url: selectedUrl,
    mode: 'simulation-outpaint-fallback',
    aspectRatio: targetAspectRatio,
    isSimulated: true
  };
};
