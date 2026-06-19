/**
 * Utilidades compartidas y normalizadores para el módulo de Cronograma / Calendario
 */

/**
 * Formatea un objeto Date o cadena de fecha en una cadena YYYY-MM-DD segura para inputs de HTML
 * @param {Date|string} date 
 * @returns {string}
 */
export const toDateInputValue = date => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Normaliza un término descriptivo de formato de publicación a la categoría oficial del sistema
 * @param {string} formatStr 
 * @returns {string}
 */
export const normalizeFormat = formatStr => {
  if (!formatStr) return 'Post Estático';
  const s = formatStr.toLowerCase();
  if (s.includes('reel') || s.includes('tiktok') || s.includes('short') || s.includes('video'))
    return 'Reel / TikTok';
  if (s.includes('carrusel') || s.includes('carousel')) return 'Carrusel';
  if (s.includes('historia') || s.includes('story')) return 'Historia';
  if (s.includes('entrevista')) return 'Entrevista';
  if (s.includes('influencer')) return 'Video Influencer';
  if (s.includes('cobertura')) return 'Cobertura de Evento';
  if (s.includes('estatico') || s.includes('post') || s.includes('imagen')) return 'Post Estático';
  return 'Post Estático';
};

/**
 * Mapea códigos de canales y plataformas a los nombres oficiales del sistema
 * @param {string} channel 
 * @returns {string}
 */
export const normalizePlatform = channel => {
  if (!channel) return 'Instagram';
  const c = channel.toUpperCase();
  if (c === 'IG' || c.includes('INSTAGRAM')) return 'Instagram';
  if (c === 'TIKTOK' || c.includes('TIKTOK')) return 'TikTok';
  if (c === 'YT' || c.includes('YOUTUBE') || c.includes('SHORTS')) return 'YouTube';
  if (c === 'FB' || c.includes('FACEBOOK')) return 'Facebook';
  if (c === 'LI' || c.includes('LINKEDIN')) return 'LinkedIn';
  return 'Instagram';
};

/**
 * Infiere el formato sugerido de publicación basado en los tipos de archivos cargados
 * @param {FileList|Array} files 
 * @returns {string}
 */
export const inferFormatFromFiles = files => {
  if (!files?.length) return 'Post';
  if (files.length > 1) return 'Carrusel';
  const type = files[0]?.type || '';
  if (type.startsWith('video/')) return 'Video';
  if (type.startsWith('image/')) return 'Imagen';
  return 'Post';
};

