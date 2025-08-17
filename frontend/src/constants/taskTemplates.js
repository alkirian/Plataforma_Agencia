// Plantillas predefinidas para tareas comunes
export const TASK_TEMPLATES = {
  // Redes Sociales
  social: {
    name: 'Redes Sociales',
    icon: '📱',
    color: 'blue',
    templates: [
      {
        id: 'post-instagram',
        name: 'Post de Instagram',
        description: 'Crear y publicar contenido para Instagram',
        tasks: [
          { title: 'Diseño gráfico para Instagram', duration: 2, status: 'pendiente' },
          { title: 'Redacción del copy', duration: 1, status: 'pendiente' },
          { title: 'Programación de publicación', duration: 0.5, status: 'pendiente' },
        ]
      },
      {
        id: 'stories-campaign',
        name: 'Campaña de Stories',
        description: 'Serie de stories temáticos para la semana',
        tasks: [
          { title: 'Planificación de contenido', duration: 1, status: 'pendiente' },
          { title: 'Diseño de 5 stories', duration: 3, status: 'pendiente' },
          { title: 'Copy para cada story', duration: 1, status: 'pendiente' },
          { title: 'Programación semanal', duration: 0.5, status: 'pendiente' },
        ]
      },
      {
        id: 'reels-creation',
        name: 'Creación de Reel',
        description: 'Video corto para Instagram/TikTok',
        tasks: [
          { title: 'Conceptualización del reel', duration: 1, status: 'pendiente' },
          { title: 'Grabación de video', duration: 2, status: 'pendiente' },
          { title: 'Edición y post-producción', duration: 3, status: 'pendiente' },
          { title: 'Copy y hashtags', duration: 0.5, status: 'pendiente' },
          { title: 'Publicación y monitoreo', duration: 0.5, status: 'pendiente' },
        ]
      }
    ]
  },

  // Marketing Digital
  marketing: {
    name: 'Marketing Digital',
    icon: '📈',
    color: 'green',
    templates: [
      {
        id: 'email-campaign',
        name: 'Campaña de Email Marketing',
        description: 'Newsletter o campaña promocional por email',
        tasks: [
          { title: 'Diseño de template de email', duration: 2, status: 'pendiente' },
          { title: 'Redacción del contenido', duration: 2, status: 'pendiente' },
          { title: 'Segmentación de audiencia', duration: 1, status: 'pendiente' },
          { title: 'Configuración y envío', duration: 1, status: 'pendiente' },
          { title: 'Análisis de resultados', duration: 1, status: 'pendiente' },
        ]
      },
      {
        id: 'blog-post',
        name: 'Artículo de Blog',
        description: 'Creación de contenido para blog corporativo',
        tasks: [
          { title: 'Investigación y outline', duration: 2, status: 'pendiente' },
          { title: 'Redacción del artículo', duration: 4, status: 'pendiente' },
          { title: 'Optimización SEO', duration: 1, status: 'pendiente' },
          { title: 'Creación de imágenes', duration: 2, status: 'pendiente' },
          { title: 'Publicación y promoción', duration: 1, status: 'pendiente' },
        ]
      },
      {
        id: 'google-ads',
        name: 'Campaña Google Ads',
        description: 'Configuración y lanzamiento de campaña publicitaria',
        tasks: [
          { title: 'Investigación de keywords', duration: 2, status: 'pendiente' },
          { title: 'Creación de anuncios', duration: 3, status: 'pendiente' },
          { title: 'Configuración de campaña', duration: 2, status: 'pendiente' },
          { title: 'Landing page optimization', duration: 3, status: 'pendiente' },
          { title: 'Monitoreo y optimización', duration: 1, status: 'pendiente' },
        ]
      }
    ]
  },

  // Diseño y Branding
  design: {
    name: 'Diseño y Branding',
    icon: '🎨',
    color: 'purple',
    templates: [
      {
        id: 'brand-identity',
        name: 'Identidad de Marca',
        description: 'Desarrollo completo de identidad visual',
        tasks: [
          { title: 'Briefing y research', duration: 3, status: 'pendiente' },
          { title: 'Moodboard y conceptos', duration: 4, status: 'pendiente' },
          { title: 'Diseño de logo', duration: 8, status: 'pendiente' },
          { title: 'Paleta de colores', duration: 2, status: 'pendiente' },
          { title: 'Tipografías y elementos', duration: 3, status: 'pendiente' },
          { title: 'Manual de marca', duration: 4, status: 'pendiente' },
        ]
      },
      {
        id: 'web-design',
        name: 'Diseño Web',
        description: 'Diseño de sitio web completo',
        tasks: [
          { title: 'Wireframes y estructura', duration: 4, status: 'pendiente' },
          { title: 'Diseño de homepage', duration: 6, status: 'pendiente' },
          { title: 'Páginas internas', duration: 8, status: 'pendiente' },
          { title: 'Versión mobile', duration: 4, status: 'pendiente' },
          { title: 'Prototipo interactivo', duration: 3, status: 'pendiente' },
        ]
      },
      {
        id: 'print-material',
        name: 'Material Impreso',
        description: 'Diseño de materiales para impresión',
        tasks: [
          { title: 'Briefing y especificaciones', duration: 1, status: 'pendiente' },
          { title: 'Conceptualización', duration: 2, status: 'pendiente' },
          { title: 'Diseño inicial', duration: 4, status: 'pendiente' },
          { title: 'Revisiones y ajustes', duration: 2, status: 'pendiente' },
          { title: 'Preparación para imprenta', duration: 1, status: 'pendiente' },
        ]
      }
    ]
  },

  // Eventos y Lanzamientos
  events: {
    name: 'Eventos y Lanzamientos',
    icon: '🚀',
    color: 'orange',
    templates: [
      {
        id: 'product-launch',
        name: 'Lanzamiento de Producto',
        description: 'Campaña completa de lanzamiento',
        tasks: [
          { title: 'Estrategia de lanzamiento', duration: 4, status: 'pendiente' },
          { title: 'Creación de landing page', duration: 6, status: 'pendiente' },
          { title: 'Campaña de expectativa', duration: 8, status: 'pendiente' },
          { title: 'Material audiovisual', duration: 6, status: 'pendiente' },
          { title: 'Campaña de PR', duration: 4, status: 'pendiente' },
          { title: 'Evento de lanzamiento', duration: 8, status: 'pendiente' },
        ]
      },
      {
        id: 'webinar',
        name: 'Webinar/Workshop',
        description: 'Organización de evento virtual',
        tasks: [
          { title: 'Planificación de contenido', duration: 3, status: 'pendiente' },
          { title: 'Diseño de materiales', duration: 4, status: 'pendiente' },
          { title: 'Página de registro', duration: 2, status: 'pendiente' },
          { title: 'Campaña de promoción', duration: 4, status: 'pendiente' },
          { title: 'Configuración técnica', duration: 2, status: 'pendiente' },
          { title: 'Seguimiento post-evento', duration: 2, status: 'pendiente' },
        ]
      }
    ]
  },

  // Mensual/Periódico
  recurring: {
    name: 'Tareas Recurrentes',
    icon: '📅',
    color: 'indigo',
    templates: [
      {
        id: 'monthly-report',
        name: 'Reporte Mensual',
        description: 'Análisis y reporte de performance mensual',
        tasks: [
          { title: 'Recopilación de métricas', duration: 2, status: 'pendiente' },
          { title: 'Análisis de datos', duration: 3, status: 'pendiente' },
          { title: 'Creación de dashboard', duration: 2, status: 'pendiente' },
          { title: 'Redacción de insights', duration: 2, status: 'pendiente' },
          { title: 'Presentación al cliente', duration: 1, status: 'pendiente' },
        ]
      },
      {
        id: 'content-calendar',
        name: 'Calendario de Contenido',
        description: 'Planificación mensual de contenido',
        tasks: [
          { title: 'Análisis de tendencias', duration: 2, status: 'pendiente' },
          { title: 'Brainstorming de ideas', duration: 3, status: 'pendiente' },
          { title: 'Calendario editorial', duration: 2, status: 'pendiente' },
          { title: 'Briefing para diseñadores', duration: 1, status: 'pendiente' },
          { title: 'Programación de posts', duration: 2, status: 'pendiente' },
        ]
      }
    ]
  }
};

// Función helper para obtener todas las plantillas en formato plano
export const getAllTemplates = () => {
  const allTemplates = [];
  Object.values(TASK_TEMPLATES).forEach(category => {
    category.templates.forEach(template => {
      allTemplates.push({
        ...template,
        category: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color
      });
    });
  });
  return allTemplates;
};

// Función para buscar plantillas
export const searchTemplates = (query) => {
  const allTemplates = getAllTemplates();
  const lowerQuery = query.toLowerCase();
  
  return allTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.category.toLowerCase().includes(lowerQuery)
  );
};