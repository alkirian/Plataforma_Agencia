// Muestras de prueba de fotos en bruto tomadas con celular para Estudio de Fotos
export const DEMO_PRODUCT_IMAGES = [
  {
    id: 'perfume',
    name: 'Loción / Perfume',
    thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&auto=format&fit=crop',
    prompt: 'En un pedestal de mármol blanco brillante, rodeado de hojas de palma doradas, luz de sol suave de mañana, gotas de rocío, estilo anuncio de revista de lujo, colores crema y oro'
  },
  {
    id: 'soda',
    name: 'Lata de Refresco',
    thumbnail: 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?q=80&w=300&auto=format&fit=crop',
    prompt: 'Flotando en el aire rodeada de cubos de hielo salpicando agua cristalina fresca, fondo de degradado azul eléctrico con luces de neón, altamente refrescante, dinámico, publicitario'
  },
  {
    id: 'mug',
    name: 'Taza de Café',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop',
    prompt: 'Sobre una mesa rústica de madera en una cafetería acogedora con luces bokeh cálidas de fondo, granos de café esparcidos alrededor con vapor caliente saliendo suavemente de la taza, rústico y premium'
  }
];

// Plantillas de estilos rápidos para Estudio de Fotos
export const STYLE_TEMPLATES = [
  {
    name: 'Estudio de Lujo',
    prompt: 'sobre un bloque minimalista de travertino, iluminación de estudio suave lateral, fondo abstracto en tonos pastel cálidos, estética editorial de alta gama, sombras suaves y realistas'
  },
  {
    name: 'Naturaleza Tropical',
    prompt: 'en un bosque tropical húmedo, apoyado sobre una roca mojada con musgo, hojas exóticas gigantes desenfocadas de fondo, rayos de luz natural atravesando la selva, fresco y orgánico'
  },
  {
    name: 'Cibernético / Neón',
    prompt: 'sobre un panel de vidrio negro reflectivo, rodeado de líneas de luz de neón cian y magenta, atmósfera cyberpunk futurista y tecnológica, reflejos perfectos en el suelo'
  },
  {
    name: 'Ingredientes Explosivos',
    prompt: 'en una composición dinámica de alta velocidad, rodeado de salpicaduras artísticas de agua y partículas suspendidas flotantes a juego con los colores del producto, fondo de estudio limpio y enérgico'
  }
];

export const ASPECT_RATIO_CLASSES = {
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-[16/9]',
  '4:5': 'aspect-[4/5]',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]'
};
