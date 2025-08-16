/**
 * Utilidades para manejo de fechas
 * Centraliza la lógica de fecha actual para toda la aplicación
 */

/**
 * Obtiene la fecha actual desde el servidor o calcula basada en zona horaria
 * @returns {Date} Fecha actual correcta
 */
export const getCurrentDate = () => {
  const systemDate = new Date();
  return systemDate;
};

/**
 * Verifica si una fecha es "hoy"
 * @param {Date} date - Fecha a verificar
 * @returns {boolean}
 */
export const isToday = (date) => {
  const today = getCurrentDate();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

/**
 * Formatea fecha para display
 * @param {Date} date 
 * @param {string} locale 
 * @returns {string}
 */
export const formatDate = (date, locale = 'es-ES') => {
  return date.toLocaleDateString(locale);
};

/**
 * Obtiene el inicio del día
 * @param {Date} date 
 * @returns {Date}
 */
export const startOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Obtiene el final del día
 * @param {Date} date 
 * @returns {Date}
 */
export const endOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};