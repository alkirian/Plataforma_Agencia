// src/components/trends/trendsHelpers.js

/**
 * Calcula las métricas de coherencia estratégica detalladas (Breakdown).
 * Incluye Potencial de Impacto, Viabilidad y desgloses tridimensionales.
 */
export const computeStrategicMetrics = (insight, client) => {
  const brandInfo = client?.brand_info || {};
  const industry = (client?.industry || '').toLowerCase();
  const audience = (brandInfo.target_audience || '').toLowerCase();
  const pillars = (brandInfo.content_pillars || []).map(p => String(p || '').toLowerCase());
  const title = (insight.title || '').toLowerCase();
  const desc = (insight.description || '').toLowerCase();
  const action = (insight.suggested_action || '').toLowerCase();

  // 1. IMPACT POTENTIAL (Engagement/Reach)
  let impactScore = 55; // base
  if (insight.relevance === 'alta') impactScore = 85;
  else if (insight.relevance === 'media') impactScore = 70;

  let impactReasons = [];
  if (audience) {
    if (
      audience.includes('joven') ||
      audience.includes('digital') ||
      audience.includes('millennial') ||
      audience.includes('gen z')
    ) {
      if (
        desc.includes('viral') ||
        desc.includes('meme') ||
        desc.includes('video') ||
        desc.includes('tendencia') ||
        action.includes('tiktok') ||
        action.includes('reel')
      ) {
        impactScore += 10;
        impactReasons.push('Alto enganche potencial en tu segmento demográfico digital joven.');
      }
    }
    if (
      audience.includes('profesional') ||
      audience.includes('b2b') ||
      audience.includes('empresa') ||
      audience.includes('corporativo')
    ) {
      if (
        desc.includes('estudio') ||
        desc.includes('informe') ||
        desc.includes('análisis') ||
        desc.includes('datos') ||
        action.includes('linkedin')
      ) {
        impactScore += 10;
        impactReasons.push('Gran relevancia y autoridad estratégica para tu audiencia corporativa/B2B.');
      }
    }
  }

  let matchedPillar = null;
  for (const pillar of pillars) {
    if (
      pillar &&
      (title.includes(pillar) ||
        desc.includes(pillar) ||
        pillar
          .split(' ')
          .some(word => word.length > 4 && (title.includes(word) || desc.includes(word))))
    ) {
      impactScore += 12;
      matchedPillar = pillar;
      impactReasons.push(`Alineación directa con tu pilar de contenido "${pillar}".`);
      break;
    }
  }

  impactScore = Math.min(98, impactScore);

  // 2. FEASIBILITY (Viabilidad de Producción)
  let feasibilityScore = 75; // base
  let formatLabel = 'Publicación Estándar';

  if (
    action.includes('video') ||
    action.includes('reel') ||
    action.includes('tiktok') ||
    action.includes('grabar') ||
    action.includes('grabación')
  ) {
    feasibilityScore = 60;
    formatLabel = 'Video Corto (Reel/TikTok)';
  } else if (
    action.includes('carrusel') ||
    action.includes('infografía') ||
    action.includes('diseño') ||
    action.includes('visual')
  ) {
    feasibilityScore = 80;
    formatLabel = 'Carrusel / Infografía';
  } else if (
    action.includes('post') ||
    action.includes('texto') ||
    action.includes('linkedin') ||
    action.includes('artículo')
  ) {
    feasibilityScore = 90;
    formatLabel = 'Post de Texto / Redacción';
  }

  const preferredPlatforms = (brandInfo.preferred_platforms || []).map(p =>
    String(p || '').toLowerCase()
  );
  if (preferredPlatforms.length > 0) {
    if (
      formatLabel.includes('Video') &&
      (preferredPlatforms.includes('tiktok') ||
        preferredPlatforms.includes('instagram') ||
        preferredPlatforms.includes('youtube'))
    ) {
      feasibilityScore += 8;
    }
    if (formatLabel.includes('Carrusel') && preferredPlatforms.includes('instagram')) {
      feasibilityScore += 5;
    }
    if (formatLabel.includes('Post') && preferredPlatforms.includes('linkedin')) {
      feasibilityScore += 5;
    }
  }

  feasibilityScore = Math.min(95, feasibilityScore);

  // 3. COHERENCE BREAKDOWN (Nuevos Sub-Cálculos UI/UX)
  let audienceScore = 70; // Base
  if (audience) {
    if (
      (audience.includes('joven') || audience.includes('digital') || audience.includes('millennial') || audience.includes('gen z')) &&
      (desc.includes('viral') || desc.includes('meme') || action.includes('tiktok') || action.includes('reel'))
    ) {
      audienceScore += 18;
    }
    if (
      (audience.includes('profesional') || audience.includes('b2b') || audience.includes('empresa') || audience.includes('corporativo')) &&
      (desc.includes('estudio') || desc.includes('informe') || desc.includes('análisis') || action.includes('linkedin'))
    ) {
      audienceScore += 18;
    }
  }
  audienceScore = Math.min(98, Math.max(55, audienceScore));

  let pillarsScore = matchedPillar ? 95 : 70;
  if (industry && (title.includes(industry) || desc.includes(industry))) {
    pillarsScore += 10;
  }
  pillarsScore = Math.min(98, pillarsScore);

  let voiceScore = insight.relevance === 'alta' ? 90 : insight.relevance === 'media' ? 80 : 70;
  const voice = (brandInfo.brand_voice || '').toLowerCase();
  if (voice) {
    if (voice.includes('formal') || voice.includes('corporativo') || voice.includes('profesional')) {
      if (title.includes('análisis') || desc.includes('estudio') || action.includes('linkedin')) voiceScore += 5;
    } else if (voice.includes('cercano') || voice.includes('fresco') || voice.includes('divertido') || voice.includes('empático')) {
      if (desc.includes('viral') || action.includes('reel') || action.includes('tiktok')) voiceScore += 5;
    }
  }
  voiceScore = Math.min(95, voiceScore);

  // 4. RATIONALE
  let rationale = '';
  if (matchedPillar) {
    rationale = `Esta tendencia es sumamente estratégica para ${client?.name || 'tu marca'} debido a su coincidencia directa con tu pilar de contenido "${matchedPillar.toUpperCase()}". `;
  } else if (industry) {
    rationale = `Al pertenecer al sector de ${industry.toUpperCase()}, esta temática representa un punto clave de conversación actual que permite posicionar a ${client?.name || 'tu marca'} como un referente actualizado en el rubro. `;
  } else {
    rationale = `Esta tendencia representa una oportunidad valiosa de posicionamiento oportuno. `;
  }

  if (formatLabel.includes('Video')) {
    rationale += `Implementar un ${formatLabel.toLowerCase()} impulsará el algoritmo de forma orgánica, ya que es el formato de mayor retención para captar la atención de tu audiencia.`;
  } else if (formatLabel.includes('Carrusel')) {
    rationale += `Diseñar un ${formatLabel.toLowerCase()} facilitará la educación de tu audiencia mediante slides visuales de alto valor, aumentando el número de guardados y compartidos.`;
  } else {
    rationale += `Publicar un post enfocado en este copy capitalizará la conversación activa del sector de manera rápida y sin complicaciones de producción.`;
  }

  let alignmentText = 'Alineación Estratégica';
  let alignmentCls = 'text-blue-400 bg-blue-500/5 border-blue-500/10';
  if (impactScore >= 85) {
    alignmentText = 'Oportunidad de Oro (Match Alto)';
    alignmentCls = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/15';
  } else if (impactScore < 70) {
    alignmentText = 'Alineación Específica';
    alignmentCls = 'text-slate-400 bg-slate-500/5 border-slate-500/10';
  }

  return {
    impactScore,
    feasibilityScore,
    audienceScore,
    pillarsScore,
    voiceScore,
    rationale,
    formatLabel,
    alignmentText,
    alignmentCls,
    matchedPillar,
  };
};

