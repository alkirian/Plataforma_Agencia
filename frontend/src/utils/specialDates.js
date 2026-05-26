/**
 * Diccionario de fechas especiales (efemérides, feriados y meses temáticos)
 * con fuerte contexto uruguayo y global, clasificados por categorías.
 */
export const SPECIAL_DATES = {
  0: [ // Enero
    { day: 1, title: "Año Nuevo", category: "Feriado", desc: "Inicio de año" },
    { day: 6, title: "Día de Reyes", category: "Feriado", desc: "Regalos y familia" },
    { isMonthLong: true, title: "Temporada de Verano", category: "Turismo", desc: "Turismo, playa y descanso en Uruguay" }
  ],
  1: [ // Febrero
    { day: 4, title: "Día Mundial contra el Cáncer", category: "Salud", desc: "Prevención y concientización" },
    { day: 14, title: "San Valentín", category: "Social", desc: "Día de los enamorados y de la amistad" },
    { isMonthLong: true, title: "Mes de Carnaval", category: "Cultura", desc: "Festa popular tradicional en Uruguay" }
  ],
  2: [ // Marzo
    { day: 8, title: "Día Internacional de la Mujer", category: "Social", desc: "Reivindicación de derechos e igualdad" },
    { day: 21, title: "Día Mundial del Síndrome de Down", category: "Salud", desc: "Inclusión y concientización" },
    { isMonthLong: true, title: "Vuelta a Clases", category: "Educación", desc: "Regreso a las aulas en escuelas y liceos" }
  ],
  3: [ // Abril
    { day: 7, title: "Día Mundial de la Salud", category: "Salud", desc: "Promoción de hábitos saludables" },
    { day: 22, title: "Día Mundial de la Tierra", category: "Ecológico", desc: "Cuidado ambiental y sostenibilidad" },
    { day: 25, title: "Día Mundial contra el Maltrato Infantil", category: "Social", desc: "Protección y derechos del niño" },
    { isMonthLong: true, title: "Mes de Concientización sobre el Autismo", category: "Salud", desc: "Inclusión y comprensión" }
  ],
  4: [ // Mayo
    { day: 1, title: "Día de los Trabajadores", category: "Feriado", desc: "Feriado no laborable tradicional" },
    { day: 10, title: "Día de la Madre", category: "Social", desc: "Conmemoración a las madres en Uruguay (segundo domingo)" },
    { day: 17, title: "Día Mundial de la Hipertensión", category: "Salud", desc: "Control y prevención cardiovascular" },
    { day: 26, title: "Día Nacional del Libro", category: "Cultura", desc: "Conmemoración de la primera biblioteca pública uruguaya" },
    { day: 28, title: "Día de Acción por la Salud de la Mujer", category: "Salud", desc: "Derechos de salud femenina" },
    { isMonthLong: true, title: "Mes de la Concientización sobre el Abuso Infantil", category: "Social", desc: "Prevención y protección de menores" }
  ],
  5: [ // Junio
    { day: 5, title: "Día Mundial del Medio Ambiente", category: "Ecológico", desc: "Cuidado del ecosistema global" },
    { day: 19, title: "Natalicio de Artigas / Día del Nunca Más", category: "Feriado", desc: "Héroe nacional de Uruguay" },
    { day: 21, title: "Comienzo del Invierno", category: "Estación", desc: "Solsticio de invierno" },
    { isMonthLong: true, title: "Mes del Orgullo LGBTQ+", category: "Social", desc: "Diversidad, inclusión e igualdad" }
  ],
  6: [ // Julio
    { day: 12, title: "Día del Padre", category: "Social", desc: "Conmemoración a los padres en Uruguay (segundo domingo)" },
    { day: 18, title: "Jura de la Constitución", category: "Feriado", desc: "Feriado patrio histórico no laborable" },
    { day: 30, title: "Día Internacional de la Amistad", category: "Social", desc: "Celebración con amigos" },
    { isMonthLong: true, title: "Mes de las Vacaciones de Invierno", category: "Turismo", desc: "Entretenimiento infantil y descanso escolar" }
  ],
  7: [ // Agosto
    { day: 16, title: "Día del Niño / Día de las Infancias", category: "Social", desc: "Celebración y juegos tradicionales (segundo domingo)" },
    { day: 25, title: "Declaratoria de la Independencia", category: "Feriado", desc: "Feriado patrio uruguayo no laborable" },
    { isMonthLong: true, title: "Mes de la Concientización sobre la Lactancia Materna", category: "Salud", desc: "Promoción de salud en neonatos" }
  ],
  8: [ // Septiembre
    { day: 21, title: "Día de la Primavera / Día de la Juventud", category: "Estación", desc: "Equinoccio de primavera" },
    { day: 21, title: "Día Mundial del Alzheimer", category: "Salud", desc: "Apoyo y concientización sobre demencias" },
    { isMonthLong: true, title: "Semana del Corazón", category: "Salud", desc: "Promoción de salud cardiovascular en Uruguay" }
  ],
  9: [ // Octubre
    { day: 12, title: "Día del Respeto a la Diversidad Cultural", category: "Feriado", desc: "Feriado histórico en Uruguay" },
    { day: 19, title: "Día Mundial de la Lucha contra el Cáncer de Mama", category: "Salud", desc: "Octubre Rosa - Prevención y diagnóstico precoz" },
    { day: 31, title: "Halloween / Noche de Brujas", category: "Social", desc: "Fiesta de disfraces y dulces" },
    { isMonthLong: true, title: "Mes de la Concientización de la Salud Mental", category: "Salud", desc: "Bienestar psicológico" }
  ],
  10: [ // Noviembre
    { day: 20, title: "Día Universal del Niño", category: "Social", desc: "Conmemoración y derechos del niño a nivel global" },
    { day: 25, title: "Día contra la Violencia hacia la Mujer", category: "Social", desc: "Concientización y erradicación de abusos" },
    { isMonthLong: true, title: "Movember / Salud Masculina", category: "Salud", desc: "Mes de concientización del cáncer de próstata y salud mental" }
  ],
  11: [ // Diciembre
    { day: 1, title: "Día Mundial de la Lucha contra el Sida", category: "Salud", desc: "Prevención y apoyo médico" },
    { day: 25, title: "Navidad / Día de la Familia", category: "Feriado", desc: "Conmemoración tradicional familiar" },
    { day: 31, title: "Fin de Año", category: "Social", desc: "Festejos para despedir el año" }
  ]
};

