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
 * Realiza un escrapeo directo del HTML de un sitio web público,
 * extrayendo su contenido textual y limpiando scripts, estilos y menús redundantes.
 */
const scrapeWebsiteDirectly = async (url) => {
  try {
    console.log(`🌐 [Web Scraping] Intentando escrapear sitio web directamente: "${url}"`);
    
    // Timeout para evitar peticiones colgadas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ [Web Scraping] El sitio web retornó estatus: ${response.status}`);
      return '';
    }

    const html = await response.text();
    
    // Extraer texto legible eliminando código no visible
    let text = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Eliminar scripts
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')   // Eliminar estilos
      .replace(/<nav[^>]*>([\s\S]*?)<\/nav>/gi, ' ')       // Eliminar menús
      .replace(/<footer[^>]*>([\s\S]*?)<\/footer>/gi, ' ')   // Eliminar pies de página
      .replace(/<[^>]*>/g, ' ')                           // Quitar etiquetas html
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')                               // Colapsar espacios
      .trim();
      
    if (text.length > 12000) {
      text = text.substring(0, 12000) + '... [Texto truncado por longitud]';
    }
    
    console.log(`🌐 [Web Scraping] Éxito. Se extrajeron ${text.length} caracteres legibles de la web.`);
    return text;
  } catch (error) {
    console.error(`❌ [Web Scraping] Falló el escrapeo directo para ${url}:`, error.message);
    return '';
  }
};

/**
 * Realiza una búsqueda estratégica usando la API de Tavily (si está disponible)
 * que cuenta con excelentes respuestas estructuradas ideales para LLMs.
 */
