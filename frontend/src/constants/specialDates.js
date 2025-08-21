// constants/specialDates.js

export const URUGUAY_SPECIAL_DATES_2025 = {
  // Enero
  "2025-01-01": { 
    name: "Año Nuevo", 
    sectors: ["all"], 
    type: "holiday",
    description: "Nuevo comienzo, propósitos, renovación"
  },
  "2025-01-06": { 
    name: "Día de los Reyes", 
    sectors: ["retail", "family", "toys", "beauty"], 
    type: "commercial",
    description: "Regalos, magia, ilusión infantil"
  },
  
  // Febrero  
  "2025-02-14": { 
    name: "Día de San Valentín", 
    sectors: ["beauty", "restaurants", "jewelry", "health"], 
    type: "commercial",
    description: "Amor, cuidado personal, regalos especiales"
  },
  "2025-02-24": { 
    name: "Carnaval - Lunes", 
    sectors: ["all"], 
    type: "cultural",
    description: "Celebración, alegría, tradición uruguaya"
  },
  "2025-02-25": { 
    name: "Carnaval - Martes", 
    sectors: ["all"], 
    type: "cultural",
    description: "Fiesta, diversión, cultura local"
  },
  
  // Marzo
  "2025-03-08": { 
    name: "Día Internacional de la Mujer", 
    sectors: ["beauty", "health", "professional"], 
    type: "awareness",
    description: "Empoderamiento, salud femenina, belleza"
  },
  "2025-03-21": { 
    name: "Día Mundial del Síndrome de Down", 
    sectors: ["health", "education"], 
    type: "awareness",
    description: "Inclusión, diversidad, concienciación"
  },
  
  // Abril
  "2025-04-07": { 
    name: "Día Mundial de la Salud", 
    sectors: ["health"], 
    type: "awareness",
    description: "Prevención, bienestar, cuidado integral"
  },
  "2025-04-18": { 
    name: "Viernes Santo", 
    sectors: ["all"], 
    type: "holiday",
    description: "Reflexión, familia, tradición"
  },
  "2025-04-19": { 
    name: "Sábado de Gloria", 
    sectors: ["all"], 
    type: "holiday",
    description: "Renovación, esperanza, celebración"
  },
  "2025-04-25": { 
    name: "Desembarco de los 33 Orientales", 
    sectors: ["all"], 
    type: "national",
    description: "Patriotismo, historia uruguaya, libertad"
  },
  
  // Mayo
  "2025-05-01": { 
    name: "Día del Trabajador", 
    sectors: ["all"], 
    type: "holiday",
    description: "Dedicación, esfuerzo, logros profesionales"
  },
  "2025-05-11": { 
    name: "Día de las Madres", 
    sectors: ["all"], 
    type: "commercial",
    description: "Amor maternal, cuidado, familia"
  },
  "2025-05-18": { 
    name: "Batalla de las Piedras", 
    sectors: ["all"], 
    type: "national",
    description: "Historia, valentía, identidad nacional"
  },
  "2025-05-31": { 
    name: "Día Mundial Sin Tabaco", 
    sectors: ["health"], 
    type: "awareness",
    description: "Salud pulmonar, prevención, vida sana"
  },
  
  // Junio
  "2025-06-15": { 
    name: "Día del Padre", 
    sectors: ["all"], 
    type: "commercial",
    description: "Paternidad, cuidado masculino, familia"
  },
  "2025-06-21": { 
    name: "Día Mundial contra el Cáncer de Próstata", 
    sectors: ["health"], 
    type: "awareness",
    description: "Salud masculina, prevención, chequeos"
  },
  
  // Julio
  "2025-07-18": { 
    name: "Jura de la Constitución", 
    sectors: ["all"], 
    type: "national",
    description: "Democracia, derechos, institucionalidad"
  },
  
  // Agosto
  "2025-08-09": { 
    name: "Día del Niño", 
    sectors: ["health", "education", "toys", "family"], 
    type: "commercial",
    description: "Infancia, salud infantil, diversión"
  },
  "2025-08-25": { 
    name: "Declaración de la Independencia", 
    sectors: ["all"], 
    type: "national",
    description: "Independencia, soberanía, orgullo nacional"
  },
  
  // Septiembre
  "2025-09-21": { 
    name: "Día de la Primavera", 
    sectors: ["beauty", "health", "retail"], 
    type: "seasonal",
    description: "Renovación, belleza, cambio de estación"
  },
  "2025-09-29": { 
    name: "Día Mundial del Corazón", 
    sectors: ["health"], 
    type: "awareness",
    description: "Salud cardiovascular, prevención, ejercicio"
  },
  
  // Octubre  
  "2025-10-12": { 
    name: "Día de la Raza", 
    sectors: ["all"], 
    type: "cultural",
    description: "Diversidad, multiculturalidad, encuentro"
  },
  "2025-10-19": { 
    name: "Día Mundial del Cáncer de Mama", 
    sectors: ["health", "beauty"], 
    type: "awareness",
    description: "Prevención femenina, autoexamen, concienciación"
  },
  "2025-10-31": { 
    name: "Halloween", 
    sectors: ["retail", "beauty"], 
    type: "commercial",
    description: "Diversión, disfraces, creatividad"
  },
  
  // Noviembre
  "2025-11-02": { 
    name: "Día de los Difuntos", 
    sectors: ["all"], 
    type: "cultural",
    description: "Memoria, familia, tradición"
  },
  "2025-11-14": { 
    name: "Día Mundial de la Diabetes", 
    sectors: ["health"], 
    type: "awareness",
    description: "Prevención, alimentación saludable, control"
  },
  
  // Diciembre
  "2025-12-01": { 
    name: "Día Mundial del SIDA", 
    sectors: ["health"], 
    type: "awareness",
    description: "Prevención, concienciación, salud sexual"
  },
  "2025-12-08": { 
    name: "Día de la Virgen", 
    sectors: ["all"], 
    type: "cultural",
    description: "Fe, tradición, espiritualidad"
  },
  "2025-12-25": { 
    name: "Navidad", 
    sectors: ["all"], 
    type: "holiday",
    description: "Familia, regalos, celebración, generosidad"
  }
};