/**
 * Obtiene los estilos visuales del canal de redes sociales sugerido.
 */
export const getChannelInfo = (suggestedAction, client) => {
  const act = (suggestedAction || '').toLowerCase();

  if (act.includes('tiktok')) {
    return {
      label: 'TikTok Video',
      cls: 'bg-slate-950/80 text-cyan-400 border border-cyan-400/30',
    };
  } else if (act.includes('linkedin')) {
    return {
      label: 'LinkedIn Post',
      cls: 'bg-[#0077B5]/10 text-blue-400 border border-[#0077B5]/35',
    };
  } else if (
    act.includes('carrusel') ||
    act.includes('reel') ||
    act.includes('instagram') ||
    act.includes('ig')
  ) {
    const isReel = act.includes('video') || act.includes('reel');
    return {
      label: isReel ? 'Instagram Reel' : 'Instagram Carrusel',
      cls: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 border border-pink-500/25',
    };
  } else if (act.includes('youtube') || act.includes('yt') || act.includes('short')) {
    return {
      label: 'YouTube Short',
      cls: 'bg-red-500/10 text-red-400 border border-red-500/25',
    };
  }

  const platforms = (client?.brand_info?.preferred_platforms || []).map(p =>
    String(p || '').toLowerCase()
  );
  if (platforms.includes('instagram')) {
    return {
      label: 'Instagram Post',
      cls: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 border border-pink-500/25',
    };
  } else if (platforms.includes('linkedin')) {
    return {
      label: 'LinkedIn Post',
      cls: 'bg-[#0077B5]/10 text-blue-400 border border-[#0077B5]/35',
    };
  }

  return {
    label: 'Post Recomendado',
    cls: 'bg-slate-800 text-slate-300 border border-white/[0.06]',
  };
};

export const formatDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const relativeDate = iso => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Hace unos momentos';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

export const relevanceBadge = rel => {
  const map = {
    alta: {
      label: 'Relevancia Alta',
      cls: 'bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25',
    },
    media: {
      label: 'Relevancia Media',
      cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    },
    baja: {
      label: 'Relevancia Baja',
      cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    },
  };
  return map[rel] || map.media;
};

export const groupReportsByDate = reportsList => {
  const groups = {};
  reportsList.forEach(report => {
    const d = new Date(report.generated_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dateStr = '';
    if (d.toDateString() === today.toDateString()) {
      dateStr = 'Hoy';
    } else if (d.toDateString() === yesterday.toDateString()) {
      dateStr = 'Ayer';
    } else {
      dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(report);
  });
  return groups;
};
