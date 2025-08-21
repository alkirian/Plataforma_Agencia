// constants/tonePresets.js
export const TONE_PRESETS = {
  // Tonos Profesionales
  "profesional": {
    label: "🏢 Profesional",
    description: "Serio, confiable, experto",
    keywords: ["expertos", "calidad", "excelencia", "profesional", "certificados", "experiencia"],
    color: "blue",
    category: "profesional"
  },
  "educativo": {
    label: "📚 Educativo", 
    description: "Informativo, didáctico, útil",
    keywords: ["aprende", "sabías que", "tips", "conocimiento", "información", "guía"],
    color: "green",
    category: "profesional"
  },
  "científico": {
    label: "🔬 Científico",
    description: "Basado en evidencia, técnico",
    keywords: ["estudios", "investigación", "evidencia", "datos", "análisis", "comprobado"],
    color: "purple",
    category: "profesional"
  },
  
  // Tonos Emocionales
  "cercano": {
    label: "🤗 Cercano",
    description: "Cálido, familiar, accesible",
    keywords: ["familia", "cuidamos", "juntos", "confianza", "acompañamos", "contigo"],
    color: "orange",
    category: "emocional"
  },
  "emocional": {
    label: "❤️ Emocional",
    description: "Inspirador, motivacional",
    keywords: ["siente", "corazón", "emociona", "inspire", "transforma", "logra"],
    color: "red",
    category: "emocional"
  },
  "empático": {
    label: "🤝 Empático",
    description: "Comprensivo, solidario",
    keywords: ["entendemos", "acompañamos", "comprendemos", "apoyo", "solidario"],
    color: "pink",
    category: "emocional"
  },
  
  // Tonos Comerciales
  "promocional": {
    label: "🎯 Promocional",
    description: "Ofertas, descuentos, CTA",
    keywords: ["oferta", "descuento", "aprovecha", "limitado", "especial", "promoción"],
    color: "yellow",
    category: "comercial"
  },
  "urgente": {
    label: "⚡ Urgente",
    description: "Llamada inmediata a acción",
    keywords: ["ahora", "último", "rápido", "no esperes", "inmediato", "hoy"],
    color: "red-dark",
    category: "comercial"
  },
  
  // Tonos Creativos
  "divertido": {
    label: "😄 Divertido",
    description: "Alegre, entretenido, ligero",
    keywords: ["diversión", "alegría", "sonríe", "disfruta", "feliz", "entretenido"],
    color: "yellow-light",
    category: "creativo"
  },
  "inspiracional": {
    label: "✨ Inspiracional",
    description: "Motivador, aspiracional",
    keywords: ["logra", "sueña", "transforma", "alcanza", "éxito", "inspira"],
    color: "indigo",
    category: "creativo"
  }
};

export const TONE_CATEGORIES = {
  profesional: {
    name: "Profesional",
    description: "Tonos serios y confiables"
  },
  emocional: {
    name: "Emocional", 
    description: "Tonos cálidos y humanos"
  },
  comercial: {
    name: "Comercial",
    description: "Tonos de ventas y promoción"
  },
  creativo: {
    name: "Creativo",
    description: "Tonos originales y divertidos"
  }
};

// Mensajes amables de espera
export const WAITING_MESSAGES = [
  {
    phase: "analyzing",
    messages: [
      "🔍 Analizando el perfil de tu cliente...",
      "📋 Revisando el historial de conversaciones...",
      "🎯 Identificando el tono perfecto para tu marca..."
    ]
  },
  {
    phase: "generating",
    messages: [
      "🧠 Generando ideas creativas y personalizadas...",
      "💡 Creando contenido alineado con tu cliente...",
      "🎨 Desarrollando propuestas únicas...",
      "✨ Perfeccionando cada idea para tu cronograma..."
    ]
  },
  {
    phase: "finalizing",
    messages: [
      "🔧 Ajustando los detalles finales...",
      "📅 Asignando fechas estratégicas...",
      "🏷️ Añadiendo hashtags relevantes...",
      "✅ Preparando tus 10 ideas personalizadas..."
    ]
  }
];