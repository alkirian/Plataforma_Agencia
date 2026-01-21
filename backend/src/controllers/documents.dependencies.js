import multer from "multer";
import { DocumentService } from "../domain/documents/DocumentService.js";
import { SupabaseDocumentRepository } from "../infrastructure/documents/SupabaseDocumentRepository.js";
import { SupabaseStorageService } from "../infrastructure/documents/SupabaseStorageService.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const documentRepository = new SupabaseDocumentRepository(supabaseAdmin);
const storageService = new SupabaseStorageService(supabaseAdmin);

export const documentService = new DocumentService(
  documentRepository,
  storageService,
);

export const documentsUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const dangerousExts = ["exe", "msi", "dll", "bat", "cmd", "sh", "scr"];
    const ext = file.originalname.split(".").pop()?.toLowerCase();

    if (ext && dangerousExts.includes(ext)) {
      return cb(new Error(`La extensión .${ext} no está permitida.`));
    }

    return cb(null, true);
  },
});
