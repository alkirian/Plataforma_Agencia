import { extractBrandProfileFromContext, searchAndExtractCompanyBrand, analyzeBrandConsistency } from '../services/aiBrand.service.js';
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Endpoint para autocompletar la identidad de marca del cliente usando IA
 * POST /api/v1/clients/:clientId/brand-profile/auto-fill
 */
export const handleAutoFillBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { rawText, documentId } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    // 1. Validar cliente y obtener permisos del usuario
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    let textToAnalyze = '';

    // A. Si se proporciona un texto plano directamente
    if (rawText && rawText.trim()) {
      textToAnalyze = rawText.trim();
    } 
    // B. Si se proporciona un documentId de la biblioteca de documentos del cliente
    else if (documentId) {
      console.log(`📂 [Brand Onboarding] Extrayendo texto del documento: ${documentId}`);
      
      const { data: doc, error: docErr } = await supabaseAuth
        .from('documents')
        .select('id, storage_path, file_type')
        .eq('id', documentId)
        .eq('client_id', clientId)
        .single();

      if (docErr || !doc) {
        console.error('❌ Error al cargar documento de referencia:', docErr);
        return res.status(404).json({ success: false, error: 'Documento de referencia no encontrado.' });
      }

      // Descargar archivo del storage bucket 'documents'
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('documents')
        .download(doc.storage_path);

      if (downloadError) {
        console.error('❌ Error al descargar archivo de Supabase Storage:', downloadError);
        return res.status(500).json({ success: false, error: `No se pudo descargar el archivo: ${downloadError.message}` });
      }

      // Decodificar y extraer texto según mime type
      const arrayBuffer = await fileData.arrayBuffer?.();
      const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : fileData;
      const fileType = doc.file_type?.toLowerCase() || '';

      if (fileType.includes('pdf')) {
        const parsedPdf = await pdf(buffer, { max: 150 });
        textToAnalyze = parsedPdf.text || '';
      } else if (fileType.includes('docx') || fileType.includes('officedocument.wordprocessingml')) {
        const { value } = await mammoth.extractRawText({ buffer });
        textToAnalyze = value || '';
      } else {
        textToAnalyze = buffer.toString('utf8') || '';
      }
    } else {
      return res.status(400).json({ success: false, error: 'Debes proporcionar un texto plano (rawText) o un documento (documentId) para analizar.' });
    }

    if (!textToAnalyze.trim()) {
      return res.status(400).json({ success: false, error: 'No se pudo extraer ningún texto de la fuente provista.' });
    }

    // 2. Ejecutar extracción estructurada usando la API de Gemini
    const extractedBrandProfile = await extractBrandProfileFromContext(textToAnalyze);

    return res.status(200).json({
      success: true,
      data: extractedBrandProfile,
      message: 'Propuesta de identidad generada con éxito por la IA.'
    });

  } catch (error) {
    console.error('❌ Error general en handleAutoFillBrandProfile:', error);
    next(error);
  }
};

/**
 * Endpoint para buscar una empresa en internet con Gemini + Google Search Grounding
 * y generar su perfil de identidad de marca automáticamente.
 * POST /api/v1/clients/:clientId/brand-profile/search-company
 */
export const handleSearchCompanyBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { companyName } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre de la empresa es requerido.' });
    }

    // Validar que el usuario tiene acceso al cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, agency_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ [Brand Search] Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    console.log(`🔍 [Brand Search] Cliente validado: ${client.name}. Buscando: "${companyName.trim()}"`);

    const extractedBrandProfile = await searchAndExtractCompanyBrand(companyName.trim());

    return res.status(200).json({
      success: true,
      data: extractedBrandProfile,
      message: `Perfil de marca de "${companyName}" generado con éxito a partir de información web.`
    });

  } catch (error) {
    console.error('❌ Error general en handleSearchCompanyBrandProfile:', error);
    next(error);
  }
};

/**
 * Endpoint para analizar la coherencia e inconsistencias de marca cruzando
 * el formulario manual y las redes sociales de referencia.
 * POST /api/v1/clients/:clientId/brand-profile/analyze-consistency
 */
export const handleAnalyzeBrandConsistency = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
    }

    const { clientId } = req.params;
    const { currentProfile, sourceLinks } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId es requerido.' });
    }

    if (!currentProfile) {
      return res.status(400).json({ success: false, error: 'Los datos actuales del perfil (currentProfile) son requeridos.' });
    }

    // Validar acceso al cliente
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.error('❌ [Brand Consistency] Error al validar cliente:', clientErr);
      return res.status(404).json({ success: false, error: 'Cliente no encontrado o sin permisos.' });
    }

    console.log(`🔍 [Brand Consistency] Realizando diagnóstico de coherencia para cliente: "${client.name}"`);
    const consistencyReport = await analyzeBrandConsistency(currentProfile, sourceLinks);

    return res.status(200).json({
      success: true,
      data: consistencyReport,
      message: 'Análisis de consistencia realizado con éxito.'
    });

  } catch (error) {
    console.error('❌ Error general en handleAnalyzeBrandConsistency:', error);
    next(error);
  }
};