const searchWithTavily = async (query) => {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    console.log('ℹ️ [Tavily Search] TAVILY_API_KEY no configurada. Saltando...');
    return null;
  }
  try {
    console.log(`📡 [Tavily Search] Consultando Tavily para: "${query}"...`);
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify({
        query: query,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 4,
      }),
    });

    if (!resp.ok) {
      console.warn(`⚠️ [Tavily Search] Tavily retornó error ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const results = [];
    if (data.answer) {
      results.push(`[Resumen de IA (Tavily)]: ${data.answer}`);
    }
    if (data.results && data.results.length > 0) {
      data.results.forEach((r, i) => {
        results.push(`[Fuente ${i + 1}: ${r.title} - URL: ${r.url}]:\n${r.content}`);
      });
    }
    return results.join('\n\n');
  } catch (error) {
    console.error('❌ [Tavily Search] Error al buscar en Tavily:', error);
    return null;
  }
};

/**
 * Realiza una auditoría inteligente cruzando la información manual del formulario
 * de identidad con la información detectada públicamente en las fuentes vinculadas.
 * @param {object} currentProfile - Datos actuales del formulario de identidad.
 * @param {Array} sourceLinks - Enlaces de fuentes provistos por el usuario.
 * @returns {Promise<object>} Reporte estructurado de consistencia con conflictos y resoluciones sugeridas.
 */
export const analyzeBrandConsistency = async (currentProfile, sourceLinks = [], extractedTexts = [], imageAssets = [], clientName = '', clientIndustry = '') => {
  console.log('🤖 [OpenAI Brand Alignment] Iniciando análisis de consistencia y perfilado multimodal...');

  let gatheredInfoText = '';
  const activeLinks = (sourceLinks || []).filter(link => link.url && link.url.trim());

  // Búsqueda real de la marca por nombre e industria en la web (usando Tavily si está o DuckDuckGo)
  if (clientName) {
    const brandQuery = `${clientName} ${clientIndustry || ''} brand business profile identity company`.trim();
    let brandScraped = '';
    
    if (process.env.TAVILY_API_KEY) {
      brandScraped = await searchWithTavily(brandQuery);
    }
    
    if (!brandScraped) {
      console.log(`📡 [Web Search] Realizando búsqueda estratégica de la marca en DuckDuckGo: "${brandQuery}"`);
      brandScraped = await searchWebDuckDuckGo(brandQuery);
    }

    if (brandScraped) {
      gatheredInfoText += `\n\n=== INFORMACIÓN DE BÚSQUEDA WEB PARA LA MARCA [Nombre: ${clientName}, Industria: ${clientIndustry || 'Sin especificar'}] ===\n${brandScraped}`;
    }
  }

  for (const link of activeLinks) {
    const rawUrl = link.url.trim();
    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    
    let scraped = '';
    
    // A. Si es un Sitio Web real, intentamos escrapearlo directamente para obtener datos 100% reales de su HTML
    const isSocialMedia = rawUrl.includes('instagram.com') || rawUrl.includes('facebook.com') || rawUrl.includes('linkedin.com') || rawUrl.includes('tiktok.com') || rawUrl.includes('youtube.com') || rawUrl.includes('twitter.com') || rawUrl.includes('x.com');
    
    if ((link.type === 'website' || rawUrl.includes('.')) && !isSocialMedia) {
      console.log(`🌐 [Brand Analysis] Detectado Sitio Web. Intentando escrapeo directo de URL: "${cleanUrl}"`);
      scraped = await scrapeWebsiteDirectly(cleanUrl);
    }
    
    // B. Si el escrapeo directo no obtuvo nada o es una red social, intentamos una búsqueda en Tavily (si está disponible) o DuckDuckGo
    if (!scraped) {
      let query = rawUrl;
      try {
        const parsed = new URL(cleanUrl);
        const host = parsed.hostname.replace('www.', '');
        const path = parsed.pathname;
        query = `${host} ${path} brand bio profile description`;
      } catch (_e) {
        query = `${rawUrl} brand info`;
      }

      if (process.env.TAVILY_API_KEY) {
        scraped = await searchWithTavily(query);
      }
      
      if (!scraped) {
        console.log(`📡 [Brand Analysis] Usando DuckDuckGo para buscar canal: "${query}"`);
        scraped = await searchWebDuckDuckGo(query);
      }
    }

    if (scraped) {
      gatheredInfoText += `\n\n--- INFORMACIÓN DE CANAL EN WEB [Tipo: ${link.type || 'other'}, URL: ${rawUrl}] ---\n${scraped}`;
    }
  }

  if (extractedTexts && extractedTexts.length > 0) {
    gatheredInfoText += `\n\n=== TEXTOS EXTRAÍDOS DE ARCHIVOS DE REFERENCIA Y BRIEFS ===\n` + extractedTexts.join('\n\n---\n\n');
  }

  if (!gatheredInfoText.trim() && (!imageAssets || imageAssets.length === 0)) {
    gatheredInfoText = 'No se encontraron enlaces de fuentes activas ni archivos con información pública detectable. Genera la mejor inferencia en base a los datos actuales del formulario y realiza una búsqueda general.';
  }

  const systemPrompt = `Actúas como un estratega senior de branding, identidad de marca y comunicación digital.
Tu tarea es realizar una auditoría de marca exhaustiva y estructurar el ADN estratégico del cliente comparando los datos actuales provistos con la información capturada en tiempo real de sus canales digitales en la web y los manuales o capturas de referencia provistos.

Antes de sacar conclusiones, debes estudiar toda la información disponible y organizar el análisis de forma profesional en español.
No inventes información que no esté respaldada por los datos entregados. Si falta información importante, indícalo claramente y especifica qué preguntas habría que hacerle al cliente.

Objetivo del análisis:
Construir una visión clara de la identidad actual de la marca, detectar fortalezas, debilidades, oportunidades de mejora y proponer una dirección estratégica para mejorar su comunicación visual, verbal y comercial.

Debes devolver estrictamente un objeto JSON válido con los campos especificados abajo. No agregues preámbulo ni markdown fuera del JSON.

Tus tareas principales son:
1. En el campo "brand_profile_text", generar una auditoría e identidad de marca EXTREMADAMENTE COMPLETA, DETALLADA y de gran extensión (de al menos 800 a 1800 palabras) utilizando títulos y subtítulos Markdown claros. Debes seguir y estructurar rigurosamente los siguientes puntos:

### 1. Resumen general de la marca
Explicación de qué hace la empresa, cómo se presenta actualmente y propuesta principal.

### 2. Identidad percibida actual
Cómo se percibe la marca hoy según su comunicación: Profesional, Cercana, Premium, Tradicional, Moderna, Juvenil, Técnica, Creativa, Institucional, Informal, Confiable, Aspiracional u otro perfil relevante.

### 3. Propuesta de valor
Promesa principal, problemas que resuelve, beneficios que ofrece, por qué elegirla y si la propuesta es clara o débilmente comunicada.

### 4. Público objetivo
Inferencia del cliente ideal, dolores, necesidades, objeciones posibles y tipo de mensaje que podría conectar mejor.

### 5. Personalidad de marca
Características de la marca si fuera una persona: rasgos principales, tono emocional, nivel de formalidad, cercanía, autoridad e innovación.

### 6. Tono de voz
Estilo del lenguaje (formal, amigable, técnico, comercial, etc.), uso del lenguaje, confianza que transmite, consistencia entre canales y tono a adoptar.

### 7. Identidad visual
Análisis de elementos disponibles (colores, estilo gráfico, fotografía, coherencia visual y diferenciación).

### 8. Diagnóstico de Instagram y Redes Sociales
Bio, estética del feed, llamados a la acción, llamados comerciales y oportunidades de mejora detectadas en base al escrapeo web.

### 9. Análisis de Sitio Web
Mensaje principal, facilidad de entendimiento, diseño, experiencia de usuario, llamados a la acción, confianza percibida y potencial de conversión.

### 10. Competencia y diferenciación
Fortalezas de competidores detectados en su sector y el territorio visual/verbal que puede ocupar para diferenciarse.

### 11. Fortalezas de la marca
Listado de las fortalezas clave encontradas.

### 12. Debilidades o problemas actuales
Listado de puntos débiles agrupados en: problemas estratégicos, problemas visuales, problemas de comunicación, problemas comerciales y problemas de experiencia digital.

### 13. Oportunidades de mejora
Acciones de mejora concretas para la identidad visual, tono, redes, web, mensajes comerciales y posicionamiento.

### 14. Dirección estratégica recomendada
Posicionamiento óptimo, mensajes a repetir, estética recomendada y qué evitar.

### 15. Frases clave sugeridas
Frase principal de marca (claim), descripción corta para redes sociales, descripción profesional para web, 5 posibles mensajes comerciales de alto impacto, y 5 llamados a la acción atractivos.

### 16. Preguntas pendientes para el cliente
Lista de preguntas estratégicas importantes para completar y refinar la identidad de marca.

### Síntesis Ejecutiva
Una síntesis final contundente de la identidad de marca recomendada.

Formato: Presenta el análisis del perfil ("brand_profile_text") en secciones de Markdown muy ricas en contenido, con explicaciones muy descriptivas en cada punto. Sé específico, profesional y crítico, pero constructivo. Evita respuestas genéricas.

2. En el campo "contradictions", identificar las contradicciones de temas, estilo, tono o visuales entre los diferentes canales públicos del cliente y sus archivos/capturas cargadas. Redacta consultas claras y sugerencias para resolver cada discrepancia de manera colaborativa con el usuario.`;

  const userPromptText = `Realiza el análisis de consistencia de marca y perfilado en lenguaje natural.

INFORMACIÓN ACTUAL DEL CLIENTE (INGRESADA MANUALMENTE):
- Nombre del cliente: "${clientName || 'Sin especificar'}"
- Rubro / Industria: "${clientIndustry || 'Sin especificar'}"
- Descripción actual: "${currentProfile.business_description || 'Sin describir'}"
- Tono actual: "${currentProfile.brand_voice || 'Sin definir'}"
- Audiencia actual: "${currentProfile.target_audience || 'Sin definir'}"
- Estilo visual actual: "${currentProfile.reference_style || 'Sin definir'}"

INFORMACIÓN RECOPILADA DE SUS CANALES WEB Y ARCHIVOS DE TEXTO/PDF (INCLUYE BÚSQUEDA WEB AUTOMÁTICA):
"""
${gatheredInfoText}
"""

IMÁGENES DE REFERENCIA / CAPTURAS DE PANTALLA CARGADAS:
${imageAssets.length > 0 ? `Se han adjuntado ${imageAssets.length} capturas o elementos gráficos de referencia de marca en Base64 para que analices visualmente su paleta de colores, diseño y vibra estética.` : 'No se adjuntaron imágenes.'}

Escribe tu respuesta estrictamente en este formato JSON:
{
  "is_consistent": false,
  "consistency_score": 75,
  "brand_profile_text": "Genera el informe estratégico exhaustivo de marca y análisis de ADN siguiendo rigurosamente los 16 puntos solicitados con formato Markdown (###) en español, de forma muy detallada e informada. No resumas, extiende el contenido para dar la máxima claridad...",
  "contradictions": [
    {
      "id": "contradiction-1",
      "title": "Título corto y claro de la contradicción de marca",
      "description": "Explicación detallada de la discrepancia de temas, tono o estilo visual entre los canales del cliente y sus archivos de referencia.",
      "consultation_question": "Pregunta clara y profesional para consultar con los usuarios cómo prefieren manejar esta contradicción (ej: ¿Prefieren mantener el estilo A o el estilo B?).",
      "suggested_fix": "Párrafo en lenguaje natural con la propuesta corregida y armonizada lista para integrarse o fusionarse al perfil."
    }
  ]
}`;

  let userPrompt;

  if (imageAssets && imageAssets.length > 0) {
    const userPromptContent = [
      { type: 'text', text: userPromptText }
    ];

    imageAssets.forEach(img => {
      userPromptContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`
        }
      });
    });

    userPrompt = userPromptContent;
  } else {
    userPrompt = userPromptText;
  }

  console.log('🤖 [OpenAI Brand Alignment] Solicitando diagnóstico multimodal y perfilado de ADN a GPT-4o-mini...');
  const jsonText = await callOpenAIJSON(systemPrompt, userPrompt);

  try {
    const parsedData = JSON.parse(jsonText);
    console.log(`✅ [OpenAI Brand Alignment] Diagnóstico multimodal estructurado correctamente. Coherencia: ${parsedData.consistency_score}%`);
    return parsedData;
  } catch (parseError) {
    console.error('❌ [OpenAI Brand Alignment] Error al parsear el JSON de coherencia:', jsonText);
    return {
      is_consistent: true,
      consistency_score: 100,
      brand_profile_text: currentProfile.business_description || '',
      contradictions: []
    };
  }
};


