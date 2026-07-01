import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configurar el cliente S3 para Cloudflare R2 o AWS S3
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;

// Determinar si R2 está completamente configurado
const isR2Configured = !!(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName);

let s3Client = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
  console.log('☁️ Cloudflare R2 Client initialized successfully.');
} else {
  console.log('ℹ️ Cloudflare R2 is not configured. Falling back to Supabase Storage.');
}

/**
 * Genera una URL firmada para subir un archivo directamente al Storage
 * @param {string} key - Ruta/Nombre del archivo en el storage (ej: 'uploads/file.png')
 * @param {string} contentType - Tipo MIME del archivo (ej: 'image/png')
 * @param {number} expiresIn - Segundos de validez de la firma (por defecto 15 min / 900s)
 * @returns {Promise<string|null>} La URL firmada para PUT, o null si R2 no está configurado
 */
export const generateUploadPresignedUrl = async (key, contentType, expiresIn = 900) => {
  if (!s3Client) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating upload presigned URL:', error);
    throw error;
  }
};

/**
 * Genera una URL firmada para descargar/visualizar un archivo privado
 * @param {string} key - Ruta del archivo en el storage
 * @param {number} expiresIn - Segundos de validez de la firma (por defecto 30 min / 1800s)
 * @returns {Promise<string|null>} La URL firmada para GET, o null si R2 no está configurado
 */
export const generateDownloadPresignedUrl = async (key, expiresIn = 1800) => {
  if (!s3Client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating download presigned URL:', error);
    throw error;
  }
};

/**
 * Elimina un archivo físico del storage de Cloudflare R2
 * @param {string} key - Ruta del archivo en el storage
 * @returns {Promise<boolean>} Confirmación de eliminación
 */
export const deleteFileFromR2 = async (key) => {
  if (!s3Client) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from Cloudflare R2:', error);
    return false;
  }
};
