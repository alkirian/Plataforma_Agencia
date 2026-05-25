import 'dotenv/config';

/**
 * Llama a OpenAI GPT-4o-mini para obtener respuestas estructuradas en JSON de forma 100% confiable.
 */
const callOpenAIJSON = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La clave OPENAI_API_KEY no está configurada en las variables de entorno del backend.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ [OpenAI Brand] Error en la API de OpenAI:', errorData);
    throw new Error(
      errorData?.error?.message ||
      `Error al comunicarse con OpenAI (Código: ${response.status})`
    );
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || '';
};

/**
 * Scraper ligero y gratuito que consulta DuckDuckGo HTML para obtener información
 * textual sobre una empresa o marca en milisegundos.
 */
const searchWebDuckDuckGo = async (query) => {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    console.log(`📡 [Web Search] Consultando DuckDuckGo para: "${query}"...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ [Web Search] DuckDuckGo retornó status ${response.status}`);
      return '';
    }

    const html = await response.text();
    const results = [];
    
    const snippetRegex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    
    let match;
    let count = 0;
    while ((match = snippetRegex.exec(html)) !== null && count < 6) {
      const cleanText = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .trim();
      if (cleanText) {
        results.push(cleanText);
        count++;
      }
    }

    console.log(`📡 [Web Search] Se obtuvieron ${results.length} fragmentos de información.`);
    return results.join('\n\n');
  } catch (error) {
    console.error('❌ [Web Search] Error al escrapear DuckDuckGo:', error);
    return '';
  }
};

/**
 * Busca información pública de una empresa en internet usando DuckDuckGo
 * y estructura su perfil de identidad de marca usando OpenAI GPT-4o-mini.
 * @param {string} companyName - El nombre de la empresa a buscar.
 * @returns {Promise<object>} Objeto JSON con el perfil estructurado.
 */
export const searchAndExtractCompanyBrand = async (companyName) => {
  // 1. Obtener la información pública de la empresa en internet
  const scrapedInfo = await searchWebDuckDuckGo(companyName);

  // 2. Enviar a OpenAI para estructurar los datos recopilados
  const systemPrompt = `Eres un estratega de marca senior y analista de marketing digital.
Tu trabajo es analizar la información pública sobre una empresa y estructurar una identidad de marca coherente.
Debes devolver estrictamente un objeto JSON válido. No incluyas preámbulos ni markdown fuera del JSON.`;

  const userPrompt = `Analiza la siguiente información de búsqueda recopilada sobre la empresa/marca llamada "${companyName}" y estructura su identidad de marca.

INFORMACIÓN RECOPILADA EN LA WEB:
"""
${scrapedInfo || 'No se encontró información web directa. Por favor infiere los datos en base a su nombre.'}
"""

Completa estrictamente esta estructura JSON con datos profesionales y coherentes:
{
  "business_description": "Resumen conciso y muy profesional del negocio y su propuesta de valor única en base a la información web.",
  "target_audience": "Público objetivo ideal (quiénes son, intereses, etc.).",
  "brand_voice": "Tono de voz de la marca (ej: cercano, profesional, inspirador, amigable).",
  "content_pillars": ["Pilar 1", "Pilar 2", "Pilar 3"],
  "content_goals": ["Objetivo 1", "Objetivo 2"],
  "products_services": ["Producto/Servicio 1", "Producto/Servicio 2"],
  "preferred_platforms": ["Instagram", "Facebook", "LinkedIn", "TikTok"],
  "preferred_formats": ["Reels", "Carruseles", "Historias", "Post estáticos"],
  "avoid_topics": ["Tema a evitar 1", "Tema a evitar 2"],
  "reference_style": "Estilo visual o estético recomendado o sugerido para su nicho de mercado."
}`;

  console.log(`🤖 [Brand Search] Estructurando identidad de "${companyName}" con OpenAI GPT-4o-mini...`);

  const jsonText = await callOpenAIJSON(systemPrompt, userPrompt);

  try {
    const parsedData = JSON.parse(jsonText);
    console.log(`✅ [Brand Search] Identidad de "${companyName}" estructurada y parseada correctamente.`);
    return parsedData;
  } catch (parseError) {
    console.error('❌ [Brand Search] Error al parsear JSON:', jsonText);
    throw new Error('La respuesta de OpenAI no pudo ser interpretada como un perfil de marca válido.');
  }
};

/**
 * Utiliza OpenAI GPT-4o-mini para extraer y estructurar el perfil de identidad de marca del cliente
 * a partir de un fragmento de texto o del contenido de un brief.
 * @param {string} rawText - Texto libre o extraído de un documento de brief.
 * @returns {Promise<object>} Objeto JSON con el perfil estructurado según el esquema de la base de datos.
 */
export const extractBrandProfileFromContext = async (rawText) => {
  const systemPrompt = `Eres un estratega de marca senior y analista de marketing digital.
Tu trabajo es analizar la descripción informal de un negocio, brief, notas o sitio web de un cliente, y extraer una identidad de marca estructurada para alimentar un motor de IA que planifica contenido.

Reglas obligatorias:
1. Analiza cuidadosamente la información provista y extrae la información requerida.
2. Si un campo no puede ser inferido a partir del texto provisto, déjalo vacío (cadena vacía "" o array vacío []). No inventes claims médicos, de rendimiento o legales.
3. Devuelve estrictamente un objeto JSON que cumpla con la estructura detallada a continuación.
4. No incluyas explicaciones de texto, preámbulos o formato markdown adicional en tu respuesta.`;

  const userPrompt = `Analiza el siguiente texto de referencia del cliente y extrae su perfil de marca:

TEXTO DE REFERENCIA DEL CLIENTE:
"""
${rawText}
"""

ESTRUCTURA JSON REQUERIDA:
{
  "business_description": "Resumen conciso y profesional del negocio y su propuesta de valor única.",
  "target_audience": "Definición del público objetivo, demografía e intereses principales.",
  "brand_voice": "Tono de comunicación y personalidad de la marca (ej: cálido, profesional, rebelde, etc.).",
  "content_pillars": ["Pilar 1", "Pilar 2", "Pilar 3"],
  "content_goals": ["Objetivo 1", "Objetivo 2"],
  "products_services": ["Producto 1", "Servicio 2"],
  "preferred_platforms": ["Instagram", "TikTok"],
  "preferred_formats": ["Reel", "Carrusel", "Post estático"],
  "avoid_topics": ["Tema a evitar 1"],
  "reference_style": "Descripción resumida del estilo visual, referencias gráficas o estéticas de la marca si se mencionan."
}`;

  console.log('🤖 [OpenAI Brand Extraction] Iniciando análisis del brief con GPT-4o-mini...');

  const jsonText = await callOpenAIJSON(systemPrompt, userPrompt);

  try {
    const parsedData = JSON.parse(jsonText);
    console.log('✅ [OpenAI Brand Extraction] Perfil de marca extraído y estructurado correctamente.');
    return parsedData;
  } catch (parseError) {
    console.error('❌ [OpenAI Brand Extraction] Error al parsear el JSON retornado por OpenAI:', jsonText);
    throw new Error('La respuesta de la IA no pudo ser interpretada como un perfil de marca válido.');
  }
};

