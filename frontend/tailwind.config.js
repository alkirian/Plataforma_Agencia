/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
  'rambla-bg': '#0d1117',
  'rambla-surface': '#161b22',
  'rambla-border': '#30363d',
  'rambla-text-primary': '#c9d1d9',
  'rambla-text-secondary': '#8b949e',
  'rambla-accent': '#58a6ff',

  // --- Nuevos colores para el tema "Cyber Glow" ---
  'glow-cyan': '#00f6ff',
  'glow-bg-start': '#020024',
  'glow-bg-end': '#0d1117',
  'glow-card-bg': 'rgba(22, 27, 34, 0.5)',
      }
    },
  },
  plugins: [],
}
