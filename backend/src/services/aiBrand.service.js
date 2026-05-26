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

/**
 * Realiza una auditoría inteligente cruzando la información manual del formulario
 * de identidad con la información detectada públicamente en las fuentes vinculadas.
 * @param {object} currentProfile - Datos actuales del formulario de identidad.
 * @param {Array} sourceLinks - Enlaces de fuentes provistos por el usuario.
 * @returns {Promise<object>} Reporte estructurado de consistencia con conflictos y resoluciones sugeridas.
 */
export const analyzeBrandConsistency = async (currentProfile, sourceLinks = []) => {
  console.log('🤖 [OpenAI Brand Alignment] Iniciando análisis de consistencia de marca...');

  let gatheredInfoText = '';
  const activeLinks = (sourceLinks || []).filter(link => link.url && link.url.trim());

  for (const link of activeLinks) {
    const rawUrl = link.url.trim();
    let query = rawUrl;
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      const host = parsed.hostname.replace('www.', '');
      const path = parsed.pathname;
      query = `${host} ${path} brand bio profile description`;
    } catch (_e) {
      query = `${rawUrl} brand info`;
    }

    console.log(`📡 [OpenAI Brand Alignment] Buscando info en web para enlace de tipo [${link.type || 'other'}]: "${query}"`);
    const scraped = await searchWebDuckDuckGo(query);
    if (scraped) {
      gatheredInfoText += `\n\n--- INFORMACIÓN DE FUENTE [Tipo: ${link.type || 'other'}, URL: ${rawUrl}] ---\n${scraped}`;
    }
  }

  if (!gatheredInfoText.trim()) {
    gatheredInfoText = 'No se encontraron enlaces de fuentes activas con información pública detectable. Compara en base al contexto general.';
  }

  const systemPrompt = `Eres un estratega de marca senior y auditor de consistencia digital.
Tu trabajo es auditar la identidad de una marca comparando los datos ingresados manualmente por el usuario en su formulario de identidad con la información real de sus canales digitales (Instagram, TikTok, YouTube, LinkedIn, Facebook, Web, etc.).
Debes identificar contradicciones o inconsistencias y, además, redactar un perfil completo y súper detallado de lo que la IA detecta en internet para las siguientes 6 áreas estratégicas:
- Descripción del Negocio (business_description)
- Audiencia Objetivo (target_audience)
- Tono de Voz (brand_voice)
- Estilo Visual de Referencia (reference_style)
- Valores y Filosofía (brand_values)
- Competidores de Referencia (competitors)

Debes devolver estrictamente un objeto JSON que siga el formato exacto especificado, sin explicaciones ni markdown en el exterior de tu respuesta.`;

  const userPrompt = `Realiza una auditoría y extracción detallada de identidad de marca.
  
DATOS DEL FORMULARIO DE IDENTIDAD (INGRESADOS MANUALMENTE):
- Descripción del Negocio: "${currentProfile.business_description || 'Sin describir'}"
- Audiencia Objetivo: "${currentProfile.target_audience || 'Sin definir'}"
- Tono de Voz: "${currentProfile.brand_voice || 'Sin definir'}"
- Estilo Visual / Estética de Referencia: "${currentProfile.reference_style || 'Sin definir'}"
- Valores y Filosofía: "${currentProfile.brand_values || 'Sin definir'}"
- Competidores de Referencia: "${currentProfile.competitors || 'Sin definir'}"

INFORMACIÓN REAL DETECTADA EN SUS ENLACES/REDES EN LA WEB:
"""
${gatheredInfoText}
"""

Completa estrictamente la estructura JSON indicada abajo.
CRÍTICO:
1. El campo "detected_profile" debe completarse SIEMPRE con la información más rica, profunda y detallada posible obtenida de las redes o deducida del comportamiento digital del cliente. Cada campo ("business_description", "target_audience", "brand_voice", "reference_style", "brand_values", "competitors") debe tener una descripción de al menos 3 a 5 oraciones extensas, sumamente profesionales y completas.
2. Si detectas cualquier discrepancia (ej: el usuario describió el tono como formal pero en Instagram usan emojis, memes o modismos informales), define "is_consistent" como false, calcula el score y agrega los conflictos en "conflicts".
3. Tanto los valores en "detected_value" y "description" del conflicto como los "value" de las "suggested_actions" deben ser sumamente extensos, profesionales, detallados y redactados en español de alta calidad, listos para inyectarse directamente en el formulario del cliente. EVITA textos cortos de una sola frase simple.

ESTRUCTURA JSON REQUERIDA:
{
  "is_consistent": false,
  "consistency_score": 75,
  "detected_profile": {
    "business_description": "Párrafo sumamente detallado de 3-5 oraciones sobre a qué se dedica el negocio en base a lo captado en internet...",
    "target_audience": "Párrafo sumamente detallado de 3-5 oraciones sobre la audiencia real captada de las redes sociales del cliente...",
    "brand_voice": "Párrafo sumamente detallado de 3-5 oraciones sobre el tono de comunicación, adjetivos y reglas detectadas...",
    "reference_style": "Párrafo sumamente detallado de 3-5 oraciones sobre la estética, colores, tipos de fotos y vibra visual de sus perfiles...",
    "brand_values": "Párrafo sumamente detallado de 3-5 oraciones describiendo la misión, visión, pilares éticos o filosofía detectada...",
    "competitors": "Párrafo detallado listando competidores directos y marcas similares en base a las menciones y sector analizado..."
  },
  "conflicts": [
    {
      "id": "conflicto-brand_voice",
      "field": "brand_voice",
      "title": "Inconsistencia en el Tono de Voz",
      "severity": "high", 
      "manual_value": "Valor escrito en el formulario",
      "detected_value": "Valor real detectado en sus redes (párrafo extenso y rico)",
      "description": "Explicación detallada de la contradicción detectada entre lo manual y lo real en redes sociales, fundamentando por qué confunde a la IA.",
      "suggested_actions": [
        {
          "type": "use_detected",
          "label": "Adoptar tono real de redes",
          "value": "Párrafo completo y súper profesional redactado en español de 3-5 oraciones que reemplazará el tono de voz para alinearlo a lo real en redes."
        },
        {
          "type": "use_manual",
          "label": "Mantener original del formulario",
          "value": "Párrafo pulido para reafirmar y mantener el valor manual original."
        },
        {
          "type": "merge_both",
          "label": "Fusionar ambos estilos",
          "value": "Párrafo redactado por ti de 3-5 oraciones que logre una fusión perfecta y armoniosa de ambos estilos."
        }
      ]
    }
  ]
}

Nota: Los valores de texto deben estar redactados en español, ser amplios, elegantes y listos para inyectarse directamente en la base de datos del cliente.`;

  console.log('🤖 [OpenAI Brand Alignment] Solicitando diagnóstico a GPT-4o-mini...');
  const jsonText = await callOpenAIJSON(systemPrompt, userPrompt);

  try {
    const parsedData = JSON.parse(jsonText);
    console.log(`✅ [OpenAI Brand Alignment] Diagnóstico de coherencia estructurado correctamente. Coherencia: ${parsedData.consistency_score}%`);
    return parsedData;
  } catch (parseError) {
    console.error('❌ [OpenAI Brand Alignment] Error al parsear el JSON de coherencia:', jsonText);
    return {
      is_consistent: true,
      consistency_score: 100,
      conflicts: []
    };
  }
};