/**
 * Retorna las efemérides y feriados sugeridos para un mes en base al sector de actividad.
 * @param {Date} date - Fecha de referencia
 * @param {string} industry - Sector del cliente (ej: "Salud", "Educación", "Tecnología", etc.)
 */
export const getSpecialDatesForMonth = (date, industry = "") => {
  const month = date.getMonth();
  const year = date.getFullYear();
  const dates = SPECIAL_DATES[month] || [];
  
  const indLower = (industry || "").toLowerCase();
  
  // Categorías universales que aplican a cualquier tipo de negocio por defecto
  const UNIVERSAL_CATEGORIES = ["Feriado", "Social", "Estación"];
  
  return dates
    .filter(d => {
      // Feriados y celebraciones sociales universales (Día de la Madre, Padre, Niño, Navidad) se muestran siempre
      if (UNIVERSAL_CATEGORIES.includes(d.category)) {
        return true;
      }
      
      // Filtros inteligentes específicos por industria para evitar ruido visual irrelevante
      if (d.category === "Salud") {
        return ["salud", "medic", "clinic", "odont", "estetic", "deport", "fitness", "gimnas", "nutri", "psicol", "bienestar"].some(kw => indLower.includes(kw));
      }
      
      if (d.category === "Educación") {
        return ["educ", "colegio", "escuel", "universi", "academi", "librer", "libro", "docent", "clase", "aula"].some(kw => indLower.includes(kw));
      }
      
      if (d.category === "Ecológico") {
        return ["eco", "susten", "ambient", "tierra", "plant", "jardin", "vivero", "flor", "paisaj", "agric", "campo", "arbol", "natur"].some(kw => indLower.includes(kw));
      }
      
      if (d.category === "Cultura") {
        return ["cultu", "art", "teatro", "music", "cine", "disen", "libro", "literat", "museo"].some(kw => indLower.includes(kw));
      }
      
      if (d.category === "Turismo") {
        return ["turis", "viaje", "hotel", "gastron", "restau", "vuelo", "agenci", "pasa", "playa"].some(kw => indLower.includes(kw));
      }
      
      return false;
    })
    .map(d => {
      let dateStr = "";
      if (!d.isMonthLong) {
        const dayStr = String(d.day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        dateStr = `${year}-${monthStr}-${dayStr}`;
      }
      
      // Si la fecha es específica de la industria y no una genérica, tiene recomendación alta
      const isRecommended = !UNIVERSAL_CATEGORIES.includes(d.category);
      
      return {
        ...d,
        dateString: dateStr,
        isRecommended
      };
    });
};
