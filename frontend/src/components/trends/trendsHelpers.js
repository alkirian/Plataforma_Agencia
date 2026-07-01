// src/components/trends/trendsHelpers.js

/**
 * Calcula las métricas de coherencia estratégica detalladas (Breakdown).
 * Incluye Potencial de Impacto, Viabilidad y desgloses tridimensionales.
 */
export const computeStrategicMetrics = (insight, client) => {
  const score = Math.max(50, Math.min(100, Number(insight.trending_score) || 75));
  const impressions = insight.estimated_impressions || 'N/D';
  const category = insight.category || 'noticias';

  const categoryMap = {
    noticias: {
      label: 'Noticias & Actualidad',
      cls: 'bg-red-500/10 text-red-400 border border-red-500/20',
      color: '#ef4444',
    },
    economia: {
      label: 'Economía & Negocios',
      cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      color: '#f59e0b',
    },
    cultura_pop: {
      label: 'Cultura Pop',
      cls: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      color: '#6366f1',
    },
    musica: {
      label: 'Música',
      cls: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      color: '#ec4899',
    },
    tecnologia: {
      label: 'Tecnología & Ciencia',
      cls: 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20',
      color: '#06b6d4',
    },
    memes: {
      label: 'Humor & Memes',
      cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      color: '#eab308',
    },
    deportes: {
      label: 'Deportes',
      cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      color: '#10b981',
    },
  };

  const catData = categoryMap[category] || categoryMap.noticias;

  return {
    impactScore: score,
    trendingScore: score,
    estimatedImpressions: impressions,
    categoryLabel: catData.label,
    categoryCls: catData.cls,
    categoryColor: catData.color,
    formatLabel: 'Análisis de Tendencia',
  };
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
