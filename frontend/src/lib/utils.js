import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS de forma inteligente
 * @param inputs - Clases CSS a combinar
 * @returns String de clases combinadas
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
