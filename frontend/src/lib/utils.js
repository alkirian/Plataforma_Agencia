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

/**
 * Genera un delay para animaciones escalonadas
 * @param index - Índice del elemento
 * @param baseDelay - Delay base en segundos
 * @returns Delay calculado
 */
export function staggerDelay(index, baseDelay = 0.1) {
  return index * baseDelay;
}

/**
 * Formatea texto para gradiente cyber
 * @param text - Texto a formatear
 * @returns Texto con clases de gradiente
 */
export function formatCyberText(text) {
  return `${text}`.split('').map((char, i) => 
    `<span style="animation-delay: ${i * 0.05}s" class="inline-block animate-fade-in">${char}</span>`
  ).join('');
}
