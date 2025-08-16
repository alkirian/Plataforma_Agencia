// src/controllers/documents.controller.js
import { supabaseAdmin } from '../config/supabaseClient.js';
import { processDocument, getDocumentsByClient, createDocument, deleteDocumentById } from '../services/documents.service.js';
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
    const token = req.token;
    const { file_name, storage_path, file_type, file_size } = req.body || {};
    if (!clientId || !storage_path || !file_name) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
    }
    const agencyId = await getUserAgencyId(req.user.id);

    // Creamos el objeto que vamos a insertar
    const documentData = {
      client_id: clientId,
      agency_id: agencyId, // <-- Sospechamos que este valor puede ser null
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