// Función para obtener fechas especiales relevantes para un cliente
export const getRelevantSpecialDates = (month, year, clientSector) => {
  const monthStr = String(month).padStart(2, '0');
  const yearStr = String(year);
  
  return Object.entries(URUGUAY_SPECIAL_DATES_2025)
    .filter(([date, info]) => {
      const [dateYear, dateMonth] = date.split('-');
      return dateYear === yearStr && 
             dateMonth === monthStr && 
             (info.sectors.includes('all') || info.sectors.includes(clientSector));
    })
    .map(([date, info]) => ({
      date,
      name: info.name,
      type: info.type,
      description: info.description,
      relevanceScore: info.sectors.includes(clientSector) ? 1.0 : 0.7,
      daysUntil: Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Función para obtener contexto estacional
export const getSeasonalContext = (month) => {
  const seasons = {
    // Verano (Diciembre, Enero, Febrero)
    summer: {
      months: [12, 1, 2],
      keywords: ["verano", "vacaciones", "playa", "calor", "descanso"],
      themes: ["renovación", "energía", "aventura", "relajación"]
    },
    // Otoño (Marzo, Abril, Mayo)
    autumn: {
      months: [3, 4, 5],
      keywords: ["otoño", "cambio", "cosecha", "reflexión", "preparación"],
      themes: ["transición", "madurez", "preparación", "introspección"]
    },
    // Invierno (Junio, Julio, Agosto)  
    winter: {
      months: [6, 7, 8],
      keywords: ["invierno", "cuidado", "protección", "calor", "refugio"],
      themes: ["cuidado", "protección", "intimidad", "reflexión"]
    },
    // Primavera (Septiembre, Octubre, Noviembre)
    spring: {
      months: [9, 10, 11],
      keywords: ["primavera", "renovación", "crecimiento", "florecimiento"],
      themes: ["renovación", "crecimiento", "optimismo", "nuevos comienzos"]
    }
  };

  return Object.values(seasons).find(season => season.months.includes(month)) || seasons.spring;
};