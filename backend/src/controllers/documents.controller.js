// src/controllers/documents.controller.js
import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import { processDocument, getDocumentsByClient, createDocument, deleteDocumentById, downloadMediaFromLink } from '../services/documents.service.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';

export const handleProcessDocument = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { documentId } = req.params;
    if (!documentId) return res.status(400).json({ success: false, message: 'documentId requerido' });
    await processDocument(documentId, token);
    res.status(202).json({ success: true, data: { status: 'processing' } });
  } catch (error) {
    next(error);
  }
};

export const handleGetDocumentsForClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId requerido' });
    const agencyId = await getUserAgencyId(req.user.id);
    const documents = await getDocumentsByClient(clientId, agencyId);
    res.status(200).json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

// src/controllers/documents.controller.js

// ... (el resto del archivo se mantiene igual)

export const handleUploadDocument = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.token || req.headers.authorization?.split(' ')[1];
    const { file_name, storage_path, file_type, file_size } = req.body || {};
    if (!clientId || !storage_path || !file_name) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
    }

    // 1. Validar que el cliente realmente pertenece a la organización del usuario
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientErr || !client) {
      console.warn(`⚠️ [documents] Intento de IDOR detectado: Usuario ${req.user.id} intentó asociar un documento al cliente ${clientId}`);
      return res.status(403).json({ success: false, message: 'Acceso denegado o cliente inexistente.' });
    }

    // Creamos el objeto que vamos a insertar
    const documentData = {
      client_id: clientId,
      agency_id: client.agency_id, // Usamos la de base de datos validada
      file_name,
      storage_path,
      file_type,
      file_size,
      ai_status: 'pending',
    };
    
    // ✨ LÍNEA DE DEPURACIÓN CLAVE ✨
    //    Vamos a imprimir este objeto en la consola del backend.
    console.log('--- DATOS A INSERTAR EN LA TABLA documents ---', documentData);

    // 1. Crea el registro del documento
    const createdDocument = await createDocument(documentData, req.user.id);

    // ... (el resto de la función se mantiene igual)
    if (createdDocument) {
      processDocument(createdDocument.id, token)
        .catch(err => {
          console.error(`[ERROR] Fallo en el procesamiento del documento ${createdDocument.id}:`, err.message);
        });
    }
    
    res.status(201).json({ success: true, data: createdDocument });
  } catch (error) {
    next(error);
  }
};

// ... (el resto del archivo se mantiene igual)

export const handleDeleteDocument = async (req, res, next) => {
  try {
    const { clientId, documentId } = req.params;
    const userId = req.user.id;
    
    console.log('🗑️ DELETE document request:', { clientId, documentId, userId });
    
    if (!documentId) return res.status(400).json({ success: false, message: 'documentId requerido' });
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId requerido' });
    
    // Obtener agency_id del usuario
    const agencyId = await getUserAgencyId(userId);
    
    // Verificar que el documento pertenece al cliente
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, client_id')
      .eq('id', documentId)
      .eq('agency_id', agencyId)
      .single();
      
    if (fetchError || !doc) {
      console.log('❌ Document not found:', { documentId, agencyId, error: fetchError });
      return res.status(404).json({ 
        success: false, 
        message: 'Documento no encontrado' 
      });
    }
    
    if (doc.client_id !== clientId) {
      console.log('❌ Document does not belong to client:', { 
        docClientId: doc.client_id, 
        requestedClientId: clientId 
      });
      return res.status(403).json({ 
        success: false, 
        message: 'El documento no pertenece a este cliente' 
      });
    }
    
    // Eliminar el documento
    await deleteDocumentById(documentId, agencyId, userId);
    
    console.log('✅ Document deleted successfully:', documentId);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error in deleteDocument controller:', error);
    next(error);
  }
};

export const handleDownloadLink = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { url } = req.body || {};
    const token = req.token || req.headers.authorization?.split(' ')[1];

    if (!clientId || !url) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos (clientId, url).' });
    }

    // 1. Validar que el cliente pertenece a la misma organización del usuario (prevenir IDOR)
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientErr || !client) {
      console.warn(`⚠️ [downloader] Acceso denegado o cliente inexistente para ${clientId}`);
      return res.status(403).json({ success: false, message: 'Acceso denegado o cliente inexistente.' });
    }

    console.log(`📥 [downloader] Iniciando descarga de enlace para cliente ${clientId}: ${url}`);

    // 2. Resolver y descargar el contenido de la URL (YouTube, Pinterest, etc.) y subirlo a Storage
    const uploadedMetadata = await downloadMediaFromLink(url, clientId);

    // 3. Crear el registro en la base de datos
    const documentData = {
      client_id: clientId,
      agency_id: client.agency_id,
      file_name: uploadedMetadata.file_name,
      storage_path: uploadedMetadata.storage_path,
      file_type: uploadedMetadata.file_type,
      file_size: uploadedMetadata.file_size,
      ai_status: 'pending',
    };

    console.log('💾 [downloader] Insertando documento descargado en BD:', documentData);
    const createdDocument = await createDocument(documentData);

    // 4. Ejecutar el procesamiento asíncrono en segundo plano (RAG/Embeddings) si corresponde
    if (createdDocument) {
      processDocument(createdDocument.id, token)
        .catch(err => {
          console.error(`[ERROR] Fallo en el procesamiento RAG del documento descargado ${createdDocument.id}:`, err.message);
        });
    }

    res.status(201).json({ success: true, data: createdDocument });
  } catch (error) {
    console.error('❌ [downloader] Error en handleDownloadLink:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Error interno al descargar el enlace.' });
  }
};