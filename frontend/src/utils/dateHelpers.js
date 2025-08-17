/**
 * Utilidades para manejo de fechas
 * Centraliza la lógica de fecha actual para toda la aplicación
 * Usando date-fns como librería base para operaciones avanzadas
 */
import { 
  format, 
  isToday as dateFnsIsToday, 
  startOfDay as dateFnsStartOfDay, 
  endOfDay as dateFnsEndOfDay,
  isThisWeek,
  isThisMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

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
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isToday = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsIsToday(dateObj);
};

/**
 * Verifica si una fecha es de esta semana
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isCurrentWeek = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isThisWeek(dateObj);
};

/**
 * Verifica si una fecha es de este mes
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isCurrentMonth = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isThisMonth(dateObj);
};

/**
 * Formatea fecha para display
 * @param {Date|string} date 
 * @param {string} formatString - Formato deseado
 * @returns {string}
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: es });
};

/**
 * Formatea fecha de manera relativa (hace X días, en X días)
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatRelativeDate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = getCurrentDate();
  const daysDiff = differenceInDays(dateObj, now);
  
  if (daysDiff === 0) return 'Hoy';
  if (daysDiff === 1) return 'Mañana';
  if (daysDiff === -1) return 'Ayer';
  if (daysDiff > 0) return `En ${daysDiff} días`;
  return `Hace ${Math.abs(daysDiff)} días`;
};

/**
 * Obtiene el inicio del día
 * @param {Date|string} date 
 * @returns {Date}
 */
export const startOfDay = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsStartOfDay(dateObj);
};

/**
 * Obtiene el final del día
 * @param {Date|string} date 
 * @returns {Date}
 */
export const endOfDay = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsEndOfDay(dateObj);
};

/**
 * Añade días a una fecha
 * @param {Date|string} date 
 * @param {number} amount 
 * @returns {Date}
 */
export const addDaysToDate = (date, amount) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, amount);
};

/**
 * Calcula diferencia en días entre dos fechas
 * @param {Date|string} laterDate 
 * @param {Date|string} earlierDate 
 * @returns {number}
 */
export const daysDifference = (laterDate, earlierDate) => {
  const later = typeof laterDate === 'string' ? parseISO(laterDate) : laterDate;
  const earlier = typeof earlierDate === 'string' ? parseISO(earlierDate) : earlierDate;
  return differenceInDays(later, earlier);
};

/**
 * Calcula diferencia en horas entre dos fechas
 * @param {Date|string} laterDate 
 * @param {Date|string} earlierDate 
 * @returns {number}
 */
export const hoursDifference = (laterDate, earlierDate) => {
  const later = typeof laterDate === 'string' ? parseISO(laterDate) : laterDate;
  const earlier = typeof earlierDate === 'string' ? parseISO(earlierDate) : earlierDate;
  return differenceInHours(later, earlier);
};