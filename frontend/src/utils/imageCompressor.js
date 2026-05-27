// src/utils/imageCompressor.js

/**
 * Comprime y redimensiona una imagen en el navegador del cliente.
 * - Reduce las dimensiones si exceden el ancho máximo para evitar peso innecesario.
 * - Convierte el archivo a formato .webp, el cual está altamente optimizado para la web.
 * - Mantiene las proporciones de aspecto del archivo original.
 * 
 * @param {File} file - El archivo de imagen original de entrada.
 * @param {number} maxWidth - Ancho máximo de la imagen comprimida (por defecto 600px).
 * @param {number} quality - Calidad de compresión de 0 a 1 (por defecto 0.82).
 * @returns {Promise<File>} El archivo comprimido listo para subirse a Supabase Storage.
 */
export const compressBrandLogo = (file, maxWidth = 600, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    // Si no es una imagen, resolver con el archivo original directamente
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar proporcionalmente si excede el ancho máximo
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback al archivo original en caso de error
        }

        // Dibujar la imagen en el lienzo bidimensional
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir el canvas a Blob en formato WebP con calidad optimizada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file); // Fallback si falla la generación del blob
            }
            
            // Crear el nuevo objeto de archivo .webp optimizado
            const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
