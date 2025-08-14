import { processDocument } from '../services/documents.service.js';

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
