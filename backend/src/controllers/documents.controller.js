import { processDocument, getDocumentsByClient, createDocument, deleteDocumentById } from '../services/documents.service.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

// Helper to fetch user's agency_id
const getUserAgencyId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .single();
  if (error) throw new Error('No se pudo obtener el perfil del usuario.');
  return data.agency_id;
};

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

export const handleUploadDocument = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { file_name, storage_path, file_type, file_size } = req.body || {};
    if (!clientId || !storage_path || !file_name) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
    }
    const agencyId = await getUserAgencyId(req.user.id);
    const created = await createDocument({
      client_id: clientId,
      agency_id: agencyId,
      file_name,
      storage_path,
      file_type,
      file_size,
      ai_status: 'pending',
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!documentId) return res.status(400).json({ success: false, message: 'documentId requerido' });
    const agencyId = await getUserAgencyId(req.user.id);
    await deleteDocumentById(documentId, agencyId);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
